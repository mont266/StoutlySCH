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
      // It's a path in Supabase storage. Construct the public URL.
      // Assuming the bucket is named 'avatars'.
      const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
      return data.publicUrl;
    }
    // Fallback to DiceBear using username as a seed
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
                        <div className="flex items-center gap-1.5 text-green-400" title="Value Rating">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h12v4a2 2 0 002-2V6a2 2 0 00-2-2H4z" clipRule="evenodd" /><path fillRule="evenodd" d="M18 9H2a1 1 0 00-1 1v4a1 1 0 001 1h16a1 1 0 001-1v-4a1 1 0 00-1-1zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5.5 0a.5.5 0 100-1 .5.5 0 000 1zM11 13a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
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
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a2 2 0 01-2 2H9.5a.5.5 0 01-.5-.5v-1.293l.293-.293A1 1 0 0010 8.586V7a1 1 0 00-1-1H4a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1H4a2 2 0 00-2 2v5a2 2 0 002 2h7a2 2 0 002-2v-5a2 2 0 00-2-2h-1z" />
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