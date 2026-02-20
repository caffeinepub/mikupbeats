import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import {
  Beat,
  BeatFilter,
  Showcase,
  UserProfile,
  BeatCategory,
  BeatStyle,
  BeatTexture,
  CoverArtEntry,
  PreviewEntry,
  RightsFolder,
  DeliveryMethod,
  RightsType,
  ExternalBlob,
  MusicLink,
  Platform,
  Show,
  Replay,
  Section,
  Message,
  Milestone,
  ShoppingItem,
  StripeConfiguration,
  StripeSessionStatus,
  AnalyticsData,
  PageType,
  Mixtape,
  ShowcaseHighlight,
  MixtapeSubmissionFeeConfig,
} from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// Admin Check
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Beats
export function useGetBeats() {
  const { actor, isFetching } = useActor();
  return useQuery<Beat[]>({
    queryKey: ['beats'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBeats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFilterBeats(filter: BeatFilter) {
  const { actor, isFetching } = useActor();
  return useQuery<Beat[]>({
    queryKey: ['beats', 'filtered', filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterBeats(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBeat(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Beat | null>({
    queryKey: ['beat', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBeat(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useUploadBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      artist: string;
      category: BeatCategory;
      style: BeatStyle;
      texture: BeatTexture;
      coverArt: CoverArtEntry[];
      preview: PreviewEntry;
      rightsFolders: RightsFolder[];
      deliveryMethod: DeliveryMethod;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.uploadBeat(
        params.id,
        params.title,
        params.artist,
        params.category,
        params.style,
        params.texture,
        params.coverArt,
        params.preview,
        params.rightsFolders,
        params.deliveryMethod
      );
      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beats'] });
    },
  });
}

export function useUpdateBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      artist: string;
      category: BeatCategory;
      style: BeatStyle;
      texture: BeatTexture;
      coverArt: CoverArtEntry[];
      preview: PreviewEntry;
      rightsFolders: RightsFolder[];
      deliveryMethod: DeliveryMethod;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateBeat(
        params.id,
        params.title,
        params.artist,
        params.category,
        params.style,
        params.texture,
        params.coverArt,
        params.preview,
        params.rightsFolders,
        params.deliveryMethod
      );
      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beats'] });
      queryClient.invalidateQueries({ queryKey: ['beat'] });
      queryClient.invalidateQueries({ queryKey: ['featuredBeat'] });
    },
  });
}

export function useDeleteBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBeat(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beats'] });
    },
  });
}

// Rights Management - Reopen for Sale
export function useUnmarkRightsAsSold() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { beatId: string; rightsType: RightsType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unmarkRightsAsSold(params.beatId, params.rightsType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beats'] });
      queryClient.invalidateQueries({ queryKey: ['beat'] });
      queryClient.invalidateQueries({ queryKey: ['featuredBeat'] });
    },
  });
}

// Showcases
export function useGetApprovedShowcases() {
  const { actor, isFetching } = useActor();
  return useQuery<Showcase[]>({
    queryKey: ['showcases', 'approved'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedShowcases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPendingShowcases() {
  const { actor, isFetching } = useActor();
  return useQuery<Showcase[]>({
    queryKey: ['showcases', 'pending'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingShowcases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitShowcase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      songName: string;
      artistName: string;
      category: BeatCategory;
      style: BeatStyle;
      texture: BeatTexture;
      beatId: string | null;
      audioFile: ExternalBlob;
      coverArt: ExternalBlob | null;
      externalLink: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitShowcase(
        params.id,
        params.songName,
        params.artistName,
        params.category,
        params.style,
        params.texture,
        params.beatId,
        params.audioFile,
        params.coverArt,
        params.externalLink
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] });
    },
  });
}

export function useApproveShowcase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveShowcase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] });
    },
  });
}

export function useApproveAllShowcases() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveAllShowcases();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] });
    },
  });
}

export function useDeleteShowcase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteShowcase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] });
    },
  });
}

// Showcase Highlights (Mixtape Integration)
export function useGetShowcaseHighlights() {
  const { actor, isFetching } = useActor();
  return useQuery<ShowcaseHighlight[]>({
    queryKey: ['showcaseHighlights'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getShowcaseHighlights();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetShowcaseHighlight() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mixtapeId: string;
      song: ExternalBlob;
      artistName: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setShowcaseHighlight(params.mixtapeId, params.song, params.artistName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showcaseHighlights'] });
    },
  });
}

// Mixtapes
export function useGetApprovedMixtapes() {
  const { actor, isFetching } = useActor();
  return useQuery<Mixtape[]>({
    queryKey: ['mixtapes', 'approved'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedMixtapes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPendingMixtapes() {
  const { actor, isFetching } = useActor();
  return useQuery<Mixtape[]>({
    queryKey: ['mixtapes', 'pending'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingMixtapes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitMixtape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title: string;
      artistName: string;
      description: string;
      coverArt: ExternalBlob | null;
      songs: ExternalBlob[];
      externalLinks: string[];
      stripeSessionId: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitMixtape(
        params.id,
        params.title,
        params.artistName,
        params.description,
        params.coverArt,
        params.songs,
        params.externalLinks,
        params.stripeSessionId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mixtapes'] });
    },
  });
}

export function useApproveMixtape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveMixtape(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mixtapes'] });
      queryClient.invalidateQueries({ queryKey: ['showcaseHighlights'] });
    },
  });
}

export function useRejectMixtape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectMixtape(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mixtapes'] });
    },
  });
}

