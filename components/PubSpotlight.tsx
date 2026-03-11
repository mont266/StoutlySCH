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
  badge?: string; // Added badge for why it's selected
}

const PubSpotlight: React.FC<PubSpotlightProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [winner, setWinner] = useState<PubStats | null>(null);
  const [candidates, setCandidates] = useState<PubStats[]>([]);
  const [sharableImage, setSharableImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [history, setHistory] = useState<PubStats[]>([]);
  const [excludedPubNames, setExcludedPubNames] = useState<string[]>([]);
  const [allPubData, setAllPubData] = useState<Map<string, any>>(new Map());
  const [customDate, setCustomDate] = useState<string>(new Date().toLocaleDateString());
  const [selectedReview, setSelectedReview] = useState<Rating | null>(null);
  const [isSelectingReview, setIsSelectingReview] = useState(false);
  
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

  const handleGenerateSpotlight = async (currentExcluded: string[] = excludedPubNames) => {
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
        .select('id, pub_id, created_at, quality, message, image_url, exact_price, like_count, comment_count, pubs!ratings_pub_id_fkey(name, lng, lat, country_code, address), profiles:profiles!ratings_user_id_fkey(username, avatar_id)')
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
      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // --- BUCKET-BASED DIVERSITY ALGORITHM ---
      const scoredPubs = Array.from(pubMap.values())
        .map(pub => {
          const avgRating = pub.ratings.reduce((sum, r) => sum + r.quality, 0) / pub.ratings.length;
          const ratingCount = pub.ratings.length;
          const imageCount = pub.ratings.filter(r => r.image_url).length;
          const recentCount = pub.ratings.filter(r => new Date(r.created_at) > fourteenDaysAgo).length;
          const totalLikes = pub.ratings.reduce((sum, r) => sum + (r.like_count || 0), 0);
          const totalComments = pub.ratings.reduce((sum, r) => sum + (r.comment_count || 0), 0);
          const photoDensity = imageCount / ratingCount;
          
          const topPint = pub.ratings.sort((a, b) => {
              if (b.quality !== a.quality) return b.quality - a.quality;
              return (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0);
          })[0];
          
          const price = topPint.exact_price || null;

          // 1. Heavy Hitter Score: Rewards high volume + high official score
          const heavyHitterScore = (avgRating * 10) + Math.min(ratingCount, 20) + (pub.officialScore ? 25 : 0);
          
          // 2. Rising Star Score: Rewards recent momentum and buzz
          const risingStarScore = (recentCount * 20) + (totalLikes * 2) + (avgRating * 5);
          
          // 3. Hidden Gem Score: Rewards high ratings with low volume (The Underdogs)
          const hiddenGemScore = (avgRating >= 4.4 && ratingCount <= 8) ? (avgRating * 25) - (ratingCount * 2) : 0;
          
          // 4. Aesthetic Score: Rewards photo density for social media
          const aestheticScore = (photoDensity * 60) + (avgRating * 5);

          const displayScore = pub.officialScore !== null ? pub.officialScore : avgRating * 20;

          return {
            name: pub.name,
            location: pub.location,
            avgRating,
            totalRatings: ratingCount,
            score: displayScore,
            rankingScore: Math.max(heavyHitterScore, risingStarScore, hiddenGemScore, aestheticScore),
            heavyHitterScore,
            risingStarScore,
            hiddenGemScore,
            aestheticScore,
            topRatedPint: topPint,
            price: price,
            rank: pub.rank,
            badge: "Community Pick" // Default
          };
        })
        .filter(p => p.totalRatings >= 2 && !currentExcluded.includes(p.name));

      // Bucket Selection Logic
      const heavyHitters = [...scoredPubs].sort((a, b) => b.heavyHitterScore - a.heavyHitterScore);
      const risingStars = [...scoredPubs].sort((a, b) => b.risingStarScore - a.risingStarScore);
      const hiddenGems = [...scoredPubs].sort((a, b) => b.hiddenGemScore - a.hiddenGemScore);
      const aesthetics = [...scoredPubs].sort((a, b) => b.aestheticScore - a.aestheticScore);

      const finalSelection = new Map<string, any>();
      const buckets = [
          { data: heavyHitters, badge: "Heavy Hitter 🏆" },
          { data: risingStars, badge: "Rising Star 🚀" },
          { data: hiddenGems, badge: "Hidden Gem 💎" },
          { data: aesthetics, badge: "Aesthetic King 📸" }
      ];

      // Pick 3 from each bucket to ensure diversity
      buckets.forEach(bucket => {
          let count = 0;
          for (const pub of bucket.data) {
              if (count >= 3) break;
              if (!finalSelection.has(pub.name)) {
                  pub.badge = bucket.badge;
                  finalSelection.set(pub.name, pub);
                  count++;
              }
          }
      });

      // Fill remaining slots up to 12 if needed
      if (finalSelection.size < 12) {
          const remaining = scoredPubs
            .filter(p => !finalSelection.has(p.name))
            .sort((a, b) => b.rankingScore - a.rankingScore);
          
          for (const pub of remaining) {
              if (finalSelection.size >= 12) break;
              finalSelection.set(pub.name, pub);
          }
      }

      const candidatesList = Array.from(finalSelection.values());
      // Shuffle slightly so the order isn't always Heavy Hitters first
      candidatesList.sort(() => Math.random() - 0.5);
      
      setCandidates(candidatesList);
      setAllPubData(pubMap);
      setIsLoading(false);
      setLoadingStep('');

    } catch (err: any) {
      console.error("Error generating spotlight:", err);
      setError(err.message || 'Failed to generate Pub Spotlight.');
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = (pub: PubStats) => {
    setWinner(pub);
    setIsSelectingReview(true);
  };

  const handleConfirmReview = async (review: Rating) => {
    if (!winner) return;
    
    setIsLoading(true);
    setIsSelectingReview(false);
    setSelectedReview(review);
    setLoadingStep(`Analyzing ${winner.name}...`);
    setCandidates([]);

    try {
      const pubData = allPubData.get(winner.name);
      if (pubData) {
          // Use the selected review as the context for analysis
          const analysis = await analyzePubSpotlight(winner.name, winner.location, [review]);
          if (analysis) {
              setWinner(prev => prev ? ({
                  ...prev,
                  topRatedPint: review, // Update the top pint to the selected one
                  vibeAnalysis: analysis.vibeAnalysis,
                  socialCaption: analysis.socialCaption,
                  hashtags: analysis.hashtags
              }) : null);
          }
      }

      setLoadingStep('Generating social media graphic...');
      setIsGeneratingImage(true);
    } catch (err: any) {
      console.error("Error analyzing selected pub:", err);
      setError("Failed to analyze the selected pub.");
      setIsLoading(false);
    }
  };

  const handlePickDifferentPub = () => {
    setWinner(null);
    setSharableImage(null);
    handleGenerateSpotlight();
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
          <SharablePubImage ref={imageRef} pubStats={winner} customDate={customDate} />
        </div>
      )}

      <div className="text-center mb-12 relative">
        <h2 className="text-4xl font-bold text-white mb-4">Pub Spotlight</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-6">
          Discover the top-performing pub of the season based on Stoutly community ratings.
        </p>
        
        <div className="flex justify-center items-center gap-4 max-w-xs mx-auto bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Display Date:</span>
            <input 
                type="text" 
                value={customDate} 
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-amber-500 w-full"
                placeholder="e.g. 10/03/2026"
            />
        </div>
      </div>

      {!winner && candidates.length === 0 && !isLoading && !error && (
        <div className="flex flex-col items-center gap-8">
          <Button onClick={() => handleGenerateSpotlight()} className="px-8 py-4 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold">
            Find Top Pubs
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

      {!winner && candidates.length > 0 && !isLoading && !isSelectingReview && (
        <div className="max-w-6xl mx-auto animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Select a Pub to Spotlight</h3>
            <Button onClick={() => setCandidates([])} className="bg-gray-700 text-sm">Cancel</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((pub, index) => (
              <div 
                key={pub.name} 
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-amber-500/50 transition-all group cursor-pointer flex flex-col"
                onClick={() => handleSelectCandidate(pub)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <h4 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors truncate">{pub.name}</h4>
                    <p className="text-gray-400 text-sm truncate">📍 {pub.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-bold border border-amber-500/20">
                      #{index + 1}
                    </div>
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                      {pub.badge}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                  <div className="bg-gray-900/50 p-2 rounded text-center">
                    <div className="text-lg font-bold text-white">{pub.avgRating.toFixed(1)}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Avg Rating</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded text-center">
                    <div className="text-lg font-bold text-white">{pub.totalRatings}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Ratings</div>
                  </div>
                </div>

                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2">
                  Select Pub
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSelectingReview && winner && (
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-2xl font-bold text-white">Select a Review for {winner.name}</h3>
                <p className="text-gray-400 text-sm">Choose the message that will appear on the graphic.</p>
            </div>
            <Button onClick={() => setIsSelectingReview(false)} className="bg-gray-700 text-sm">Back</Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {allPubData.get(winner.name)?.ratings.map((rating: Rating) => (
              <div 
                key={rating.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-amber-500/50 transition-all cursor-pointer group"
                onClick={() => handleConfirmReview(rating)}
              >
                <div className="flex items-start gap-4">
                  {rating.image_url && (
                    <img src={rating.image_url} alt="Review" className="w-20 h-20 object-cover rounded-lg shrink-0 border border-gray-700" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-500 font-bold">★ {rating.quality.toFixed(1)}</span>
                            <span className="text-gray-500 text-xs">by @{rating.profiles?.username}</span>
                        </div>
                        <span className="text-gray-500 text-xs">{new Date(rating.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-300 italic line-clamp-3">"{rating.message}"</p>
                  </div>
                  <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-amber-500 text-black p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                  <Button onClick={() => {
                      setWinner(null);
                      setExcludedPubNames([]);
                  }} className="bg-gray-700 hover:bg-gray-600">
                    Back to History
                  </Button>
                  <Button onClick={handlePickDifferentPub} className="bg-amber-600 hover:bg-amber-700">
                    Pick Different Pub
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
