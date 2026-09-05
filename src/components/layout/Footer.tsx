import React from 'react';
import { Droplet, ShieldCheck, Trash2, Heart, ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { t } from '../../i18n';
import { ToolCategory } from '../../types';
import { CATEGORIES } from '../../registry/toolsRegistry';

interface FooterProps {
  onNavigate: (view: string, category?: ToolCategory, toolSlug?: string) => void;
  onClearAllData: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onClearAllData }) => {
  return (
    <footer className="border-t border-white/10 bg-[#020617]/90 backdrop-blur-xl text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Droplet className="w-4 h-4 fill-white/20" />
              </div>
              <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{APP_CONFIG.name}</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              {APP_CONFIG.tagline}. All file conversions, formatting, and cryptography execute exclusively inside your browser.
            </p>
            <div className="flex items-center gap-1.5 text-teal-400 text-[11px] font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>0 bytes ever sent to cloud</span>
            </div>
          </div>

          {/* Categories Col */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              Tool Categories
            </h4>
            <ul className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate('category', cat.id)}
                    className="hover:text-cyan-300 transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('pdf')}
                  className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>PDF Suite (80+ Tools)</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">Client-Side</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Trust Col */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              Privacy & Trust
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Privacy Guarantee
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('security')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Security Architecture
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  About & Architecture
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Feedback / Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Data Controls Col */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              Browser Storage Controls
            </h4>
            <p className="text-[11px] text-slate-400">
              AquaTools does not store file data. Only harmless UI preferences (bookmarks/theme) are kept locally.
            </p>
            <button
              type="button"
              id="footer-clear-data-btn"
              onClick={onClearAllData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all backdrop-blur-md"
              aria-label="Wipe all local storage and preferences"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('common.clearAllData')}</span>
            </button>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <p>© {new Date().getFullYear()} {APP_CONFIG.name}. {t('common.allRightsReserved')}</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => onNavigate('settings')} className="hover:text-slate-200 transition-colors">
              Settings
            </button>
            <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-slate-200 transition-colors">
              No-Upload Policy
            </button>
            <button type="button" onClick={() => onNavigate('terms')} className="hover:text-slate-200 transition-colors">
              Terms
            </button>
            <a href={APP_CONFIG.GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
