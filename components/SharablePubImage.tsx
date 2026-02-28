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
  rank?: number | null;
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

  const getAvatarUrl = (profile: any) => {
    const fallbackSeed = profile?.username || 'User';
    const fallbackUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(fallbackSeed)}`;

    if (!profile || !profile.avatar_id) {
        return fallbackUrl;
    }

    try {
        const avatarData = JSON.parse(profile.avatar_id);

        if (avatarData.type === 'uploaded' && avatarData.url) {
            return avatarData.url;
        }

        if (avatarData.type === 'dicebear' && avatarData.style) {
            const seed = avatarData.seed || fallbackSeed;
            return `https://api.dicebear.com/8.x/${avatarData.style}/svg?seed=${encodeURIComponent(seed)}`;
        }
        
        return fallbackUrl;

    } catch (error) {
        const avatarPath = profile.avatar_id;
        if (typeof avatarPath === 'string' && avatarPath.startsWith('http')) {
            return avatarPath;
        }
        return fallbackUrl;
    }
  };

  return (
    <div
      ref={ref}
      className="w-[600px] h-[600px] bg-[#1A120F] text-stone-200 p-6 flex flex-col relative overflow-hidden font-sans"
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

      {/* Header - Compact */}
      <div className="relative z-10 flex justify-between items-end mb-4">
        <div>
            <h2 className="text-sm font-bold tracking-widest text-amber-500 uppercase">Stoutly</h2>
            <h1 className="text-3xl font-extrabold tracking-wider uppercase text-white leading-none">
            {title}
            </h1>
        </div>
        {rank && rank <= 10 && (
             <div className="bg-stone-800/80 px-3 py-1 rounded-full border border-amber-500/30">
                <span className="text-[10px] text-amber-500 font-bold tracking-wider uppercase">
                    Ranked #{rank} on Stoutly
                </span>
            </div>
        )}
      </div>

      {/* Main Content - Full Image with Overlays */}
      <div className="relative z-10 flex-1 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl group min-h-0 bg-[#2C2421]">
        {topRatedPint?.image_url ? (
            <>
                <img 
                    src={topRatedPint.image_url} 
                    alt="Featured Pint" 
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                />
                
                {/* Overlays */}
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                    {/* Top: Pub Details */}
                    <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-lg">
                        <div className="flex justify-between items-start">
                            <div className="min-w-0 mr-2">
                                <h2 className="text-2xl font-bold text-white leading-tight truncate">{name}</h2>
                                <div className="flex items-start text-amber-400 text-xs font-medium uppercase tracking-wide mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="line-clamp-2">{location}</span>
                                </div>
                            </div>
                            <div className={`${scoreColorClass} px-3 py-2 rounded-lg font-bold shadow-lg flex flex-col items-center justify-center leading-none border-2 shrink-0`}>
                                <span className="text-[8px] uppercase tracking-wider opacity-80 mb-0.5">Score</span>
                                <span className="text-xl">{Math.round(score)}</span>
                            </div>
                        </div>
                        
                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                             <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Avg Rating</span>
                                <span className="text-lg font-bold text-white">{avgRating.toFixed(1)}</span>
                             </div>
                             <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Ratings</span>
                                <span className="text-lg font-bold text-white">{totalRatings}</span>
                             </div>
                             {price && (
                                 <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Price</span>
                                    <span className="text-lg font-bold text-amber-400">£{price.toFixed(2)}</span>
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* Bottom: Review */}
                    <div className="bg-gradient-to-t from-black via-black/80 to-transparent -mx-6 -mb-6 p-6 pt-12">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="bg-amber-500 text-[#1A120F] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Top Pint</span>
                        </div>
                        <p className="text-white font-medium italic text-xl leading-snug shadow-black drop-shadow-md line-clamp-3">"{topRatedPint.message}"</p>
                        <div className="flex items-center mt-3">
                             <img 
                                src={getAvatarUrl(topRatedPint.profiles)}
                                alt={topRatedPint.profiles?.username || 'User'}
                                className="w-8 h-8 rounded-full border border-stone-500 mr-3 object-cover"
                             />
                             <p className="text-sm text-stone-300 font-medium">@{topRatedPint.profiles?.username || 'user'}</p>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            // Fallback for no image
             <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#2C2421]">
                 <div className="mb-8">
                    <h2 className="text-4xl font-bold text-white mb-2">{name}</h2>
                    <p className="text-amber-500 uppercase tracking-widest">{location}</p>
                 </div>
                 <div className={`${scoreColorClass} w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold border-4 mb-8`}>
                    {Math.round(score)}
                 </div>
                 <p className="text-stone-500 italic text-lg">"A consistent favorite among the Stoutly community."</p>
             </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2 opacity-60">
           <Logo className="w-6 h-6" />
           <span className="font-bold tracking-widest text-stone-500 text-[10px] uppercase">stoutly.co.uk</span>
        </div>
        <span className="text-[10px] text-stone-400 font-mono font-bold opacity-80">{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
});

SharablePubImage.displayName = 'SharablePubImage';

export default SharablePubImage;
