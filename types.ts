
export enum AppMode {
  WEDDING_WALL = 'WEDDING_WALL',
  VOTING = 'VOTING',
  LUCKY_DRAW = 'LUCKY_DRAW',
  CONTROL = 'CONTROL'
}

export type SchemeId = string;

// --- Frontend MediaItem (used across components) ---

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  visible: boolean;
}

// --- Backend API Response Types ---

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface BackendMediaItem {
  id: string;
  fileKey: string;
  readUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
}

export interface BackendScheme {
  id: string;
  name: string;
  isLive: boolean;
  isPinned: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  items: BackendMediaItem[];
}

export interface PresignedUploadResponse {
  itemId: string;
  uploadUrl: string;
  fileKey: string;
  readUrl: string;
  fileName: string;
  expiresInSeconds: number;
}

// --- Guest Message ---

export interface GuestMessage {
  id: string;
  name: string;
  content: string;
  timestamp: number;
  pictureUrl?: string;
}

// --- Voting ---

export interface Voter {
  id: string;
  name: string;
  choice: string;
}

export interface EligibleParticipant {
  voteId: string;
  lineUserId: string;
  lineDisplayName: string;
  optionKey: string;
}

export interface DrawWinner {
  id: string;
  lineUserId: string;
  lineDisplayName: string;
  optionKey: string;
  drawnAt: string;
  isActive: boolean;
}

export interface VoteOption {
  key: string;
  label: string;
  color: string;
  count: number;
  percentage: number;
}

// --- WebSocket Event Types ---

export type WsEventType =
  | 'message:new'
  | 'vote:update'
  | 'vote:cast'
  | 'vote:reset'
  | 'control:sync'
  | 'media:update';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  payload: T;
}

export interface WsMessagePayload {
  id: string;
  name: string;
  content: string;
  timestamp: number;
  pictureUrl?: string;
}

export interface WsVoteUpdatePayload {
  options: VoteOption[];
  totalVotes: number;
}

export interface WsVoteCastPayload {
  voterId: string;
  voterName: string;
  optionId: string;
}

export interface WsVoteResetPayload {
  options: VoteOption[];
}

export interface WsControlSyncPayload {
  liveScheme?: SchemeId;
  showWallMessages?: boolean;
  slideshowSpeed?: number;
  messageScrollSpeed?: number;
}

export interface WsMediaUpdatePayload {
  schemeIds: SchemeId[];
  schemes: Record<SchemeId, MediaItem[]>;
}

// --- Legacy types kept for internal state ---

export interface MediaSchemeData {
  schemeIds: SchemeId[];
  schemes: Record<SchemeId, MediaItem[]>;
}
