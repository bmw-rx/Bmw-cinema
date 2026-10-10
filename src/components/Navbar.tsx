import React, { useState, useEffect } from 'react';
import { Film, Search, Heart, Tv, Home, Menu, X, Play, Activity } from 'lucide-react';
import { getFavorites } from '../services/storage';

interface NavbarProps {
  activePage: 'home' | 'movies' | 'tvshows' | 'football' | 'search' | 'favorites' | 'movie';
  onNavigate: (page: 'home' | 'movies' | 'tvshows' | 'football' | 'search' | 'favorites') => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate, onOpenSearch }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      setFavCount(getFavorites().length);
    };
    updateCount();
    window.addEventListener('bmw_favorites_updated', updateCount);
    return () => window.removeEventListener('bmw_favorites_updated', updateCount);
  }, []);

  const navLinks = [
    { id: 'home' as const, label: 'Home', icon: Home, href: 'index.html' },
    { id: 'movies' as const, label: 'Movies', icon: Film, href: 'movies.html' },
    { id: 'tvshows' as const, label: 'TV Shows', icon: Tv, href: 'tvshows.html' },
    { id: 'football' as const, label: 'Football', icon: Activity, href: 'football.html', isLive: true },
    { id: 'search' as const, label: 'Search', icon: Search, href: 'search.html' },
    { id: 'favorites' as const, label: 'My List', icon: Heart, count: favCount, href: '#favorites' },
  ];

  const handleLinkClick = (e: React.MouseEvent, id: typeof navLinks[number]['id']) => {
    e.preventDefault();
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#262626] py-3 shadow-xl'
          : 'bg-gradient-to-b from-[#0d0d0d]/90 via-[#0d0d0d]/50 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-10">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="index.html"
            onClick={(e) => handleLinkClick(e, 'home')}
            className="flex items-center gap-2 group whitespace-nowrap shrink-0 text-decoration-none"
          >
            <span className="w-8 h-8 rounded-lg bg-[#ff6b35] flex items-center justify-center font-black text-black text-base shadow-[0_0_15px_rgba(255,107,53,0.5)] group-hover:scale-105 transition-transform">
              ▶
            </span>
            <div className="flex items-baseline tracking-tighter">
              <span className="text-xl sm:text-2xl font-black text-white">BMW</span>
              <span className="text-xl sm:text-2xl font-black text-[#ff6b35] ml-1">CINEMA</span>
            </div>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#ff6b35] font-semibold'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isLive && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/40 rounded-full flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                      Live
                    </span>
                  )}
                  {link.count !== undefined && link.count > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-[#ff6b35] text-black rounded-full">
                      {link.count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6b35] rounded-full animate-fadeIn" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                else onNavigate('search');
              }}
              className="p-2 text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
              aria-label="Search Movies"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('movies')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#ff6b35] hover:bg-[#ff8354] rounded-lg shadow-[0_2px_12px_rgba(255,107,53,0.35)] transition-all transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Browse Catalog</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#141414] border-b border-[#262626] px-4 py-4 space-y-2 animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activePage === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1a1a1a] text-[#ff6b35] font-semibold'
                    : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.isLive && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-red-600/30 text-red-400 rounded-full">
                      Live
                    </span>
                  )}
                </div>
                {link.count !== undefined && link.count > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-[#ff6b35] text-black rounded-full">
                    {link.count}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
};
