import React, { useState } from 'react';
import { useFeatureFlags, FeatureFlagService } from '../../services/featureFlags';
import { 
  Sliders, ShieldCheck, ShoppingBag, Share2, Monitor, 
  Printer, QrCode, FileText, Cpu, CheckCircle2, AlertCircle, Sparkles, Layers 
} from 'lucide-react';
import { SmartExportPresets } from './SmartExportPresets';
import { QualitySizeLab } from './QualitySizeLab';
import { PrivacyInspector } from './PrivacyInspector';
import { EcommercePack } from './EcommercePack';
import { SocialPack } from './SocialPack';
import { ScreenshotBeautifier } from './ScreenshotBeautifier';
import { PrintSheet } from './PrintSheet';
import { QrArtboard } from './QrArtboard';
import { SizeBudgetTool } from './SizeBudgetTool';
import { LocalWorkflow } from './LocalWorkflow';
import { ImageProcessingConfig } from '../../types/image';

interface AquaToolsHubProps {
  currentFile?: File | null;
  currentBlob?: Blob | null;
  currentConfig?: ImageProcessingConfig;
}

export const AquaToolsHub: React.FC<AquaToolsHubProps> = ({ currentFile, currentBlob, currentConfig }) => {
  const flags = useFeatureFlags();
  const [activeTab, setActiveTab] = useState<string>('hub');

  const toolsList = [
    { id: 'smart-export', name: 'Smart Export Presets', icon: Sliders, flag: 'enableSmartExportPresets' as const, desc: 'Optimized profiles for web, print, mobile, and archive.' },
    { id: 'quality-lab', name: 'Quality-vs-Size Lab', icon: Cpu, flag: 'enableQualitySizeLab' as const, desc: 'Matrix comparison across multiple compression algorithms.' },
    { id: 'privacy-inspector', name: 'Privacy Inspector', icon: ShieldCheck, flag: 'enablePrivacyInspector' as const, desc: 'Deep EXIF/GPS audit and secure client-side scrubbing.' },
    { id: 'ecommerce-pack', name: 'E-commerce Pack', icon: ShoppingBag, flag: 'enableEcommercePack' as const, desc: 'Square catalog crops, padding, and shadow variations.' },
    { id: 'social-pack', name: 'Social Media Pack', icon: Share2, flag: 'enableSocialPack' as const, desc: 'Instant sizing for Instagram, X, LinkedIn, and YouTube.' },
    { id: 'screenshot-beautifier', name: 'Screenshot Beautifier', icon: Monitor, flag: 'enableScreenshotBeautifier' as const, desc: 'Glassmorphic window frames, gradients, and backdrop padding.' },
    { id: 'print-sheet', name: 'Print Sheet', icon: Printer, flag: 'enablePrintSheet' as const, desc: 'Contact sheet and multi-tile print layouts with crop marks.' },
    { id: 'qr-artboard', name: 'QR Artboard', icon: QrCode, flag: 'enableQrArtboard' as const, desc: 'Custom QR code generation with image embedding.' },
    { id: 'size-budget', name: 'File Size Budget Tool', icon: FileText, flag: 'enableSizeBudgetTool' as const, desc: 'Automatic binary search compression to hit strict byte caps.' },
    { id: 'local-workflow', name: 'Local Image Workflow', icon: Layers, flag: 'enableLocalWorkflow' as const, desc: 'Multi-step batch pipeline processing 100% locally.' },
  ];

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">AquaTools Advanced Suite</h2>
            <p className="text-xs text-slate-400">Modular, zero-upload client-side image tools gated behind feature flags.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const nextState = !flags.enableExperimentalFeatures;
            FeatureFlagService.setFlag('enableExperimentalFeatures', nextState);
            // Toggle all sub-flags for testing convenience when experimental is toggled
            ['enableSmartExportPresets', 'enableQualitySizeLab', 'enablePrivacyInspector', 'enableEcommercePack', 'enableSocialPack', 'enableScreenshotBeautifier', 'enablePrintSheet', 'enableQrArtboard', 'enableSizeBudgetTool', 'enableLocalWorkflow'].forEach((k) => {
              FeatureFlagService.setFlag(k as any, nextState);
            });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
            flags.enableExperimentalFeatures
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          <span>{flags.enableExperimentalFeatures ? 'Disable All Flags' : 'Enable All AquaTools'}</span>
        </button>
      </div>

      {/* Tool Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTab('hub')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTab === 'hub'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          <div className="font-semibold text-xs">Overview Hub</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Feature Flag Manager</div>
        </button>

        {toolsList.map((tool) => {
          const isEnabled = flags[tool.flag];
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTab(tool.id)}
              className={`p-3 rounded-2xl border text-left transition-all relative ${
                activeTab === tool.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg'
                  : isEnabled
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                  : 'bg-white/5 border-white/10 text-slate-400 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${isEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'}`} />
              </div>
              <div className="font-semibold text-xs truncate">{tool.name}</div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {activeTab === 'hub' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Strict Feature Flag & Client-Side Architecture</span>
                <p className="text-cyan-100/80 leading-relaxed">
                  Per specifications, all AquaTools are modular, testable, and strictly disabled by default until explicitly enabled via feature flags. No backend upload APIs or external storage calls are used—all transformations run locally in your browser sandbox.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {toolsList.map((tool) => {
                const isEnabled = flags[tool.flag];
                const Icon = tool.icon;
                return (
                  <div key={tool.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/10 text-cyan-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{tool.name}</div>
                        <div className="text-[11px] text-slate-400">{tool.desc}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={() => FeatureFlagService.setFlag(tool.flag, !isEnabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                        isEnabled
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'smart-export' && (
          flags.enableSmartExportPresets ? (
            <SmartExportPresets currentFile={currentFile} currentBlob={currentBlob} />
          ) : (
            <DisabledFeatureNotice featureName="Smart Export Presets" onEnable={() => FeatureFlagService.setFlag('enableSmartExportPresets', true)} />
          )
        )}

        {activeTab === 'quality-lab' && (
          flags.enableQualitySizeLab ? (
            <QualitySizeLab currentFile={currentFile} />
          ) : (
            <DisabledFeatureNotice featureName="Quality-vs-Size Lab" onEnable={() => FeatureFlagService.setFlag('enableQualitySizeLab', true)} />
          )
        )}

        {activeTab === 'privacy-inspector' && (
          flags.enablePrivacyInspector ? (
            <PrivacyInspector currentFile={currentFile} />
          ) : (
            <DisabledFeatureNotice featureName="Privacy-first Image Inspector" onEnable={() => FeatureFlagService.setFlag('enablePrivacyInspector', true)} />
          )
        )}

        {activeTab === 'ecommerce-pack' && (
          flags.enableEcommercePack ? (
            <EcommercePack currentFile={currentFile} />
          ) : (
            <DisabledFeatureNotice featureName="E-commerce Image Pack" onEnable={() => FeatureFlagService.setFlag('enableEcommercePack', true)} />
          )
        )}

        {activeTab === 'social-pack' && (
          flags.enableSocialPack ? (
            <SocialPack currentFile={currentFile} />
          ) : (
            <DisabledFeatureNotice featureName="Social Media Pack" onEnable={() => FeatureFlagService.setFlag('enableSocialPack', true)} />
          )
        )}

        {activeTab === 'screenshot-beautifier' && (
          flags.enableScreenshotBeautifier ? (
            <ScreenshotBeautifier currentFile={currentFile} />
          ) : (
            <DisabledFeatureNotice featureName="Screenshot Beautifier" onEnable={() => FeatureFlagService.setFlag('enableScreenshotBeautifier', true)} />
          )
        )}

        {activeTab === 'print-sheet' && (
          flags.enablePrintSheet ? (
            <PrintSheet currentFile={currentFile} />
          ) : (
            <DisabledFeatureNotice featureName="Print Sheet" onEnable={() => FeatureFlagService.setFlag('enablePrintSheet', true)} />
          )
        )}

        {activeTab === 'qr-artboard' && (
          flags.enableQrArtboard ? (
            <QrArtboard currentFile={currentFile} />
          ) : (
            <DisabledFeatureNotice featureName="QR Artboard" onEnable={() => FeatureFlagService.setFlag('enableQrArtboard', true)} />
          )
        )}

        {activeTab === 'size-budget' && (
          flags.enableSizeBudgetTool ? (
            <SizeBudgetTool currentFile={currentFile} />
          ) : (
            <DisabledFeatureNotice featureName="File Size Budget Tool" onEnable={() => FeatureFlagService.setFlag('enableSizeBudgetTool', true)} />
          )
        )}

        {activeTab === 'local-workflow' && (
          flags.enableLocalWorkflow ? (
            <LocalWorkflow />
          ) : (
            <DisabledFeatureNotice featureName="Local Image Workflow" onEnable={() => FeatureFlagService.setFlag('enableLocalWorkflow', true)} />
          )
        )}
      </div>
    </div>
  );
};

const DisabledFeatureNotice: React.FC<{ featureName: string; onEnable: () => void }> = ({ featureName, onEnable }) => (
  <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center space-y-4">
    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
      <AlertCircle className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-white">{featureName} is disabled</h3>
      <p className="text-xs text-slate-400 max-w-md mx-auto">
        This feature is gated behind a strict feature flag per development guidelines. Click below to enable it.
      </p>
    </div>
    <button
      type="button"
      onClick={onEnable}
      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold text-xs transition-all"
    >
      Enable {featureName}
    </button>
  </div>
);
