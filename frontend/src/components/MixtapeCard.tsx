import { useState } from 'react';
import { Mixtape } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, ExternalLink, Trash2 } from 'lucide-react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useDeleteMixtape } from '../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface MixtapeCardProps {
  mixtape: Mixtape;
}

export default function MixtapeCard({ mixtape }: MixtapeCardProps) {
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteMixtape = useDeleteMixtape();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwner = identity && mixtape.uploader.toString() === identity.getPrincipal().toString();
  const canDelete = isAdmin || isOwner;

  const currentSong = mixtape.songs[currentTrackIndex];
  const isCurrentlyPlaying = currentAudio === currentSong?.getDirectURL() && isPlaying;

  const handlePlayPause = async () => {
    if (!currentSong) return;

    const url = currentSong.getDirectURL();
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play(url);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < mixtape.songs.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      const nextSong = mixtape.songs[currentTrackIndex + 1];
      play(nextSong.getDirectURL());
    }
  };

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      const prevSong = mixtape.songs[currentTrackIndex - 1];
      play(prevSong.getDirectURL());
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMixtape.mutateAsync(mixtape.id);
      toast.success('Mixtape deleted successfully');
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete mixtape');
    }
  };

  return (
    <>
      <Card className="bg-card/50 border-border/40 hover:border-[#a970ff]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
        <CardHeader>
          {mixtape.coverArt && (
            <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden">
              <img
                src={mixtape.coverArt.getDirectURL()}
                alt={mixtape.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardTitle className="text-[#a970ff]">{mixtape.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{mixtape.artistName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{mixtape.description}</p>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Track {currentTrackIndex + 1} of {mixtape.songs.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentTrackIndex === 0}
                className="border-border/40"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handlePlayPause}
                className="flex-1 bg-[#a970ff] hover:bg-[#9860ef] text-white"
              >
                {isCurrentlyPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isCurrentlyPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                disabled={currentTrackIndex === mixtape.songs.length - 1}
                className="border-border/40"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {mixtape.externalLinks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">External Links</p>
              {mixtape.externalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#a970ff] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link}
                </a>
              ))}
            </div>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Mixtape
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mixtape</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{mixtape.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
