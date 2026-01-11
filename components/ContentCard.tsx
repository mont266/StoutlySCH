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
      <div className="p-5 flex-grow">
        <div className="flex items-center mb-4">
          <img
            src={user?.avatar_url || `https://i.pravatar.cc/150?u=${item.id}`}
            alt={user?.username || 'User avatar'}
            className="w-10 h-10 rounded-full mr-3 border-2 border-gray-600"
          />
          <div>
            <p className="font-semibold text-white">{user?.username || 'Stoutly User'}</p>
            <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        {itemIsRating ? (
          <>
            <div className="mb-2">
              <span className="font-bold text-amber-400">{item.score}/10</span> at <span className="font-semibold text-gray-300">{item.pub_name}</span>
            </div>
            <p className="text-gray-300 italic">"{item.review_text}"</p>
          </>
        ) : (
          <p className="text-gray-300">{item.content}</p>
        )}
      </div>
      
      <div className="p-5 bg-gray-900/50 mt-auto">
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