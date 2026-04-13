import { Feather } from 'lucide-react';

const Footer = () => (
  <footer className="bg-card border-t py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-heading font-bold text-lg">
          <Feather className="h-5 w-5 text-accent" />
          InkBridge
        </div>
        <p className="text-sm text-muted-foreground">© 2026 InkBridge. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
