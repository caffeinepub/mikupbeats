import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, ShoppingCart, Loader2, Download } from 'lucide-react';
import { Beat, PreviewType, RightsType } from '../backend';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useCreateCheckoutSession } from '../hooks/useQueries';
import { useStripePreflight } from '../hooks/useStripePreflight';
import { toast } from 'sonner';
import { createPendingPaidPurchase, storeFreePurchase } from '../utils/purchaseTracking';
import { useRecordBeatPurchase } from '../hooks/useQueries';
import { isValidStripeCheckoutUrl, sanitizeCheckoutError } from '../lib/stripeCheckout';
import { logCheckoutEvent, sanitizeErrorForLogging } from '../lib/checkoutDebug';
import { getRightsLabel, isBeatExclusiveSold, canPurchaseRights } from '../lib/beatRights';

interface BeatCardProps {
  beat: Beat;
}

export default function BeatCard({ beat }: BeatCardProps) {
  const navigate = useNavigate();
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const createCheckout = useCreateCheckoutSession();
  const recordPurchase = useRecordBeatPurchase();
  const { isStripeConfigured, canStartPaidCheckout, checkoutUnavailableMessage } = useStripePreflight();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingRightIndex, setPurchasingRightIndex] = useState<number | null>(null);

  const coverArtUrl = beat.coverArt[0]?.reference.getDirectURL();
  const previewUrl = beat.preview?.reference.getDirectURL();
  const isVideo = beat.preview?.previewType === PreviewType.video;
  const isCurrentlyPlaying = currentAudio === previewUrl && isPlaying;
  const isExclusiveSold = isBeatExclusiveSold(beat);

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

  const handleCoverArtClick = () => {
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or cover art
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.cover-art-clickable')) {
      return;
    }
    navigate({ to: '/beat/$beatId', params: { beatId: beat.id } });
  };

  const handlePurchase = async (rightIndex: number, price: bigint, isFree: boolean, rightsType: RightsType) => {
    setIsPurchasing(true);
    setPurchasingRightIndex(rightIndex);
    
    try {
      const priceInCents = Number(price);
      const isFreeOrZero = isFree || priceInCents === 0;

      if (isFreeOrZero) {
        // Handle free download or $0 price - record purchase immediately
        const sessionId = `free-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        // Store free purchase in localStorage
        storeFreePurchase(
          beat.id,
          beat.title,
          beat.artist,
          rightsType,
          sessionId,
          beat.deliveryMethod
        );
        
        // Record purchase on backend
        await recordPurchase.mutateAsync({ 
          beatId: beat.id, 
          sessionId, 
          isFree: true,
          rightsType: rightsType
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
      createPendingPaidPurchase(
        beat.id,
        beat.title,
        beat.artist,
        rightsType,
        beat.deliveryMethod
      );

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

  const getRightsVariant = (rightsType: RightsType) => {
    // Basic Right uses default variant which will be styled with purple
    switch (rightsType) {
      case RightsType.basicRight:
        return 'default';
      case RightsType.premiumRight:
        return 'secondary';
      case RightsType.exclusiveRight:
        return 'outline';
      case RightsType.stems:
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriceDisplay = (folder: typeof beat.rightsFolders[0]) => {
    const priceInCents = Number(folder.priceInCents);
    if (folder.freeDownload || priceInCents === 0) {
      return 'Free';
    }
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  return (
    <Card 
      className={`overflow-hidden bg-card border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer ${
        isCurrentlyPlaying ? 'ring-2 ring-primary shadow-xl shadow-primary/50 border-primary/60' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="p-0">
        <div 
          className={`cover-art-clickable relative aspect-square overflow-hidden cursor-pointer group ${
            isCurrentlyPlaying ? 'ring-2 ring-primary shadow-lg shadow-primary/50' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleCoverArtClick();
          }}
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
              <span className="text-4xl font-bold text-muted-foreground">{beat.title[0]}</span>
            </div>
          )}
          
          <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${
            isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <div className={`rounded-full bg-primary/90 p-4 transition-all duration-300 ${
              isCurrentlyPlaying ? 'animate-pulse shadow-lg shadow-primary/50' : ''
            }`}>
              {isCurrentlyPlaying ? (
                <Pause className="h-8 w-8 text-primary-foreground" />
              ) : (
                <Play className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
          </div>

          {previewUrl && (
            <div className="absolute bottom-2 left-2 z-10">
              <Badge variant="secondary" className="bg-background/80 text-xs">
                {isVideo ? 'Video Audio' : '60s Preview'}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{beat.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{beat.artist}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {beat.category}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {beat.style}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {beat.texture}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {isExclusiveSold && (
          <div className="w-full px-4 py-3 rounded-md bg-destructive/10 border border-destructive/40 text-center">
            <span className="text-sm font-semibold text-destructive">
              Exclusive – Sold
            </span>
          </div>
        )}
        {!isExclusiveSold && beat.rightsFolders.map((folder, index) => {
          const priceInCents = Number(folder.priceInCents);
          const isFreeOrZero = folder.freeDownload || priceInCents === 0;
          const isBasicRight = folder.rightsType === RightsType.basicRight;
          const canPurchase = canPurchaseRights(beat, folder.rightsType);
          const isPaidRight = !isFreeOrZero;
          
          return (
            <Button
              key={index}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePurchase(index, folder.priceInCents, folder.freeDownload, folder.rightsType);
              }}
              disabled={isPurchasing || !canPurchase || (isPaidRight && !canStartPaidCheckout)}
              className={`w-full ${isBasicRight ? 'bg-[#a970ff] hover:bg-[#a970ff]/90 text-white' : ''}`}
              variant={isBasicRight ? undefined : (getRightsVariant(folder.rightsType) as any)}
            >
              {isPurchasing && purchasingRightIndex === index ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isFreeOrZero ? (
                <Download className="h-4 w-4 mr-2" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              {getRightsLabel(folder.rightsType)} - {getPriceDisplay(folder)}
            </Button>
          );
        })}
      </CardFooter>
    </Card>
  );
}
