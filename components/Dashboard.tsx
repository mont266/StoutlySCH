import React, { useState, useEffect, useCallback } from 'react';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { type ContentItem, type Post, type Rating } from '../types';
import Header from './Header';
import Spinner from './Spinner';
import ContentCard from './ContentCard';
import Button from './Button';

interface DashboardProps {
  session: Session;
}

const PAGE_SIZE = 10; // 10 ratings and 10 posts per page load

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Effect for handling the scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Centralized data fetching function
  const fetchPage = useCallback(async (page: number) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [ratingsRes, postsRes] = await Promise.all([
      supabase
        .from('ratings')
        .select('id, created_at, quality, message, image_url, like_count, comment_count, price, is_private, exact_price, pubs(name, lng, lat, country_code), profiles:profiles!ratings_user_id_fkey(username, avatar_id)')
        .order('created_at', { ascending: false })
        .range(from, to),
      supabase
        .from('posts')
        .select('id, created_at, content, like_count, comment_count, profiles:profiles!posts_user_id_fkey(username, avatar_id)')
        .order('created_at', { ascending: false })
        .range(from, to),
    ]);

    if (ratingsRes.error) throw ratingsRes.error;
    if (postsRes.error) throw postsRes.error;

    const ratings: Rating[] = (ratingsRes.data || []).map((r: any) => ({
      ...r,
      pubs: r.pubs || null,
      profiles: r.profiles || null,
      is_private: r.is_private ?? false,
    }));
    const posts: Post[] = (postsRes.data || []).map((p: any) => ({
      ...p,
      profiles: p.profiles || null,
    }));

    return [...ratings, ...posts];
  }, []);

  // Effect for the initial content load
  useEffect(() => {
    const loadInitialContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const initialContent = await fetchPage(0);
        setContent(initialContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setCurrentPage(0);
        setHasMore(initialContent.length >= PAGE_SIZE * 2);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch content.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialContent();
  }, [fetchPage]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || isRefreshing) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      const moreContent = await fetchPage(nextPage);
      if (moreContent.length < PAGE_SIZE * 2) {
        setHasMore(false);
      }
      setContent(prevContent =>
        [...prevContent, ...moreContent].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
      setCurrentPage(nextPage);
    } catch (err: any) {
      setError(err.message || 'Failed to load more content.');
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  const handleRefresh = async () => {
    if (isRefreshing || isLoadingMore) return;
    
    setIsRefreshing(true);
    setError(null);
    try {
        const refreshedContent = await fetchPage(0);
        setContent(refreshedContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setCurrentPage(0);
        setHasMore(refreshedContent.length >= PAGE_SIZE * 2);
    } catch (err: any) {
        setError(err.message || 'Failed to refresh content.');
    } finally {
        setIsRefreshing(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#111827] text-gray-200">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">Latest Content Feed</h2>
            <Button onClick={handleRefresh} isLoading={isRefreshing} className="flex items-center gap-2 text-sm !py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4s0-2-2-2-2 2-2 2M4 20s0 2 2 2 2-2 2-2M20 12c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8" />
                </svg>
              <span>Refresh</span>
            </Button>
        </div>

        {loading && <Spinner />}
        {error && <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-md">{error}</p>}
        
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <Button onClick={handleLoadMore} isLoading={isLoadingMore}>
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
         {!loading && content.length === 0 && !error && (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold text-white">No Content Found</h3>
                <p className="text-gray-400 mt-2">Looks like there are no recent posts or ratings to analyze.</p>
            </div>
         )}
      </main>
      
      {showScrollTop && (
        <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:from-purple-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-[#111827] z-20"
            aria-label="Scroll to top"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
        </button>
      )}
    </div>
  );
};

export default Dashboard;