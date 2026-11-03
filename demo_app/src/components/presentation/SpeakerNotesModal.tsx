import React from 'react';
import { X, Volume2 } from 'lucide-react';

interface SpeakerNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideNumber: number;
  slideTitle: string;
  notes: string[];
}

export const SpeakerNotesModal: React.FC<SpeakerNotesModalProps> = ({
  isOpen,
  onClose,
  slideNumber,
  slideTitle,
  notes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-xl bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl shadow-2xl p-5 text-slate-800 transition-all duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-700">Speaker Notes (Press 'N' to Hide)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">
          Slide {slideNumber}: {slideTitle}
        </h4>
        <div className="space-y-2 text-sm text-slate-700 leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
          {notes.map((paragraph, idx) => (
            <p key={idx} className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">•</span>
              <span>{paragraph}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="mt-3 text-right">
        <span className="text-[11px] text-slate-400 italic">Visible only to you during presentation</span>
      </div>
    </div>
  );
};
