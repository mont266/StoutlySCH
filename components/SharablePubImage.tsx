import React, { forwardRef } from 'react';
import { type Rating } from '../types';
import Logo from './Logo';

interface PubStats {
  name: string;
  location: string;
  avgRating: number;
  totalRatings: number;
  score: number;
  topRatedPint: Rating | null;
  price?: number | null;
  rank?: number | null; // Added rank
}

interface SharablePubImageProps {
  pubStats: PubStats;
  title?: string;
}

const SharablePubImage = forwardRef<HTMLDivElement, SharablePubImageProps>(({ pubStats, title = 'Pub Spotlight' }, ref) => {
  const { name, location, avgRating, totalRatings, topRatedPint, score, price, rank } = pubStats;

  const getScoreColor = (s: number) => {
      if (s >= 80) return 'bg-yellow-400 border-yellow-300 text-black'; // Gold
      if (s >= 65) return 'bg-green-500 border-green-400 text-black'; // Green
      if (s >= 45) return 'bg-amber-500 border-amber-400 text-black'; // Amber
      return 'bg-stone-500 border-stone-400 text-white'; // Grey
  };

  const scoreColorClass = getScoreColor(score);

  return (
    <div
      ref={ref}
      className="w-[600px] h-[600px] bg-[#1A120F] text-stone-200 p-8 flex flex-col relative overflow-hidden font-sans"
      style={{ 
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        backgroundColor: '#1A120F'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
             backgroundSize: '20px 20px' 
           }} 
      />

      {/* Header */}
      <div className="relative z-10 text-center mb-6">
        <h2 className="text-xl font-bold tracking-widest text-amber-500 uppercase mb-1">Stoutly</h2>
        <h1 className="text-5xl font-extrabold tracking-wider uppercase text-white">
          {title}
        </h1>
        {rank && rank <= 10 && (
            <div className="mt-2 inline-block bg-stone-800/80 px-4 py-1 rounded-full border border-amber-500/30">
                <span className="text-xs text-amber-500 font-bold tracking-wider uppercase">
                    #{rank} Ranked Pub on Stoutly • {new Date().toLocaleDateString()}
                </span>
            </div>
        )}
      </div>

      {/* Main Content - Adjusted for larger image */}
      <div className="relative z-10 flex-1 flex flex-col gap-4 min-h-0">
        
        {/* Pub Info Card - Compact */}
        <div className="bg-[#2C2421] rounded-xl p-4 border border-amber-900/30 shadow-xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4" />
          
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-4">
                <h2 className="text-2xl font-bold text-white mb-1 truncate leading-tight">{name}</h2>
                <div className="flex items-center text-amber-500/80 text-xs font-medium uppercase tracking-wide truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {location}
                </div>
            </div>
            
            {/* Score Badge - Prominent & Color Coded */}
            <div className={`${scoreColorClass} px-3 py-1 rounded-lg font-bold shadow-lg transform rotate-2 shrink-0 flex flex-col items-center justify-center leading-none border-2`}>
                <span className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">Score</span>
                <span className="text-xl">{Math.round(score)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-end border-t border-stone-700/50 pt-3 mt-3">
             <div>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-0.5">Avg Rating</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-amber-500">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-stone-500">/ 5.0</span>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-0.5">Total Ratings</span>
                <span className="text-xl font-bold text-white">{totalRatings}</span>
             </div>
          </div>
          
          {price && (
             <div className="mt-3 pt-3 border-t border-stone-700/50 flex justify-center">
                <div className="bg-stone-800/80 px-4 py-1 rounded-full border border-amber-900/50 flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider">Avg Price</span>
                    <span className="text-lg font-bold text-amber-400">£{price.toFixed(2)}</span>
                </div>
             </div>
          )}
        </div>

        {/* Featured Pint Image - Maximized */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-stone-800 shadow-2xl group min-h-0">
            {topRatedPint?.image_url ? (
                <>
                    <img 
                        src={topRatedPint.image_url} 
                        alt="Featured Pint" 
                        className="absolute inset-0 w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                    {/* Gradient Overlay for Text */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1A120F] via-[#1A120F]/70 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-amber-500 text-[#1A120F] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Top Pint</span>
                        </div>
                        <p className="text-white font-medium italic text-lg leading-snug line-clamp-2">"{topRatedPint.message}"</p>
                        <div className="flex items-center mt-2">
                             <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center text-[10px] text-stone-300 mr-2 border border-stone-600">
                                {topRatedPint.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                             </div>
                             <p className="text-xs text-stone-400">@{topRatedPint.profiles?.username || 'user'}</p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="w-full h-full bg-[#2C2421] flex flex-col items-center justify-center p-8 text-center">
                    <Logo className="w-20 h-20 mx-auto opacity-10 mb-4" />
                    <p className="text-stone-500 italic text-lg">"A consistent favorite among the Stoutly community."</p>
                </div>
            )}
        </div>

      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 pt-4 border-t border-stone-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <Logo className="w-8 h-8" />
           <span className="font-bold tracking-widest text-stone-500 text-xs uppercase">www.stoutly.co.uk</span>
        </div>
        <span className="text-xs text-stone-600 font-mono">{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
});

SharablePubImage.displayName = 'SharablePubImage';

export default SharablePubImage;
