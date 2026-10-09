import React, { useState, useEffect } from 'react';
import { db } from './lib/database';
import { UserProfile, WeeklyMission } from './types';
import { Navbar } from './components/common/Navbar';
import { ReminderBanner } from './components/common/ReminderBanner';
import { LandingPage } from './components/views/LandingPage';
import { StudentDashboard } from './components/views/StudentDashboard';
import { WorkoutTrackerView } from './components/views/WorkoutTrackerView';
import { WeeklyMissionsView } from './components/views/WeeklyMissionsView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { LoginModal } from './components/auth/LoginModal';
import { UsernameSetupModal } from './components/auth/UsernameSetupModal';
import { StudyEvidenceModal } from './components/modals/StudyEvidenceModal';
import { WorkoutModal } from './components/modals/WorkoutModal';
import { MissionModal } from './components/modals/MissionModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(db.getCurrentUser());
  const [currentView, setCurrentView] = useState<string>(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'dashboard') : 'landing');
  const [authError, setAuthError] = useState<string | null>(db.getAuthError());
  
  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUsernameSetupOpen, setIsUsernameSetupOpen] = useState(false);
  const [isStudyEvidenceModalOpen, setIsStudyEvidenceModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedMissionForModal, setSelectedMissionForModal] = useState<WeeklyMission | null>(null);

  // Subscribe to database changes
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      const user = db.getCurrentUser();
      const err = db.getAuthError();
      setCurrentUser(user);
      setAuthError(err);

      if (user) {
        // Clean URL hash/query once user session is successfully verified
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        if (user.username === null) {
          setIsUsernameSetupOpen(true);
        } else {
          // If user logs in while on landing, automatically direct to their view
          setCurrentView((prev) => (prev === 'landing' ? (user.role === 'admin' ? 'admin' : 'dashboard') : prev));
        }
      } else {
        // If logged out
        setCurrentView((prev) => (prev !== 'leaderboard' ? 'landing' : 'leaderboard'));
      }
    });

    return () => unsubscribe();
  }, []);

  // Check on initial mount if user is already authenticated
  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      if (user.username === null) {
        setIsUsernameSetupOpen(true);
      } else {
        setCurrentView(user.role === 'admin' ? 'admin' : 'dashboard');
      }
    }
  }, []);

  const reminders = currentUser ? db.getRemindersForUser(currentUser.id) : [];

  const handleLoginSuccess = (isFirstTime: boolean) => {
    if (isFirstTime) {
      setIsUsernameSetupOpen(true);
    } else {
      const user = db.getCurrentUser();
      setCurrentView(user?.role === 'admin' ? 'admin' : 'dashboard');
    }
  };

  const handleReminderAction = (actionUrl: string) => {
    if (actionUrl === '#timer') {
      setCurrentView('dashboard');
      const el = document.getElementById('timer');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (actionUrl === '#study-evidence') {
      setIsStudyEvidenceModalOpen(true);
    } else if (actionUrl === '#workouts') {
      setCurrentView('workouts');
    } else if (actionUrl === '#missions') {
      setCurrentView('missions');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 flex flex-col justify-between selection:bg-[#00E599] selection:text-black">
      
      {/* Background radial glow ambience */}
      <div className="fixed inset-0 pointer-events-none arc-grid-bg opacity-30 z-0"></div>

      <div className="relative z-10 flex-1">
        
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        {/* Institutional Domain Access Error Alert */}
        {authError && (
          <div className="max-w-2xl mx-auto px-4 mb-4">
            <div className="bg-rose-950/80 border border-rose-500/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-rose-200 text-sm">Institutional Email Required</p>
                <p className="text-rose-300/90 mt-1 leading-relaxed">{authError}</p>
                <p className="text-slate-400 mt-2 font-mono text-[11px]">
                  Please sign in using your official IIT Madras BS student Google account (e.g., ending with @study.iitm.ac.in, @ds.study.iitm.ac.in, or @es.study.iitm.ac.in).
                </p>
              </div>
              <button 
                onClick={() => {
                  setAuthError(null);
                  db.clearAuthError();
                }} 
                className="text-rose-400 hover:text-white p-1 rounded-lg hover:bg-rose-900/50 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* In-Website Non-Intrusive Reminders */}
        {currentUser && currentView === 'dashboard' && (
          <ReminderBanner
            reminders={reminders}
            onAction={handleReminderAction}
          />
        )}

        {/* Main Content Router */}
        <main className="mt-2">
          {currentView === 'landing' && (
            <LandingPage
              currentUser={currentUser}
              onOpenLogin={() => setIsLoginOpen(true)}
              onViewLeaderboard={() => setCurrentView('leaderboard')}
              onGoToDashboard={() => setCurrentView(currentUser?.role === 'admin' ? 'admin' : 'dashboard')}
            />
          )}

          {currentView === 'dashboard' && currentUser && (
            <StudentDashboard
              user={currentUser}
              onNavigate={(view) => setCurrentView(view)}
              onOpenStudyEvidenceModal={() => setIsStudyEvidenceModalOpen(true)}
              onOpenWorkoutModal={() => setIsWorkoutModalOpen(true)}
              onOpenMissionModal={(mission) => setSelectedMissionForModal(mission)}
            />
          )}

          {currentView === 'workouts' && currentUser && (
            <WorkoutTrackerView
              user={currentUser}
              onOpenWorkoutModal={() => setIsWorkoutModalOpen(true)}
            />
          )}

          {currentView === 'missions' && currentUser && (
            <WeeklyMissionsView
              user={currentUser}
              onOpenMissionModal={(mission) => setSelectedMissionForModal(mission)}
            />
          )}

          {currentView === 'leaderboard' && (
            <LeaderboardView />
          )}

          {currentView === 'admin' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'coordinator') && (
            <AdminDashboardView actor={currentUser} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {currentUser && (
        <UsernameSetupModal
          user={currentUser}
          isOpen={isUsernameSetupOpen}
          onSuccess={() => {
            setIsUsernameSetupOpen(false);
            setCurrentView('dashboard');
          }}
        />
      )}

      {currentUser && (
        <StudyEvidenceModal
          userId={currentUser.id}
          isOpen={isStudyEvidenceModalOpen}
          onClose={() => setIsStudyEvidenceModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {currentUser && (
        <WorkoutModal
          userId={currentUser.id}
          isOpen={isWorkoutModalOpen}
          onClose={() => setIsWorkoutModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {currentUser && selectedMissionForModal && (
        <MissionModal
          userId={currentUser.id}
          mission={selectedMissionForModal}
          isOpen={Boolean(selectedMissionForModal)}
          onClose={() => setSelectedMissionForModal(null)}
          onSuccess={() => {}}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">Winter Arc – Namdapha</span>
            <span>•</span>
            <span>IIT Madras BS Degree Programme</span>
          </div>
          <div>
            <span>October 10 – December 31, 2026 (Asia/Kolkata)</span>
          </div>
          <div className="text-slate-400">
            <span>Non-punitive • Community Discipline • Integrity</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
