import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Clock, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { toast } from 'sonner';
import { format } from 'date-fns';

const JobDetail = () => {
  const { id } = useParams();
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [proposal, setProposal] = useState('');
  const [bid, setBid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (data) setJob(data);
      if (user) {
        const { data: app } = await supabase.from('applications').select('id').eq('job_id', id!).eq('writer_id', user.id);
        if (app && app.length > 0) setApplied(true);
      }
      setLoading(false);
    };
    if (id) fetchJob();
  }, [id, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (role !== 'writer') { toast.error('Only writers can apply to jobs.'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('applications').insert({
        job_id: id!,
        writer_id: user.id,
        proposal,
        bid: parseFloat(bid),
      });
      if (error) throw error;
      toast.success('Application submitted!');
      setApplied(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 container mx-auto px-4">
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 container mx-auto px-4 text-center">
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    </div>
  );

  const canApply = user && role === 'writer' && job.status === 'open';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-2xl font-heading">{job.title}</CardTitle>
                    <Badge>{job.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required?.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
                  </div>
                  <div className="flex gap-6 pt-4 border-t text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Budget: ${job.budget}</span>
                    {job.deadline && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Due: {format(new Date(job.deadline), 'PPP')}</span>}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              {canApply && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-heading">
                      {applied ? 'Applied ✓' : 'Submit Proposal'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {applied ? (
                      <p className="text-sm text-muted-foreground">You've already applied to this job.</p>
                    ) : (
                      <form onSubmit={handleApply} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Your Proposal</Label>
                          <Textarea value={proposal} onChange={e => setProposal(e.target.value)} required placeholder="Why are you a great fit?" rows={4} />
                        </div>
                        <div className="space-y-2">
                          <Label>Your Bid ($)</Label>
                          <Input type="number" value={bid} onChange={e => setBid(e.target.value)} required min="1" placeholder="Enter amount" />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                          {submitting ? 'Submitting...' : 'Apply Now'}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}
              {user && role === 'writer' && job.status !== 'open' && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">This job is no longer accepting applications.</p>
                  </CardContent>
                </Card>
              )}
              {user && role === 'client' && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">You're viewing this as a client. Writers can apply to this job.</p>
                  </CardContent>
                </Card>
              )}
              {!user && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-3">Sign in as a writer to apply for this job.</p>
                    <Button className="w-full" onClick={() => navigate('/login')}>Sign In</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JobDetail;
