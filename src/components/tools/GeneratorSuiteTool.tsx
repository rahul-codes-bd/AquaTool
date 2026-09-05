import React, { useState, useEffect } from 'react';
import { GeneratorTools, MockUser, PaletteHarmony, PaletteColor } from '../../services/generatorTools';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import {
  Dices,
  RefreshCw,
  Link,
  Sparkles,
  Box,
  Palette,
  UserCheck,
  RotateCcw,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Sliders,
  Check,
  Copy,
  Download,
  Shuffle,
  Layers
} from 'lucide-react';

export interface GeneratorSuiteToolProps {
  initialTab?: 'random' | 'slug' | 'username' | 'palette' | 'gradient' | 'shadow';
}

export const GeneratorSuiteTool: React.FC<GeneratorSuiteToolProps> = ({
  initialTab = 'random',
}) => {
  const [activeTab, setActiveTab] = useState<
    'random' | 'slug' | 'username' | 'palette' | 'gradient' | 'shadow'
  >(initialTab);

  // Sync if initialTab changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // ==========================================
  // TAB 1: RANDOM DATA & MOCK GENERATOR STATE
  // ==========================================
  const [randomMode, setRandomMode] = useState<'numbers' | 'strings' | 'users' | 'shuffle'>('numbers');
  // Numbers
  const [numMin, setNumMin] = useState(1);
  const [numMax, setNumMax] = useState(100);
  const [numCount, setNumCount] = useState(6);
  const [numUnique, setNumUnique] = useState(true);
  const [numSorted, setNumSorted] = useState(false);
  const [numDecimals, setNumDecimals] = useState(0);
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);

  // Strings / Tokens
  const [strLength, setStrLength] = useState(16);
  const [strType, setStrType] = useState<'alphanumeric' | 'alpha' | 'numeric' | 'hex' | 'base64'>('alphanumeric');
  const [strCount, setStrCount] = useState(5);
  const [randomStrings, setRandomStrings] = useState<string[]>([]);

  // Mock Users
  const [mockUserCount, setMockUserCount] = useState(5);
  const [mockUsers, setMockUsers] = useState<MockUser[]>([]);
  const [mockExportFormat, setMockExportFormat] = useState<'json' | 'csv'>('json');

  // List Shuffler & Picker
  const [listInput, setListInput] = useState('Apple\nBanana\nCherry\nDragonfruit\nElderberry\nFig\nGrape');
  const [pickCount, setPickCount] = useState(3);
  const [shuffledList, setShuffledList] = useState<string[]>([]);
  const [pickedItems, setPickedItems] = useState<string[]>([]);

  const handleGenRandomNumbers = () => {
    setRandomNumbers(
      GeneratorTools.generateRandomNumbers({
        min: numMin,
        max: numMax,
        count: numCount,
        unique: numUnique,
        sort: numSorted ? 'asc' : 'none',
        decimals: numDecimals,
      })
    );
  };

  const handleGenRandomStrings = () => {
    const list: string[] = [];
    for (let i = 0; i < strCount; i++) {
      list.push(GeneratorTools.generateRandomString(strLength, strType));
    }
    setRandomStrings(list);
  };

  const handleGenMockUsers = () => {
    setMockUsers(GeneratorTools.generateMockUsers(mockUserCount));
  };

  const handleShuffleList = () => {
    const items = listInput.split('\n').map((s) => s.trim()).filter(Boolean);
    const shuffled = GeneratorTools.shuffleList(items);
    const picked = GeneratorTools.pickRandomItems(items, Math.min(items.length, pickCount));
    setShuffledList(shuffled);
    setPickedItems(picked);
  };

  // ==========================================
  // TAB 2: SLUGIFIER STATE
  // ==========================================
  const defaultSlugInput = 'AquaTools: A 100% Client-Side Web Utility Suite for Developers & Designers!';
  const [rawTitle, setRawTitle] = useState(defaultSlugInput);
  const [slugLower, setSlugLower] = useState(true);
  const [slugSep, setSlugSep] = useState<'-' | '_' | '/'>('-');
  const [slugRemoveAccents, setSlugRemoveAccents] = useState(true);
  const [slugMaxLength, setSlugMaxLength] = useState(80);
  const [slugResult, setSlugResult] = useState('');

  const updateSlug = (text: string) => {
    const res = GeneratorTools.slugify(text, {
      separator: slugSep,
      lowercase: slugLower,
      removeAccents: slugRemoveAccents,
      maxLength: slugMaxLength,
    });
    setSlugResult(res);
  };

  useEffect(() => {
    updateSlug(rawTitle);
  }, [rawTitle, slugLower, slugSep, slugRemoveAccents, slugMaxLength]);

  // ==========================================
  // TAB 3: USERNAME GENERATOR STATE
  // ==========================================
  const [usernameStyle, setUsernameStyle] = useState<
    'developer' | 'aesthetic' | 'gamer' | 'professional' | 'minimal' | 'fun'
  >('developer');
  const [usernamePrefix, setUsernamePrefix] = useState('');
  const [usernameSuffix, setUsernameSuffix] = useState('');
  const [usernameDigits, setUsernameDigits] = useState(true);
  const [usernameSep, setUsernameSep] = useState<'_' | '-' | '.' | ''>('_');
  const [usernameCount, setUsernameCount] = useState(12);
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);

  const handleGenUsernames = () => {
    setGeneratedUsernames(
      GeneratorTools.generateUsernames({
        style: usernameStyle,
        count: usernameCount,
        includeNumber: usernameDigits,
        separator: usernameSep,
        prefix: usernamePrefix || undefined,
        suffix: usernameSuffix || undefined,
      })
    );
  };

  // ==========================================
  // TAB 4: PALETTE & HARMONY GENERATOR STATE
  // ==========================================
  const [paletteHarmony, setPaletteHarmony] = useState<PaletteHarmony>('triadic');
  const [baseHex, setBaseHex] = useState('#06b6d4');
  const [lockedColors, setLockedColors] = useState<boolean[]>([false, false, false, false, false]);
  const [paletteSwatches, setPaletteSwatches] = useState<
    Array<{ hex: string; rgb: string; hsl: string; contrastText: string }>
  >([]);

  const handleGenPalette = () => {
    const raw = GeneratorTools.generatePalette({
      harmony: paletteHarmony,
      baseColor: baseHex,
    });
    const formatted = raw.map((c) => ({
      hex: c.hex,
      rgb: typeof c.rgb === 'string' ? c.rgb : `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
      hsl: typeof c.hsl === 'string' ? c.hsl : `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
      contrastText: c.isDark ? '#ffffff' : '#0f172a',
    }));

    setPaletteSwatches((prev) => {
      if (prev.length !== 5) return formatted;
      return formatted.map((swatch, idx) => (lockedColors[idx] ? prev[idx] : swatch));
    });
  };

  const toggleLockColor = (index: number) => {
    const copy = [...lockedColors];
    copy[index] = !copy[index];
    setLockedColors(copy);
  };

  // ==========================================
  // TAB 5: CSS GRADIENT GENERATOR STATE
  // ==========================================
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientStops, setGradientStops] = useState([
    { color: '#06b6d4', position: 0 },
    { color: '#3b82f6', position: 50 },
    { color: '#8b5cf6', position: 100 },
  ]);

  const cssGradientString =
    gradientType === 'linear'
      ? `linear-gradient(${gradientAngle}deg, ${gradientStops
          .map((s) => `${s.color} ${s.position}%`)
          .join(', ')})`
      : `radial-gradient(circle at center, ${gradientStops
          .map((s) => `${s.color} ${s.position}%`)
          .join(', ')})`;

  // ==========================================
  // TAB 6: CSS SHADOW GENERATOR STATE
  // ==========================================
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(20);
  const [shadowBlur, setShadowBlur] = useState(30);
  const [shadowSpread, setShadowSpread] = useState(-5);
  const [shadowColor, setShadowColor] = useState('#06b6d4');
  const [shadowOpacity, setShadowOpacity] = useState(35);
  const [shadowInset, setShadowInset] = useState(false);
  const [shadowPreviewTheme, setShadowPreviewTheme] = useState<'dark' | 'light'>('dark');

  const hexToRgba = (hex: string, alphaPercent: number) => {
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${(alphaPercent / 100).toFixed(2)})`;
  };

  const cssShadowString = `box-shadow: ${shadowInset ? 'inset ' : ''}${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${hexToRgba(
    shadowColor,
    shadowOpacity
  )};`;

  // Initial runs
  useEffect(() => {
    handleGenRandomNumbers();
    handleGenRandomStrings();
    handleGenMockUsers();
    handleShuffleList();
    handleGenUsernames();
    handleGenPalette();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Tab Bar */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('random')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'random'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dices className="w-3.5 h-3.5 text-cyan-400" />
          <span>Random & Mock Data</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('slug')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'slug'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link className="w-3.5 h-3.5 text-teal-400" />
          <span>URL Slugifier</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('username')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'username'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Username Generator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('palette')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'palette'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Color Palette & Harmony</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gradient')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'gradient'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>CSS Gradient</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shadow')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'shadow'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-indigo-400" />
          <span>CSS Box Shadow</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. RANDOM DATA & MOCK GENERATOR */}
      {/* ============================================================== */}
      {activeTab === 'random' && (
        <div className="space-y-6">
          {/* Submode pill selector */}
          <div className="flex justify-center">
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setRandomMode('numbers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  randomMode === 'numbers' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                Random Numbers
              </button>
              <button
                type="button"
                onClick={() => setRandomMode('strings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  randomMode === 'strings' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                Crypto Strings & Tokens
              </button>
              <button
                type="button"
                onClick={() => setRandomMode('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  randomMode === 'users' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                Mock User Profiles
              </button>
              <button
                type="button"
                onClick={() => setRandomMode('shuffle')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  randomMode === 'shuffle' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                List Shuffler & Picker
              </button>
            </div>
          </div>

          {/* Mode 1.1: Numbers */}
          {randomMode === 'numbers' && (
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Min Value</label>
                  <input
                    type="number"
                    value={numMin}
                    onChange={(e) => setNumMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Max Value</label>
                  <input
                    type="number"
                    value={numMax}
                    onChange={(e) => setNumMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Count</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={numCount}
                    onChange={(e) => setNumCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Decimals</label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={numDecimals}
                    onChange={(e) => setNumDecimals(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={numUnique}
                      onChange={(e) => setNumUnique(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    <span>Unique only</span>
                  </label>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={numSorted}
                      onChange={(e) => setNumSorted(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    <span>Ascending sort</span>
                  </label>
                </div>
              </div>

              {/* Number Results */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Generated Numbers ({randomNumbers.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenRandomNumbers}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <CopyButton textToCopy={randomNumbers.join(', ')} label="Copy List" />
                    <DownloadButton
                      content={randomNumbers.join('\n')}
                      fileName="random-numbers.txt"
                      mimeType="text/plain"
                      label="Download"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {randomNumbers.map((num, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-cyan-300 font-bold text-sm shadow-sm"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mode 1.2: Crypto Strings */}
          {randomMode === 'strings' && (
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Token Character Set</label>
                  <select
                    value={strType}
                    onChange={(e) => setStrType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="alphanumeric">Alphanumeric (A-Z, a-z, 0-9)</option>
                    <option value="hex">Hexadecimal (0-9, a-f)</option>
                    <option value="base64">Base64 URL-Safe</option>
                    <option value="alpha">Letters Only (A-Z, a-z)</option>
                    <option value="numeric">Numbers Only (0-9)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Length per string</label>
                  <input
                    type="number"
                    min={4}
                    max={128}
                    value={strLength}
                    onChange={(e) => setStrLength(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={strCount}
                    onChange={(e) => setStrCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* String Results */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Web Crypto CSPRNG Tokens
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenRandomStrings}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <CopyButton textToCopy={randomStrings.join('\n')} label="Copy All" />
                    <DownloadButton
                      content={randomStrings.join('\n')}
                      fileName="crypto-tokens.txt"
                      mimeType="text/plain"
                      label="Download"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-1 font-mono text-xs text-cyan-300">
                  {randomStrings.map((str, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <span className="break-all">{str}</span>
                      <CopyButton textToCopy={str} label="Copy" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mode 1.3: Mock Users */}
          {randomMode === 'users' && (
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Number of Mock Records</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={mockUserCount}
                      onChange={(e) => setMockUserCount(Number(e.target.value))}
                      className="w-28 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Export Format</label>
                    <select
                      value={mockExportFormat}
                      onChange={(e) => setMockExportFormat(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    >
                      <option value="json">JSON Array</option>
                      <option value="csv">CSV Spreadsheet</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleGenMockUsers}
                    className="px-4 py-2 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Data</span>
                  </button>
                  <CopyButton
                    textToCopy={
                      mockExportFormat === 'json'
                        ? JSON.stringify(mockUsers, null, 2)
                        : [
                            'ID,First Name,Last Name,Username,Email,Job Title,Company,City,Country',
                            ...mockUsers.map(
                              (u) =>
                                `"${u.id}","${u.firstName}","${u.lastName}","${u.username}","${u.email}","${u.jobTitle}","${u.company}","${u.city}","${u.country}"`
                            ),
                          ].join('\n')
                    }
                    label="Copy Export"
                  />
                  <DownloadButton
                    content={
                      mockExportFormat === 'json'
                        ? JSON.stringify(mockUsers, null, 2)
                        : [
                            'ID,First Name,Last Name,Username,Email,Job Title,Company,City,Country',
                            ...mockUsers.map(
                              (u) =>
                                `"${u.id}","${u.firstName}","${u.lastName}","${u.username}","${u.email}","${u.jobTitle}","${u.company}","${u.city}","${u.country}"`
                            ),
                          ].join('\n')
                    }
                    fileName={`mock-users.${mockExportFormat}`}
                    mimeType={mockExportFormat === 'json' ? 'application/json' : 'text/csv'}
                    label="Download"
                  />
                </div>
              </div>

              {/* Table Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Username & Email</th>
                      <th className="p-3">Job Title</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {mockUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-medium text-slate-100">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="p-3 font-mono text-cyan-400">
                          <div>@{u.username}</div>
                          <div className="text-slate-400 font-sans">{u.email}</div>
                        </td>
                        <td className="p-3">{u.jobTitle}</td>
                        <td className="p-3 text-slate-400">{u.company}</td>
                        <td className="p-3 text-slate-400">
                          {u.city}, {u.country}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mode 1.4: List Shuffler & Picker */}
          {randomMode === 'shuffle' && (
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-300">
                    List Items (one item per line)
                  </label>
                  <textarea
                    rows={8}
                    value={listInput}
                    onChange={(e) => setListInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span>Pick Random:</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={pickCount}
                        onChange={(e) => setPickCount(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-slate-200"
                      />
                      <span>items</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleShuffleList}
                      className="px-4 py-2 rounded-xl aqua-glow-button text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Shuffle & Pick</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Picked Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-cyan-400">Randomly Picked ({pickedItems.length})</span>
                      <CopyButton textToCopy={pickedItems.join('\n')} label="Copy Picked" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {pickedItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-bold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Shuffled Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-400">Full Shuffled Order</span>
                      <CopyButton textToCopy={shuffledList.join('\n')} label="Copy Shuffled" />
                    </div>
                    <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 font-mono max-h-36 overflow-y-auto">
                      {shuffledList.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Random Disclaimer */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">Synthetic Mock Data Notice</span>
              <p>
                All data is synthesized dynamically in browser memory using the Web Crypto API. Mock users and random
                attributes are generated for testing, staging, and wireframe prototypes and do not correspond to real
                identities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. URL SLUGIFIER */}
      {/* ============================================================== */}
      {activeTab === 'slug' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">Original Text / Article Title</label>
                <button
                  type="button"
                  onClick={() => setRawTitle(defaultSlugInput)}
                  className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Sample</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={rawTitle}
                onChange={(e) => setRawTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm"
                placeholder="Enter title or string to convert into a clean URL slug..."
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Word Separator</label>
                <select
                  value={slugSep}
                  onChange={(e) => setSlugSep(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="-">Hyphen (-)</option>
                  <option value="_">Underscore (_)</option>
                  <option value="/">Slash (/)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Max Character Cap</label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={slugMaxLength}
                  onChange={(e) => setSlugMaxLength(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={slugLower}
                    onChange={(e) => setSlugLower(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Lowercase all characters</span>
                </label>
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={slugRemoveAccents}
                    onChange={(e) => setSlugRemoveAccents(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Normalize accents (e.g. é → e)</span>
                </label>
              </div>
            </div>

            {/* Live Slug Output & Mock Browser Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Live Generated URL Slug
                </span>
                <div className="flex items-center gap-2">
                  <CopyButton textToCopy={slugResult} label="Copy Slug" />
                  <DownloadButton
                    content={slugResult}
                    fileName="slug.txt"
                    mimeType="text/plain"
                    label="Download"
                  />
                </div>
              </div>

              {/* URL Address Bar Mockup */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <span className="text-slate-500 text-xs font-mono select-none">https://example.com/blog/</span>
                <span className="text-cyan-300 text-xs font-mono font-bold break-all select-all">
                  {slugResult || '...'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">URL Routing Disclaimer</span>
              <p>
                Ensure your routing framework or web server is configured to handle the chosen separator consistently.
                Verify that generated slugs do not conflict with reserved application path keywords (e.g., /api,
                /admin).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. USERNAME GENERATOR */}
      {/* ============================================================== */}
      {activeTab === 'username' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Theme / Archetype</label>
                <select
                  value={usernameStyle}
                  onChange={(e) => setUsernameStyle(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="developer">Developer & Tech</option>
                  <option value="aesthetic">Aesthetic & Cosmic</option>
                  <option value="gamer">Gamer & Apex</option>
                  <option value="professional">Professional</option>
                  <option value="minimal">Minimalist</option>
                  <option value="fun">Fun & Quirky</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Separator</label>
                <select
                  value={usernameSep}
                  onChange={(e) => setUsernameSep(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="_">Underscore (_)</option>
                  <option value="-">Hyphen (-)</option>
                  <option value=".">Period (.)</option>
                  <option value="">None (Concatenated)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Custom Prefix (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. dev"
                  value={usernamePrefix}
                  onChange={(e) => setUsernamePrefix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Custom Suffix (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. io"
                  value={usernameSuffix}
                  onChange={(e) => setUsernameSuffix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usernameDigits}
                    onChange={(e) => setUsernameDigits(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Append random digits</span>
                </label>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Generated Handles ({generatedUsernames.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenUsernames}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                  <CopyButton textToCopy={generatedUsernames.join('\n')} label="Copy All" />
                  <DownloadButton
                    content={generatedUsernames.join('\n')}
                    fileName="usernames.txt"
                    mimeType="text/plain"
                    label="Download"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {generatedUsernames.map((uname, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 group hover:border-slate-700 transition-colors"
                  >
                    <span className="font-mono text-xs text-cyan-300 font-semibold truncate">@{uname}</span>
                    <CopyButton textToCopy={uname} label="Copy" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">Availability Notice</span>
              <p>
                Generated usernames are algorithmically computed for creative inspiration and placeholder accounts.
                Please verify handle availability on target social platforms or services prior to branding decisions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. COLOR PALETTE & HARMONY */}
      {/* ============================================================== */}
      {activeTab === 'palette' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Color Harmony Rule</label>
                  <select
                    value={paletteHarmony}
                    onChange={(e) => setPaletteHarmony(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="triadic">Triadic Harmony (Balanced)</option>
                    <option value="complementary">Complementary (High Contrast)</option>
                    <option value="analogous">Analogous (Serene / Adjacent)</option>
                    <option value="split-complementary">Split-Complementary</option>
                    <option value="tetradic">Tetradic (Four-Color Rectangular)</option>
                    <option value="monochromatic">Monochromatic (Shades & Tints)</option>
                    <option value="random">Random Harmonic Palette</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Base Seed Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={baseHex}
                      onChange={(e) => setBaseHex(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={baseHex}
                      onChange={(e) => setBaseHex(e.target.value)}
                      className="w-24 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleGenPalette}
                  className="px-4 py-2 rounded-xl aqua-glow-button text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Palette</span>
                </button>
                <CopyButton
                  textToCopy={paletteSwatches.map((s) => s.hex).join(', ')}
                  label="Copy HEX List"
                />
                <DownloadButton
                  content={`/* AquaTools Generated Palette */\n:root {\n${paletteSwatches
                    .map((s, i) => `  --color-${i + 1}: ${s.hex}; /* ${s.rgb} */`)
                    .join('\n')}\n}`}
                  fileName="palette.css"
                  mimeType="text/css"
                  label="Download CSS"
                />
              </div>
            </div>

            {/* Swatches Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {paletteSwatches.map((swatch, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden border border-slate-800 shadow-md flex flex-col justify-between"
                  style={{ backgroundColor: swatch.hex }}
                >
                  <div className="p-3 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => toggleLockColor(idx)}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                        lockedColors[idx]
                          ? 'bg-black/60 text-amber-300'
                          : 'bg-black/30 text-white/70 hover:text-white'
                      }`}
                      title={lockedColors[idx] ? 'Color Locked' : 'Lock Color'}
                    >
                      {lockedColors[idx] ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-md"
                      style={{
                        backgroundColor: swatch.contrastText === '#ffffff' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
                        color: swatch.contrastText,
                      }}
                    >
                      AA {swatch.contrastText === '#ffffff' ? 'Light text' : 'Dark text'}
                    </span>
                  </div>

                  <div className="h-20" />

                  <div className="p-3 bg-slate-950/90 backdrop-blur-md border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-100">{swatch.hex}</span>
                      <CopyButton textToCopy={swatch.hex} label="Copy" />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{swatch.rgb}</div>
                    <div className="text-[10px] font-mono text-slate-500">{swatch.hsl}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live UI Mockup Preview Card using Palette */}
            {paletteSwatches.length === 5 && (
              <div className="p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-950">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Live UI Mockup Preview with Palette</span>
                </span>
                <div
                  className="p-6 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
                  style={{ backgroundColor: paletteSwatches[0].hex, color: paletteSwatches[0].contrastText }}
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: paletteSwatches[2].hex, color: paletteSwatches[2].contrastText }}
                    >
                      Featured Badge
                    </span>
                    <h4 className="text-base font-bold">Interactive Component Preview</h4>
                    <p className="text-xs opacity-90 max-w-sm">
                      Demonstrating how background, surface, badges, and primary buttons coordinate in your custom theme.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95"
                    style={{ backgroundColor: paletteSwatches[1].hex, color: paletteSwatches[1].contrastText }}
                  >
                    Action Button
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">Accessibility (WCAG 2.1) Verification</span>
              <p>
                Colors are generated according to mathematical color wheel geometries. Contrast recommendations indicate
                estimated legibility against white or black text; verify specific text sizes and font weights against
                WCAG AA (4.5:1) standards before production release.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. CSS GRADIENT GENERATOR */}
      {/* ============================================================== */}
      {activeTab === 'gradient' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Gradient Type</label>
                    <select
                      value={gradientType}
                      onChange={(e) => setGradientType(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    >
                      <option value="linear">Linear Gradient</option>
                      <option value="radial">Radial Gradient</option>
                    </select>
                  </div>

                  {gradientType === 'linear' && (
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Angle</span>
                        <span className="font-mono text-cyan-400 font-bold">{gradientAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={gradientAngle}
                        onChange={(e) => setGradientAngle(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  )}
                </div>

                {/* Color Stops Manager */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-slate-300">Color Stops ({gradientStops.length})</label>
                  {gradientStops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                    >
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => {
                          const copy = [...gradientStops];
                          copy[idx].color = e.target.value;
                          setGradientStops(copy);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={stop.color}
                        onChange={(e) => {
                          const copy = [...gradientStops];
                          copy[idx].color = e.target.value;
                          setGradientStops(copy);
                        }}
                        className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200"
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={stop.position}
                        onChange={(e) => {
                          const copy = [...gradientStops];
                          copy[idx].position = Number(e.target.value);
                          setGradientStops(copy);
                        }}
                        className="flex-1 accent-cyan-400"
                      />
                      <span className="text-xs font-mono text-slate-400 w-10 text-right">{stop.position}%</span>
                      {gradientStops.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setGradientStops(gradientStops.filter((_, i) => i !== idx))}
                          className="text-xs text-red-400 hover:text-red-300 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {gradientStops.length < 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        setGradientStops([
                          ...gradientStops,
                          { color: '#ec4899', position: Math.min(100, gradientStops[gradientStops.length - 1].position + 15) },
                        ])
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 pt-1"
                    >
                      + Add Color Stop
                    </button>
                  )}
                </div>

                {/* Gradient Presets */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Curated Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Aqua Horizon', stops: [{ color: '#06b6d4', position: 0 }, { color: '#3b82f6', position: 100 }] },
                      { name: 'Sunset Glow', stops: [{ color: '#f97316', position: 0 }, { color: '#ec4899', position: 100 }] },
                      { name: 'Neon Cyberpunk', stops: [{ color: '#a855f7', position: 0 }, { color: '#06b6d4', position: 100 }] },
                      { name: 'Emerald Aurora', stops: [{ color: '#10b981', position: 0 }, { color: '#06b6d4', position: 100 }] },
                    ].map((pre) => (
                      <button
                        key={pre.name}
                        type="button"
                        onClick={() => setGradientStops(pre.stops)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800"
                      >
                        {pre.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-3 flex flex-col justify-between">
                <div
                  className="w-full h-64 rounded-2xl border border-slate-800 shadow-inner flex items-center justify-center p-6 text-center text-white"
                  style={{ background: cssGradientString }}
                >
                  <div className="p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 space-y-1">
                    <h4 className="font-bold text-base">Live Canvas Preview</h4>
                    <p className="text-xs opacity-80">Smooth browser rendering simulation</p>
                  </div>
                </div>

                {/* CSS Code box */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 font-mono">background: {cssGradientString};</span>
                    <div className="flex items-center gap-2">
                      <CopyButton textToCopy={`background: ${cssGradientString};`} label="Copy CSS" />
                      <DownloadButton
                        content={`/* AquaTools Gradient */\n.gradient-bg {\n  background: ${cssGradientString};\n}`}
                        fileName="gradient.css"
                        mimeType="text/css"
                        label="Download"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">CSS Compatibility Notice</span>
              <p>
                CSS gradients are universally supported in modern desktop and mobile browsers. For legacy HTML email
                clients, always specify a solid fallback background color prior to the gradient declaration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. CSS BOX SHADOW GENERATOR */}
      {/* ============================================================== */}
      {activeTab === 'shadow' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>X Offset</span>
                      <span className="font-mono text-cyan-400 font-bold">{shadowX}px</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={shadowX}
                      onChange={(e) => setShadowX(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Y Offset</span>
                      <span className="font-mono text-cyan-400 font-bold">{shadowY}px</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={shadowY}
                      onChange={(e) => setShadowY(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Blur Radius</span>
                      <span className="font-mono text-cyan-400 font-bold">{shadowBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={shadowBlur}
                      onChange={(e) => setShadowBlur(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Spread Radius</span>
                      <span className="font-mono text-cyan-400 font-bold">{shadowSpread}px</span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={shadowSpread}
                      onChange={(e) => setShadowSpread(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Shadow Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Opacity</span>
                      <span className="font-mono text-cyan-400 font-bold">{shadowOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={shadowOpacity}
                      onChange={(e) => setShadowOpacity(Number(e.target.value))}
                      className="w-full accent-cyan-400 pt-2"
                    />
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shadowInset}
                      onChange={(e) => setShadowInset(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    <span>Inset Shadow (Inner Shadow)</span>
                  </label>
                </div>

                {/* Elevation Presets */}
                <div className="space-y-1.5 pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Elevation Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Floating Card', x: 0, y: 20, blur: 30, spread: -5, col: '#06b6d4', op: 35, ins: false },
                      { name: 'Subtle Elevation', x: 0, y: 4, blur: 12, spread: 0, col: '#000000', op: 30, ins: false },
                      { name: 'Deep Ambient', x: 0, y: 25, blur: 50, spread: -12, col: '#000000', op: 50, ins: false },
                      { name: 'Neon Glow', x: 0, y: 0, blur: 25, spread: 2, col: '#06b6d4', op: 70, ins: false },
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setShadowX(p.x);
                          setShadowY(p.y);
                          setShadowBlur(p.blur);
                          setShadowSpread(p.spread);
                          setShadowColor(p.col);
                          setShadowOpacity(p.op);
                          setShadowInset(p.ins);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShadowPreviewTheme('dark')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      shadowPreviewTheme === 'dark'
                        ? 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dark Surface
                  </button>
                  <button
                    type="button"
                    onClick={() => setShadowPreviewTheme('light')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      shadowPreviewTheme === 'light'
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Light Surface
                  </button>
                </div>

                <div
                  className={`w-full h-64 rounded-2xl border flex items-center justify-center p-6 transition-colors ${
                    shadowPreviewTheme === 'dark'
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-100 border-slate-300'
                  }`}
                >
                  <div
                    className={`w-44 h-32 rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${
                      shadowPreviewTheme === 'dark'
                        ? 'bg-slate-900 text-slate-100 border border-slate-700/60'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                    style={{
                      boxShadow: `${shadowInset ? 'inset ' : ''}${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${hexToRgba(
                        shadowColor,
                        shadowOpacity
                      )}`,
                    }}
                  >
                    <span className="text-xs font-bold">Interactive Card</span>
                    <span className="text-[10px] opacity-70 font-mono mt-1">
                      {shadowX}px {shadowY}px {shadowBlur}px
                    </span>
                  </div>
                </div>

                {/* CSS Code box */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 font-mono">{cssShadowString}</span>
                    <div className="flex items-center gap-2">
                      <CopyButton textToCopy={cssShadowString} label="Copy CSS" />
                      <DownloadButton
                        content={`/* AquaTools Box Shadow */\n.elevated-card {\n  ${cssShadowString}\n}`}
                        fileName="box-shadow.css"
                        mimeType="text/css"
                        label="Download"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">GPU Rendering Notice</span>
              <p>
                Large blur and spread values create deep elevations but can trigger additional GPU repaints on complex
                mobile layouts. For optimal frame rates, combine moderate blurs with subtle opacity.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
