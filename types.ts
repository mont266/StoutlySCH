import { type User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  username: string;
  avatar_id: string;
}

export interface Rating {
  id: string;
  created_at: string;
  quality: number;
  price: number;
  message: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  is_private?: boolean;
  exact_price?: number | null;
  pubs: {
    name: string;
    lng: number | null;
    lat: number | null;
    country_code: string | null;
  } | null;
  profiles: Profile | null;
}

export interface Post {
  id: string;
  created_at: string;
  content: string;
  like_count: number;
  comment_count: number;
  profiles: Profile | null;
}

export type ContentItem = Rating | Post;

export interface SocialAnalysis {
  analysis: string;
  caption: string;
  hashtags: string[];
}

export interface PintOfTheWeekAnalysis {
  id: string; // id of the winning rating
  analysis: string;
  socialScore: number;
}


export type AppUser = SupabaseUser;

// Type guard to check if an item is a Rating
export const isRating = (item: ContentItem): item is Rating => {
  return (item as Rating).quality !== undefined;
};