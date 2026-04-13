import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, PenLine, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection = () => (
  <section className="relative gradient-hero min-h-[90vh] flex items-center overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(152 56% 45% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(217 71% 40% / 0.4) 0%, transparent 50%)' }} />
    <div className="container mx-auto px-4 py-20 relative z-10">
      <div className="max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent mb-6">
            <Shield className="h-4 w-4" /> Trusted Writing Marketplace
          </span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6" style={{ color: 'hsl(0 0% 100%)' }}>
          Where Great Writing<br />
          <span className="text-gradient">Meets Opportunity</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg md:text-xl mb-8 max-w-xl" style={{ color: 'hsl(210 20% 80%)' }}>
          Connect with talented writers or find your next writing gig. Secure escrow payments, real-time collaboration, and trusted reviews.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8" asChild>
            <Link to="/signup">Start Writing <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" className="border-border/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8" asChild>
            <Link to="/signup">Hire a Writer</Link>
          </Button>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-12 flex items-center gap-8">
          {[
            { icon: PenLine, label: '2,500+ Writers' },
            { icon: Users, label: '10K+ Projects' },
            { icon: Shield, label: 'Escrow Protected' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2" style={{ color: 'hsl(210 20% 75%)' }}>
              <Icon className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
