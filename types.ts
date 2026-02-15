
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
