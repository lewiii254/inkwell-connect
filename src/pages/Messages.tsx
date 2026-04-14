import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Feather, Send, ArrowLeft, LogOut, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean | null;
  created_at: string;
}

interface Conversation {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

const Messages = () => {
  const { user, profile, signOut } = useAuth();
  const { userId: urlUserId } = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Handle URL-based user selection (e.g. /messages/:userId)
  useEffect(() => {
    if (!urlUserId || !user) return;
    const initConversation = async () => {
      const { data: prof } = await supabase.from('profiles').select('full_name').eq('user_id', urlUserId).single();
      setSelectedUserId(urlUserId);
      setSelectedName(prof?.full_name || 'User');
    };
    initConversation();
  }, [urlUserId, user]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!msgs) return;

      const convMap = new Map<string, { messages: Message[] }>();
      msgs.forEach((m: Message) => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!convMap.has(otherId)) convMap.set(otherId, { messages: [] });
        convMap.get(otherId)!.messages.push(m);
      });

      const userIds = Array.from(convMap.keys());
      if (userIds.length === 0) { setConversations([]); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      profiles?.forEach(p => profileMap.set(p.user_id, p));

      const convs: Conversation[] = userIds.map(uid => {
        const cm = convMap.get(uid)!;
        const last = cm.messages[0];
        const unread = cm.messages.filter(m => m.receiver_id === user.id && !m.read).length;
        const p = profileMap.get(uid);
        return {
          user_id: uid,
          full_name: p?.full_name || 'User',
          avatar_url: p?.avatar_url || null,
          last_message: last.content,
          last_time: last.created_at,
          unread,
        };
      });

      convs.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
      setConversations(convs);
    };

    loadConversations();
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!user || !selectedUserId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (data) setMessages(data as Message[]);

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', selectedUserId)
        .eq('receiver_id', user.id)
        .eq('read', false);
    };

    loadMessages();
  }, [user, selectedUserId]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== user.id && msg.receiver_id !== user.id) return;

          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (otherId === selectedUserId) {
            setMessages(prev => [...prev, msg]);
            if (msg.receiver_id === user.id) {
              supabase.from('messages').update({ read: true }).eq('id', msg.id).then();
            }
          }

          setConversations(prev => {
            const existing = prev.find(c => c.user_id === otherId);
            if (existing) {
              return prev.map(c =>
                c.user_id === otherId
                  ? { ...c, last_message: msg.content, last_time: msg.created_at, unread: otherId === selectedUserId ? 0 : c.unread + (msg.receiver_id === user.id ? 1 : 0) }
                  : c
              ).sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUserId || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUserId,
      content: newMessage.trim(),
    });
    if (!error) setNewMessage('');
    setSending(false);
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card shrink-0">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
            <Feather className="h-5 w-5 text-accent" /> InkBridge
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`w-full md:w-80 border-r bg-card flex flex-col shrink-0 ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h2 className="font-heading font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" /> Messages
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No conversations yet. Start one from a contract or job!
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.user_id}
                  onClick={() => { setSelectedUserId(conv.user_id); setSelectedName(conv.full_name); }}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b ${selectedUserId === conv.user_id ? 'bg-muted' : ''}`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                      {initials(conv.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{conv.full_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(conv.last_time), 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground truncate">{conv.last_message}</span>
                      {conv.unread > 0 && (
                        <span className="ml-2 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          {selectedUserId ? (
            <>
              <div className="p-4 border-b bg-card flex items-center gap-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedUserId(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent/10 text-accent text-xs font-medium">
                    {initials(selectedName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-heading font-semibold">{selectedName}</span>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 max-w-2xl mx-auto">
                  {messages.map(msg => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-accent text-accent-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <form onSubmit={handleSend} className="p-4 border-t bg-card">
                <div className="flex gap-2 max-w-2xl mx-auto">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-heading font-medium">Select a conversation</p>
                <p className="text-sm">Choose from your existing conversations</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
