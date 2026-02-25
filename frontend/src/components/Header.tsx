import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3 ml-14">
          <img
            src="/assets/generated/mikupbeats-logo-transparent.dim_200x200.png"
            alt="MikupBeats Logo"
            className="h-10 w-10"
          />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              MikupBeats
            </h1>
            <p className="text-xs text-muted-foreground">Premium Beats</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {userProfile && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{userProfile.name}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Guest Mode
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
