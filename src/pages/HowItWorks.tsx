import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { FileText, Search, Handshake, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { icon: FileText, title: 'Post a Job', desc: 'Clients describe their writing needs, set a budget and deadline.' },
  { icon: Search, title: 'Writers Apply', desc: 'Talented writers browse jobs and submit proposals with bids.' },
  { icon: Handshake, title: 'Collaborate', desc: 'Accept a writer, fund the escrow, and work together through the platform.' },
  { icon: DollarSign, title: 'Get Paid', desc: 'Once work is approved, payment is released from escrow to the writer.' },
];

const HowItWorks = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">How InkBridge Works</h1>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">A simple, secure process from posting a job to getting paid.</p>
        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div key={step.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="flex items-start gap-6 p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <step.icon className="h-7 w-7 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-accent">STEP {i + 1}</span>
                  <h3 className="text-lg font-heading font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default HowItWorks;
