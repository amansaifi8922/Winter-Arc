import React, { useState } from 'react';
import { db } from '../../lib/database';
import { getKolkataDateString } from '../../lib/timezone';
import { validateEvidenceFile } from '../../lib/validation';
import confetti from 'canvas-confetti';

interface WorkoutModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WORKOUT_TYPES = [
  'Gym / Weight Training',
  'Running / Jogging',
  'Calisthenics / Bodyweight',
  'Sports (Badminton, Football, Cricket, etc.)',
  'Cycling',
  'Yoga & Mobility',
  'Swimming',
  'Home HIIT / Functional',
];

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const todayIST = getKolkataDateString();

  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0]);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [workoutDate, setWorkoutDate] = useState(todayIST);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      setErrorMsg('A photograph as evidence of your workout is required.');
      return;
    }

    if (durationMinutes < 10 || durationMinutes > 360) {
      setErrorMsg('Workout duration must be between 10 and 360 minutes.');
      return;
    }

    if (workoutDate > todayIST) {
      setErrorMsg('Cannot log workouts for future dates.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await db.logWorkout(
      userId,
      workoutType,
      durationMinutes,
      workoutDate,
      selectedFile,
      notes
    );
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
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
          <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/20 text-[#FF6B35] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Log Workout Entry</h2>
            <p className="text-xs text-slate-400">Weekly Target: 3 Workouts • +5 Points</p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Workout Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Discipline / Activity Type
            </label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              className="w-full bg-[#151821] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6B35]/60"
            >
              {WORKOUT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Duration & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="10"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#151821] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF6B35]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date (Asia/Kolkata)
              </label>
              <input
                type="date"
                max={todayIST}
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="w-full bg-[#151821] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF6B35]/60"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Session Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 5 km interval run, leg day, heavy squats"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#151821] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6B35]/60"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Workout Photo Evidence (Required)
            </label>
            <div className="border-2 border-dashed border-white/15 hover:border-[#FF6B35]/50 rounded-2xl p-4 text-center cursor-pointer transition-colors relative bg-[#090b10]">
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
                  <p className="text-[11px] text-[#FF6B35]">Click to change photo</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-white">Upload gym selfie, track GPS, or gear</p>
                  <p className="text-[10px] text-slate-500">Private storage for coordinator verification</p>
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
              className="flex-1 py-3 bg-[#FF6B35] hover:bg-[#FF6B35]/90 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#FF6B35]/20"
            >
              {isSubmitting ? 'Recording Workout...' : 'Record Workout'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
