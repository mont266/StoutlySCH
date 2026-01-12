import React, { forwardRef } from 'react';
import { type Rating } from '../types';
import Logo from './Logo';

interface SharableImageProps {
  rating: Rating;
}

const Star: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-8 w-8 ${filled ? 'text-yellow-400' : 'text-gray-500'}`}
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
      className="w-[600px] h-[600px] bg-gray-900 text-white relative overflow-hidden font-sans"
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}
    >
      <img
        src={rating.image_url}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt={`Pint at ${rating.pubs?.name}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <h1
            className="text-5xl font-extrabold text-white tracking-tight"
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}
          >
            Pint of the Week
          </h1>
          <Logo className="w-20 h-20" />
        </div>

        {/* Bottom Section */}
        <div className="space-y-4">
          <div
            className="bg-black/50 backdrop-blur-sm p-4 rounded-lg"
            style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}
          >
            <h2 className="text-3xl font-bold text-white truncate">{rating.pubs?.name || 'A Fine Establishment'}</h2>
            <p className="text-xl text-gray-300">by @{rating.profiles?.username || 'A Stout Lover'}</p>
          </div>

          <div className="flex gap-4">
            <div className="bg-black/50 backdrop-blur-sm p-3 rounded-lg flex-1">
              <h3 className="text-base font-semibold text-gray-300 uppercase tracking-wider">Quality</h3>
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} filled={i < rating.quality} />
                ))}
              </div>
            </div>
            {rating.price > 0 && (
              <div className="bg-black/50 backdrop-blur-sm p-3 rounded-lg flex-1">
                <h3 className="text-base font-semibold text-gray-300 uppercase tracking-wider">Value</h3>
                <div className="flex items-center mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} filled={i < rating.price} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SharableImage;