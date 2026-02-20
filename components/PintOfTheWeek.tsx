import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { findPintOfTheWeek } from '../services/geminiService';
import { type Rating, type PintOfTheWeekAnalysis } from '../types';
import Button from './Button';
import Spinner from './Spinner';
import ContentCard from './ContentCard';
import SharableImage from './SharableImage';
import { toPng } from 'html-to-image';

const PintOfTheWeek: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PintOfTheWeekAnalysis | null>(null);
  const [winningPint, setWinningPint] = useState<Rating | null>(null);
  const [sharableImage, setSharableImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [previousPints, setPreviousPints] = useState<any[]>([]);
  
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedPints = localStorage.getItem('pintOfTheWeekHistory');
    if (savedPints) {
      setPreviousPints(JSON.parse(savedPints));
    }
  }, []);

  const handleReset = () => {
    setIsLoading(false);
    setLoadingStep('');
    setError(null);
    setAnalysisResult(null);
    setWinningPint(null);
    setSharableImage(null);
    setIsGeneratingImage(false);
  };

  useEffect(() => {
    if (isGeneratingImage && imageRef.current) {
      // Small timeout to ensure all assets (like the pint image) are loaded in the DOM
      const timer = setTimeout(async () => {
        try {
          const dataUrl = await toPng(imageRef.current!, { 
            quality: 0.98,
            pixelRatio: 2, // Generate a higher resolution image (600px * 2 = 1200px)
            cacheBust: true,
          });
          setSharableImage(dataUrl);

          // Save the complete result including the image to local storage
          if (analysisResult && winningPint) {
            const newHistory = [
              {
                analysis: analysisResult,
                winner: winningPint,
                sharableImage: dataUrl,
                date: new Date().toISOString(),
              },
              ...previousPints.filter(p => p.winner.id !== winningPint.id),
            ].slice(0, 5);

            localStorage.setItem('pintOfTheWeekHistory', JSON.stringify(newHistory));
            setPreviousPints(newHistory);
          }
        } catch (err) {
          console.error("Failed to generate image:", err);
          setError("A client-side error occurred while generating the image. Please try again.");
        } finally {
          setIsLoading(false);
          setLoadingStep('');
          setIsGeneratingImage(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGeneratingImage]);

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
        .select('id, created_at, quality, message, image_url, like_count, comment_count, price, is_private, exact_price, pubs!ratings_pub_id_fkey(name, lng, lat, country_code), profiles:profiles!ratings_user_id_fkey(username, avatar_id)')
        .gte('created_at', sevenDaysAgo)
        .not('image_url', 'is', null);

      if (dbError) throw new Error(dbError.message);
      if (!ratings || ratings.length === 0) {
        throw new Error("No ratings with images found in the last 7 days to analyze.");
      }

      // Step 2: Get analysis from Gemini
      setLoadingStep('Analyzing pints with Gemini to find the winner...');
      const analysisResponse = await findPintOfTheWeek(ratings as Rating[]);
      
      if (analysisResponse.success === false) {
        throw new Error(analysisResponse.error);
      }

      const analysis = analysisResponse.data;
      const winner = ratings.find(r => r.id === analysis.id);
      
      if (!winner) {
        throw new Error("A critical error occurred. The AI's choice was validated but could not be found in the dataset.");
      }
      
      setAnalysisResult(analysis);
      setWinningPint(winner as Rating);

      
      
      // Step 3: Trigger client-side image generation
      setLoadingStep('Generating a custom social media graphic...');
      setIsGeneratingImage(true);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      {isGeneratingImage && winningPint && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <SharableImage ref={imageRef} rating={winningPint} />
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">Find the Pint of the Week</h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          Let Gemini analyze all ratings with photos from the last 7 days to find the best one and generate a ready-to-post social media graphic.
        </p>
      </div>

      {!analysisResult && !isLoading && !error && (
        <div className="flex justify-center gap-4">
          <Button onClick={handleFindPint} isLoading={isLoading} className="px-8 py-4 text-lg">
            Find Pint of the Week
          </Button>
          {previousPints.length > 0 && (
            <Button onClick={() => {
              const latest = previousPints[0];
              setAnalysisResult(latest.analysis);
              setWinningPint(latest.winner);
              setSharableImage(latest.sharableImage);
            }} className="px-8 py-4 text-lg bg-gray-600 hover:bg-gray-700 from-transparent to-transparent">
              View Latest Saved
            </Button>
          )}
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
                    <img src={sharableImage} alt="Sharable social media graphic for the pint of the week" className="rounded-md shadow-lg w-full h-auto" />
                ) : (
                    <div className="w-full aspect-square bg-gray-700 rounded-md flex items-center justify-center">
                        <p className="text-gray-400">Finalizing image...</p>
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
          {previousPints.length > 0 && !analysisResult && (
        <div className="mt-12">
            <h3 className="text-2xl font-bold text-white text-center mb-4">Previously Saved Pints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {previousPints.map((pint, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-4 relative">
                        <div className="cursor-pointer" onClick={() => {
                            setAnalysisResult(pint.analysis);
                            setWinningPint(pint.winner);
                            setSharableImage(pint.sharableImage);
                        }}>
                            <ContentCard item={pint.winner} />
                            <p className="text-sm text-gray-400 mt-2 text-center">Generated on {new Date(pint.date).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => {
                            const newHistory = previousPints.filter((_, i) => i !== index);
                            localStorage.setItem('pintOfTheWeekHistory', JSON.stringify(newHistory));
                            setPreviousPints(newHistory);
                        }} className="absolute top-2 right-2 bg-red-500/50 text-white rounded-full p-1 hover:bg-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}
    </main>
  );
};

export default PintOfTheWeek;