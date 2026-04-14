import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Feather, PenLine, FileText, DollarSign, LogOut, MessageSquare, Upload, FileUp, Check } from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { toast } from 'sonner';

const WriterDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const unreadCount = useUnreadMessages();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: apps }, { data: cts }, { data: w }] = await Promise.all([
        supabase.from('applications').select('*, jobs(title, budget, status)').eq('writer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('contracts').select('*, jobs(title)').eq('writer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      ]);
      if (apps) setApplications(apps);
      if (cts) setContracts(cts);
      if (w) setWallet(w);
    };
    fetchData();
  }, [user]);

  const handleFileUpload = async (contractId: string, file: File) => {
    if (!user) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF and DOCX files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB.');
      return;
    }

    setUploadingId(contractId);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${contractId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploadingId(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(path);

    const { error: updateError } = await supabase.from('contracts').update({
      submission_url: path,
      submission_notes: submissionNotes[contractId] || '',
      status: 'completed' as any,
    }).eq('id', contractId);

    if (updateError) {
      toast.error('Failed to update contract: ' + updateError.message);
    } else {
      toast.success('Work submitted successfully!');
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, submission_url: path, submission_notes: submissionNotes[contractId] || '', status: 'completed' } : c));
    }
    setUploadingId(null);
  };

  const stats = [
    { label: 'Applications', value: applications.length, icon: PenLine },
    { label: 'Active Contracts', value: contracts.filter(c => c.status === 'active').length, icon: FileText },
    { label: 'Earnings', value: `$${wallet?.balance || 0}`, icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
            <Feather className="h-5 w-5 text-accent" /> InkBridge
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="relative">
              <Link to="/messages">
                <MessageSquare className="mr-2 h-4 w-4" /> Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 min-w-[1.25rem] rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">Hi, {profile?.full_name || 'Writer'}</span>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate('/'); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-heading font-bold">Writer Dashboard</h1>
          <Button asChild><Link to="/jobs">Browse Jobs</Link></Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-heading font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="font-heading">Recent Applications</CardTitle></CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No applications yet. <Link to="/jobs" className="text-accent hover:underline">Browse jobs</Link></p>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{(app as any).jobs?.title}</p>
                        <p className="text-xs text-muted-foreground">Bid: ${app.bid}</p>
                      </div>
                      <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-heading">Contracts</CardTitle></CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No contracts yet.</p>
              ) : (
                <div className="space-y-4">
                  {contracts.slice(0, 5).map(ct => (
                    <div key={ct.id} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{(ct as any).jobs?.title}</p>
                          <p className="text-xs text-muted-foreground">${ct.amount}</p>
                        </div>
                        <Badge variant={ct.status === 'completed' ? 'default' : ct.status === 'active' ? 'secondary' : 'destructive'}>{ct.status}</Badge>
                      </div>

                      {ct.status === 'active' && (
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-xs font-medium">Submit Your Work</Label>
                          <Textarea
                            placeholder="Add notes about your submission..."
                            value={submissionNotes[ct.id] || ''}
                            onChange={e => setSubmissionNotes(prev => ({ ...prev, [ct.id]: e.target.value }))}
                            rows={2}
                            className="text-sm"
                          />
                          <input
                            type="file"
                            accept=".pdf,.docx"
                            className="hidden"
                            ref={el => { fileInputRefs.current[ct.id] = el; }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(ct.id, file);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="default"
                            disabled={uploadingId === ct.id}
                            onClick={() => fileInputRefs.current[ct.id]?.click()}
                          >
                            {uploadingId === ct.id ? (
                              <><FileUp className="mr-1 h-3.5 w-3.5 animate-pulse" /> Uploading...</>
                            ) : (
                              <><Upload className="mr-1 h-3.5 w-3.5" /> Upload PDF/DOCX</>
                            )}
                          </Button>
                        </div>
                      )}

                      {ct.submission_url && (
                        <div className="flex items-center gap-2 text-xs text-accent">
                          <Check className="h-3.5 w-3.5" /> Work submitted
                        </div>
                      )}

                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/messages/${ct.client_id}`}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message Client
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WriterDashboard;
