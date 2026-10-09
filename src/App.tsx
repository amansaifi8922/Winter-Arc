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
  const [currentView, setCurrentView] = useState<string>(currentUser ? 'dashboard' : 'landing');
  
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
      setCurrentUser(user);
      if (user && user.username === null) {
        setIsUsernameSetupOpen(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const reminders = currentUser ? db.getRemindersForUser(currentUser.id) : [];

  const handleLoginSuccess = (isFirstTime: boolean) => {
    if (isFirstTime) {
      setIsUsernameSetupOpen(true);
    } else {
      setCurrentView('dashboard');
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
              onOpenLogin={() => setIsLoginOpen(true)}
              onViewLeaderboard={() => setCurrentView('leaderboard')}
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
