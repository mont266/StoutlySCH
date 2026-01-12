import React, { forwardRef } from 'react';
import { type Rating } from '../types';
import Logo from './Logo';

interface SharableImageProps {
  rating: Rating;
}

// Star component with updated colors to match the brand palette
const Star: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-6 w-6 ${filled ? 'text-amber-500' : 'text-gray-600'}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const SharableImage = forwardRef<HTMLDivElement, SharableImageProps>(({ rating }, ref) => {
  if (!rating.image_url) return null;

  return (
    <div
      ref={ref}
      className="w-[600px] h-[600px] text-stone-200 relative overflow-hidden font-sans p-8 flex flex-col"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        backgroundColor: '#1A120F' // Brand's dark charcoal color
      }}
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-wider uppercase text-amber-500">
            Pint <span className="font-light text-3xl text-stone-300">of the</span> Week
        </h1>
      </div>

      {/* Image with overlayed text */}
      <div className="relative my-4 flex-grow w-full rounded-lg shadow-lg border-2 border-amber-500/50">
        <img
            src={rating.image_url}
            crossOrigin="anonymous"
            className="w-full h-full object-cover rounded"
            alt={`Pint at ${rating.pubs?.name}`}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 rounded-b">
             <h2 className="text-3xl font-bold text-white truncate" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>{rating.pubs?.name || 'A Fine Establishment'}</h2>
             <p className="text-lg text-stone-300" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>by @{rating.profiles?.username || 'A Stout Lover'}</p>
        </div>
      </div>

      {/* Ratings & Footer */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
             <div>
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Quality</h3>
                <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={`q-${i}`} filled={i < rating.quality} />
                    ))}
                </div>
            </div>
            {rating.price > 0 && (
            <div>
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Value</h3>
                <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={`v-${i}`} filled={i < rating.price} />
                    ))}
                </div>
            </div>
            )}
        </div>
        <div className="text-right">
            <Logo className="w-14 h-14 ml-auto" />
            <p className="text-xs text-stone-500 mt-1 font-mono">
                www.stoutly.co.uk
            </p>
        </div>
      </div>
    </div>
  );
});

export default SharableImage;