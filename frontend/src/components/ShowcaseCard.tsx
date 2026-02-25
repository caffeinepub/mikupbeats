import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { Showcase } from '../backend';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useIsCallerAdmin, useDeleteShowcase } from '../hooks/useQueries';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ShowcaseCardProps {
  showcase: Showcase;
}

export default function ShowcaseCard({ showcase }: ShowcaseCardProps) {
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteShowcase = useDeleteShowcase();
  
  const audioUrl = showcase.audioFile.getDirectURL();
  const coverUrl = showcase.coverArt?.getDirectURL();
  const isCurrentlyPlaying = currentAudio === audioUrl && isPlaying;

  const handleCoverArtClick = () => {
    if (!audioUrl) {
      toast.error('No audio available for this showcase');
      return;
    }

    // Play full-length audio through unified audio player
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play(audioUrl);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteShowcase.mutateAsync(showcase.id);
      toast.success('Showcase deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete showcase');
    }
  };

  const formatCategory = (category: string) => {
    const categoryMap: Record<string, string> = {
      hipHop: 'Hip Hop',
      pop: 'Pop',
      rock: 'Rock',
      electronic: 'Electronic',
      lofi: 'Lo-Fi',
    };
    return categoryMap[category] || category;
  };

  const formatStyle = (style: string) => {
    const styleMap: Record<string, string> = {
      oldSchool: 'Old School',
      modern: 'Modern',
      experimental: 'Experimental',
      trap: 'Trap',
      jazzInfluence: 'Jazz Influence',
      classic: 'Classic',
    };
    return styleMap[style] || style;
  };

  return (
    <Card className={`overflow-hidden bg-card/50 backdrop-blur-sm border-border/40 hover:border-primary/40 transition-all duration-300 ${
      isCurrentlyPlaying ? 'ring-2 ring-primary shadow-xl shadow-primary/50 border-primary/60' : ''
    }`}>
      <CardHeader className="p-0">
        <div 
          className={`relative aspect-video overflow-hidden cursor-pointer group ${
            isCurrentlyPlaying ? 'ring-2 ring-primary shadow-lg shadow-primary/50' : ''
          }`}
          onClick={handleCoverArtClick}
        >
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={showcase.songName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground">{showcase.artistName[0]}</span>
            </div>
          )}

          {/* Play/Pause overlay indicator */}
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

          {/* Audio indicator */}
          <div className="absolute bottom-2 left-2 z-10">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
              Full Audio
            </Badge>
          </div>

          {/* Admin delete button */}
          {isAdmin && (
            <div className="absolute top-2 right-2 z-10">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 bg-destructive/90 hover:bg-destructive shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Showcase</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{showcase.songName}" by {showcase.artistName}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteShowcase.isPending}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {deleteShowcase.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold mb-1">{showcase.songName}</h3>
          <p className="text-sm text-muted-foreground">{showcase.artistName}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {formatCategory(showcase.category)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {formatStyle(showcase.style)}
          </Badge>
        </div>

        {showcase.externalLink && (
          <a 
            href={showcase.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            View More
          </a>
        )}
      </CardContent>
    </Card>
  );
}
