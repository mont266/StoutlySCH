import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { type Rating } from '../types';
import { analyzePubSpotlight } from '../services/geminiService';
import Button from './Button';
import Spinner from './Spinner';
import SharablePubImage from './SharablePubImage';
import { toPng } from 'html-to-image';

interface PubSpotlightProps {
  onBack?: () => void;
}

interface PubStats {
  name: string;
  location: string;
  avgRating: number;
  totalRatings: number;
  score: number; // This will be the DISPLAY score (Official or Base)
  rankingScore: number; // This will be used for sorting
  topRatedPint: Rating | null;
  vibeAnalysis?: string;
  socialCaption?: string;
  hashtags?: string[];
  dateGenerated?: string;
  price?: number | null; // Added price
  rank?: number | null; // Added rank
}

const PubSpotlight: React.FC<PubSpotlightProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [winner, setWinner] = useState<PubStats | null>(null);
  const [sharableImage, setSharableImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [history, setHistory] = useState<PubStats[]>([]);
  
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pubSpotlightHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (pub: PubStats, image: string) => {
    const newEntry = { ...pub, sharableImage: image, dateGenerated: new Date().toISOString() };
    const newHistory = [newEntry, ...history.filter(h => h.name !== pub.name)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('pubSpotlightHistory', JSON.stringify(newHistory));
  };

  const deleteFromHistory = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = [...history];
    newHistory.splice(index, 1);
    setHistory(newHistory);
    localStorage.setItem('pubSpotlightHistory', JSON.stringify(newHistory));
  };

  const handleGenerateSpotlight = async () => {
    setIsLoading(true);
    setError(null);
    setWinner(null);
    setSharableImage(null);

    try {
      setLoadingStep('Fetching ratings from the last 90 days...');
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      
      // Fetch ratings with pub_id
      const { data: ratings, error: dbError } = await supabase
        .from('ratings')
        .select('id, pub_id, created_at, quality, message, image_url, exact_price, pubs!ratings_pub_id_fkey(name, lng, lat, country_code, address), profiles:profiles!ratings_user_id_fkey(username, avatar_id)')
        .gte('created_at', ninetyDaysAgo)
        .not('pubs', 'is', null);

      if (dbError) throw dbError;

      if (!ratings || ratings.length === 0) {
        throw new Error("No ratings found in the last 90 days to analyze.");
      }

      setLoadingStep('Fetching official Stoutly scores...');
      
      // Get unique pub IDs
      const pubIds = Array.from(new Set(ratings.map((r: any) => r.pub_id)));
      
      // Fetch scores from pub_scores table for the current batch
      const { data: pubScores, error: scoresError } = await supabase
        .from('pub_scores')
        .select('pub_id, pub_score')
        .in('pub_id', pubIds);

      // Fetch TOP 10 scores globally to determine rank
      const { data: topScores, error: topScoresError } = await supabase
        .from('pub_scores')
        .select('pub_id, pub_score')
        .order('pub_score', { ascending: false })
        .limit(10);

      if (scoresError) console.warn("Could not fetch pub_scores", scoresError);
      if (topScoresError) console.warn("Could not fetch top scores", topScoresError);

      const scoreMap = new Map<string, number>();
      if (pubScores) {
          pubScores.forEach((ps: any) => {
              scoreMap.set(String(ps.pub_id), ps.pub_score);
          });
      }

      // Create a map for top 10 ranks
      const rankMap = new Map<string, number>();
      if (topScores) {
          topScores.forEach((ps: any, index: number) => {
              rankMap.set(String(ps.pub_id), index + 1);
          });
      }

      setLoadingStep('Analyzing pub performance...');
      
      // Group ratings by Pub Name
      const pubMap = new Map<string, {
        id: string;
        name: string;
        location: string;
        ratings: Rating[];
        officialScore: number | null;
        rank: number | null;
      }>();

      ratings.forEach((r: any) => {
        const pubName = r.pubs.name;
        const pubIdStr = String(r.pub_id);
        
        if (!pubMap.has(pubName)) {
          // Use address if available, otherwise fallback to country logic
          let locationDisplay = r.pubs.address || r.pubs.country_code || 'Unknown Location';
          
          // Only do country code expansion if we don't have an address
          if (!r.pubs.address) {
              if (locationDisplay === 'GB') locationDisplay = 'United Kingdom';
              if (locationDisplay === 'IE') locationDisplay = 'Ireland';
              if (locationDisplay === 'US') locationDisplay = 'United States';
          }

          pubMap.set(pubName, {
            id: pubIdStr,
            name: pubName,
            location: locationDisplay,
            ratings: [],
            officialScore: scoreMap.has(pubIdStr) ? scoreMap.get(pubIdStr)! : null,
            rank: rankMap.has(pubIdStr) ? rankMap.get(pubIdStr)! : null
          });
        }
        
        const pubData = pubMap.get(pubName)!;
        pubData.ratings.push(r);
        
        // If we missed the score on first pass (e.g. race condition or map order), try to set it again
        if (pubData.officialScore === null && scoreMap.has(pubIdStr)) {
            pubData.officialScore = scoreMap.get(pubIdStr)!;
        }
      });

      // Calculate Scores
      const scoredPubs: PubStats[] = Array.from(pubMap.values())
        .map(pub => {
          const avgRating = pub.ratings.reduce((sum, r) => sum + r.quality, 0) / pub.ratings.length;
          const ratingCount = pub.ratings.length;
          
          // Find best pint
          const topPint = pub.ratings.sort((a, b) => {
              if (b.quality !== a.quality) return b.quality - a.quality;
              return (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0);
          })[0];
          
          // Get price from top pint or average
          const price = topPint.exact_price || null;

          // Scoring Algorithm V5 (Strict Separation):
          // 1. Display Score: MUST be the official score if available, otherwise the raw average * 20.
          // 2. Ranking Score: Used ONLY for sorting. Includes bonuses for volume, images, etc.
          
          let displayScore = 0;
          let rankingScore = 0;

          if (pub.officialScore !== null) {
              displayScore = pub.officialScore;
              rankingScore = pub.officialScore; // Start ranking with official score
          } else {
              displayScore = avgRating * 20;
              rankingScore = displayScore;
          }

          // Add bonuses ONLY to rankingScore, never to displayScore
          rankingScore += Math.min(ratingCount, 10); // Volume bonus
          if (topPint.image_url) rankingScore += 5; // Image bonus

          return {
            name: pub.name,
            location: pub.location,
            avgRating,
            totalRatings: ratingCount,
            score: displayScore, // PURE score for display
            rankingScore,        // Boosted score for sorting
            topRatedPint: topPint,
            price: price, // Add price to stats
            rank: pub.rank // Add rank
          };
        })
        .filter(p => p.totalRatings >= 2); // Keep the threshold to ensure recent relevance

      // Sort by RANKING score descending
      scoredPubs.sort((a, b) => b.rankingScore - a.rankingScore);

      if (scoredPubs.length === 0) {
         // Fallback logic
         const rawSorted = Array.from(pubMap.values()).map(pub => ({
            name: pub.name,
            location: pub.location,
            avgRating: pub.ratings.reduce((sum, r) => sum + r.quality, 0) / pub.ratings.length,
            totalRatings: pub.ratings.length,
            score: pub.officialScore || (pub.ratings.reduce((sum, r) => sum + r.quality, 0) / pub.ratings.length * 20),
            rankingScore: 0, // Not needed for fallback really
            topRatedPint: pub.ratings[0]
        })).sort((a, b) => b.score - a.score);
        
        if (rawSorted.length > 0) setWinner({ ...rawSorted[0], rankingScore: rawSorted[0].score });
        else throw new Error("Could not calculate pub scores.");
      } else {
        setWinner(scoredPubs[0]);
      }
      
      // GEMINI ANALYSIS
      setLoadingStep('Asking Gemini to write the social post...');
      const winningPub = scoredPubs.length > 0 ? scoredPubs[0] : null;
      
      if (winningPub) {
          const pubData = pubMap.get(winningPub.name);
          if (pubData) {
              const analysis = await analyzePubSpotlight(winningPub.name, winningPub.location, pubData.ratings);
              if (analysis) {
                  setWinner(prev => prev ? ({
                      ...prev,
                      vibeAnalysis: analysis.vibeAnalysis,
                      socialCaption: analysis.socialCaption,
                      hashtags: analysis.hashtags
                  }) : null);
              }
          }
      }

      setLoadingStep('Generating social media graphic...');
      setIsGeneratingImage(true);

    } catch (err: any) {
      console.error("Error generating spotlight:", err);
      setError(err.message || 'Failed to generate Pub Spotlight.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isGeneratingImage && winner && imageRef.current) {
      const generate = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const dataUrl = await toPng(imageRef.current!, {
            quality: 0.95,
            pixelRatio: 2,
            cacheBust: true,
          });
          setSharableImage(dataUrl);
          saveToHistory(winner, dataUrl);
        } catch (err) {
          console.error("Image generation failed:", err);
          setError("Failed to generate image.");
        } finally {
          setIsLoading(false);
          setIsGeneratingImage(false);
          setLoadingStep('');
        }
      };
      generate();
    }
  }, [isGeneratingImage, winner]);

  return (
    <main className="container mx-auto p-4 md:p-8 min-h-screen">
      {winner && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <SharablePubImage ref={imageRef} pubStats={winner} />
        </div>
      )}

      <div className="text-center mb-12 relative">
        <h2 className="text-4xl font-bold text-white mb-4">Pub Spotlight</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Discover the top-performing pub of the season based on Stoutly community ratings.
        </p>
      </div>

      {!winner && !isLoading && !error && (
        <div className="flex flex-col items-center gap-8">
          <Button onClick={handleGenerateSpotlight} className="px-8 py-4 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold">
            Generate New Spotlight
          </Button>

          {history.length > 0 && (
            <div className="w-full max-w-4xl">
              <h3 className="text-2xl font-bold text-white mb-4 text-left border-b border-gray-700 pb-2">Previous Winners</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {history.map((h, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition relative group" onClick={() => {
                      setWinner(h);
                      setSharableImage((h as any).sharableImage);
                  }}>
                    <button 
                        onClick={(e) => deleteFromHistory(i, e)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Delete from history"
                    >
                        ✕
                    </button>
                    <h4 className="font-bold text-amber-500 truncate pr-6">{h.name}</h4>
                    <p className="text-xs text-gray-400">{new Date(h.dateGenerated!).toLocaleDateString()}</p>
                    <div className="mt-2 text-sm text-gray-300">Score: {Math.round(h.score)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <Spinner size="h-12 w-12" />
          <p className="text-amber-400 mt-4 animate-pulse">{loadingStep}</p>
        </div>
      )}

      {error && (
        <div className="text-center bg-red-900/30 p-6 rounded-lg max-w-md mx-auto border border-red-800">
          <h3 className="text-xl font-semibold text-red-400">Error</h3>
          <p className="text-gray-300 mt-2">{error}</p>
          <Button onClick={() => setError(null)} className="mt-4 bg-gray-700">Try Again</Button>
        </div>
      )}

      {winner && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Left: Image Preview */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 sticky top-24">
            <h3 className="text-2xl font-bold text-white mb-4">Social Share</h3>
            {sharableImage ? (
              <div className="space-y-4">
                <img src={sharableImage} alt="Pub Spotlight Graphic" className="w-full rounded-lg shadow-2xl" />
                <div className="flex justify-center gap-4">
                  <a 
                    href={sharableImage} 
                    download={`pub_spotlight_${winner.name.replace(/\s+/g, '_').toLowerCase()}.png`}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Download Image
                  </a>
                  <Button onClick={() => setWinner(null)} className="bg-gray-700 hover:bg-gray-600">
                    Back to History
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>

          {/* Right: Stats & Details */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-2">{winner.name}</h3>
              <p className="text-gray-400 flex items-center gap-2">
                <span className="text-xl">📍</span> {winner.location}
              </p>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-400">{winner.avgRating.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 uppercase">Avg Rating</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-400">{winner.totalRatings}</div>
                  <div className="text-xs text-gray-500 uppercase">Ratings</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg text-center border border-amber-500/30">
                  <div className="text-3xl font-bold text-white">{Math.round(winner.score)}</div>
                  <div className="text-xs text-amber-500 uppercase">Stoutly Score</div>
                </div>
              </div>
            </div>

            {winner.vibeAnalysis && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h4 className="text-lg font-semibold text-amber-400 mb-2">The Vibe Check</h4>
                    <p className="text-gray-300 italic">"{winner.vibeAnalysis}"</p>
                </div>
            )}

            {winner.socialCaption && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-3">Social Media Caption</h4>
                    <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm text-gray-300 whitespace-pre-wrap">
                        {winner.socialCaption}
                        <br/><br/>
                        {winner.hashtags?.map(tag => <span key={tag} className="text-blue-400 mr-2">{tag}</span>)}
                    </div>
                    <Button 
                        onClick={() => navigator.clipboard.writeText(`${winner.socialCaption}\n\n${winner.hashtags?.join(' ')}`)}
                        className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-sm"
                    >
                        Copy Caption
                    </Button>
                </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default PubSpotlight;
