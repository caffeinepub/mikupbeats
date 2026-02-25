import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, LogIn, ChevronDown, ShoppingCart } from 'lucide-react';
import InteractiveTimeline from '../components/InteractiveTimeline';
import DynamicHomeSequence from '../components/DynamicHomeSequence';
import { getPersistedStripeReturnParams } from '../utils/stripeReturn';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [hasPendingPurchase, setHasPendingPurchase] = useState(false);

  useEffect(() => {
    // Check if there's a pending Stripe return
    const stripeParams = getPersistedStripeReturnParams();
    setHasPendingPurchase(!!stripeParams);
  }, []);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Dynamic Home Sequence Background */}
      <DynamicHomeSequence />

      {/* Content Layer */}
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Hero Intro Banner */}
          <div className="space-y-6 animate-fade-in">
            <div className="relative">
              <img
                src="/assets/generated/mikupbeats-logo-transparent.dim_200x200.png"
                alt="MikupBeats Logo"
                className="h-40 w-40 mx-auto drop-shadow-[0_0_30px_rgba(168,85,247,0.6)] animate-pulse-glow"
              />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-6xl md:text-7xl font-bold text-primary">
                MikupBeats
              </h1>
              <p className="text-2xl md:text-3xl text-primary/80 font-semibold tracking-wide">
                Premium Beat Producer Platform
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover premium beats, showcase your work, and connect with the music community.
              </p>
            </div>

            <div className="relative w-full max-w-3xl mx-auto aspect-[3/1] rounded-lg overflow-hidden border-2 border-primary/30 shadow-[0_0_40px_rgba(168,85,247,0.3)] animate-border-glow">
              <img
                src="/assets/generated/beat-hero-banner.dim_1200x400.png"
                alt="Beat Production"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Pending Purchase Alert */}
          {hasPendingPurchase && (
            <Alert className="max-w-md mx-auto bg-primary/10 border-primary/30 animate-fade-in">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground">
                Please log in to complete your purchase
              </AlertDescription>
            </Alert>
          )}

          {/* Login Section */}
          <div className="space-y-6 animate-fade-in-delay">
            <Button
              onClick={handleLogin}
              disabled={loginStatus === 'logging-in'}
              size="lg"
              className="w-full max-w-md mx-auto text-lg h-14 bg-[#a970ff] hover:bg-[#a970ff]/90 text-white transition-colors shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              {loginStatus === 'logging-in' ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Login with Internet Identity
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>Secure authentication powered by Internet Computer</p>
            </div>
          </div>

          {/* Scroll Down Cue */}
          <div className="animate-bounce-slow pt-8">
            <ChevronDown className="h-8 w-8 mx-auto text-primary/60" />
          </div>
        </div>
      </div>

      {/* Interactive Timeline */}
      <div className="relative z-10">
        <InteractiveTimeline />
      </div>
    </div>
  );
}
