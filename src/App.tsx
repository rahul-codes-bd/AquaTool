import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WaterBackground } from './components/layout/WaterBackground';
import { HomePage } from './components/pages/HomePage';
import { ToastContainer } from './components/common/Toast';
import { AdSlotPlaceholder } from './components/common/AdSlotPlaceholder';
import { StorageService } from './services/storage';
import { ALL_TOOLS, getToolBySlug } from './registry/toolsRegistry';
import { PDF_CATEGORIES, getPdfToolBySlug } from './registry/pdfRegistry';
import { IMAGE_CATEGORIES, getImageToolBySlug, IMAGE_TOOLS } from './registry/imageRegistry';
import { getFileConvToolBySlug } from './registry/fileConvRegistry';
import { ToolCategory, ToastMessage } from './types';
import { PdfToolCategory } from './types/pdf';
import { ImageToolCategory } from './types/image';
import { APP_CONFIG } from './config/appConfig';
import { updateSEOMetadata } from './services/seo';
import { MASTER_CATEGORIES } from './registry/unifiedRegistry';
import { t } from './i18n';

// Route-level dynamic code splitting for sub-pages & heavy execution runners
const ToolRunnerPage = lazy(() => import('./components/pages/ToolRunnerPage').then(m => ({ default: m.ToolRunnerPage })));
const PdfHubPage = lazy(() => import('./components/pages/PdfHubPage').then(m => ({ default: m.PdfHubPage })));
const PdfToolRunnerPage = lazy(() => import('./components/pages/PdfToolRunnerPage').then(m => ({ default: m.PdfToolRunnerPage })));
const ImageHubPage = lazy(() => import('./components/pages/ImageHubPage').then(m => ({ default: m.ImageHubPage })));
const ImageToolRunnerPage = lazy(() => import('./components/pages/ImageToolRunnerPage').then(m => ({ default: m.ImageToolRunnerPage })));
const FileConvHubPage = lazy(() => import('./components/fileconv/FileConvHubPage').then(m => ({ default: m.FileConvHubPage })));
const FileConvRunnerPage = lazy(() => import('./components/fileconv/FileConvRunnerPage').then(m => ({ default: m.FileConvRunnerPage })));
const PrivacyPage = lazy(() => import('./components/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const SecurityPage = lazy(() => import('./components/pages/SecurityPage').then(m => ({ default: m.SecurityPage })));
const AboutPage = lazy(() => import('./components/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./components/pages/ContactPage').then(m => ({ default: m.ContactPage })));
const SettingsPage = lazy(() => import('./components/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const TermsPage = lazy(() => import('./components/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const NotFoundPage = lazy(() => import('./components/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

const ViewLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4" role="status" aria-label="Loading tool workspace">
    <div className="w-10 h-10 border-3 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin motion-reduce:animate-none" />
    <span className="text-sm font-medium text-slate-400 tracking-wide">Loading workspace...</span>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [activePdfCategory, setActivePdfCategory] = useState<PdfToolCategory | 'all'>('all');
  const [activeImageCategory, setActiveImageCategory] = useState<ImageToolCategory | 'all'>('all');
  const [activeToolSlug, setActiveToolSlug] = useState<string | null>(null);
  const [activePdfToolSlug, setActivePdfToolSlug] = useState<string | null>(null);
  const [activeImageToolSlug, setActiveImageToolSlug] = useState<string | null>(null);
  const [activeFileConvToolSlug, setActiveFileConvToolSlug] = useState<string | null>(null);
  const [imageInitialFiles, setImageInitialFiles] = useState<File[]>([]);
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
        setActivePdfToolSlug(null);
        setActiveImageToolSlug(null);
        setAttemptedRoute('');
      } else if (hash === 'images' || hash === 'image-hub') {
        setCurrentView('image-hub');
        setActiveImageCategory('all');
        setActiveToolSlug(null);
        setActivePdfToolSlug(null);
        setActiveImageToolSlug(null);
        setAttemptedRoute('');
      } else if (hash.startsWith('image-category/') || hash.startsWith('images/')) {
        const catSlug = hash.replace(/^(image-category\/|images\/)/, '') as ImageToolCategory;
        const validImageCat = IMAGE_CATEGORIES.some((c) => c.id === catSlug);
        if (validImageCat) {
          setCurrentView('image-hub');
          setActiveImageCategory(catSlug);
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveImageToolSlug(null);
          setAttemptedRoute('');
        } else {
          setCurrentView('404');
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveImageToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (hash.startsWith('image-tool/')) {
        const slug = hash.replace('image-tool/', '');
        const imageTool = getImageToolBySlug(slug);
        if (imageTool) {
          setActiveImageToolSlug(slug);
          setCurrentView('image-tool');
          setAttemptedRoute('');
          StorageService.addRecentTool(slug);
          setRecentTools(StorageService.getRecentTools());
        } else {
          setCurrentView('404');
          setActiveImageToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (hash === 'pdf' || hash === 'pdf-hub') {
        setCurrentView('pdf-hub');
        setActivePdfCategory('all');
        setActiveToolSlug(null);
        setActivePdfToolSlug(null);
        setActiveImageToolSlug(null);
        setAttemptedRoute('');
      } else if (hash.startsWith('pdf-category/') || hash.startsWith('pdf/')) {
        const catSlug = hash.replace(/^(pdf-category\/|pdf\/)/, '') as PdfToolCategory;
        const validPdfCat = PDF_CATEGORIES.some((c) => c.id === catSlug);
        if (validPdfCat) {
          setCurrentView('pdf-hub');
          setActivePdfCategory(catSlug);
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveImageToolSlug(null);
          setAttemptedRoute('');
        } else {
          setCurrentView('404');
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveImageToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (hash.startsWith('pdf-tool/')) {
        const slug = hash.replace('pdf-tool/', '');
        const pdfTool = getPdfToolBySlug(slug);
        if (pdfTool) {
          setActivePdfToolSlug(slug);
          setCurrentView('pdf-tool');
          setActiveImageToolSlug(null);
          setAttemptedRoute('');
          StorageService.addRecentTool(slug);
          setRecentTools(StorageService.getRecentTools());
        } else {
          setCurrentView('404');
          setActivePdfToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (hash.startsWith('tool/')) {
        const slug = hash.replace('tool/', '');
        const imageTool = getImageToolBySlug(slug);
        const found = getToolBySlug(slug);
        const pdfTool = getPdfToolBySlug(slug);
        const fcTool = getFileConvToolBySlug(slug);

        if (imageTool) {
          setActiveImageToolSlug(slug);
          setCurrentView('image-tool');
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveFileConvToolSlug(null);
          setAttemptedRoute('');
          StorageService.addRecentTool(slug);
          setRecentTools(StorageService.getRecentTools());
        } else if (found) {
          setActiveToolSlug(slug);
          setCurrentView('tool');
          setActiveImageToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveFileConvToolSlug(null);
          setAttemptedRoute('');
          StorageService.addRecentTool(slug);
          setRecentTools(StorageService.getRecentTools());
        } else if (pdfTool) {
          setActivePdfToolSlug(slug);
          setCurrentView('pdf-tool');
          setActiveToolSlug(null);
          setActiveImageToolSlug(null);
          setActiveFileConvToolSlug(null);
          setAttemptedRoute('');
          StorageService.addRecentTool(slug);
          setRecentTools(StorageService.getRecentTools());
        } else if (fcTool) {
          setActiveFileConvToolSlug(slug);
          setCurrentView('fileconv-tool');
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveImageToolSlug(null);
          setAttemptedRoute('');
          StorageService.addRecentTool(slug);
          setRecentTools(StorageService.getRecentTools());
        } else {
          setCurrentView('404');
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveImageToolSlug(null);
          setActiveFileConvToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (hash.startsWith('category/')) {
        const cat = hash.replace('category/', '') as ToolCategory;
        const validCategories: ToolCategory[] = [
          'converters',
          'documents',
          'images',
          'generators',
          'developer',
          'security',
          'workflows',
          'utilities',
        ];
        if (validCategories.includes(cat)) {
          setCurrentView('home');
          setActiveCategory(cat);
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveImageToolSlug(null);
          setActiveFileConvToolSlug(null);
          setAttemptedRoute('');
        } else {
          setCurrentView('404');
          setActiveToolSlug(null);
          setActivePdfToolSlug(null);
          setActiveImageToolSlug(null);
          setActiveFileConvToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (hash === 'fileconv' || hash === 'fileconv-hub') {
        setCurrentView('fileconv-hub');
        setActiveFileConvToolSlug(null);
        setActiveToolSlug(null);
        setActivePdfToolSlug(null);
        setActiveImageToolSlug(null);
        setAttemptedRoute('');
      } else if (hash.startsWith('fileconv-tool/')) {
        const slug = hash.replace('fileconv-tool/', '');
        const fcTool = getFileConvToolBySlug(slug);
        if (fcTool) {
          setActiveFileConvToolSlug(slug);
          setCurrentView('fileconv-tool');
          setAttemptedRoute('');
          StorageService.addRecentTool(slug);
          setRecentTools(StorageService.getRecentTools());
        } else {
          setCurrentView('404');
          setActiveFileConvToolSlug(null);
          setAttemptedRoute(rawHash);
        }
      } else if (['privacy', 'security', 'about', 'contact', 'settings', 'terms', 'favorites', 'all-tools'].includes(hash)) {
        setCurrentView(hash);
        setActiveCategory('all');
        setActiveToolSlug(null);
        setActivePdfToolSlug(null);
        setActiveImageToolSlug(null);
        setAttemptedRoute('');
      } else {
        // Unrecognized route -> show 404
        setCurrentView('404');
        setActiveToolSlug(null);
        setActivePdfToolSlug(null);
        setActiveImageToolSlug(null);
        setAttemptedRoute(rawHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    handleHashChange();
    window.addEventListener('popstate', handleHashChange);
    return () => window.removeEventListener('popstate', handleHashChange);
  }, []);

  // Update document title, canonical tag, Open Graph, and Twitter metadata on view/tool change
  useEffect(() => {
    let title = '';
    let description = '';
    let canonicalPath = '/';

    if (currentView === 'home') {
      if (activeCategory !== 'all') {
        const catObj = MASTER_CATEGORIES.find((c) => c.id === activeCategory);
        title = catObj ? `${catObj.name} Utilities` : 'Category';
        description = catObj?.description;
        canonicalPath = `/#/category/${activeCategory}`;
      } else {
        title = 'Private, Local Browser Utilities';
        canonicalPath = '/';
      }
    } else if (currentView === 'all-tools') {
      title = 'Explore All Tools';
      description = 'Search and discover all 180+ private, client-side tools in AquaTools.';
      canonicalPath = '/#/all-tools';
    } else if (currentView === 'pdf-hub') {
      if (activePdfCategory !== 'all') {
        const catObj = PDF_CATEGORIES.find((c) => c.id === activePdfCategory);
        title = catObj ? `PDF ${catObj.name}` : 'PDF Category';
        canonicalPath = `/#/pdf-category/${activePdfCategory}`;
      } else {
        title = 'PDF Suite & Workstation';
        description = 'Complete browser-based PDF workstation. Merge, split, compress, edit, convert, and protect PDF files.';
        canonicalPath = '/#/pdf-hub';
      }
    } else if (currentView === 'image-hub') {
      if (activeImageCategory !== 'all') {
        const catObj = IMAGE_CATEGORIES.find((c) => c.id === activeImageCategory);
        title = catObj ? `Image ${catObj.name}` : 'Image Category';
        canonicalPath = `/#/image-category/${activeImageCategory}`;
      } else {
        title = 'Image Studio & Workbench';
        description = 'Client-side image processing studio. Convert, compress, resize, edit, crop, and optimize photos.';
        canonicalPath = '/#/image-hub';
      }
    } else if (currentView === 'fileconv-hub') {
      title = 'File Conversion Hub';
      description = 'Convert images, audio, video, documents, and code formats directly inside your browser.';
      canonicalPath = '/#/fileconv-hub';
    } else if (currentView === 'tool' && activeToolSlug) {
      const t = getToolBySlug(activeToolSlug);
      if (t) {
        title = t.name;
        description = t.description;
        canonicalPath = `/#/tool/${t.slug}`;
      }
    } else if (currentView === 'pdf-tool' && activePdfToolSlug) {
      const t = getPdfToolBySlug(activePdfToolSlug);
      if (t) {
        title = t.title;
        description = t.shortDescription;
        canonicalPath = `/#/tool/${t.slug}`;
      }
    } else if (currentView === 'image-tool' && activeImageToolSlug) {
      const t = getImageToolBySlug(activeImageToolSlug);
      if (t) {
        title = t.title;
        description = t.description;
        canonicalPath = `/#/tool/${t.slug}`;
      }
    } else if (currentView === 'fileconv-tool' && activeFileConvToolSlug) {
      const t = getFileConvToolBySlug(activeFileConvToolSlug);
      if (t) {
        title = t.title;
        description = t.description;
        canonicalPath = `/#/tool/${t.slug}`;
      }
    } else if (currentView === 'privacy') {
      title = 'Privacy Policy';
      description = 'AquaTools Privacy Policy: Zero file uploads, zero telemetry, zero cookies. 100% local processing.';
      canonicalPath = '/#/privacy';
    } else if (currentView === 'security') {
      title = 'Security Overview';
      description = 'AquaTools Security Architecture: Local WebCrypto, WebAssembly sandboxing, and zero external backend dependency.';
      canonicalPath = '/#/security';
    } else if (currentView === 'about') {
      title = 'About AquaTools';
      description = 'About AquaTools: Empowering users with fast, client-side, zero-upload web utility tools.';
      canonicalPath = '/#/about';
    } else if (currentView === 'contact') {
      title = 'Contact & Support';
      description = 'Get in touch with the AquaTools team or report issues.';
      canonicalPath = '/#/contact';
    } else if (currentView === 'terms') {
      title = 'Terms of Service';
      description = 'Terms of Service and usage guidelines for AquaTools utilities.';
      canonicalPath = '/#/terms';
    } else if (currentView === 'settings') {
      title = 'Settings';
      description = 'User preferences and local storage settings.';
      canonicalPath = '/#/settings';
    } else if (currentView === 'favorites') {
      title = 'Favorites';
      description = 'Your bookmarked local tools.';
      canonicalPath = '/#/favorites';
    } else if (currentView === '404') {
      title = 'Page Not Found (404)';
      description = 'The requested page or tool does not exist on AquaTools.';
      canonicalPath = '/#/404';
    }

    updateSEOMetadata({ title, description, canonicalPath });
  }, [
    currentView,
    activeCategory,
    activePdfCategory,
    activeImageCategory,
    activeToolSlug,
    activePdfToolSlug,
    activeImageToolSlug,
    activeFileConvToolSlug,
  ]);

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
    } else if (view === 'pdf-tool' && toolSlug) {
      window.location.hash = `pdf-tool/${toolSlug}`;
    } else if (view === 'image-tool' && toolSlug) {
      window.location.hash = `image-tool/${toolSlug}`;
    } else if (view === 'fileconv' || view === 'fileconv-hub') {
      window.location.hash = 'fileconv';
    } else if (view === 'fileconv-tool' && toolSlug) {
      window.location.hash = `fileconv-tool/${toolSlug}`;
    } else if (view === 'pdf') {
      window.location.hash = 'pdf';
    } else if (view === 'images' || view === 'image-hub') {
      window.location.hash = 'images';
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

  const handleSelectPdfTool = (slug: string) => {
    window.location.hash = `pdf-tool/${slug}`;
  };

  const handleSelectPdfCategory = (category: PdfToolCategory | 'all') => {
    if (category === 'all') {
      window.location.hash = 'pdf';
    } else {
      window.location.hash = `pdf-category/${category}`;
    }
  };

  const handleSelectImageTool = (slug: string, initialFiles?: File[]) => {
    if (initialFiles && initialFiles.length > 0) {
      setImageInitialFiles(initialFiles);
    }
    window.location.hash = `image-tool/${slug}`;
  };

  const handleSelectImageCategory = (category: ImageToolCategory | 'all') => {
    if (category === 'all') {
      window.location.hash = 'images';
    } else {
      window.location.hash = `image-category/${category}`;
    }
  };

  const handleToggleFavorite = (slug: string) => {
    const updated = StorageService.toggleFavorite(slug);
    setFavorites(updated);
    const isFav = updated.includes(slug);
    const tool = getToolBySlug(slug) || getPdfToolBySlug(slug) || getImageToolBySlug(slug);
    addToast(
      'success',
      isFav ? 'Added to Bookmarks' : 'Removed from Bookmarks',
      tool ? ('title' in tool ? tool.title : tool.name) : undefined
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
  const activePdfTool = activePdfToolSlug ? getPdfToolBySlug(activePdfToolSlug) : null;
  const activeImageTool = activeImageToolSlug ? getImageToolBySlug(activeImageToolSlug) : null;
  const activeFileConvTool = activeFileConvToolSlug ? getFileConvToolBySlug(activeFileConvToolSlug) : null;

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

        <Suspense fallback={<ViewLoadingFallback />}>
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

          {(currentView === 'images' || currentView === 'image-hub') && (
            <ImageHubPage
              activeCategory={activeImageCategory}
              onSelectCategory={handleSelectImageCategory}
              onSelectImageTool={handleSelectImageTool}
              onNavigateHome={() => handleNavigate('home')}
            />
          )}

          {currentView === 'image-tool' && activeImageTool && (
            <ImageToolRunnerPage
              tool={activeImageTool}
              initialFiles={imageInitialFiles}
              onBack={() => {
                setImageInitialFiles([]);
                handleNavigate('images');
              }}
              onSelectOtherTool={handleSelectImageTool}
            />
          )}

          {(currentView === 'pdf' || currentView === 'pdf-hub') && (
            <PdfHubPage
              activeCategory={activePdfCategory}
              onSelectCategory={handleSelectPdfCategory}
              onSelectPdfTool={handleSelectPdfTool}
              onNavigateHome={() => handleNavigate('home')}
            />
          )}

          {(currentView === 'fileconv' || currentView === 'fileconv-hub') && (
            <FileConvHubPage onSelectTool={(slug) => handleNavigate('fileconv-tool', undefined, slug)} />
          )}

          {currentView === 'fileconv-tool' && activeFileConvTool && (
            <FileConvRunnerPage tool={activeFileConvTool} onBack={() => handleNavigate('fileconv')} />
          )}

          {currentView === 'pdf-tool' && activePdfTool && (
            <PdfToolRunnerPage
              tool={activePdfTool}
              isFavorite={favorites.includes(activePdfTool.slug)}
              onToggleFavorite={handleToggleFavorite}
              onNavigateHub={() => handleNavigate('pdf')}
              onSelectTool={handleSelectPdfTool}
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
        </Suspense>

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
