import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Feather, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, role } = useAuth();

  const dashboardPath = role === 'client' ? '/dashboard/client' : role === 'admin' ? '/dashboard/admin' : '/dashboard/writer';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <Feather className="h-6 w-6 text-accent" />
          InkBridge
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/jobs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse Jobs</Link>
          <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          {user ? (
            <Button asChild><Link to={dashboardPath}>Dashboard</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/login">Log In</Link></Button>
              <Button asChild><Link to="/signup">Get Started</Link></Button>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden glass border-t p-4 flex flex-col gap-3">
          <Link to="/jobs" className="text-sm py-2" onClick={() => setOpen(false)}>Browse Jobs</Link>
          {user ? (
            <Button asChild onClick={() => setOpen(false)}><Link to={dashboardPath}>Dashboard</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild onClick={() => setOpen(false)}><Link to="/login">Log In</Link></Button>
              <Button asChild onClick={() => setOpen(false)}><Link to="/signup">Get Started</Link></Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
