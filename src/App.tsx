import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WaterBackground } from './components/layout/WaterBackground';
import { HomePage } from './components/pages/HomePage';
import { ToolRunnerPage } from './components/pages/ToolRunnerPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { SecurityPage } from './components/pages/SecurityPage';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { TermsPage } from './components/pages/TermsPage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { ToastContainer } from './components/common/Toast';
import { AdSlotPlaceholder } from './components/common/AdSlotPlaceholder';
import { StorageService } from './services/storage';
import { ALL_TOOLS, getToolBySlug } from './registry/toolsRegistry';
import { ToolCategory, ToastMessage } from './types';
import { APP_CONFIG } from './config/appConfig';
import { t } from './i18n';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [activeToolSlug, setActiveToolSlug] = useState<string | null>(null);
  const [attemptedRoute, setAttemptedRoute] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());
  const [recentTools, setRecentTools] = useState<string[]>(() => StorageService.getRecentTools());
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(
    () => StorageService.getPreferences().theme || 'dark'
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply theme & reduced-motion classes to <html>
  useEffect(() => {
    const root = document.documentElement;
    // Theme
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Motion preference
    const prefs = StorageService.getPreferences();
    if (
      prefs.reducedMotion === 'reduce' ||
      (prefs.reducedMotion === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [theme]);

  // Sync hash routing on load & popstate
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash;
      const hash = rawHash.replace(/^#\/?/, '');

      if (!hash) {
        setCurrentView('home');
        setActiveCategory('all');
        setActiveToolSlug(null);
        setAttemptedRoute('');
      } else if (hash.startsWith('tool/')) {
        const slug = hash.replace('tool/', '');
        const found = getToolBySlug(slug);
        if (found) {
          setActiveToolSlug(slug);
          setCurrentView('tool');
          setAttemptedRoute('');
          StorageService.addRecentTool(slug);
          setRecentTools(StorageService.getRecentTools());
        } else {
          // Slug not recognized -> show 404
          setCurrentView('404');
          setActiveToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (hash.startsWith('category/')) {
        const cat = hash.replace('category/', '') as ToolCategory;
        const validCategories: ToolCategory[] = ['converters', 'documents', 'developer', 'generators', 'utilities'];
        if (validCategories.includes(cat)) {
          setCurrentView('home');
          setActiveCategory(cat);
          setActiveToolSlug(null);
          setAttemptedRoute('');
        } else {
          setCurrentView('404');
          setActiveToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (['privacy', 'security', 'about', 'contact', 'settings', 'terms', 'favorites', 'all-tools'].includes(hash)) {
        setCurrentView(hash);
        setActiveCategory('all');
        setActiveToolSlug(null);
        setAttemptedRoute('');
      } else {
        // Unrecognized route -> show 404
        setCurrentView('404');
        setActiveToolSlug(null);
        setAttemptedRoute(rawHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    handleHashChange();
    window.addEventListener('popstate', handleHashChange);
    return () => window.removeEventListener('popstate', handleHashChange);
  }, []);

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (view: string, category?: ToolCategory, toolSlug?: string) => {
    if (view === 'tool' && toolSlug) {
      window.location.hash = `tool/${toolSlug}`;
    } else if (view === 'category' && category) {
      window.location.hash = `category/${category}`;
    } else if (view === 'all-tools' && category) {
      window.location.hash = `category/${category}`;
    } else if (view === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = view;
    }
  };

  const handleSelectTool = (slug: string) => {
    handleNavigate('tool', undefined, slug);
  };

  const handleToggleFavorite = (slug: string) => {
    const updated = StorageService.toggleFavorite(slug);
    setFavorites(updated);
    const isFav = updated.includes(slug);
    const tool = getToolBySlug(slug);
    addToast(
      'success',
      isFav ? 'Added to Bookmarks' : 'Removed from Bookmarks',
      tool ? tool.name : undefined
    );
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    StorageService.savePreferences({ theme: nextTheme });
    addToast('info', `Switched to ${nextTheme} theme`);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    StorageService.savePreferences({ theme: newTheme });
    addToast('info', `Switched to ${newTheme} theme`);
  };

  const handleClearAllData = () => {
    StorageService.clearAll();
    setFavorites([]);
    setRecentTools([]);
    addToast('warning', 'Local Data Reset', 'All cached bookmarks and local preferences have been cleared.');
  };

  const handleClearRecentTools = () => {
    StorageService.clearRecentTools();
    setRecentTools([]);
    addToast('info', 'Recent History Cleared', 'Your locally recorded tool history has been cleared.');
  };

  const handleClearFavorites = () => {
    StorageService.clearFavorites();
    setFavorites([]);
    addToast('info', 'Bookmarks Cleared', 'All saved favorites have been cleared.');
  };

  const activeTool = activeToolSlug ? getToolBySlug(activeToolSlug) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#070d18] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Water Caustics & Glow Background */}
      <WaterBackground />

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
        theme={theme}
        onToggleTheme={handleThemeToggle}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Ad Placeholder (Feature Flag controlled, 0 layout shift) */}
        <AdSlotPlaceholder slotId="top-header-banner" />

        {(currentView === 'home' || currentView === 'all-tools' || currentView === 'favorites') && (
          <HomePage
            currentView={currentView}
            activeCategory={activeCategory}
            onSelectTool={handleSelectTool}
            favorites={favorites}
            recentTools={recentTools}
            onToggleFavorite={handleToggleFavorite}
            onClearRecentTools={handleClearRecentTools}
            onClearFavorites={handleClearFavorites}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'tool' && activeTool && (
          <ToolRunnerPage
            tool={activeTool}
            isFavorite={favorites.includes(activeTool.slug)}
            onToggleFavorite={handleToggleFavorite}
            onNavigateHome={() => handleNavigate('home')}
            onSelectTool={handleSelectTool}
          />
        )}

        {currentView === 'privacy' && <PrivacyPage />}

        {currentView === 'security' && <SecurityPage />}

        {currentView === 'about' && <AboutPage />}

        {currentView === 'contact' && <ContactPage />}

        {currentView === 'terms' && <TermsPage onNavigate={handleNavigate} />}

        {currentView === 'settings' && (
          <SettingsPage
            theme={theme}
            onThemeChange={handleThemeChange}
            onClearAllData={handleClearAllData}
          />
        )}

        {currentView === '404' && (
          <NotFoundPage
            attemptedRoute={attemptedRoute}
            onNavigate={handleNavigate}
            onSelectTool={handleSelectTool}
          />
        )}

        {/* Bottom Ad Placeholder */}
        <AdSlotPlaceholder slotId="bottom-footer-banner" />
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} onClearAllData={handleClearAllData} />

      {/* Accessible Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
