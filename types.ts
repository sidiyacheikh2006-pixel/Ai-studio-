export interface Photo {
  id: string;
  url: string;
  timestamp: number;
  isPrivate: boolean;
}

export enum AppMode {
  DECOY = 'DECOY',
  REAL = 'REAL'
}

export interface LongPressOptions {
  threshold?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}