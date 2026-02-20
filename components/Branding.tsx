import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import Logo from './Logo';

const Branding: React.FC = () => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoSVG = `
    <svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
      <g transform='translate(0 2)'>
        <path 
          d='M50 5 C 29.5 5, 12.5 22.5, 12.5 42.5 C 12.5 67.5, 50 95, 50 95 C 50 95, 87.5 67.5, 87.5 42.5 C 87.5 22.5, 70.5 5, 50 5 Z' 
          fill='#1A120F'
          stroke='#F59E0B'
          stroke-width='4'
        />
        <path 
          d='M25 45 C 40 30, 60 30, 75 45 C 75 35, 65 25, 50 25 C 35 25, 25 35, 25 45 Z' 
          fill='#FDEED4'
        />
      </g>
    </svg>
  `;

  const downloadSVG = () => {
    const blob = new Blob([logoSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stoutly-logo.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const downloadPNG = () => {
    if (logoRef.current) {
      toPng(logoRef.current, { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'stoutly-logo.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 text-white">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-amber-500">Brand Guidelines</h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          A resource for our marketing partners to ensure brand consistency.
        </p>
      </div>

      <div className="space-y-12">
        {/* Color Palette */}
        <section>
          <h3 className="text-3xl font-bold mb-6 border-b-2 border-amber-500/50 pb-2">🎨 Color Palette</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h4 className="text-xl font-semibold mb-4">Primary Brand Colors</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Stout Black</span>
                    <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-400 font-mono">#1A120F</p>
                    <button onClick={() => handleCopy('#1A120F')} title="Copy hex code">
                      {copiedColor === '#1A120F' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#1A120F] border-2 border-gray-600"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Stoutly Amber</span>
                    <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-400 font-mono">#F59E0B</p>
                    <button onClick={() => handleCopy('#F59E0B')} title="Copy hex code">
                      {copiedColor === '#F59E0B' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#F59E0B] border-2 border-gray-600"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Cream</span>
                    <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-400 font-mono">#FDEED4</p>
                    <button onClick={() => handleCopy('#FDEED4')} title="Copy hex code">
                      {copiedColor === '#FDEED4' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#FDEED4] border-2 border-gray-600"></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h4 className="text-xl font-semibold mb-4">Secondary UI Colors</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Dark Mode BG</span>
                    <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-400 font-mono">#111827</p>
                    <button onClick={() => handleCopy('#111827')} title="Copy hex code">
                      {copiedColor === '#111827' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#111827] border-2 border-gray-600"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Light Mode BG</span>
                    <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-400 font-mono">#F9FAFB</p>
                    <button onClick={() => handleCopy('#F9FAFB')} title="Copy hex code">
                      {copiedColor === '#F9FAFB' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#F9FAFB] border-2 border-gray-600"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Success Green</span>
                    <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-400 font-mono">#22C55E</p>
                    <button onClick={() => handleCopy('#22C55E')} title="Copy hex code">
                      {copiedColor === '#22C55E' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#22C55E] border-2 border-gray-600"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h3 className="text-3xl font-bold mb-6 border-b-2 border-amber-500/50 pb-2">🔤 Typography</h3>
          <div className="bg-gray-800/50 p-6 rounded-lg">
            <p className="text-lg text-gray-300">Stoutly relies on a clean, native feel, using the default system font stack to ensure the app feels at home on the user's device. For design work, we recommend using <span className="font-semibold text-amber-500">Inter</span> or <span className="font-semibold text-amber-500">Roboto</span> to match this aesthetic.</p>
            <div className="mt-6">
              <p className="text-xl font-bold tracking-tight">This is a heading (bold, tracking-tight)</p>
              <p className="text-lg mt-2">This is body text (regular weight)</p>
            </div>
          </div>
        </section>

        {/* Logo & Iconography */}
        <section>
          <h3 className="text-3xl font-bold mb-6 border-b-2 border-amber-500/50 pb-2">🍺 Logo & Iconography</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h4 className="text-xl font-semibold mb-4">Visual Construction</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Shape: A map pin that doubles as a pint glass.</li>
                <li>Fill: Top 25% is Cream (#FDEED4), bottom 75% is Stout Black (#1A120F).</li>
                <li>Stroke: Thick, bold stroke in Stoutly Amber (#F59E0B).</li>
                <li>Stroke Width: 4px (relative to a 100x100 viewBox).</li>
              </ul>
              <h4 className="text-xl font-semibold mt-6 mb-4">Logo Text Spacing</h4>
              <p className="text-gray-300">In the header, the text "Stoutly" is displayed with <span className="font-semibold text-amber-500">tracking-tight</span> (approx -0.025em letter spacing) to give it a compact, modern feel.</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col items-center justify-center">
              <div ref={logoRef} className="w-32 h-32" dangerouslySetInnerHTML={{ __html: logoSVG }} />
              <div className="flex flex-col md:flex-row gap-4 mt-6">
                <button onClick={downloadSVG} className="px-4 py-2 rounded-md font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all duration-200">
                  Download Logo SVG
                </button>
                <button onClick={downloadPNG} className="px-4 py-2 rounded-md font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200">
                  Download Logo PNG
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Voice & Tone */}
        <section>
          <h3 className="text-3xl font-bold mb-6 border-b-2 border-amber-500/50 pb-2">🗣️ Voice & Tone</h3>
          <div className="bg-gray-800/50 p-6 rounded-lg">
            <p className="text-lg text-gray-300">The brand voice is enthusiastic, community-focused, and authentic. It feels like a knowledgeable friend at the pub.</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 mt-4">
              <li>Keywords: "Perfect Pint", "Community-Driven", "Buzzing", "Explore".</li>
              <li>Tagline: "Find the Perfect Pint of Guinness" or "Your guide to finding the perfect pint."</li>
              <li>Call to Action Style: Direct and inviting (e.g., "Start Exploring", "Rate Your Pint").</li>
            </ul>
          </div>
        </section>

        {/* UI Design Language */}
        <section>
          <h3 className="text-3xl font-bold mb-6 border-b-2 border-amber-500/50 pb-2">📱 UI Design Language</h3>
          <div className="bg-gray-800/50 p-6 rounded-lg">
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Rounded Corners: Generous rounding (rounded-2xl or rounded-lg).</li>
              <li>Shadows: Soft, diffused shadows (shadow-md, shadow-2xl).</li>
              <li>Glassmorphism: Occasional use of backdrops (backdrop-blur-sm).</li>
              <li>Borders: Subtle top borders in Amber (border-t-4 border-amber-500).</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Branding;
