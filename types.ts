import { type User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  username: string;
  avatar_id: string;
}

export interface Rating {
  id: string;
  created_at: string;
  score: number;
  review_text: string;
  pub_name: string;
  profiles: Profile | null;
}

export interface Post {
  id: string;
  created_at: string;
  content: string;
  profiles: Profile | null;
}

export type ContentItem = Rating | Post;

export interface SocialAnalysis {
  analysis: string;
  caption: string;
  hashtags: string[];
}

export type AppUser = SupabaseUser;

// Type guard to check if an item is a Rating
export const isRating = (item: ContentItem): item is Rating => {
  return (item as Rating).score !== undefined;
};