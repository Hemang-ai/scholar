export enum LoadingState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type ViewState = 'HOME' | 'HISTORY' | 'EDITOR';

export interface PaperVersion {
  id: string;
  versionNumber: number;
  content: string;
  createdAt: number;
}

export interface Paper {
  id: string;
  topic: string;
  overview: string;
  createdAt: number;
  updatedAt: number;
  versions: PaperVersion[];
}

export interface PaperRequest {
  topic: string;
  overview: string;
}

export interface PaperSection {
  type: 'text' | 'mermaid' | 'table';
  content: string;
}

// Extend Window to include mermaid global from CDN
declare global {
  interface Window {
    mermaid: any;
  }
}