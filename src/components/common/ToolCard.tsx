import React from 'react';
import { Star, ArrowRight, Shield } from 'lucide-react';
import { ToolDefinition } from '../../types';
import { DynamicIcon } from './DynamicIcon';
import { StorageService } from '../../services/storage';

interface ToolCardProps {
  tool: ToolDefinition;
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string) => void;
  onSelectTool: (slug: string) => void;
  onTagClick?: (tag: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isFavorite = false,
  onToggleFavorite,
  onSelectTool,
  onTagClick,
}) => {
  return (
    <div
      id={`tool-card-${tool.slug}`}
      onClick={() => onSelectTool(tool.slug)}
      className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-200 cursor-pointer overflow-hidden shadow-lg shadow-black/10 flex flex-col justify-between"
      tabIndex={0}
      role="link"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectTool(tool.slug);
        }
      }}
      aria-label={`Open ${tool.name} tool`}
    >
      {/* Frosted ambient glow orb */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

      <div className="space-y-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:bg-cyan-500/15 group-hover:border-cyan-500/40 transition-all">
            <DynamicIcon name={tool.iconName} size={22} />
          </div>

          <div className="flex items-center gap-1.5">
            {tool.isPopular && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-500/20 rounded text-cyan-400 border border-cyan-500/30">
                Popular
              </span>
            )}
            <button
              type="button"
              id={`favorite-btn-${tool.slug}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleFavorite) onToggleFavorite(tool.slug);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-amber-400 hover:bg-amber-400/10'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'
              }`}
              aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
            {tool.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Tags & Origin Hub Badge */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tool.hubName && (
            <span className="text-[10px] font-medium px-2 py-0.5 bg-cyan-500/15 text-cyan-300 rounded-md border border-cyan-500/25">
              {tool.hubName}
            </span>
          )}
          {tool.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              onClick={(e) => {
                if (onTagClick) {
                  e.stopPropagation();
                  onTagClick(tag);
                }
              }}
              role={onTagClick ? 'button' : undefined}
              tabIndex={onTagClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onTagClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.stopPropagation();
                  e.preventDefault();
                  onTagClick(tag);
                }
              }}
              className={`text-[10px] px-2 py-0.5 rounded border border-white/5 ${
                onTagClick
                  ? 'bg-white/5 hover:bg-cyan-500/15 hover:text-cyan-300 hover:border-cyan-500/30 text-slate-400 cursor-pointer transition-colors'
                  : 'bg-white/5 text-slate-400'
              }`}
              title={onTagClick ? `Filter by tag: ${tag}` : undefined}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
        <div className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
          <Shield className="w-3 h-3" />
          <span>Local only</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-300 transition-colors">
          <span>Launch</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
