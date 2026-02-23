import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { generateWeeklySummary } from '../services/geminiService';
import Spinner from './Spinner';
import Logo from './Logo';
import Button from './Button';
import SharableLeaderboard from './ShareableLeaderboard';
import { toPng } from 'html-to-image';

const Leaderboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [newPosts, setNewPosts] = useState<any[]>([]);
  const [sharableImage, setSharableImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

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
        const topUsersData = sortedUsers.slice(0, 3).map(userId => {
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

    const generateImage = async () => {
    if (!imageRef.current) return;
    try {
      const dataUrl = await toPng(imageRef.current, { 
        quality: 0.98, 
        pixelRatio: 2,
        cacheBust: true,
      });
      setSharableImage(dataUrl);
    } catch (err) {
      console.error("Failed to generate leaderboard image:", err);
      setError("A client-side error occurred while generating the image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

    useEffect(() => {
    if (isGeneratingImage) {
      // A small timeout helps ensure the DOM is ready and images are loaded
      const timer = setTimeout(() => generateImage(), 500);
      return () => clearTimeout(timer);
    }
  }, [isGeneratingImage]);

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
      setIsGeneratingImage(true); // Trigger image generation
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary.');
    } finally {
      // The image generation will set its own loading state
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      {isGeneratingImage && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ShareableLeaderboard ref={imageRef} topUsers={topUsers} newUsersCount={newUsersCount} />
        </div>
      )}
      {isLoading && <Spinner />}
      {error && <p className="text-red-400">{error}</p>}
      {!isLoading && !error && (
        <div className="bg-gradient-to-br from-gray-900 to-black text-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto font-sans">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold tracking-tighter">Weekly Highlights</h2>
            <Logo />
          </div>

          {summary ? (
            <>
            <div className="mb-8 animate-fade-in">
                <h3 className="text-2xl font-bold text-purple-300 mb-2">This Week's Summary</h3>
                <p className="text-lg text-gray-300 whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-md">{summary}</p>
            </div>

            {sharableImage ? (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-purple-300 mb-4">Your Sharable Leaderboard</h3>
                <img src={sharableImage} alt="Weekly leaderboard graphic" className="rounded-lg shadow-lg w-full max-w-lg mx-auto" />
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={sharableImage}
                    download="stoutly_weekly_leaderboard.png"
                    className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-200"
                  >
                    Download Graphic
                  </a>
                  <Button onClick={() => { setSummary(null); setSharableImage(null); }} className="bg-gray-600 hover:bg-gray-700 from-transparent to-transparent">
                    Start Over
                  </Button>
                </div>
              </div>
            ) : isGeneratingImage ? (
              <div className="text-center space-y-4">
                <Spinner size="h-12 w-12" />
                <p className="text-purple-300 font-semibold animate-pulse">Generating your social media graphic...</p>
              </div>
            ) : null}
            </>
          ) : (
            <div className="text-center mb-8">
              <Button onClick={handleGenerateSummary} isLoading={isGenerating || isGeneratingImage} disabled={isGenerating || isGeneratingImage}>
                {isGenerating ? 'Analyzing...' : isGeneratingImage ? 'Generating Graphic...' : 'Generate Weekly Post'}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-center md:text-left">Top Contributors</h3>
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
              <h3 className="text-2xl font-semibold mb-4 text-center md:text-left">Newcomers Corner</h3>
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
