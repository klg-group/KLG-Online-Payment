import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Type, Plus, Minus, RotateCcw, Save, Sparkles, Check, CheckCircle2 } from 'lucide-react';

export function AdminFontSizeSection() {
  const [fontSize, setFontSize] = useState<number>(16);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load current font size from Firestore on mount
  useEffect(() => {
    const fetchFontSize = async () => {
      try {
        const styleRef = doc(db, 'settings', 'global_styles');
        const snap = await getDoc(styleRef);
        if (snap.exists() && snap.data().fontSize) {
          setFontSize(snap.data().fontSize);
        } else {
          const localSize = localStorage.getItem('klgc_global_font_size');
          if (localSize) setFontSize(parseInt(localSize));
        }
      } catch (err) {
        console.warn("Could not fetch remote font size, using cached:", err);
        const localSize = localStorage.getItem('klgc_global_font_size');
        if (localSize) setFontSize(parseInt(localSize));
      }
    };
    fetchFontSize();
  }, []);

  // Update root element size live for immediate review
  const updateStyleLive = (size: number) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const styleRef = doc(db, 'settings', 'global_styles');
      const snap = await getDoc(styleRef);
      if (snap.exists()) {
        await updateDoc(styleRef, { fontSize });
      } else {
        await setDoc(styleRef, { fontSize, bgColor: '#E4E3E0' });
      }

      localStorage.setItem('klgc_global_font_size', fontSize.toString());
      setMessage('Global application text size updated and saved!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save style options:", err);
      // Offline fallback
      localStorage.setItem('klgc_global_font_size', fontSize.toString());
      setMessage('Saved to local storage cache (Offline Mode)');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const presets = [
    { label: 'Compact / Small', value: 14, desc: 'Optimized high-density data sheets' },
    { label: 'System Normal', value: 16, desc: 'Standard balanced human layout' },
    { label: 'Large Reader', value: 18, desc: 'Increased visual readability and ergonomics' },
    { label: 'Extra Large', value: 20, desc: 'Ultra text highlights and zoom layers' },
    { label: 'Double Big Scale', value: 24, desc: 'Demonstration and high visibility presentation font size' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center pb-3 border-b border-black mb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black uppercase tracking-tight text-gray-800">Global Font Size & Legibility Management</h3>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Scales application typography dynamically using root relative measurement values</p>
          </div>
          <div className="bg-black text-white px-2 py-1 text-[10px] uppercase font-black font-mono">
            CURRENT: {fontSize}PX
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-emerald-400 border border-black font-extrabold text-xs text-black uppercase tracking-tight flex items-center gap-2">
            <CheckCircle2 size={14} /> {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Fine-Tune Size Slider</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateStyleLive(Math.max(12, fontSize - 1))}
                  className="p-3 bg-white border-2 border-black font-bold hover:bg-gray-100 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 duration-100"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="range"
                  min="12"
                  max="28"
                  value={fontSize}
                  onChange={(e) => updateStyleLive(parseInt(e.target.value))}
                  className="flex-1 accent-black h-2 bg-gray-200 cursor-pointer"
                />
                <button
                  onClick={() => updateStyleLive(Math.min(28, fontSize + 1))}
                  className="p-3 bg-white border-2 border-black font-bold hover:bg-gray-100 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 duration-100"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Standard Typography Presets</label>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateStyleLive(preset.value)}
                    className={`w-full text-left p-3 border-2 border-black transition-all flex justify-between items-center ${
                      fontSize === preset.value
                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-black hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black uppercase">{preset.label}</p>
                      <p className={`text-[9px] ${fontSize === preset.value ? 'text-gray-300' : 'text-gray-400'}`}>{preset.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{preset.value}px</span>
                      {fontSize === preset.value && <Check size={14} className="text-emerald-400 font-bold" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => updateStyleLive(16)}
                className="px-4 py-3 bg-white text-black font-bold uppercase text-[10px] tracking-wider border-2 border-black hover:bg-gray-50 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={12} /> Reset to 16px
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
                    Saving Sizing...
                  </>
                ) : (
                  <>
                    <Save size={12} /> Save Dynamic Font Sizing
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sizing Interactive Sandbox Preview */}
          <div className="lg:col-span-7 bg-[#F4F3F0] p-5 border-2 border-black select-none space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-tight text-gray-500 border-b border-black/15 pb-1 flex items-center gap-1.5 mb-2">
              <Sparkles size={12} className="text-amber-500" /> Human Accessibility Sizing Sandbox Live View
            </h4>
            
            <div className="bg-white border-2 border-black p-4 space-y-3">
              <h1 className="text-xl font-black text-black tracking-tight leading-none">
                Large Display Heading Representation
              </h1>
              <p className="text-xs text-gray-550 italic uppercase font-bold tracking-wider">
                System Metadata Status: System Operational
              </p>
              <p className="text-sm leading-relaxed text-gray-800">
                This sandbox demonstrates how elements dynamically balance spacing, line heights, and borders inside KLG modules when you modify font properties.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button className="bg-black text-white text-[10px] font-black uppercase tracking-wide px-3 py-1.5 border border-black">
                  Primary Button Model
                </button>
                <button className="bg-white text-black text-[10px] font-black uppercase tracking-wide px-3 py-1.5 border border-black">
                  Secondary Control
                </button>
              </div>
            </div>

            {/* Sample Table Preview */}
            <div className="bg-white border border-black p-3 space-y-2">
              <div className="flex justify-between items-center bg-gray-100 p-2 font-semibold text-xs border border-black flex-wrap">
                <span className="uppercase text-[9px] font-black text-gray-400">Ledger Identifier</span>
                <span className="font-mono text-[10px] font-bold text-emerald-600">+$2,412.00 USD</span>
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-bold text-center">
                ✔ Sandbox synchronized to your override text scales
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
