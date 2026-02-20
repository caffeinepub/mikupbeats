import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ShowcaseHighlight {
    mixtapeId: string;
    highlightedSong: ExternalBlob;
    artistName: string;
}
export interface LiveStream {
    id: string;
    title: string;
    host: string;
    description: string;
    isActive: boolean;
}
export interface DailyVisit {
    date: string;
    count: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface RightsFolder {
    freeDownload: boolean;
    sold: boolean;
    googleDriveLink?: string;
    zipFile?: ExternalBlob;
    licenseDocs: Array<LicenseDocEntry>;
    audioFiles: Array<AudioFileEntry>;
    priceInCents: bigint;
    rightsType: RightsType;
}
export interface MessageUpdate {
    id: string;
    updatedContent: string;
}
export interface Beat {
    id: string;
    title: string;
    preview: PreviewEntry;
    deliveryMethod: DeliveryMethod;
    rightsFolders: Array<RightsFolder>;
    style: BeatStyle;
    approved: boolean;
    texture: BeatTexture;
    category: BeatCategory;
    artist: string;
    coverArt: Array<CoverArtEntry>;
}
export interface AnalyticsData {
    pageVisits: PageVisits;
    dailyVisits: Array<DailyVisit>;
    totalVisits: bigint;
    uniqueVisitors: bigint;
}
export interface Mixtape {
    id: string;
    title: string;
    externalLinks: Array<string>;
    description: string;
    songs: Array<ExternalBlob>;
    approved: boolean;
    uploader: Principal;
    artistName: string;
    coverArt?: ExternalBlob;
}
export interface MusicLink {
    url: string;
    title: string;
    platform: Platform;
    coverArt?: ExternalBlob;
    releaseDate?: string;
}
export interface AudioFileEntry {
    assetId: string;
    reference: ExternalBlob;
    description?: string;
    fileType: AudioFileType;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Replay {
    replayUrl: string;
    title: string;
    description: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Showcase {
    id: string;
    externalLink?: string;
    songName: string;
    audioFile: ExternalBlob;
    style: BeatStyle;
    approved: boolean;
    beatId?: string;
    texture: BeatTexture;
    category: BeatCategory;
    artistName: string;
    coverArt?: ExternalBlob;
}
export interface PreviewEntry {
    duration: bigint;
    assetId: string;
    reference: ExternalBlob;
    description?: string;
    previewType: PreviewType;
}
export interface MixtapeSubmissionFeeConfig {
    enabled: boolean;
    priceInCents: bigint;
}
export interface LicenseDocEntry {
    assetId: string;
    reference: ExternalBlob;
    description?: string;
    docType: LicenseDocType;
}
export interface BeatFilter {
    style?: BeatStyle;
    texture?: BeatTexture;
    category?: BeatCategory;
}
export type Platform = {
    __kind__: "soundcloud";
    soundcloud: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "spotify";
    spotify: null;
} | {
    __kind__: "youtube";
    youtube: null;
} | {
    __kind__: "appleMusic";
    appleMusic: null;
};
export interface Milestone {
    media?: ExternalBlob;
    title: string;
    order: bigint;
    date: string;
    description: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface CoverArtEntry {
    assetId: string;
    reference: ExternalBlob;
    description?: string;
    fileType: CoverArtType;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface Show {
    title: string;
    date: string;
    time: string;
    description: string;
}
export interface Message {
    id: string;
    principal: Principal;
    name: string;
    createdAt: bigint;
    sectionId: string;
    message: string;
}
export interface PageVisits {
    mva: bigint;
    forum: bigint;
    live: bigint;
    mixtapes: bigint;
    store: bigint;
    musicLinks: bigint;
    showcase: bigint;
}
export interface Section {
    id: string;
    title: string;
    creator: string;
    createdAt: bigint;
    description: string;
    creatorName: string;
    linkSharingEnabled: boolean;
}
export interface UserProfile {
    isCreator: boolean;
    name: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum AudioFileType {
    mp3 = "mp3",
    wav = "wav",
    stems = "stems"
}
export enum BeatCategory {
    pop = "pop",
    lofi = "lofi",
    rock = "rock",
    hipHop = "hipHop",
    electronic = "electronic"
}
export enum BeatStyle {
    experimental = "experimental",
    oldSchool = "oldSchool",
    trap = "trap",
    classic = "classic",
    modern = "modern",
    jazzInfluence = "jazzInfluence"
}
export enum BeatTexture {
    smooth = "smooth",
    gritty = "gritty",
    upbeat = "upbeat",
    melodic = "melodic"
}
export enum CoverArtType {
    jpg = "jpg",
    png = "png",
    webp = "webp"
}
export enum DeliveryMethod {
    googleDrive = "googleDrive",
    zipFiles = "zipFiles"
}
export enum LicenseDocType {
    pdf = "pdf",
    txt = "txt",
    docx = "docx",
    folder = "folder"
}
export enum PageType {
    mva = "mva",
    forum = "forum",
    live = "live",
    mixtapes = "mixtapes",
    store = "store",
    musicLinks = "musicLinks",
    showcase = "showcase"
}
export enum PreviewType {
    audio = "audio",
    video = "video"
}
export enum RightsType {
    basicRight = "basicRight",
    premiumRight = "premiumRight",
    exclusiveRight = "exclusiveRight",
    stems = "stems"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addExcludedVisitor(principal: Principal): Promise<void>;
    addMessage(sectionId: string, id: string, message: string): Promise<void>;
    addMusicLink(title: string, platform: Platform, url: string, releaseDate: string | null, coverArt: ExternalBlob | null): Promise<void>;
    addReplay(id: string, title: string, description: string, replayUrl: string): Promise<void>;
    addUpcomingShow(id: string, title: string, date: string, time: string, description: string): Promise<void>;
    approveAllShowcases(): Promise<void>;
    approveMixtape(id: string): Promise<void>;
    approveShowcase(id: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkUpdateMessages(messageUpdates: Array<MessageUpdate>): Promise<void>;
    canGetBasicRightsWithLicense(beatId: string): Promise<boolean>;
    canGetExclusiveRightsWithLicense(beatId: string): Promise<boolean>;
    canGetPremiumRightsWithLicense(beatId: string): Promise<boolean>;
    canGetStemsRightsWithLicense(beatId: string): Promise<boolean>;
    clearFeaturedBeat(): Promise<void>;
    clearRedirectUrl(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createSection(id: string, title: string, description: string, linkSharingEnabled: boolean): Promise<void>;
    deleteBasicRightsLicense(): Promise<void>;
    deleteBeat(id: string): Promise<void>;
    deleteExclusiveRightsLicense(): Promise<void>;
    deleteMessage(id: string): Promise<void>;
    deleteMilestone(id: string): Promise<void>;
    deleteMixtape(id: string): Promise<void>;
    deleteMusicLink(title: string): Promise<void>;
    deleteMvaPreview(): Promise<void>;
    deletePremiumRightsLicense(): Promise<void>;
    deleteReplay(id: string): Promise<void>;
    deleteSection(id: string): Promise<void>;
    deleteShowcase(id: string): Promise<void>;
    deleteStemsRightsLicense(): Promise<void>;
    deleteUpcomingShow(id: string): Promise<void>;
    endAllLiveStreams(): Promise<void>;
    endLiveStream(id: string): Promise<void>;
    filterBeats(filter: BeatFilter): Promise<Array<Beat>>;
    getActiveLiveStreams(): Promise<Array<LiveStream>>;
    getAnalytics(): Promise<AnalyticsData>;
    getApprovedMixtapes(): Promise<Array<Mixtape>>;
    getApprovedShowcases(): Promise<Array<Showcase>>;
    getBasicRightsLicense(): Promise<ExternalBlob | null>;
    getBeat(id: string): Promise<Beat | null>;
    getBeats(): Promise<Array<Beat>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExcludedVisitors(): Promise<Array<Principal>>;
    getExclusiveRightsLicense(): Promise<ExternalBlob | null>;
    getFeaturedBeat(): Promise<Beat | null>;
    getGoogleDriveLink(beatId: string, rightsType: RightsType, sessionId: string | null): Promise<string | null>;
    getLicenseFiles(beatId: string, rightsType: RightsType, sessionId: string | null): Promise<Array<ExternalBlob>>;
    getManySections(ids: Array<string>): Promise<Array<Section>>;
    getMessages(sectionId: string): Promise<Array<Message>>;
    getMilestones(): Promise<Array<Milestone>>;
    getMixtapeSubmissionFeeConfig(): Promise<MixtapeSubmissionFeeConfig>;
    getMusicLinks(): Promise<Array<MusicLink>>;
    getMvaPreview(): Promise<ExternalBlob | null>;
    getPendingMixtapes(): Promise<Array<Mixtape>>;
    getPendingShowcases(): Promise<Array<Showcase>>;
    getPremiumRightsLicense(): Promise<ExternalBlob | null>;
    getPurchaseHistory(): Promise<Array<string>>;
    getRedirectUrl(): Promise<string | null>;
    getReplays(): Promise<Array<Replay>>;
    getRightsZipFile(beatId: string, rightsType: RightsType, sessionId: string | null): Promise<ExternalBlob | null>;
    getSection(id: string): Promise<Section | null>;
    getSectionLinkSharing(id: string): Promise<boolean>;
    getSections(): Promise<Array<Section>>;
    getShowcaseHighlights(): Promise<Array<ShowcaseHighlight>>;
    getStemsRightsLicense(): Promise<ExternalBlob | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUpcomingShows(): Promise<Array<Show>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isExcludedVisitor(principal: Principal): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    processOutcall(input: TransformationInput): Promise<TransformationOutput>;
    recordBeatPurchase(beatId: string, sessionId: string, isFree: boolean, rightsType: RightsType): Promise<void>;
    recordSiteVisit(page: PageType): Promise<void>;
    rejectMixtape(id: string): Promise<void>;
    removeExcludedVisitor(principal: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveMilestone(id: string, milestone: Milestone): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setFeaturedBeat(beatId: string): Promise<void>;
    setMixtapeSubmissionFeeConfig(enabled: boolean, priceInCents: bigint): Promise<void>;
    setRedirectUrl(url: string): Promise<void>;
    setSectionLinkSharing(id: string, enabled: boolean): Promise<void>;
    setShowcaseHighlight(mixtapeId: string, song: ExternalBlob, artistName: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    startLiveStream(id: string, host: string, title: string, description: string): Promise<void>;
    submitMixtape(id: string, title: string, artistName: string, description: string, coverArt: ExternalBlob | null, songs: Array<ExternalBlob>, externalLinks: Array<string>, stripeSessionId: string | null): Promise<void>;
    submitShowcase(id: string, songName: string, artistName: string, category: BeatCategory, style: BeatStyle, texture: BeatTexture, beatId: string | null, audioFile: ExternalBlob, coverArt: ExternalBlob | null, externalLink: string | null): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unmarkRightsAsSold(beatId: string, rightsType: RightsType): Promise<void>;
    updateBasicRightsLicense(license: ExternalBlob): Promise<void>;
    updateBeat(id: string, title: string, artist: string, category: BeatCategory, style: BeatStyle, texture: BeatTexture, coverArt: Array<CoverArtEntry>, preview: PreviewEntry, rightsFolders: Array<RightsFolder>, deliveryMethod: DeliveryMethod): Promise<void>;
    updateExclusiveRightsLicense(license: ExternalBlob): Promise<void>;
    updateMilestoneOrder(milestoneIds: Array<[string, bigint]>): Promise<void>;
    updateMusicLink(title: string, platform: Platform, url: string, releaseDate: string | null, coverArt: ExternalBlob | null): Promise<void>;
    updatePremiumRightsLicense(license: ExternalBlob): Promise<void>;
    updateReplay(id: string, title: string, description: string, replayUrl: string): Promise<void>;
    updateStemsRightsLicense(license: ExternalBlob): Promise<void>;
    updateUpcomingShow(id: string, title: string, date: string, time: string, description: string): Promise<void>;
    uploadBasicRightsLicense(license: ExternalBlob): Promise<void>;
    uploadBeat(id: string, title: string, artist: string, category: BeatCategory, style: BeatStyle, texture: BeatTexture, coverArt: Array<CoverArtEntry>, preview: PreviewEntry, rightsFolders: Array<RightsFolder>, deliveryMethod: DeliveryMethod): Promise<void>;
    uploadExclusiveRightsLicense(license: ExternalBlob): Promise<void>;
    uploadMvaPreview(reference: ExternalBlob): Promise<void>;
    uploadPremiumRightsLicense(license: ExternalBlob): Promise<void>;
    uploadStemsRightsLicense(license: ExternalBlob): Promise<void>;
    verifyBeatPurchase(beatId: string, sessionId: string | null): Promise<boolean>;
    verifyGuestBeatPurchase(sessionId: string, beatId: string): Promise<boolean>;
}
