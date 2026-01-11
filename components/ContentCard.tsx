import React, { useState } from 'react';
import { type ContentItem, isRating, type SocialAnalysis } from '../types';
import { getSocialMediaAngle } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import Button from './Button';
import Spinner from './Spinner';

interface ContentCardProps {
  item: ContentItem;
}

const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  const [analysis, setAnalysis] = useState<SocialAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    const result = await getSocialMediaAngle(item);
    if (result) {
      setAnalysis(result);
    } else {
      setError('Failed to get analysis from Gemini. Please try again.');
    }
    setIsAnalyzing(false);
  };

  const user = item.profiles;
  const itemIsRating = isRating(item);

  const getAvatarUrl = () => {
    const avatarPath = user?.avatar_id;
    if (avatarPath) {
      // Check if it's already a full URL (like a stored DiceBear link)
      if (avatarPath.startsWith('http')) {
        return avatarPath;
      }
      // Otherwise, construct the URL from Supabase storage
      const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
      return data.publicUrl;
    }
    // Fallback to generating a new DiceBear URL if no avatar_id is present
    const seed = user?.username || item.id;
    return `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed)}`;
  }


  return (
    <div className="bg-[#1F2937] rounded-lg shadow-lg overflow-hidden flex flex-col">
      {itemIsRating && item.image_url && (
        <div className="w-full h-48 bg-black flex items-center justify-center">
            <img src={item.image_url} alt={`A pint of Guinness at ${item.pubs?.name || 'a pub'}`} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex items-center mb-4">
          <img
            src={getAvatarUrl()}
            alt={user?.username || 'User avatar'}
            className="w-10 h-10 rounded-full mr-3 border-2 border-gray-600 bg-gray-700"
          />
          <div>
            <p className="font-semibold text-white">{user?.username || 'Stoutly User'}</p>
            <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex-grow">
            {itemIsRating ? (
            <>
                <div className="flex items-center gap-6 mb-3 text-sm">
                    <div className="flex items-center gap-1.5 text-amber-400" title="Quality Rating">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="font-bold text-lg">{item.quality}</span>
                        <span className="text-gray-400 font-medium">/ 10</span>
                    </div>
                     {item.price && (
                        <div className="flex items-center gap-1.5 text-green-400" title="Price Rating">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A1 1 0 012 10V5a1 1 0 011-1h5a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-lg">{item.price}</span>
                            <span className="text-gray-400 font-medium">/ 5</span>
                        </div>
                     )}
                </div>
                <div className="mb-2 text-gray-300">
                    Rated at <span className="font-semibold text-white">{item.pubs?.name || 'a pub'}</span>
                </div>
                <p className="text-gray-300 italic">"{item.message}"</p>
            </>
            ) : (
            <p className="text-gray-300">{item.content}</p>
            )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>{item.like_count}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2c-4.418 0-8 3.134-8 7 0 2.135.986 4.093 2.585 5.343C3.963 15.157 4 16.279 4 17.5c0 .552.448 1 1 1h1.5a.5.5 0 00.354-.146L10 14.828l3.146 3.526A.5.5 0 0013.5 18.5H15c.552 0 1-.448 1-1 0-1.221.037-2.343.415-3.157C17.014 13.093 18 11.135 18 9c0-3.866-3.582-7-8-7z" clipRule="evenodd" />
                </svg>
                <span>{item.comment_count}</span>
            </div>
        </div>
      </div>
      
      <div className="p-5 bg-gray-900/50">
        {analysis && (
          <div className="mb-4 animate-fade-in">
            <h4 className="font-bold text-purple-400 text-lg mb-2">Social Angle</h4>
            <div className="space-y-3 text-sm">
                <p><strong className="text-gray-400">Analysis:</strong> {analysis.analysis}</p>
                <p className="bg-gray-800 p-3 rounded-md"><strong className="text-gray-400 block mb-1">Suggested Caption:</strong> {analysis.caption}</p>
                <p><strong className="text-gray-400">Hashtags:</strong> {analysis.hashtags.join(' ')}</p>
            </div>
          </div>
        )}

        {isAnalyzing && <Spinner />}
        
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        
        <Button onClick={handleAnalyze} isLoading={isAnalyzing} className="w-full">
          {analysis ? 'Re-analyze' : 'Find Social Angle'}
        </Button>
      </div>
    </div>
  );
};

export default ContentCard;