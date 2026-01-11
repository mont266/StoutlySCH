import React, { useState } from 'react';
import { type ContentItem, isRating, type SocialAnalysis } from '../types';
import { getSocialMediaAngle } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import Button from './Button';
import Spinner from './Spinner';
import RatingDisplay from './RatingDisplay';

interface ContentCardProps {
  item: ContentItem;
}

const ShieldIcon = () => (
    <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 5a1 1 0 011-1h10a1 1 0 011 1v6.28c0 3.39-4.13 5.48-6 6.47-1.87-1-6-3.08-6-6.47V5z" />
    </svg>
);

const PriceTagIcon = () => (
    <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A1 1 0 012 10V5a1 1 0 011-1h5a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);


const getCurrencySymbol = (countryCode: string | null | undefined): string => {
    if (!countryCode) return '';
    switch (countryCode.toUpperCase()) {
        case 'GB':
        case 'UK':
            return '£';
        case 'IE':
            return '€';
        case 'US':
            return '$';
        default:
            return '';
    }
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
    const profile = item.profiles;
    const fallbackSeed = profile?.username || item.id;
    const fallbackUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(fallbackSeed)}`;

    if (!profile || !profile.avatar_id) {
        return fallbackUrl;
    }

    try {
        const avatarData = JSON.parse(profile.avatar_id);

        if (avatarData.type === 'uploaded' && avatarData.url) {
            return avatarData.url;
        }

        if (avatarData.type === 'dicebear' && avatarData.style && avatarData.seed) {
            return `https://api.dicebear.com/8.x/${avatarData.style}/svg?seed=${encodeURIComponent(avatarData.seed)}`;
        }
        
        console.warn('Parsed avatar_id has unknown structure:', avatarData);
        return fallbackUrl;

    } catch (error) {
        const avatarPath = profile.avatar_id;
        if (typeof avatarPath === 'string' && avatarPath.startsWith('http')) {
            return avatarPath;
        }
        console.warn('Could not parse avatar_id, falling back to initials:', profile.avatar_id);
        return fallbackUrl;
    }
  }

  const currencySymbol = itemIsRating ? getCurrencySymbol(item.pubs?.country_code) : '';

  return (
    <div className="bg-[#1F2937] rounded-lg shadow-lg overflow-hidden flex flex-col">
      {itemIsRating && item.image_url && (
        <div className="w-full h-48 bg-black flex items-center justify-center">
            <img src={item.image_url} alt={`A pint of Guinness at ${item.pubs?.name || 'a pub'}`} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <img
                    src={getAvatarUrl()}
                    alt={user?.username || 'User avatar'}
                    className="w-10 h-10 rounded-full mr-3 border-2 border-gray-600 bg-gray-700 object-cover"
                />
                <div>
                    <p className="font-semibold text-white">{user?.username || 'Stoutly User'}</p>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 {itemIsRating ? (
                    <span className="text-xs font-semibold text-yellow-300 bg-yellow-900/60 px-2.5 py-1 rounded-full">Rating</span>
                 ) : (
                    <span className="text-xs font-semibold text-blue-300 bg-blue-900/60 px-2.5 py-1 rounded-full">Post</span>
                 )}
                 {itemIsRating && item.is_private && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400" title="This rating is private">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                        <span>Private</span>
                    </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
                {itemIsRating && (
                    <div className="flex items-center gap-4 flex-wrap">
                        <RatingDisplay
                            icon={<ShieldIcon />}
                            rating={item.quality}
                            maxRating={5}
                            filledColor="text-yellow-400"
                            title={`Quality: ${item.quality}/5`}
                        />
                         {item.price > 0 && (
                           <RatingDisplay
                                icon={<PriceTagIcon />}
                                rating={item.price}
                                maxRating={5}
                                filledColor="text-green-400"
                                title={`Price: ${item.price}/5`}
                           />
                         )}
                    </div>
                )}
                {itemIsRating && (
                    <div className="text-gray-300">
                        Rated at <span className="font-semibold text-white">{item.pubs?.name || 'a pub'}</span>
                        {item.exact_price && currencySymbol && (
                            <span className="ml-2 text-sm text-green-400 font-mono">({currencySymbol}{item.exact_price.toFixed(2)})</span>
                        )}
                    </div>
                )}
                <p className={itemIsRating ? "text-gray-300 italic" : "text-gray-200"}>
                    {itemIsRating ? `"${item.message}"` : item.content}
                </p>
            </div>
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