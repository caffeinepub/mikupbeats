import { useEffect } from 'react';
import { useGetYouTubeLiveUrl, useIsCallerAdmin, useGetUpcomingShows, useGetReplays, useRecordSiteVisit } from '../hooks/useQueries';
import { Loader2, Radio, Calendar, PlayCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageType } from '../backend';

export default function LivePage() {
  const { url: liveUrl, isLoading } = useGetYouTubeLiveUrl();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: upcomingShows = [], isLoading: showsLoading } = useGetUpcomingShows();
  const { data: replays = [], isLoading: replaysLoading } = useGetReplays();
  const recordVisit = useRecordSiteVisit();

  useEffect(() => {
    // Record site visit when page loads
    recordVisit.mutate(PageType.live);
  }, []);

  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
        const videoId = urlObj.searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (urlObj.hostname.includes('youtu.be')) {
        const videoId = urlObj.pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#a970ff] flex items-center gap-3">
          <Radio className="h-10 w-10" />
          Live Stream
        </h1>
        <p className="text-muted-foreground">Watch live beat-making sessions and catch up on past streams</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#a970ff]" />
        </div>
      ) : liveUrl ? (
        <div className="max-w-5xl mx-auto mb-12">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={getEmbedUrl(liveUrl)}
              className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-[#a970ff]/20"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <Alert className="max-w-2xl mx-auto mb-12 border-[#a970ff]/20">
          <AlertDescription className="text-center">
            {isAdmin ? (
              <>No live stream configured. Visit the Admin page to set up a YouTube live stream URL.</>
            ) : (
              <>No live stream is currently active. Check back later!</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Separator className="my-12" />

      {/* Upcoming Shows Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-[#a970ff]" />
          <h2 className="text-3xl font-bold text-[#a970ff]">
            Upcoming Shows
          </h2>
        </div>

        {showsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#a970ff]" />
          </div>
        ) : upcomingShows.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingShows.map((show, index) => (
              <Card key={index} className="border-[#a970ff]/20 hover:border-[#a970ff]/40 transition-colors bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">{show.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {show.date} at {show.time}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{show.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert className="border-[#a970ff]/20">
            <AlertDescription className="text-center">
              No upcoming shows scheduled at the moment. Check back soon!
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator className="my-12" />

      {/* Replays Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <PlayCircle className="h-8 w-8 text-[#a970ff]" />
          <h2 className="text-3xl font-bold text-[#a970ff]">
            Replays
          </h2>
        </div>

        {replaysLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#a970ff]" />
          </div>
        ) : replays.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {replays.map((replay, index) => (
              <Card key={index} className="border-[#a970ff]/20 hover:border-[#a970ff]/40 transition-colors bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">{replay.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{replay.description}</p>
                  <Button
                    asChild
                    className="w-full bg-[#a970ff] hover:bg-[#a970ff]/90"
                  >
                    <a href={replay.replayUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch Replay
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert className="border-[#a970ff]/20">
            <AlertDescription className="text-center">
              No replays available yet. Past streams will appear here!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
