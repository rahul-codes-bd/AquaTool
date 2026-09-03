import React, { useState, useEffect } from 'react';
import { Droplet, Star, Moon, Sun, Shield, Menu, X, Grid, Settings, HelpCircle, Lock } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { PrivacyBadge } from '../common/PrivacyBadge';
import { ToolCategory } from '../../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, category?: ToolCategory, toolSlug?: string) => void;
  favoritesCount: number;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  favoritesCount,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          id="navbar-brand-logo"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group select-none py-1"
          role="button"
          tabIndex={0}
          aria-label="Go to AquaTools Homepage"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavClick('home');
            }
          }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 via-sky-400 to-teal-500 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.35)] group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(6,182,212,0.5)] transition-all">
            <Droplet className="w-4.5 h-4.5 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {APP_CONFIG.name}
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                100% Local
              </span>
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              currentView === 'home'
                ? 'bg-white/10 text-cyan-300 font-semibold border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>Explore</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('all-tools')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              currentView === 'all-tools'
                ? 'bg-white/10 text-cyan-300 font-semibold border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Tools</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('favorites')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              currentView === 'favorites'
                ? 'bg-white/10 text-amber-300 font-semibold border border-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('privacy')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              currentView === 'privacy'
                ? 'bg-white/10 text-cyan-300 font-semibold border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Privacy</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              currentView === 'settings'
                ? 'bg-white/10 text-cyan-300 font-semibold border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right Action Icons & Privacy badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <PrivacyBadge />
          </div>

          <button
            type="button"
            id="theme-toggle-navbar"
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Mobile hamburger menu toggle button with min 44x44px touch target */}
          <button
            type="button"
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-w-[44px] min-h-[44px] rounded-xl bg-white/5 text-slate-200 hover:text-white border border-white/10 flex items-center justify-center active:scale-95 transition-all"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-navigation-drawer"
            className="relative z-40 md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                currentView === 'home'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-200 hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <span>Home & Explore</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('all-tools')}
              className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                currentView === 'all-tools'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-200 hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-cyan-400" />
                <span>All Utilities</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('favorites')}
              className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                currentView === 'favorites'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-200 hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${favoritesCount > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                <span>Favorites</span>
              </span>
              {favoritesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('privacy')}
              className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                currentView === 'privacy'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-200 hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Privacy Guarantee</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('security')}
              className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                currentView === 'security'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-200 hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Security Architecture</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('settings')}
              className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                currentView === 'settings'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-200 hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </span>
            </button>

            <div className="pt-3 border-t border-white/10">
              <PrivacyBadge className="w-full justify-center min-h-[44px]" />
            </div>
          </div>
        </>
      )}
    </header>
  );
};

