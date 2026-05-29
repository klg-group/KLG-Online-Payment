import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Globe, Palette, Save, Sparkles, Check, CheckCircle2, RotateCcw } from 'lucide-react';

export function AdminBgColorSection() {
  const [bgColor, setBgColor] = useState<string>('#E4E3E0');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load current background color from Firestore on mount
  useEffect(() => {
    const fetchBgColor = async () => {
      try {
        const styleRef = doc(db, 'settings', 'global_styles');
        const snap = await getDoc(styleRef);
        if (snap.exists() && snap.data().bgColor) {
          setBgColor(snap.data().bgColor);
        } else {
          const localBg = localStorage.getItem('klgc_global_bg_color');
          if (localBg) setBgColor(localBg);
        }
      } catch (err) {
        console.warn("Could not fetch remote bg color, using cached:", err);
        const localBg = localStorage.getItem('klgc_global_bg_color');
        if (localBg) setBgColor(localBg);
      }
    };
    fetchBgColor();
  }, []);

  // Update root element background live for immediate review
  const updateStyleLive = (color: string) => {
    setBgColor(color);
    document.documentElement.style.setProperty('--bg', color);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const styleRef = doc(db, 'settings', 'global_styles');
      const snap = await getDoc(styleRef);
      if (snap.exists()) {
        await updateDoc(styleRef, { bgColor });
      } else {
        await setDoc(styleRef, { bgColor, fontSize: 16 });
      }

      localStorage.setItem('klgc_global_bg_color', bgColor);
      setMessage('Global application background color updated and saved!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save style options:", err);
      // Offline fallback
      localStorage.setItem('klgc_global_bg_color', bgColor);
      setMessage('Saved to local storage cache (Offline Mode)');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const presetThemes = [
    { name: 'Classical Gray', hex: '#E4E3E0', text: '#141414', description: 'Original high-contrast KLG neo-classic theme' },
    { name: 'Pure Stark Ice', hex: '#F9F9FB', text: '#141414', description: 'Pure modern extreme contrast interface background' },
    { name: 'Soft Warm Sand', hex: '#F5EBE0', text: '#2B231D', description: 'Cozy and eye-friendly ambient paper style' },
    { name: 'Sage Mint Mist', hex: '#E2ECE9', text: '#13211C', description: 'Calm organic sage mint for terminal charts' },
    { name: 'Lavender Breeze', hex: '#E8E8F4', text: '#1E1E2F', description: 'Soft elegant pastel lavender sky background' },
    { name: 'Golden Chalk', hex: '#FFFBEB', text: '#2C1B02', description: 'Soft radiant golden chalk light setting' },
    { name: 'Cyberpunk Yellow', hex: '#FFE600', text: '#000000', description: 'High-contrast stark industrial cyberpunk yellow' },
    { name: 'Vibrant Orange', hex: '#FF6F59', text: '#111111', description: 'A vibrant retro-future orange accent theme' },
    { name: 'Terminal Charcoal', hex: '#232323', text: '#00FF66', description: 'Immersive low-light system admin dark theme' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center pb-3 border-b border-black mb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black uppercase tracking-tight text-gray-800">Global Background Color Management</h3>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Sets the primary background canvas color of the financial ledger environment</p>
          </div>
          <div className="bg-black text-white px-2 py-1 text-[10px] uppercase font-black font-mono">
            HEX: {bgColor.toUpperCase()}
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-emerald-400 border border-black font-extrabold text-xs text-black uppercase tracking-tight flex items-center gap-2">
            <CheckCircle2 size={14} /> {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Theme selection panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Pre-Designed Color Themes</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presetThemes.map((theme) => {
                  const isSelected = bgColor.toLowerCase() === theme.hex.toLowerCase();
                  return (
                    <button
                      key={theme.hex}
                      onClick={() => updateStyleLive(theme.hex)}
                      className={`text-left p-3 border-2 border-black transition-all flex flex-col justify-between h-24 ${
                        isSelected 
                          ? 'ring-4 ring-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                          : 'hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                      style={{ backgroundColor: theme.hex, color: theme.text }}
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase truncate">{theme.name}</span>
                          {isSelected && <Check size={14} className="stroke-[3]" />}
                        </div>
                        <p className="text-[9px] opacity-80 mt-1 leading-snug truncate-2-lines">{theme.description}</p>
                      </div>
                      <span className="text-[9px] font-mono select-none font-bold block text-right mt-1">{theme.hex.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interactive Color Picker */}
            <div className="p-4 bg-gray-50 border border-black border-dashed space-y-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Custom Dynamic Color Canvas</label>
              
              <div className="flex items-center gap-4">
                <div className="relative border-2 border-black w-14 h-14 overflow-hidden shrink-0">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => updateStyleLive(e.target.value)}
                    className="absolute cursor-pointer border-0 w-20 h-20 -left-2 -top-2"
                  />
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tight">Manual Input Code</p>
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.startsWith('#') && value.length <= 7) {
                        updateStyleLive(value);
                      } else if (value.length <= 6 && !value.startsWith('#')) {
                        updateStyleLive('#' + value);
                      }
                    }}
                    placeholder="#E4E3E0"
                    maxLength={7}
                    className="w-full text-xs p-2 border-2 border-black font-semibold uppercase bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateStyleLive('#E4E3E0')}
                className="px-4 py-3 bg-white text-black font-bold uppercase text-[10px] tracking-wider border-2 border-black hover:bg-gray-50 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={12} /> Reset default
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-black hover:bg-gray-800 text-white font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)]"
              >
                {saving ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <Save size={12} /> Save Canvas Globally
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sizing Interactive Sandbox Preview */}
          <div className="lg:col-span-6 border-2 border-black p-5 flex flex-col justify-between" style={{ backgroundColor: bgColor }}>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-tight text-gray-500 border-b border-black/15 pb-1 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" /> Dynamic Layout Balance Representation
              </h4>
              
              <div className="bg-white border-2 border-black p-4 space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="bg-black text-white text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest font-mono select-none">
                  Sample Widget Card
                </span>
                <p className="text-xs font-black uppercase text-amber-500">
                  KLG Ledger Sandbox Preview
                </p>
                <p className="text-xs text-gray-700 leading-snug">
                  Notice how card layouts, crisp block borders, and elements pop nicely against your custom background color.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                <div className="bg-white p-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-gray-400">Ledger Count</p>
                  <p className="text-sm font-black mt-0.5">14,293</p>
                </div>
                <div className="bg-white p-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-gray-400">Active Node</p>
                  <p className="text-sm font-black mt-0.5 text-green-600">ONLINE</p>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-gray-400 uppercase font-black text-center mt-6 select-none font-mono">
              🔒 Real-time theme canvas synchronization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
