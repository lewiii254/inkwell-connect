import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, MessageSquare, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

const ClientJobDetail = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [contracts, setContracts] = useState<any[]>([]);

  const fetchData = async () => {
    if (!jobId) return;
    const [{ data: j }, { data: apps }, { data: cts }] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', jobId).single(),
      supabase.from('applications').select('*').eq('job_id', jobId),
      supabase.from('contracts').select('*').eq('job_id', jobId),
    ]);
    if (j) setJob(j);
    if (apps) {
      setApplications(apps);
      const writerIds = apps.map(a => a.writer_id);
      if (cts) {
        cts.forEach(c => { if (!writerIds.includes(c.writer_id)) writerIds.push(c.writer_id); });
      }
      if (writerIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('*').in('user_id', writerIds);
        if (profs) {
          const map: Record<string, any> = {};
          profs.forEach(p => { map[p.user_id] = p; });
          setProfiles(map);
        }
      }
    }
    if (cts) setContracts(cts);
  };

  useEffect(() => { fetchData(); }, [jobId]);

  const handleAccept = async (appId: string, writerId: string) => {
    if (!user || !job) return;
    const app = applications.find(a => a.id === appId);
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', appId);
    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', jobId!);
    await supabase.from('contracts').insert({
      job_id: jobId!,
      writer_id: writerId,
      client_id: user.id,
      amount: app?.bid || job.budget,
    });
    await supabase.from('applications').update({ status: 'rejected' }).eq('job_id', jobId!).neq('id', appId);
    toast.success('Writer accepted! Contract created.');
    fetchData();
  };

  const handleReject = async (appId: string) => {
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId);
    toast.success('Application rejected.');
    fetchData();
  };

  const handleDownload = async (submissionUrl: string) => {
    const { data, error } = await supabase.storage.from('submissions').download(submissionUrl);
    if (error || !data) {
      toast.error('Download failed: ' + (error?.message || 'Unknown error'));
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = submissionUrl.split('/').pop() || 'submission';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!job) return <div className="min-h-screen flex items-center justify-center"><div className="h-32 w-32 bg-muted animate-pulse rounded-xl" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl font-heading">{job.title}</CardTitle>
              <Badge>{job.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{job.description}</p>
            <p className="text-sm">Budget: <strong>${job.budget}</strong></p>
          </CardContent>
        </Card>

        {/* Submissions Section */}
        {contracts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading">Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts.map(ct => (
                  <div key={ct.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{profiles[ct.writer_id]?.full_name || 'Writer'}</p>
                        <p className="text-xs text-muted-foreground">Amount: ${ct.amount}</p>
                      </div>
                      <Badge variant={ct.status === 'completed' ? 'default' : ct.status === 'active' ? 'secondary' : 'destructive'}>{ct.status}</Badge>
                    </div>

                    {ct.submission_url ? (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4 text-accent" /> Submitted Work
                        </div>
                        {ct.submission_notes && (
                          <p className="text-xs text-muted-foreground">{ct.submission_notes}</p>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDownload(ct.submission_url)}>
                          <Download className="mr-1 h-3.5 w-3.5" /> Download File
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No submission yet.</p>
                    )}

                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/messages/${ct.writer_id}`}>
                        <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message Writer
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Applications ({applications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No applications yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{profiles[app.writer_id]?.full_name || 'Writer'}</p>
                        <p className="text-sm text-muted-foreground">Bid: ${app.bid}</p>
                      </div>
                      <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{app.proposal}</p>
                    <div className="flex gap-2">
                      {app.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleAccept(app.id, app.writer_id)}>
                            <Check className="mr-1 h-3.5 w-3.5" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(app.id)}>
                            <X className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/messages/${app.writer_id}`}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message Writer
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientJobDetail;
