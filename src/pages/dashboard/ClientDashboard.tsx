import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Feather, Plus, Briefcase, Users, DollarSign, LogOut, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const ClientDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', budget: '', deadline: '', category: 'general', skills: '' });

  const fetchData = async () => {
    if (!user) return;
    const [{ data: j }, { data: w }] = await Promise.all([
      supabase.from('jobs').select('*').eq('client_id', user.id).order('created_at', { ascending: false }),
      supabase.from('wallets').select('*').eq('user_id', user.id).single(),
    ]);
    if (j) setJobs(j);
    if (w) setWallet(w);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('jobs').insert({
      client_id: user.id,
      title: form.title,
      description: form.description,
      budget: parseFloat(form.budget),
      deadline: form.deadline || null,
      category: form.category,
      skills_required: form.skills.split(',').map(s => s.trim()).filter(Boolean),
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Job posted!');
    setDialogOpen(false);
    setForm({ title: '', description: '', budget: '', deadline: '', category: 'general', skills: '' });
    fetchData();
  };

  const stats = [
    { label: 'Total Jobs', value: jobs.length, icon: Briefcase },
    { label: 'Active Jobs', value: jobs.filter(j => j.status === 'open' || j.status === 'in_progress').length, icon: Users },
    { label: 'Wallet Balance', value: `$${wallet?.balance || 0}`, icon: DollarSign },
  ];

  const navItems = (
    <Button variant="outline" size="sm" asChild className="mr-2">
      <Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</Link>
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
            <Feather className="h-5 w-5 text-accent" /> InkBridge
          </Link>
          <div className="flex items-center gap-4">
            {navItems}
            <span className="text-sm text-muted-foreground">Hi, {profile?.full_name || 'Client'}</span>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate('/'); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-heading font-bold">Client Dashboard</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Post a Job</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Post a New Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={4} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Budget ($)</Label><Input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} required min="1" /></div>
                  <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. blog, copywriting" /></div>
                <div className="space-y-2"><Label>Required Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} placeholder="SEO, Blog Writing, Research" /></div>
                <Button type="submit" className="w-full">Post Job</Button>
              </form>
            </DialogContent>
          </Dialog>
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
        <Card>
          <CardHeader><CardTitle className="font-heading">Your Jobs</CardTitle></CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No jobs posted yet. Create your first job!</p>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <Link key={job.id} to={`/dashboard/client/jobs/${job.id}`} className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 hover:bg-muted/50 transition-all">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">${job.budget} · {job.category}</p>
                    </div>
                    <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientDashboard;
