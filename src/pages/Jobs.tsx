import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, DollarSign, Clock, ArrowRight } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string | null;
  category: string;
  skills_required: string[];
  status: string;
  created_at: string;
  client_id: string;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase.from('jobs').select('*').eq('status', 'open').order('created_at', { ascending: false });
      if (data) setJobs(data as unknown as Job[]);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase()) ||
    j.skills_required.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold mb-2">Browse Jobs</h1>
            <p className="text-muted-foreground">Find your next writing opportunity</p>
          </div>
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title, skill, or keyword..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No jobs found. Check back soon!</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(job => (
                <Card key={job.id} className="hover:shadow-lg hover:border-accent/30 transition-all group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-heading line-clamp-2 group-hover:text-accent transition-colors">{job.title}</CardTitle>
                      <Badge variant="secondary" className="shrink-0 ml-2">{job.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.skills_required.slice(0, 3).map(s => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${job.budget}</span>
                        {job.deadline && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(job.deadline), 'MMM d')}</span>}
                      </div>
                      <Button size="sm" variant="ghost" className="text-accent" asChild>
                        <Link to={`/jobs/${job.id}`}>View <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Jobs;
