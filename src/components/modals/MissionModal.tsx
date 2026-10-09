import React, { useState } from 'react';
import { db } from '../../lib/database';
import { WeeklyMission } from '../../types';
import { validateEvidenceFile } from '../../lib/validation';
import confetti from 'canvas-confetti';

interface MissionModalProps {
  userId: string;
  mission: WeeklyMission;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  userId,
  mission,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [studentNotes, setStudentNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
      setErrorMsg('Please upload a photo satisfying the mission completion criteria.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await db.submitMissionEvidence(userId, mission.id, selectedFile, studentNotes);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch {}
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0e1017] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        
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
          <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{mission.title}</h2>
            <p className="text-xs text-slate-400">Week {mission.week_number} • Worth {mission.point_value} Points</p>
          </div>
        </div>

        <div className="space-y-4">
          
          <div className="p-3.5 bg-[#090b10] rounded-2xl border border-white/5 space-y-2 text-xs">
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-500">Instructions</p>
              <p className="text-slate-300 whitespace-pre-line mt-0.5">{mission.instructions}</p>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] font-mono uppercase text-slate-500">Criteria</p>
              <p className="text-slate-300 mt-0.5">{mission.criteria}</p>
            </div>
          </div>

          {/* Student reflection notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reflection / Execution Notes
            </label>
            <textarea
              rows={3}
              placeholder="Describe how you completed this mission and what habits were fortified..."
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              className="w-full bg-[#151821] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]/60"
            />
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mission Evidence Photograph (Required)
            </label>
            <div className="border-2 border-dashed border-white/15 hover:border-[#38BDF8]/50 rounded-2xl p-4 text-center cursor-pointer transition-colors relative bg-[#090b10]">
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
                    className="max-h-36 mx-auto rounded-xl object-contain border border-white/20"
                  />
                  <p className="text-[11px] text-[#38BDF8]">Click to change photo</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-white">Upload proof image</p>
                  <p className="text-[10px] text-slate-500">JPEG, PNG, or WEBP up to 10MB</p>
                </div>
              )}
            </div>
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
              disabled={isSubmitting || !selectedFile}
              className="flex-1 py-3 bg-[#38BDF8] hover:bg-[#38BDF8]/90 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#38BDF8]/20"
            >
              {isSubmitting ? 'Uploading Proof...' : 'Complete Mission (+20 pts)'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
