import React, { useState } from 'react';
import { type ContentItem, isRating, type SocialAnalysis } from '../types';
import { getSocialMediaAngle } from '../services/geminiService';
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

  return (
    <div className="bg-[#1F2937] rounded-lg shadow-lg overflow-hidden flex flex-col">
      {itemIsRating && item.image_url && (
        <img src={item.image_url} alt={`A pint of Guinness at ${item.pubs?.name || 'a pub'}`} className="w-full h-48 object-cover" />
      )}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex items-center mb-4">
          <img
            src={user?.avatar_id || `https://i.pravatar.cc/150?u=${item.id}`}
            alt={user?.username || 'User avatar'}
            className="w-10 h-10 rounded-full mr-3 border-2 border-gray-600"
          />
          <div>
            <p className="font-semibold text-white">{user?.username || 'Stoutly User'}</p>
            <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex-grow">
            {itemIsRating ? (
            <>
                <div className="mb-2">
                <span className="font-bold text-amber-400">{item.quality}/10</span> at <span className="font-semibold text-gray-300">{item.pubs?.name || 'a pub'}</span>
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