import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { findPintOfTheWeek, createSharableImage } from '../services/geminiService';
import { type Rating, type PintOfTheWeekAnalysis } from '../types';
import Button from './Button';
import Spinner from './Spinner';
import ContentCard from './ContentCard';

const PintOfTheWeek: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PintOfTheWeekAnalysis | null>(null);
  const [winningPint, setWinningPint] = useState<Rating | null>(null);
  const [sharableImage, setSharableImage] = useState<string | null>(null);

  const handleReset = () => {
    setIsLoading(false);
    setLoadingStep('');
    setError(null);
    setAnalysisResult(null);
    setWinningPint(null);
    setSharableImage(null);
  };

  const handleFindPint = async () => {
    handleReset();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch recent ratings from Supabase
      setLoadingStep('Fetching ratings from the last 7 days...');
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: ratings, error: dbError } = await supabase
        .from('ratings')
        .select('id, created_at, quality, message, image_url, like_count, comment_count, price, is_private, exact_price, pubs(name, lng, lat, country_code), profiles:profiles!ratings_user_id_fkey(username, avatar_id)')
        .gte('created_at', sevenDaysAgo)
        .not('image_url', 'is', null);

      if (dbError) throw new Error(dbError.message);
      if (!ratings || ratings.length === 0) {
        throw new Error("No ratings with images found in the last 7 days to analyze.");
      }

      // Step 2: Get analysis from Gemini
      setLoadingStep('Analyzing pints with Gemini to find the winner...');
      const analysisResponse = await findPintOfTheWeek(ratings as Rating[]);
      
      // FIX: Use a guard clause to handle the failure case. This makes the type narrowing
      // for the discriminated union more explicit and resolves the TypeScript error.
      if (analysisResponse.success === false) {
        throw new Error(analysisResponse.error);
      }

      const analysis = analysisResponse.data;
      setAnalysisResult(analysis);

      // The ID from `analysis` is now guaranteed to be valid because of the check in `geminiService`
      const winner = ratings.find(r => r.id === analysis.id);
      if (!winner) {
        // This is now a very unlikely edge case
        throw new Error("A critical error occurred. The AI's choice was validated but could not be found in the dataset.");
      }
      setWinningPint(winner as Rating);

      // Step 3: Generate sharable image
      setLoadingStep('Generating a custom social media graphic...');
      const imageB64 = await createSharableImage(winner as Rating);
      if (!imageB64) {
        throw new Error("Failed to generate the social media image.");
      }
      setSharableImage(`data:image/png;base64,${imageB64}`);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">Find the Pint of the Week</h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          Let Gemini analyze all ratings with photos from the last 7 days to find the best one and generate a ready-to-post social media graphic.
        </p>
      </div>

      {!analysisResult && !isLoading && !error && (
        <div className="flex justify-center">
          <Button onClick={handleFindPint} isLoading={isLoading} className="px-8 py-4 text-lg">
            Find Pint of the Week
          </Button>
        </div>
      )}
      
      {isLoading && (
        <div className="text-center space-y-4">
            <Spinner size="h-12 w-12" />
            <p className="text-purple-300 font-semibold animate-pulse">{loadingStep}</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center bg-red-900/50 p-6 rounded-lg max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-red-300">An Error Occurred</h3>
            <p className="text-red-400 mt-2">{error}</p>
            <Button onClick={handleReset} className="mt-4">
              Try Again
            </Button>
        </div>
      )}

      {analysisResult && winningPint && !isLoading && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Sharable Image & Actions */}
            <div className="bg-gray-800/50 rounded-lg p-6 text-center sticky top-24">
                 <h3 className="text-2xl font-bold text-white mb-4">Your Sharable Image</h3>
                {sharableImage ? (
                    <img src={sharableImage} alt="Sharable social media graphic for the pint of the week" className="rounded-md shadow-lg w-full aspect-square object-cover" />
                ) : (
                    <div className="w-full aspect-square bg-gray-700 rounded-md flex items-center justify-center">
                        <Spinner />
                    </div>
                )}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href={sharableImage || '#'}
                        download="pint_of_the_week.png"
                        className={`
                            px-4 py-2 rounded-md font-semibold text-white
                            bg-gradient-to-r from-green-500 to-teal-600
                            hover:from-green-600 hover:to-teal-700
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-[#111827]
                            transition-all duration-200 ease-in-out
                            ${!sharableImage ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        aria-disabled={!sharableImage}
                    >
                      Download Image
                    </a>
                    <Button onClick={handleReset} className="bg-gray-600 hover:bg-gray-700 from-transparent to-transparent">
                        Start Over
                    </Button>
                </div>
            </div>

            {/* Right Column: Analysis & Original Pint */}
            <div className="space-y-8">
                <div className="bg-gray-800/50 rounded-lg p-6">
                     <h3 className="text-2xl font-bold text-white mb-4">Gemini's Analysis</h3>
                     <div className="flex items-center justify-between mb-4 bg-gray-900/50 p-3 rounded-md">
                         <span className="font-semibold text-purple-400">Social Score</span>
                         <span className="text-4xl font-bold text-white">{analysisResult.socialScore}<span className="text-2xl text-gray-400">/100</span></span>
                     </div>
                     <p className="text-gray-300 whitespace-pre-wrap font-mono">{analysisResult.analysis}</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-2xl font-bold text-white mb-4">The Winning Pint</h3>
                    <div className="max-w-md mx-auto">
                        <ContentCard item={winningPint} />
                    </div>
                </div>
            </div>
        </div>
      )}
    </main>
  );
};

export default PintOfTheWeek;