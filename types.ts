

export interface LyricSection {
  id: number;
  type: string;
  artistName: string;
  gender: string;
  vocalStyle: string;
  lyrics: string;
}

export interface VocalStylesMap {
  [key: string]: string;
}

export interface GeneratedStyle {
  key: string;
  description: string;
}

export type PresetChoice = 'original' | 'hollywood' | 'reality';

export type TemplateType = 'off' | 'gfunk-boombap' | 'cinematic';

export interface Track {
  title: string;
  artist: string;
  duration?: string; // e.g., "3:45"
}

export interface SEOMetadata {
  title: string;
  description: string;
  hashtags: string;
  thumbnailPrompts: { // Object containing named thumbnail prompts
    artistCentered: string; // Corresponds to original Prompt 1
    teaser?: string; // For Shorts only (Prompt 2a)
    trackNameOnly?: string; // For Full Length only (Prompt 2b)
    brandFocus: string; // Corresponds to original Prompt 3
    productionFocus: string; // Corresponds to original Prompt 4
  };
  pinnedComment: string;
}

export interface GeneratePackage {
  shorts: SEOMetadata;
  full: SEOMetadata;
  globalKeywordBank: string;
}

export interface StagedElement {
  id: string;
  type: 'text' | 'overlay';
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  animation: string;
  fontWeight: string;
}

export interface StagedThumbnail {
  id: string;
  imageUrl: string;
  type: 'shorts' | 'full';
  elements: StagedElement[];
  motionEffect: string;
}

export interface ProofreadSuggestion {
  id: string;
  field: string;
  targetPath: string[]; // e.g. ["full", "title"]
  reason: string;
  original: string;
  suggested: string;
  applied: boolean;
}