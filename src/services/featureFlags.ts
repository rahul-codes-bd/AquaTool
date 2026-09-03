import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/appConfig';

export interface FeatureFlags {
  /** Master flag to enable advertising slots. Default: false */
  enableAds: boolean;
  /** Developer preview mode to visualize reserved ad slot dimensions without loading providers. Default: false */
  adPreviewMode: boolean;
  /** Strict zero-telemetry enforcement. Always false. */
  enableTelemetry: false;
  /** Experimental or beta tools toggle. Default: false */
  enableExperimentalFeatures: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableAds: false,
  adPreviewMode: false,
  enableTelemetry: false,
  enableExperimentalFeatures: false,
};

const FEATURE_FLAGS_STORAGE_KEY = 'aquatools_feature_flags_v1';
const LISTENERS: Array<() => void> = [];

export class FeatureFlagService {
  private static cachedFlags: FeatureFlags | null = null;

  /**
   * Get the current active feature flags.
   * Strictly defaults to false for ads, telemetry, and external scripts.
   */
  static getFlags(): FeatureFlags {
    if (this.cachedFlags) {
      return this.cachedFlags;
    }

    try {
      const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cachedFlags = {
          ...DEFAULT_FEATURE_FLAGS,
          ...parsed,
          // Telemetry is permanently disabled regardless of storage
          enableTelemetry: false,
        };
        return this.cachedFlags;
      }
    } catch {
      // Fallback on error
    }

    this.cachedFlags = { ...DEFAULT_FEATURE_FLAGS };
    return this.cachedFlags;
  }

  /**
   * Update a specific feature flag.
   */
  static setFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]): void {
    if (key === 'enableTelemetry') {
      // Permanent safety lock: Telemetry cannot be enabled
      return;
    }

    const current = this.getFlags();
    const updated: FeatureFlags = {
      ...current,
      [key]: value,
      enableTelemetry: false,
    };

    this.cachedFlags = updated;
    try {
      localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable
    }

    this.notifyListeners();
  }

  /**
   * Reset all feature flags to strict defaults (all disabled).
   */
  static resetToDefaults(): void {
    this.cachedFlags = { ...DEFAULT_FEATURE_FLAGS };
    try {
      localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
    this.notifyListeners();
  }

  /**
   * Check if ad slots should be rendered (either active or in preview mode).
   * Strictly returns false by default.
   */
  static areAdsActive(): boolean {
    const flags = this.getFlags();
    return flags.enableAds || flags.adPreviewMode;
  }

  /**
   * Subscribe to feature flag updates.
   */
  static subscribe(listener: () => void): () => void {
    LISTENERS.push(listener);
    return () => {
      const index = LISTENERS.indexOf(listener);
      if (index !== -1) {
        LISTENERS.splice(index, 1);
      }
    };
  }

  private static notifyListeners(): void {
    LISTENERS.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying feature flag listener:', err);
      }
    });
  }
}

/**
 * React hook to reactively consume feature flags.
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(() => FeatureFlagService.getFlags());

  useEffect(() => {
    const unsubscribe = FeatureFlagService.subscribe(() => {
      setFlags(FeatureFlagService.getFlags());
    });
    return unsubscribe;
  }, []);

  return flags;
}

