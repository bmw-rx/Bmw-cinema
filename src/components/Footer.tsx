import React from 'react';

interface FooterProps {
  onNavigate?: (page: 'home' | 'movies' | 'tvshows' | 'football' | 'search' | 'favorites') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1f1f1f] text-gray-400 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-[#ff6b35] flex items-center justify-center font-black text-black text-xs">
                ▶
              </span>
              <span className="text-lg font-black text-white tracking-tight">BMW</span>
              <span className="text-lg font-black text-[#ff6b35]">CINEMA</span>
            </div>
            <p className="text-gray-500 max-w-sm text-xs leading-relaxed">
              The premier streaming and high-speed download network for blockbuster movies, television series, and live global football.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
            <button
              onClick={() => onNavigate && onNavigate('home')}
              className="text-gray-400 hover:text-[#ff6b35] transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate && onNavigate('movies')}
              className="text-gray-400 hover:text-[#ff6b35] transition-colors"
            >
              Movies
            </button>
            <button
              onClick={() => onNavigate && onNavigate('tvshows')}
              className="text-gray-400 hover:text-[#ff6b35] transition-colors"
            >
              TV Shows
            </button>
            <button
              onClick={() => onNavigate && onNavigate('football')}
              className="text-gray-400 hover:text-[#ff6b35] transition-colors"
            >
              Live Football
            </button>
            <button
              onClick={() => onNavigate && onNavigate('search')}
              className="text-gray-400 hover:text-[#ff6b35] transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => onNavigate && onNavigate('favorites')}
              className="text-gray-400 hover:text-[#ff6b35] transition-colors"
            >
              My List
            </button>
          </div>
        </div>

        {/* Legal & Attribution */}
        <div className="pt-6 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            <span>&copy; {new Date().getFullYear()} BMW CINEMA. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Powered by BMW CINEMA Ultra HD Cloud Servers</span>
            <span>·</span>
            <span>Direct Fast-Link Streaming Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
