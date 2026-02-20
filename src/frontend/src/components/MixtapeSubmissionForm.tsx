import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitMixtape, useGetMixtapeSubmissionFeeConfig, useCreateCheckoutSession } from '@/hooks/useQueries';
import { ExternalBlob } from '@/backend';
import { Upload, X, AlertCircle } from 'lucide-react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MixtapeSubmissionForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [description, setDescription] = useState('');
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
  const [songs, setSongs] = useState<File[]>([]);
  const [externalLinks, setExternalLinks] = useState<string[]>(['']);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);

  const { identity } = useInternetIdentity();
  const submitMixtape = useSubmitMixtape();
  const { data: feeConfig } = useGetMixtapeSubmissionFeeConfig();
  const createCheckoutSession = useCreateCheckoutSession();

  const isAdmin = identity?.getPrincipal().toString() === 'admin'; // Simplified check

  // Strict audio-only validation for MP3, M4A, and WAV
  const allowedAudioMimeTypes = [
    'audio/mpeg',      // MP3
    'audio/mp3',       // MP3 (alternative)
    'audio/mp4',       // M4A
    'audio/x-m4a',     // M4A (alternative)
    'audio/wav',       // WAV
    'audio/x-wav',     // WAV (alternative)
    'audio/wave',      // WAV (alternative)
  ];

  // Allowed file extensions - strictly .mp3, .m4a, .wav
  const allowedExtensions = ['.mp3', '.m4a', '.wav'];

  const validateAudioFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    
    // Check file extension first (most reliable)
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    // Check MIME type
    const hasValidMimeType = allowedAudioMimeTypes.includes(file.type.toLowerCase());
    
    // File must have valid extension AND (valid MIME type OR no MIME type)
    // This handles cases where MIME type might be empty or incorrect
    return hasValidExtension && (hasValidMimeType || file.type === '');
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverArt(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverArtPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSongsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Clear any previous format error
    setFormatError(null);
    setError(null);
    
    // Validate that all files are supported audio formats (MP3, M4A, WAV only)
    const invalidFiles = files.filter(file => !validateAudioFile(file));
    
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map(f => f.name).join(', ');
      setFormatError(`Audio files only (.mp3, .m4a, .wav). Invalid files: ${invalidFileNames}`);
      e.target.value = ''; // Clear the input
      return;
    }
    
    if (files.length + songs.length > 20) {
      setError('Maximum 20 songs allowed per mixtape');
      e.target.value = ''; // Clear the input
      return;
    }
    
    setSongs([...songs, ...files]);
  };

  const removeSong = (index: number) => {
    setSongs(songs.filter((_, i) => i !== index));
    setFormatError(null);
    setError(null);
  };

  const handleExternalLinkChange = (index: number, value: string) => {
    const newLinks = [...externalLinks];
    newLinks[index] = value;
    setExternalLinks(newLinks);
  };

  const addExternalLink = () => {
    setExternalLinks([...externalLinks, '']);
  };

  const removeExternalLink = (index: number) => {
    setExternalLinks(externalLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormatError(null);

    if (!title || !artistName || !description || !coverArt || songs.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    if (songs.length > 20) {
      setError('Maximum 20 songs allowed per mixtape');
      return;
    }

    // Final validation: ensure all songs are supported audio formats before upload
    const invalidFiles = songs.filter(file => !validateAudioFile(file));
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map(f => f.name).join(', ');
      setFormatError(`Audio files only (.mp3, .m4a, .wav). Invalid files: ${invalidFileNames}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let stripeSessionId: string | null = null;

      // Handle payment if required (non-admin users with paid submission enabled)
      if (feeConfig?.enabled && !isAdmin && feeConfig.priceInCents > 0) {
        const sessionResponse = await createCheckoutSession.mutateAsync({
          items: [
            {
              productName: 'Mixtape Submission Fee',
              productDescription: 'Fee for submitting a mixtape/album',
              priceInCents: feeConfig.priceInCents,
              quantity: BigInt(1),
              currency: 'usd',
            },
          ],
          successUrl: `${window.location.origin}/?mixtape_submission=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/mixtapes`,
        });

        // Redirect to Stripe checkout
        window.location.href = sessionResponse.url;
        return;
      }

      // Upload cover art
      const coverArtBytes = await coverArt.arrayBuffer();
      const coverArtBlob = ExternalBlob.fromBytes(new Uint8Array(coverArtBytes));

      // Upload songs with progress tracking
      const songBlobs: ExternalBlob[] = [];
      for (let i = 0; i < songs.length; i++) {
        const songBytes = await songs[i].arrayBuffer();
        const songBlob = ExternalBlob.fromBytes(new Uint8Array(songBytes)).withUploadProgress((percentage) => {
          const overallProgress = ((i + percentage / 100) / songs.length) * 100;
          setUploadProgress(Math.round(overallProgress));
        });
        songBlobs.push(songBlob);
      }

      // Filter out empty external links
      const validLinks = externalLinks.filter((link) => link.trim() !== '');

      // Submit mixtape
      await submitMixtape.mutateAsync({
        id: `mixtape-${Date.now()}`,
        title,
        artistName,
        description,
        coverArt: coverArtBlob,
        songs: songBlobs,
        externalLinks: validLinks,
        stripeSessionId,
      });

      // Reset form
      setTitle('');
      setArtistName('');
      setDescription('');
      setCoverArt(null);
      setCoverArtPreview(null);
      setSongs([]);
      setExternalLinks(['']);
      setUploadProgress(0);
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit mixtape');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Upload className="mr-2 h-4 w-4" />
          Submit Mixtape/Album
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Submit Your Mixtape/Album</DialogTitle>
        </DialogHeader>

        {feeConfig?.enabled && !isAdmin && feeConfig.priceInCents > 0 && (
          <Alert className="bg-primary/10 border-primary/30">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Submission fee: ${(Number(feeConfig.priceInCents) / 100).toFixed(2)} (Admin submissions are free)
            </AlertDescription>
          </Alert>
        )}

        {formatError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm font-medium">{formatError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter mixtape/album title"
              required
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artistName">Artist Name *</Label>
            <Input
              id="artistName"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter artist name"
              required
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your mixtape/album"
              rows={4}
              required
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverArt">Cover Art *</Label>
            <Input
              id="coverArt"
              type="file"
              accept="image/*"
              onChange={handleCoverArtChange}
              required
              disabled={isUploading}
            />
            {coverArtPreview && (
              <div className="mt-2">
                <img src={coverArtPreview} alt="Cover art preview" className="w-32 h-32 object-cover rounded" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="songs">
              Songs * (MP3, M4A, or WAV only - Max 20 songs)
            </Label>
            <Input
              id="songs"
              type="file"
              accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/wave"
              multiple
              onChange={handleSongsChange}
              disabled={isUploading}
            />
            {songs.length > 0 && (
              <div className="mt-2 space-y-2">
                {songs.map((song, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm truncate flex-1">{song.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSong(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>External Links (Optional)</Label>
            {externalLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={link}
                  onChange={(e) => handleExternalLinkChange(index, e.target.value)}
                  placeholder="https://..."
                  disabled={isUploading}
                />
                {externalLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExternalLink(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addExternalLink} disabled={isUploading}>
              Add Link
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isUploading} className="flex-1">
              {isUploading ? 'Uploading...' : 'Submit'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
