import { PenLine, Shield, Star, Wallet, MessageSquare, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: PenLine, title: 'Post & Apply', desc: 'Clients post jobs, writers apply with proposals. Simple and efficient.' },
  { icon: Shield, title: 'Escrow Payments', desc: 'Funds are held securely until work is approved. Trust built in.' },
  { icon: Star, title: 'Ratings & Reviews', desc: 'Build your reputation with transparent reviews from both sides.' },
  { icon: MessageSquare, title: 'Real-time Chat', desc: 'Communicate directly with your client or writer on the platform.' },
  { icon: FileText, title: 'File Submissions', desc: 'Upload and download work files directly through InkBridge.' },
  { icon: Wallet, title: 'Wallet System', desc: 'Track earnings, deposits, and transactions all in one place.' },
];

const FeaturesSection = () => (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Everything You Need</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">A complete platform for freelance writing — from discovery to delivery.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="group rounded-xl border bg-card p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <f.icon className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
