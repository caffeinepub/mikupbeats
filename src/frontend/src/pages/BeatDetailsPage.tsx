import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, ShoppingCart, ArrowLeft, Loader2, Download } from 'lucide-react';
import { useGetBeat, useCreateCheckoutSession, useRecordBeatPurchase } from '../hooks/useQueries';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { PreviewType, RightsType, Beat, RightsFolder } from '../backend';
import { useStripePreflight } from '../hooks/useStripePreflight';
import { toast } from 'sonner';
import { createPendingPaidPurchase, storeFreePurchase } from '../utils/purchaseTracking';
import { isValidStripeCheckoutUrl, sanitizeCheckoutError } from '../lib/stripeCheckout';
import { logCheckoutEvent, sanitizeErrorForLogging } from '../lib/checkoutDebug';
import { getRightsLabel, isBeatExclusiveSold, canPurchaseRights } from '../lib/beatRights';

export default function BeatDetailsPage() {
  const { beatId } = useParams({ from: '/beat/$beatId' });
  const navigate = useNavigate();
  const { data: beat, isLoading } = useGetBeat(beatId);
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const createCheckout = useCreateCheckoutSession();
  const recordPurchase = useRecordBeatPurchase();
  const { isStripeConfigured, canStartPaidCheckout, checkoutUnavailableMessage } = useStripePreflight();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingRightIndex, setPurchasingRightIndex] = useState<number | null>(null);

  const previewUrl = beat?.preview?.reference.getDirectURL();
  const isVideo = beat?.preview?.previewType === PreviewType.video;
  const isCurrentlyPlaying = currentAudio === previewUrl && isPlaying;
  const isExclusiveSold = beat ? isBeatExclusiveSold(beat) : false;

  useEffect(() => {
    if (isCurrentlyPlaying && previewUrl) {
      const audio = document.querySelector('audio');
      if (audio) {
        const handleTimeUpdate = () => {
          if (audio.currentTime >= 60) {
            pause();
            audio.currentTime = 0;
          }
        };
        audio.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
        };
      }
    }
  }, [isCurrentlyPlaying, previewUrl, pause]);

  const handlePlayPause = () => {
    if (!previewUrl) {
      toast.error('No preview available for this beat');
      return;
    }

    if (isCurrentlyPlaying) {
      pause();
    } else {
      play(previewUrl);
    }
  };

  const handlePurchase = async (rightIndex: number, price: bigint, isFree: boolean, rightsType: RightsType) => {
    if (!beat) return;

    setIsPurchasing(true);
    setPurchasingRightIndex(rightIndex);

    try {
      const priceInCents = Number(price);
      const isFreeOrZero = isFree || priceInCents === 0;

      if (isFreeOrZero) {
        // Handle free download or $0 price - record purchase immediately
        const sessionId = `free-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Store free purchase in localStorage
        storeFreePurchase(beat.id, beat.title, beat.artist, rightsType, sessionId, beat.deliveryMethod);

        // Record purchase on backend
        await recordPurchase.mutateAsync({
          beatId: beat.id,
          sessionId,
          isFree: true,
          rightsType: rightsType,
        });

        toast.success('Free download access granted! Check your purchase history to download files.');
        setIsPurchasing(false);
        setPurchasingRightIndex(null);
        return;
      }

      // Preflight check for paid purchases
      if (!canStartPaidCheckout) {
        logCheckoutEvent({
          step: 'preflight',
          beatId: beat.id,
          rightsType: rightsType.toString(),
          isStripeConfigured,
          errorMessage: 'Stripe not configured',
        });
        toast.error(checkoutUnavailableMessage);
        setIsPurchasing(false);
        setPurchasingRightIndex(null);
        return;
      }

      // Handle paid purchase through Stripe
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const rightsLabel = getRightsLabel(rightsType, false);

      logCheckoutEvent({
        step: 'createSession',
        beatId: beat.id,
        rightsType: rightsType.toString(),
        isStripeConfigured,
      });

      // Create Stripe checkout session with root-based return URL
      const checkoutSession = await createCheckout.mutateAsync({
        items: [
          {
            productName: `${beat.title} - ${rightsLabel}`,
            productDescription: `${beat.artist} - ${beat.category}`,
            priceInCents: price,
            quantity: BigInt(1),
            currency: 'usd',
          },
        ],
        successUrl: `${baseUrl}/?beatId=${beat.id}&rightsType=${rightsType}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/`,
      });

      // Validate checkout URL
      if (!isValidStripeCheckoutUrl(checkoutSession.url)) {
        logCheckoutEvent({
          step: 'validateUrl',
          beatId: beat.id,
          rightsType: rightsType.toString(),
          isStripeConfigured,
          hasCheckoutUrl: !!checkoutSession.url,
          errorMessage: 'Invalid or empty checkout URL',
        });
        throw new Error('Unable to create checkout session. Please try again.');
      }

      logCheckoutEvent({
        step: 'redirect',
        beatId: beat.id,
        rightsType: rightsType.toString(),
        isStripeConfigured,
        hasCheckoutUrl: true,
      });

      // Store pending purchase record (not finalized yet)
      createPendingPaidPurchase(beat.id, beat.title, beat.artist, rightsType, beat.deliveryMethod);

      // Redirect to Stripe checkout (do NOT call recordBeatPurchase yet)
      window.location.href = checkoutSession.url;
    } catch (error: any) {
      const sanitizedError = sanitizeCheckoutError(error);
      logCheckoutEvent({
        step: 'error',
        beatId: beat.id,
        rightsType: rightsType.toString(),
        isStripeConfigured,
        errorMessage: sanitizeErrorForLogging(error),
      });
      toast.error(sanitizedError);
      setIsPurchasing(false);
      setPurchasingRightIndex(null);
    }
  };

  const getPriceDisplay = (folder: RightsFolder) => {
    const priceInCents = Number(folder.priceInCents);
    if (folder.freeDownload || priceInCents === 0) {
      return 'Free';
    }
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!beat) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Beat not found</p>
            <Button onClick={() => navigate({ to: '/' })}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coverArtUrl = beat.coverArt[0]?.reference.getDirectURL();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Store
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cover Art and Preview */}
          <div className="space-y-4">
            <div
              className={`relative aspect-square overflow-hidden rounded-lg cursor-pointer group ${
                isCurrentlyPlaying ? 'ring-4 ring-primary shadow-2xl shadow-primary/50' : ''
              }`}
              onClick={handlePlayPause}
            >
              {coverArtUrl ? (
                <img
                  src={coverArtUrl}
                  alt={beat.title}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isCurrentlyPlaying ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-6xl font-bold text-muted-foreground">{beat.title[0]}</span>
                </div>
              )}

              <div
                className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${
                  isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <div
                  className={`rounded-full bg-primary/90 p-6 transition-all duration-300 ${
                    isCurrentlyPlaying ? 'animate-pulse shadow-2xl shadow-primary/50' : ''
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-12 w-12 text-primary-foreground" />
                  ) : (
                    <Play className="h-12 w-12 text-primary-foreground" />
                  )}
                </div>
              </div>

              {previewUrl && (
                <div className="absolute bottom-4 left-4 z-10">
                  <Badge variant="secondary" className="bg-background/80">
                    {isVideo ? 'Video Audio' : '60s Preview'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Beat Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-[#a970ff]">{beat.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{beat.artist}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{beat.category}</Badge>
                <Badge variant="secondary">{beat.style}</Badge>
                <Badge variant="secondary">{beat.texture}</Badge>
              </div>
            </div>

            <Card className="bg-card border-border/40">
              <CardHeader>
                <CardTitle className="text-[#a970ff]">Available Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isExclusiveSold && (
                  <div className="w-full px-4 py-3 rounded-md bg-destructive/10 border border-destructive/40 text-center mb-4">
                    <span className="text-sm font-semibold text-destructive">Exclusive – Sold</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      This beat has been sold exclusively and is no longer available for purchase.
                    </p>
                  </div>
                )}
                {!isExclusiveSold &&
                  beat.rightsFolders.map((folder, index) => {
                    const priceInCents = Number(folder.priceInCents);
                    const isFreeOrZero = folder.freeDownload || priceInCents === 0;
                    const canPurchase = canPurchaseRights(beat, folder.rightsType);
                    const isPaidRight = !isFreeOrZero;

                    return (
                      <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border/40">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{getRightsLabel(folder.rightsType)}</h3>
                          <span className="text-2xl font-bold text-primary">{getPriceDisplay(folder)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {folder.rightsType === RightsType.basicRight &&
                            'Non-Exclusive: You may use this beat, but others can purchase it too. Perfect for demos and mixtapes.'}
                          {folder.rightsType === RightsType.premiumRight &&
                            'Non-Exclusive: Enhanced rights with more distribution options. Others can still purchase this beat.'}
                          {folder.rightsType === RightsType.exclusiveRight &&
                            'Exclusive: Full ownership. No one else can purchase this beat after you.'}
                          {folder.rightsType === RightsType.stems && 'Individual track stems for complete creative control.'}
                        </p>
                        <Button
                          onClick={() => handlePurchase(index, folder.priceInCents, folder.freeDownload, folder.rightsType)}
                          disabled={isPurchasing || !canPurchase || (isPaidRight && !canStartPaidCheckout)}
                          className="w-full bg-[#a970ff] hover:bg-[#a970ff]/90"
                        >
                          {isPurchasing && purchasingRightIndex === index ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isFreeOrZero ? (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Get Free Download
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Purchase Now
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            <Card className="bg-card border-border/40">
              <CardHeader>
                <CardTitle className="text-[#a970ff]">Licensing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Non-Exclusive Rights:</strong> You receive a license to use the beat, but the producer retains
                  ownership and can sell it to others.
                </p>
                <p>
                  <strong>Exclusive Rights:</strong> You gain full ownership. The beat is removed from sale and no one else can
                  purchase it.
                </p>
                <p className="text-xs mt-4 pt-4 border-t border-border/40">
                  All purchases include a license agreement. By purchasing, you agree to the terms of use for the selected
                  rights type.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
