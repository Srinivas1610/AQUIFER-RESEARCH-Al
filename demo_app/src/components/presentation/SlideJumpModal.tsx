import React from 'react';
import { X, Grid } from 'lucide-react';

interface SlideJumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: { id: number; title: string; category: string }[];
  currentSlide: number;
  onSelectSlide: (index: number) => void;
}

export const SlideJumpModal: React.FC<SlideJumpModalProps> = ({
  isOpen,
  onClose,
  slides,
  currentSlide,
  onSelectSlide,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-blue-700" />
            <h3 className="text-lg font-bold text-slate-900">Jump to Slide (Press 'G' or Click)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {slides.map((s, idx) => {
            const isCurrent = idx === currentSlide;
            return (
              <button
                key={s.id}
                onClick={() => {
                  onSelectSlide(idx);
                  onClose();
                }}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-500 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-blue-700">
                    Slide {s.id}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    {s.category}
                  </span>
                </div>
                <div className="font-semibold text-sm line-clamp-2 mt-1">
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
          <span>Use arrow keys to browse during presentation</span>
          <span>Press ESC or G to close</span>
        </div>
      </div>
    </div>
  );
};
