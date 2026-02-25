import { useState, useEffect } from 'react';
import { useGetApprovedMixtapes, useRecordSiteVisit } from '../hooks/useQueries';
import { PageType } from '../backend';
import MixtapeCard from '../components/MixtapeCard';
import MixtapeSubmissionForm from '../components/MixtapeSubmissionForm';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function MixtapesPage() {
  const { data: mixtapes = [], isLoading } = useGetApprovedMixtapes();
  const { identity } = useInternetIdentity();
  const recordVisit = useRecordSiteVisit();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    recordVisit.mutate(PageType.mixtapes);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredMixtapes = mixtapes.filter((mixtape) => {
    const query = searchQuery.toLowerCase();
    return (
      mixtape.title.toLowerCase().includes(query) ||
      mixtape.artistName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#a970ff]">
          Mixtape & Album Drops
        </h1>
        <p className="text-muted-foreground">
          Discover full-length projects from talented artists
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search mixtapes by title or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border/40"
          />
        </div>
        {identity && <MixtapeSubmissionForm />}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-96 bg-card/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : filteredMixtapes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? 'No mixtapes found matching your search.'
              : 'No mixtapes available yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMixtapes.map((mixtape) => (
            <MixtapeCard key={mixtape.id} mixtape={mixtape} />
          ))}
        </div>
      )}
    </div>
  );
}
