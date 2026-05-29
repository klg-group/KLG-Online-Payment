import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AdConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Sparkles } from 'lucide-react';

export function AdsRenderer({ position }: { position: 'fixed_top' | 'fixed_bottom' | 'popup' | 'sliding' }) {
  const [ad, setAd] = useState<AdConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'ads_config'),
      where('type', '==', position),
      where('isActive', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // Return first matching active ad
        setAd(snap.docs[0].data() as AdConfig);
      } else {
        setAd(null);
      }
    }, () => {
      // Local storage fallback for offline/development simplicity
      const localAd = localStorage.getItem(`klgc_local_ad_${position}`);
      if (localAd) {
        try {
          setAd(JSON.parse(localAd));
        } catch (_) {}
      }
    });

    return () => unsub();
  }, [position]);

  if (!ad || dismissed) return null;

  const renderContent = () => {
    const isImage = ad.imageUrl && ad.imageUrl.trim().length > 0;
    return (
      <div className="relative group flex items-center justify-between w-full h-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-amber-400 border border-black text-black px-2 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Sparkles size={8} /> SPONSORED
          </div>
          {isImage ? (
            <a 
              href={ad.linkUrl || '#'} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 overflow-hidden min-w-0"
            >
              <img 
                src={ad.imageUrl} 
                alt="Ad Banner" 
                className="h-10 object-cover border border-black rounded"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold underline truncate text-gray-800 break-all">{ad.content}</span>
            </a>
          ) : (
            <div className="text-xs font-bold truncate text-gray-900 pr-2">
              {ad.content}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {ad.linkUrl && (
            <a 
              href={ad.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-1.5 hover:bg-black/10 border border-transparent rounded transition-all text-gray-700"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button 
            type="button" 
            onClick={() => setDismissed(true)} 
            className="p-1 text-gray-700 hover:text-black hover:rotate-90 transition-transform"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (position === 'fixed_top') {
    return (
      <div className="w-full bg-amber-50 border-b border-black py-2 px-4 h-12 flex items-center shadow-[inset_0_-1px_0_0_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (position === 'fixed_bottom') {
    return (
      <div className="w-full bg-amber-50 border-t border-black py-2 px-4 h-12 flex items-center shadow-[inset_0_1px_0_0_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (position === 'popup') {
    return (
      <AnimatePresence>
        {!dismissed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-2 border-black p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative"
            >
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <span className="bg-amber-400 border border-black text-black px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">AD</span>
                <button 
                  type="button" 
                  onClick={() => setDismissed(true)} 
                  className="p-1 hover:bg-gray-100 border border-black rounded transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {ad.imageUrl && (
                  <div className="border border-black overflow-hidden h-40 bg-gray-100 flex items-center justify-center">
                    <img 
                      src={ad.imageUrl} 
                      alt="Promotional Banner" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-black uppercase text-gray-900 tracking-tight leading-snug">{ad.content}</p>
                </div>
                {ad.linkUrl && (
                  <a 
                    href={ad.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-black hover:bg-gray-800 text-white border border-black font-bold uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Learn More <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  if (position === 'sliding') {
    const isLtr = ad.slidingDirection === 'left-to-right';
    const initX = isLtr ? -350 : 350;
    
    return (
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ x: initX, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: initX, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className={`fixed bottom-16 ${isLtr ? 'left-4' : 'right-4'} z-45 max-w-xs w-72 bg-amber-50 border-2 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="bg-amber-400 border border-black text-black px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={8} /> SPECIAL AD
              </span>
              <button 
                type="button" 
                onClick={() => setDismissed(true)} 
                className="p-1 text-gray-700 hover:text-black border border-black rounded bg-white hover:rotate-90 transition-transform"
              >
                <X size={12} />
              </button>
            </div>
            
            <div className="space-y-3">
              {ad.imageUrl && (
                <div className="border border-black overflow-hidden h-24">
                  <img 
                    src={ad.imageUrl} 
                    alt="Slider Sponsor" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <p className="text-[11px] font-black leading-tight text-gray-800">{ad.content}</p>
              {ad.linkUrl && (
                <a 
                  href={ad.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center py-1.5 bg-white hover:bg-gray-100 border border-black font-bold uppercase text-[9px] tracking-wider transition-all"
                >
                  Visit Website ⚡
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
}
