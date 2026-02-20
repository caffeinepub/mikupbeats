import { useState } from 'react';
import { Menu, X, Store, Star, Radio, Layers, Music, MessageSquare, ShoppingBag, User, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    setOpen(false);
    window.location.href = '/';
  };

  const handleLogin = async () => {
    setOpen(false);
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate({ to: path });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full bg-card border border-primary/20 hover:bg-primary/10 shadow-lg shadow-primary/10"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-card border-primary/20">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <img
              src="/assets/generated/mikupbeats-logo-transparent.dim_200x200.png"
              alt="MikupBeats"
              className="h-8 w-8"
            />
            <span className="text-primary">MikupBeats</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Navigation</p>
            <nav className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-3 h-11" onClick={() => handleNavigation('/')}>
                <Store className="h-5 w-5" />
                <span>Store</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11"
                onClick={() => handleNavigation('/showcase')}
              >
                <Star className="h-5 w-5" />
                <span>Showcase</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-11" onClick={() => handleNavigation('/live')}>
                <Radio className="h-5 w-5" />
                <span>Live</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11"
                onClick={() => handleNavigation('/mva')}
              >
                <Layers className="h-5 w-5" />
                <span>M.v.A</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11"
                onClick={() => handleNavigation('/music-links')}
              >
                <Music className="h-5 w-5" />
                <span>Music Links</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11"
                onClick={() => handleNavigation('/forum')}
              >
                <MessageSquare className="h-5 w-5" />
                <span>Community Forum</span>
              </Button>
            </nav>
          </div>

          <Separator />

          {isAuthenticated ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Account</p>
              <nav className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation('/account-setup')}
                >
                  <User className="h-5 w-5" />
                  <span>Account Setup</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation('/purchase-history')}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Purchase History</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </nav>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Account</p>
              <nav className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11"
                  onClick={handleLogin}
                  disabled={loginStatus === 'logging-in'}
                >
                  <LogIn className="h-5 w-5" />
                  <span>{loginStatus === 'logging-in' ? 'Logging in...' : 'Login'}</span>
                </Button>
              </nav>
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="text-xs text-muted-foreground text-center">
            <p>© 2025 MikupBeats</p>
            <p className="mt-1">
              Built with love using{' '}
              <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
