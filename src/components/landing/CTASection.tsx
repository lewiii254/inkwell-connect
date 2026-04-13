import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTASection = () => (
  <section className="py-24 gradient-hero">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4" style={{ color: 'hsl(0 0% 100%)' }}>Ready to Bridge the Gap?</h2>
      <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: 'hsl(210 20% 80%)' }}>
        Join thousands of writers and clients building lasting professional relationships.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8" asChild>
          <Link to="/signup">Join as Writer <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
        <Button size="lg" variant="outline" className="border-border/30 text-primary-foreground hover:bg-primary-foreground/10 px-8" asChild>
          <Link to="/signup">Join as Client</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default CTASection;