export function useDeleteMixtape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMixtape(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mixtapes'] });
      queryClient.invalidateQueries({ queryKey: ['showcaseHighlights'] });
    },
  });
}

// Mixtape Submission Fee Config
export function useGetMixtapeSubmissionFeeConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<MixtapeSubmissionFeeConfig>({
    queryKey: ['mixtapeSubmissionFeeConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMixtapeSubmissionFeeConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetMixtapeSubmissionFeeConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { enabled: boolean; priceInCents: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setMixtapeSubmissionFeeConfig(params.enabled, params.priceInCents);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mixtapeSubmissionFeeConfig'] });
    },
  });
}

// User Profiles
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Purchases
export function useGetPurchaseHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ['purchaseHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPurchaseHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordBeatPurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      beatId: string;
      sessionId: string;
      isFree: boolean;
      rightsType: RightsType;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordBeatPurchase(params.beatId, params.sessionId, params.isFree, params.rightsType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseHistory'] });
      queryClient.invalidateQueries({ queryKey: ['beats'] });
      queryClient.invalidateQueries({ queryKey: ['beat'] });
    },
  });
}

export function useVerifyBeatPurchase(beatId: string, sessionId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['verifyBeatPurchase', beatId, sessionId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.verifyBeatPurchase(beatId, sessionId);
    },
    enabled: !!actor && !isFetching && !!beatId,
  });
}

export function useGetRightsZipFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { beatId: string; rightsType: RightsType; sessionId: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRightsZipFile(params.beatId, params.rightsType, params.sessionId);
    },
  });
}

export function useGetGoogleDriveLink() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { beatId: string; rightsType: RightsType; sessionId: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGoogleDriveLink(params.beatId, params.rightsType, params.sessionId);
    },
  });
}

export function useDownloadLicenseFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { beatId: string; rightsType: RightsType; sessionId: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      const licenseFiles = await actor.getLicenseFiles(params.beatId, params.rightsType, params.sessionId);
      return licenseFiles;
    },
  });
}

export function useGetLicenseFiles(beatId: string, rightsType: RightsType, sessionId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob[]>({
    queryKey: ['licenseFiles', beatId, rightsType, sessionId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLicenseFiles(beatId, rightsType, sessionId);
    },
    enabled: !!actor && !isFetching && !!beatId,
  });
}

// Stripe
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isStripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isStripeConfigured'] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { items: ShoppingItem[]; successUrl: string; cancelUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(params.items, params.successUrl, params.cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useGetStripeSessionStatus(sessionId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<StripeSessionStatus>({
    queryKey: ['stripeSessionStatus', sessionId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStripeSessionStatus(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
  });
}

// User Approval
export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
  });
}

// M.v.A Preview
export function useGetMvaPreview() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ['mvaPreview'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMvaPreview();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadMvaPreview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadMvaPreview(reference);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mvaPreview'] });
    },
  });
}

export function useDeleteMvaPreview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMvaPreview();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mvaPreview'] });
    },
  });
}

// Music Links
export function useGetMusicLinks() {
  const { actor, isFetching } = useActor();
  return useQuery<MusicLink[]>({
    queryKey: ['musicLinks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMusicLinks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMusicLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      platform: Platform;
      url: string;
      releaseDate: string | null;
      coverArt: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMusicLink(params.title, params.platform, params.url, params.releaseDate, params.coverArt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicLinks'] });
    },
  });
}

export function useUpdateMusicLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      platform: Platform;
      url: string;
      releaseDate: string | null;
      coverArt: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMusicLink(params.title, params.platform, params.url, params.releaseDate, params.coverArt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicLinks'] });
    },
  });
}

export function useDeleteMusicLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMusicLink(title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicLinks'] });
    },
  });
}

// Featured Beat
export function useGetFeaturedBeat() {
  const { actor, isFetching } = useActor();
  return useQuery<Beat | null>({
    queryKey: ['featuredBeat'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getFeaturedBeat();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetFeaturedBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (beatId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setFeaturedBeat(beatId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredBeat'] });
    },
  });
}

export function useClearFeaturedBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearFeaturedBeat();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredBeat'] });
    },
  });
}

// Live Shows
export function useGetUpcomingShows() {
  const { actor, isFetching } = useActor();
  return useQuery<Show[]>({
    queryKey: ['upcomingShows'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingShows();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUpcomingShow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; title: string; date: string; time: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addUpcomingShow(params.id, params.title, params.date, params.time, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcomingShows'] });
    },
  });
}

export function useUpdateUpcomingShow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; title: string; date: string; time: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUpcomingShow(params.id, params.title, params.date, params.time, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcomingShows'] });
    },
  });
}

