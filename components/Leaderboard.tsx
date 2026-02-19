import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { generateLeaderboardPost } from '../services/geminiService';
import Button from './Button';
import Spinner from './Spinner';

const Leaderboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialPost, setSocialPost] = useState<string | null>(null);

  const handleGeneratePost = async () => {
    setIsLoading(true);
    setError(null);
    setSocialPost(null);

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch top 10 users based on number of ratings
      const { data: users, error: dbError } = await supabase
        .from('ratings')
        .select('profiles!ratings_user_id_fkey(username, avatar_id)')
        .gte('created_at', sevenDaysAgo)
        .limit(10);

      if (dbError) throw new Error(dbError.message);
      if (!users || users.length === 0) {
        throw new Error('No user data found in the last 7 days.');
      }

      const leaderboardData = users.map((u: any) => u.profiles);

      const post = await generateLeaderboardPost(leaderboardData);
      setSocialPost(post);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">Leaderboard Highlights</h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          Generate a social media post highlighting the top 10 users from the past week.
        </p>
      </div>

      {!socialPost && !isLoading && !error && (
        <div className="flex justify-center">
          <Button onClick={handleGeneratePost} isLoading={isLoading} className="px-8 py-4 text-lg">
            Generate Leaderboard Post
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="text-center">
          <Spinner />
          <p className="text-purple-300 mt-2">Generating post...</p>
        </div>
      )}

      {error && (
        <div className="text-center bg-red-900/50 p-4 rounded-lg">
          <p className="text-red-400">{error}</p>
          <Button onClick={handleGeneratePost} className="mt-4">Try Again</Button>
        </div>
      )}

      {socialPost && (
        <div className="bg-gray-800/50 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">Your Social Media Post</h3>
          <div className="whitespace-pre-wrap font-mono text-gray-300 bg-gray-900/50 p-4 rounded-md">
            {socialPost}
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => navigator.clipboard.writeText(socialPost)}>Copy to Clipboard</Button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Leaderboard;
