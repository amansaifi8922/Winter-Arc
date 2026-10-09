import React, { useState } from 'react';
import { db } from '../../lib/database';
import { getKolkataDateString } from '../../lib/timezone';
import { validateEvidenceFile } from '../../lib/validation';
import confetti from 'canvas-confetti';

interface StudyEvidenceModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudyEvidenceModal: React.FC<StudyEvidenceModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const todayIST = getKolkataDateString();
  const todaySeconds = db.getTodayStudyTotalSeconds(userId, todayIST);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateEvidenceFile(file);
      if (!validation.isValid) {
        setErrorMsg(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select or drag a photograph of your completed timer.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const res = await db.submitDailyStudyEvidence(userId, todayIST, selectedFile, todaySeconds);
    setIsUploading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0e1017] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#00E599]/20 text-[#00E599] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Upload Daily Study Evidence</h2>
            <p className="text-xs text-slate-400">Lock today's 180-minute study streak ({todayIST})</p>
          </div>
        </div>

        <div className="space-y-4">
          
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-300">
            <p className="font-semibold text-white mb-1">Requirement:</p>
            <p className="text-slate-400 leading-relaxed">
              Upload a clear photograph showing your study timer having reached at least 180 minutes.
              Photos are stored in private storage and accessible only for review by house coordinators.
            </p>
          </div>

          {/* Upload Drop Area */}
          <div className="border-2 border-dashed border-white/15 hover:border-[#00E599]/50 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-[#090b10]">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            
            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-xl object-contain border border-white/20"
                />
                <p className="text-xs text-[#00E599] font-medium">Click or drag another image to replace</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-white">Click to browse or drag & drop photo</p>
                <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP up to 10MB</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-xs border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading || !selectedFile}
              className="flex-1 py-3 bg-[#00E599] hover:bg-[#00E599]/90 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#00E599]/20"
            >
              {isUploading ? 'Securing Evidence...' : 'Submit Evidence'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
