import { useState, useMemo, useRef, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Skeleton from './components/Skeleton';
import Sidebar from './components/Sidebar';
import LessonView from './components/LessonView';
import BeyondRepo from './components/BeyondRepo';
import ShortcutsModal from './components/ShortcutsModal';
import AuthModal from './components/AuthModal';
import AdminDashboard from './pages/AdminDashboard';
import BillingModal from './components/BillingModal';
import AppBuilder from './pages/AppBuilder';
import OnboardingTour from './components/OnboardingTour';
import { LESSONS, ACHIEVEMENTS } from './data/lessons';
import { usePersistentProgress } from './hooks/usePersistentProgress';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSwipe } from './hooks/useSwipe';
import { bumpStreak } from './utils/streak';
import { exportProgress, importProgress } from './services/storage';
import { isLoggedIn, logout, getStoredUser } from './services/authService';
import { trackEvent } from './services/analytics';
import { recommendNext } from './utils/recommend';
import { generateCertificate, downloadCertificate } from './utils/certificate';

const ORDERED_IDS = LESSONS.map((l) => l.id);

function LearningApp() {
  const { loaded, dark, done, bookmarked, notes, fontSize, streak, lastLessonId, hasSeenOnboarding, update, saveError, reload } = usePersistentProgress();
  const [activeId, setActiveId] = useState(lastLessonId || LESSONS[0].id);
  const [query, setQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('all'); // 'all' | 'android' | 'backend'
  const [showAuth, setShowAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showAppBuilder, setShowAppBuilder] = useState(false);
  const [showBeyond, setShowBeyond] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const searchRef = useRef(null);
  const fileInputRef = useRef(null);

  // Bump the streak once per day, the first time the app finishes loading.
  const streakBumped = useRef(false);
  if (loaded && !streakBumped.current) {
    streakBumped.current = true;
    const next = bumpStreak(streak);
    if (next !== streak) update({ streak: next });
  }

  const filtered = useMemo(() => {
    let list = LESSONS;
    if (trackFilter !== 'all') list = list.filter((l) => l.track === trackFilter);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((l) => {
      const haystack = [
        l.title, l.objective,
        ...(l.body?.map((b) => `${b.h} ${b.p}`) ?? []),
        l.code?.text ?? '', l.quiz?.q ?? '', ...(l.lineNotes ?? []),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, trackFilter]);

  const active = LESSONS.find((l) => l.id === activeId);
  const progress = Math.round((Object.keys(done).length / LESSONS.length) * 100);
  const earnedBadges = ACHIEVEMENTS.filter((a) => a.test(done));
  const recommended = useMemo(() => recommendNext(LESSONS, done, activeId), [done, activeId]);

  // Fire a lesson_view analytics event whenever the active lesson changes.
  const lastTracked = useRef(null);
  if (active && lastTracked.current !== active.id) {
    lastTracked.current = active.id;
    trackEvent('lesson_view', active.id);
  }

  const goRelative = useCallback((delta) => {
    const idx = ORDERED_IDS.indexOf(activeId);
    const next = Math.min(Math.max(idx + delta, 0), ORDERED_IDS.length - 1);
    setActiveId(ORDERED_IDS[next]);
    update({ lastLessonId: ORDERED_IDS[next] });
  }, [activeId, update]);

  const swipeHandlers = useSwipe({ onSwipeLeft: () => goRelative(1), onSwipeRight: () => goRelative(-1) });

  useKeyboardShortcuts({
    onSearch: () => searchRef.current?.focus(),
    onEscape: () => { setShowShortcuts(false); setShowBeyond(false); },
    onToggleDark: () => update({ dark: !dark }),
    onToggleReading: () => setReadingMode((r) => !r),
    onShowHelp: () => setShowShortcuts((s) => !s),
    onNext: () => !showBeyond && goRelative(1),
    onPrev: () => !showBeyond && goRelative(-1),
  });

  const handleSelect = (id) => { setActiveId(id); update({ lastLessonId: id }); };
  const handleAuthed = (user) => { setLoggedIn(true); setCurrentUser(user); setShowAuth(false); reload(); };
  const handleLogout = () => { logout(); setLoggedIn(false); setCurrentUser(null); reload(); };
  const handleDownloadCertificate = () => {
    const dataUrl = generateCertificate({
      name: 'Learner', // no name field is collected yet; using account name is a natural follow-up once logged in
      completedCount: Object.keys(done).length,
      totalCount: LESSONS.length,
      date: new Date().toLocaleDateString(),
    });
    downloadCertificate(dataUrl, 'app-making-book-certificate.png');
    trackEvent('lesson_complete', undefined, { certificate: true });
  };
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await importProgress(file);
      update(parsed);
    } catch {
      // Invalid file — silently ignore rather than crash the app.
    }
    e.target.value = '';
  };

  if (!loaded) return <Skeleton />;

  return (
    <div data-theme={dark ? 'dark' : 'light'}>
      {!hasSeenOnboarding && <OnboardingTour onDismiss={() => update({ hasSeenOnboarding: true })} />}
      <a href="#lesson-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded">
        Skip to lesson content
      </a>
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans flex flex-col md:flex-row">
        <Sidebar
          lessons={LESSONS}
          filtered={filtered}
          activeId={activeId}
          onSelect={handleSelect}
          done={done}
          bookmarked={bookmarked}
          notes={notes}
          query={query}
          onQueryChange={setQuery}
          trackFilter={trackFilter}
          onTrackFilter={setTrackFilter}
          searchRef={searchRef}
          progress={progress}
          earnedBadges={earnedBadges}
          streak={streak}
          fontSize={fontSize}
          onFontSize={(size) => update({ fontSize: size })}
          readingMode={readingMode}
          onToggleReading={() => setReadingMode((r) => !r)}
          dark={dark}
          onToggleDark={() => update({ dark: !dark })}
          onShowShortcuts={() => setShowShortcuts(true)}
          onShowBeyond={() => setShowBeyond(true)}
          onExport={() => exportProgress({ done, bookmarked, notes, streak })}
          onImport={handleImport}
          fileInputRef={fileInputRef}
          saveError={saveError}
          loggedIn={loggedIn}
          onShowAuth={() => setShowAuth(true)}
          onLogout={handleLogout}
          onDownloadCertificate={handleDownloadCertificate}
          isAdmin={!!currentUser?.isAdmin}
          onShowAdminDashboard={() => setShowAdminDashboard(true)}
          onShowBilling={() => setShowBilling(true)}
          onShowAppBuilder={() => setShowAppBuilder(true)}
        />

        <main id="lesson-main" className="flex-1 overflow-y-auto" role="main" {...swipeHandlers}>
          {showBeyond ? (
            <BeyondRepo onBack={() => setShowBeyond(false)} />
          ) : active ? (
            <LessonView
              lesson={active}
              isFirst={ORDERED_IDS.indexOf(active.id) === 0}
              isLast={ORDERED_IDS.indexOf(active.id) === ORDERED_IDS.length - 1}
              onPrev={() => goRelative(-1)}
              onNext={() => goRelative(1)}
              bookmarked={!!bookmarked[active.id]}
              onToggleBookmark={() => update({ bookmarked: { ...bookmarked, [active.id]: !bookmarked[active.id] } })}
              notes={notes[active.id]}
              onNoteChange={(text) => update({ notes: { ...notes, [active.id]: text } })}
              done={!!done[active.id]}
              onMarkDone={() => { update({ done: { ...done, [active.id]: true } }); trackEvent('lesson_complete', active.id); }}
              fontSize={fontSize}
              readingMode={readingMode}
              onExitReading={() => setReadingMode(false)}
              recommended={recommended}
              onSelectRecommended={handleSelect}
            />
          ) : (
            <div className="p-10 text-sm text-[var(--text-muted)]">No lessons match your search.</div>
          )}
        </main>
      </div>

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={handleAuthed} />}
      {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}
      {showBilling && <BillingModal isPremium={!!currentUser?.isPremium} onClose={() => setShowBilling(false)} />}
      {showAppBuilder && <AppBuilder onClose={() => setShowAppBuilder(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LearningApp />
    </ErrorBoundary>
  );
}
