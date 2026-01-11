import React, { useState, useEffect, useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { type ContentItem, type Post, type Rating } from '../types';
import Header from './Header';
import Spinner from './Spinner';
import ContentCard from './ContentCard';

interface DashboardProps {
  session: Session;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ratingsRes, postsRes] = await Promise.all([
        supabase
          .from('ratings')
          .select('id, created_at, quality, message, pubs(name), profiles:profiles!ratings_user_id_fkey(username, avatar_id)')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('posts')
          .select('id, created_at, content, profiles (username, avatar_id)')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (ratingsRes.error) throw ratingsRes.error;
      if (postsRes.error) throw postsRes.error;

      // FIX: The Supabase query returns nested relations as arrays (e.g., `pubs`, `profiles`).
      // The `Rating` type expects a single object or null. This map transforms the data
      // by taking the first item from the nested array, aligning with the type definition.
      const ratings: Rating[] = (ratingsRes.data || []).map((r: any) => ({
        ...r,
        pubs: r.pubs?.[0] || null,
        profiles: r.profiles?.[0] || null,
      }));
      const posts: Post[] = (postsRes.data || []).map((p: any) => ({
        ...p,
        profiles: p.profiles?.[0] || null, // Posts might still return an array
      }));

      const combinedContent = [...ratings, ...posts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setContent(combinedContent);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch content.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return (
    <div className="min-h-screen bg-[#111827] text-gray-200">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">Latest Content Feed</h2>
            <button 
                onClick={fetchContent} 
                className="text-sm text-purple-400 hover:text-purple-300 transition"
                disabled={loading}
            >
                Refresh Feed
            </button>
        </div>

        {loading && <Spinner />}
        {error && <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-md">{error}</p>}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
         {!loading && content.length === 0 && !error && (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold text-white">No Content Found</h3>
                <p className="text-gray-400 mt-2">Looks like there are no recent posts or ratings to analyze.</p>
            </div>
         )}
      </main>
    </div>
  );
};

export default Dashboard;