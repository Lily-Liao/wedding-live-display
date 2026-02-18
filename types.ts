
export enum AppMode {
  WEDDING_WALL = 'WEDDING_WALL',
  VOTING = 'VOTING',
  LUCKY_DRAW = 'LUCKY_DRAW',
  CONTROL = 'CONTROL'
}

export type SchemeId = string;

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  visible: boolean;
}

export interface GuestMessage {
  id: string;
  name: string;
  content: string;
  timestamp: number;
}

export interface Voter {
  id: string;
  name: string;
  choice: string;
}

export interface VoteOption {
  id: string;
  label: string;
  color: string;
  count: number;
}

// --- WebSocket Event Types ---

export type WsEventType =
  | 'message:new'
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

// --- API Response Types ---

export interface MediaSchemeData {
  schemeIds: SchemeId[];
  schemes: Record<SchemeId, MediaItem[]>;
}

export interface PresignedUploadItem {
  uploadUrl: string;
  mediaItem: MediaItem;
}

export interface PresignedUploadResponse {
  items: PresignedUploadItem[];
}

export interface DisplaySettings {
  showWallMessages?: boolean;
  slideshowSpeed?: number;
  messageScrollSpeed?: number;
}
