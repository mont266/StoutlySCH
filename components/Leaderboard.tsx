import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { generateWeeklySummary } from '../services/geminiService';
import Spinner from './Spinner';
import Logo from './Logo';

const Leaderboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
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

        // Define RPC functions in Supabase
        const ddl = `
        create or replace function get_top_users(since timestamptz) returns table(user_id uuid, username text, post_count bigint) as $$
          select p.user_id, pr.username, count(*) as post_count from posts p join profiles pr on p.user_id = pr.id where p.created_at >= since group by p.user_id, pr.username order by post_count desc limit 5;
        $$ language sql;

        create or replace function get_new_user_posts(since timestamptz) returns table(id uuid, content text) as $$
          select p.id, p.content from posts p join profiles pr on p.user_id = pr.id where pr.created_at >= since order by p.created_at desc limit 3;
        $$ language sql;
        `;
        await supabase.rpc('eval', { query: ddl });

        // Fetch top 5 users
        const { data: topUsersData, error: topUsersError } = await supabase
          .rpc('get_top_users', { since: sevenDaysAgo });

        if (topUsersError) throw new Error(topUsersError.message);
        setTopUsers(topUsersData);

        // Fetch new users count
        const { count: newUsersCountData, error: newUsersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .gte('created_at', sevenDaysAgo);

        if (newUsersError) throw new Error(newUsersError.message);
        setNewUsersCount(newUsersCountData || 0);

        // Fetch posts from new users
        const { data: newPostsData, error: newPostsError } = await supabase
          .rpc('get_new_user_posts', { since: sevenDaysAgo });

        if (newPostsError) throw new Error(newPostsError.message);
        setNewPosts(newPostsData);

        // Generate summary
        const summaryText = await generateWeeklySummary({ topUsers: topUsersData, newUsersCount: newUsersCountData || 0, newPosts: newPostsData });
        setSummary(summaryText);

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

          <p className="text-lg text-gray-300 mb-8">{summary}</p>

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
