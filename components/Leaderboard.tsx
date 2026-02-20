import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { generateWeeklySummary } from '../services/geminiService';
import Spinner from './Spinner';
import Logo from './Logo';

const Leaderboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newPosts, setNewPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*, profiles!posts_user_id_fkey(*)')
          .gte('created_at', sevenDaysAgo);
        if (postsError) throw new Error(postsError.message);

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .gte('created_at', sevenDaysAgo);
        if (profilesError) throw new Error(profilesError.message);

        const userPostCounts = posts.reduce((acc, post) => {
          acc[post.user_id] = (acc[post.user_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedUsers = Object.keys(userPostCounts).sort((a, b) => userPostCounts[b] - userPostCounts[a]);
        const topUsersData = sortedUsers.slice(0, 5).map(userId => {
          const userProfile = posts.find(p => p.user_id === userId)?.profiles;
          return {
            user_id: userId,
            username: userProfile?.username || 'Unknown',
            post_count: userPostCounts[userId]
          };
        });
        setTopUsers(topUsersData);

        setNewUsersCount(profiles.length);

        const newUserIds = new Set(profiles.map(p => p.id));
        const newPostsData = posts.filter(p => newUserIds.has(p.user_id)).slice(0, 3);
        setNewPosts(newPostsData);

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const summaryText = await generateWeeklySummary({ 
          topUsers, 
          newUsersCount, 
          newPosts 
      });
      setSummary(summaryText);
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 flex justify-center items-center">
      {isLoading && <Spinner />}
      {error && <p className="text-red-400">{error}</p>}
      {!isLoading && !error && (
        <div className="bg-gradient-to-br from-gray-900 to-black text-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl font-sans">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold tracking-tighter">Weekly Highlights</h2>
            <Logo />
          </div>

          {summary ? (
            <p className="text-lg text-gray-300 mb-8 animate-fade-in">{summary}</p>
          ) : (
            <div className="text-center mb-8">
              <button onClick={handleGenerateSummary} disabled={isGenerating} className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {isGenerating ? <Spinner /> : 'Generate Weekly Summary'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Top Contributors</h3>
              <ul className="space-y-3">
                {topUsers.map(user => (
                  <li key={user.user_id} className="flex items-center bg-white/5 p-3 rounded-lg">
                    <span className="text-xl font-bold text-purple-400 mr-4">{user.post_count}</span>
                    <span className="text-lg">{user.username}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Newcomers Corner</h3>
              <div className="bg-white/5 p-4 rounded-lg mb-4">
                <p className="text-5xl font-bold text-purple-400">{newUsersCount}</p>
                <p className="text-lg text-gray-300">New Members This Week</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                {newPosts.slice(0, 3).map(post => (
                  <li key={post.id} className="truncate">- "{post.content}"</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Leaderboard;