export function useDeleteUpcomingShow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteUpcomingShow(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcomingShows'] });
    },
  });
}

// Replays
export function useGetReplays() {
  const { actor, isFetching } = useActor();
  return useQuery<Replay[]>({
    queryKey: ['replays'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReplays();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddReplay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; title: string; description: string; replayUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReplay(params.id, params.title, params.description, params.replayUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replays'] });
    },
  });
}

export function useUpdateReplay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; title: string; description: string; replayUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateReplay(params.id, params.title, params.description, params.replayUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replays'] });
    },
  });
}

export function useDeleteReplay() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteReplay(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replays'] });
    },
  });
}

// Forum Sections
export function useGetSections() {
  const { actor, isFetching } = useActor();
  return useQuery<Section[]>({
    queryKey: ['sections'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSections();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSection(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Section | null>({
    queryKey: ['section', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSection(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; title: string; description: string; linkSharingEnabled: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSection(params.id, params.title, params.description, params.linkSharingEnabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

export function useDeleteSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

export function useGetSectionLinkSharing() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['sectionLinkSharing'],
    queryFn: async () => {
      if (!actor) return false;
      return false;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetSectionLinkSharing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; enabled: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setSectionLinkSharing(params.id, params.enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['section'] });
      queryClient.invalidateQueries({ queryKey: ['sectionLinkSharing'] });
    },
  });
}

// Forum Messages
export function useGetMessages(sectionId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ['messages', sectionId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages(sectionId);
    },
    enabled: !!actor && !isFetching && !!sectionId,
    refetchInterval: 3000,
  });
}

export function useAddMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { sectionId: string; id: string; message: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMessage(params.sectionId, params.id, params.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.sectionId] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// Milestones
export function useGetMilestones() {
  const { actor, isFetching } = useActor();
  return useQuery<Milestone[]>({
    queryKey: ['milestones'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMilestones();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveMilestone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; milestone: Milestone }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveMilestone(params.id, params.milestone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

export function useDeleteMilestone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMilestone(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

export function useUpdateMilestoneOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestoneIds: [string, bigint][]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMilestoneOrder(milestoneIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

// License Management
export function useGetBasicRightsLicense() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ['basicRightsLicense'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBasicRightsLicense();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadBasicRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadBasicRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basicRightsLicense'] });
    },
  });
}

export function useUpdateBasicRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBasicRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basicRightsLicense'] });
    },
  });
}

export function useDeleteBasicRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBasicRightsLicense();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basicRightsLicense'] });
    },
  });
}

export function useGetPremiumRightsLicense() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ['premiumRightsLicense'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPremiumRightsLicense();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadPremiumRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadPremiumRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premiumRightsLicense'] });
    },
  });
}

export function useUpdatePremiumRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePremiumRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premiumRightsLicense'] });
    },
  });
}

export function useDeletePremiumRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePremiumRightsLicense();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premiumRightsLicense'] });
    },
  });
}

export function useGetExclusiveRightsLicense() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ['exclusiveRightsLicense'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getExclusiveRightsLicense();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadExclusiveRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadExclusiveRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusiveRightsLicense'] });
    },
  });
}

export function useUpdateExclusiveRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateExclusiveRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusiveRightsLicense'] });
    },
  });
}

export function useDeleteExclusiveRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteExclusiveRightsLicense();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusiveRightsLicense'] });
    },
  });
}

export function useGetStemsRightsLicense() {
  const { actor, isFetching } = useActor();
  return useQuery<ExternalBlob | null>({
    queryKey: ['stemsRightsLicense'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStemsRightsLicense();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadStemsRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadStemsRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stemsRightsLicense'] });
    },
  });
}

export function useUpdateStemsRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (license: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStemsRightsLicense(license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stemsRightsLicense'] });
    },
  });
}

export function useDeleteStemsRightsLicense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteStemsRightsLicense();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stemsRightsLicense'] });
    },
  });
}

// Analytics
export function useGetAnalytics() {
  const { actor, isFetching } = useActor();
  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordSiteVisit() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (page: PageType) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordSiteVisit(page);
    },
  });
}

export function useAddExcludedVisitor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExcludedVisitor(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['excludedVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useRemoveExcludedVisitor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeExcludedVisitor(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['excludedVisitors'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useIsExcludedVisitor(principal: Principal) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isExcludedVisitor', principal.toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isExcludedVisitor(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetExcludedVisitors() {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ['excludedVisitors'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExcludedVisitors();
    },
    enabled: !!actor && !isFetching,
  });
}

// YouTube Live URL
export function useGetYouTubeLiveUrl() {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUrl = localStorage.getItem('youtubeLiveUrl');
    if (storedUrl) {
      setUrl(storedUrl);
    }
    setIsLoading(false);
  }, []);

  const saveUrl = (newUrl: string) => {
    localStorage.setItem('youtubeLiveUrl', newUrl);
    setUrl(newUrl);
  };

  const deleteUrl = () => {
    localStorage.removeItem('youtubeLiveUrl');
    setUrl('');
  };

  return { url, saveUrl, deleteUrl, isLoading };
}
