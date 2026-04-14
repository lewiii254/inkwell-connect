import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Feather, Users, Briefcase, DollarSign, LogOut, Shield, AlertTriangle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: p }, { data: r }, { data: j }, { data: c }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('jobs').select('*').order('created_at', { ascending: false }),
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
        supabase.from('wallets').select('*'),
      ]);
      if (p) setUsers(p);
      if (r) setRoles(r);
      if (j) setJobs(j);
      if (c) setContracts(c);
      if (w) setWallets(w);
    };
    fetchAll();
  }, []);

  const getRoleForUser = (userId: string) => {
    const r = roles.find(r => r.user_id === userId);
    return r?.role || 'unknown';
  };

  const totalRevenue = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const disputedContracts = contracts.filter(c => c.status === 'disputed');

  const handleCancelJob = async (jobId: string) => {
    await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', jobId);
    toast.success('Job cancelled');
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'cancelled' } : j));
  };

  const handleResolveDispute = async (contractId: string, resolution: 'completed' | 'cancelled') => {
    await supabase.from('contracts').update({ status: resolution }).eq('id', contractId);
    toast.success(`Dispute resolved as ${resolution}`);
    setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: resolution } : c));
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users },
    { label: 'Total Jobs', value: jobs.length, icon: Briefcase },
    { label: 'Active Contracts', value: contracts.filter(c => c.status === 'active').length, icon: BarChart3 },
    { label: 'Disputes', value: disputedContracts.length, icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
            <Feather className="h-5 w-5 text-accent" /> InkBridge
            <Badge variant="outline" className="ml-2 text-xs"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.full_name || 'Admin'}</span>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate('/'); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-heading font-bold mb-8">Admin Dashboard</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle className="font-heading">All Users ({users.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{u.full_name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground">Rating: {u.rating || 0}⭐ · Reviews: {u.review_count || 0}</p>
                      </div>
                      <Badge variant="outline">{getRoleForUser(u.user_id)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader><CardTitle className="font-heading">All Jobs ({jobs.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-xs text-muted-foreground">${job.budget} · {job.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status}</Badge>
                        {(job.status === 'open' || job.status === 'in_progress') && (
                          <Button variant="destructive" size="sm" onClick={() => handleCancelJob(job.id)}>Cancel</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader><CardTitle className="font-heading">Disputed Contracts ({disputedContracts.length})</CardTitle></CardHeader>
              <CardContent>
                {disputedContracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No disputes to resolve.</p>
                ) : (
                  <div className="space-y-3">
                    {disputedContracts.map(ct => (
                      <div key={ct.id} className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">Contract #{ct.id.slice(0, 8)}</p>
                          <Badge variant="destructive">Disputed</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Amount: ${ct.amount}</p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleResolveDispute(ct.id, 'completed')}>Release Payment</Button>
                          <Button size="sm" variant="outline" onClick={() => handleResolveDispute(ct.id, 'cancelled')}>Cancel & Refund</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
