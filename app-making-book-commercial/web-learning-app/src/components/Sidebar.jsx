import { useTranslation } from 'react-i18next';
import {
  Search, Sun, Moon, CheckCircle2, Circle, BookmarkCheck, StickyNote,
  Info, Trophy, Flame, Type, Focus, Keyboard, Download, Upload,
  Cloud, CloudOff, LogIn, LogOut, ShieldAlert, CreditCard, Sparkles,
} from 'lucide-react';
import { TRACK } from '../data/tracks';

const FONT_SIZES = ['sm', 'base', 'lg'];

export default function Sidebar({
  lessons, filtered, activeId, onSelect, done, bookmarked, notes,
  query, onQueryChange, trackFilter, onTrackFilter, searchRef, progress, earnedBadges, streak,
  fontSize, onFontSize, readingMode, onToggleReading, dark, onToggleDark,
  onShowShortcuts, onShowBeyond, onExport, onImport, fileInputRef, saveError,
  loggedIn, onShowAuth, onLogout, onDownloadCertificate, isAdmin, onShowAdminDashboard, onShowBilling, onShowAppBuilder,
}) {
  const { t, i18n } = useTranslation();
  return (
    <aside className={`w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--bg-panel)] flex-col ${readingMode ? 'hidden' : 'flex'}`}>
      <div className="p-4 border-b border-[var(--border)] flex items-start justify-between gap-2">
        <div>
          <h1 className="font-mono text-sm font-semibold tracking-tight text-[var(--text-primary)]">app-making-book</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Learn the actual repo, file by file</p>
        </div>
        {streak.count > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-amber-300 flex-shrink-0 pt-0.5" title="Daily streak">
            <Flame size={12} /> {streak.count}
          </span>
        )}
      </div>

      <div className="p-3">
        <label htmlFor="lesson-search" className="sr-only">Search lessons</label>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[var(--text-muted)]" aria-hidden="true" />
          <input
            id="lesson-search"
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-md pl-8 pr-3 py-1.5 text-xs placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60"
          />
        </div>
        <div className="flex gap-1 mt-2" role="group" aria-label="Filter by track">
          {['all', 'android', 'backend'].map((t) => (
            <button
              key={t}
              onClick={() => onTrackFilter(t)}
              aria-pressed={trackFilter === t}
              className={`px-2 py-0.5 rounded text-[10px] capitalize border ${trackFilter === t ? 'border-white/40 text-[var(--text-primary)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mb-1">
          <span>Progress</span><span>{progress}%</span>
        </div>
        <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[#8B7FD6] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {earnedBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {earnedBadges.map((b) => (
              <span key={b.id} title={b.label} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                <Trophy size={9} /> {b.label}
              </span>
            ))}
          </div>
        )}
        {progress === 100 && onDownloadCertificate && (
          <button
            onClick={onDownloadCertificate}
            className="w-full mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-black bg-amber-400 rounded-md py-1.5 hover:bg-amber-300"
          >
            <Trophy size={12} /> Download certificate
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-4" aria-label="Lessons">
        {['android', 'backend'].map((trackKey) => {
          const t = TRACK[trackKey];
          const items = filtered.filter((l) => l.track === trackKey);
          if (items.length === 0) return null;
          return (
            <div key={trackKey}>
              <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: t.accent }}>
                {t.name}
              </div>
              {items.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onSelect(l.id)}
                  aria-current={activeId === l.id ? 'true' : undefined}
                  className={`w-full text-left px-2 py-2 rounded-md text-xs flex items-center gap-2 mb-0.5 transition focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60 ${activeId === l.id ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-input)]'}`}
                >
                  {done[l.id] ? (
                    <CheckCircle2 size={13} style={{ color: t.accent }} className="flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle size={13} className="text-[var(--text-muted)] flex-shrink-0" aria-hidden="true" />
                  )}
                  <span className="flex-1 text-[var(--text-primary)]">{l.title}</span>
                  {bookmarked[l.id] && <BookmarkCheck size={12} style={{ color: t.accent }} aria-hidden="true" />}
                  {notes[l.id]?.trim() && <StickyNote size={11} className="text-[var(--text-muted)]" aria-hidden="true" />}
                </button>
              ))}
            </div>
          );
        })}

        <button
          onClick={onShowBeyond}
          className="w-full text-left px-2 py-2 rounded-md text-xs flex items-center gap-2 text-[var(--text-muted)] hover:bg-[var(--bg-input)] mt-2 border-t border-[var(--border)] pt-3 focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60"
        >
          <Info size={13} aria-hidden="true" /> {t("topics_not_in_repo")}
        </button>
        {loggedIn && (
          <button
            onClick={onShowAppBuilder}
            className="w-full text-left px-2 py-2 rounded-md text-xs flex items-center gap-2 text-[#8B7FD6] hover:bg-[var(--bg-input)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60"
          >
            <Sparkles size={13} aria-hidden="true" /> App Builder
          </button>
        )}
        {isAdmin && (
          <button
            onClick={onShowAdminDashboard}
            className="w-full text-left px-2 py-2 rounded-md text-xs flex items-center gap-2 text-amber-400 hover:bg-[var(--bg-input)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60"
          >
            <ShieldAlert size={13} aria-hidden="true" /> Admin Dashboard
          </button>
        )}
      </nav>

      <div className="p-3 border-t border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1" role="group" aria-label="Font size">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onFontSize(size)}
                aria-pressed={fontSize === size}
                className={`px-1.5 py-1 rounded text-[10px] font-mono border ${fontSize === size ? 'border-white/40 text-[var(--text-primary)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
              >
                <Type size={size === 'sm' ? 10 : size === 'base' ? 12 : 14} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={onToggleReading} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60" aria-pressed={readingMode} aria-label="Toggle distraction-free reading mode" title="Reading mode (R)">
              <Focus size={14} className={readingMode ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'} />
            </button>
            <button onClick={onShowShortcuts} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60" aria-label="Show keyboard shortcuts" title="Keyboard shortcuts (?)">
              <Keyboard size={14} className="text-[var(--text-muted)]" />
            </button>
            <button onClick={onToggleDark} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60" aria-label={dark ? 'Switch to light reading mode' : 'Switch to dark reading mode'} title="Toggle theme (D)">
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'sw' : 'en')}
              className="px-1.5 py-1 rounded text-[10px] font-mono border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              title="Only UI labels are translated so far — see README"
            >
              {i18n.language === 'en' ? 'EN' : 'SW'}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={loggedIn ? onLogout : onShowAuth}
            className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {loggedIn ? <LogOut size={12} /> : <LogIn size={12} />}
            {loggedIn ? 'Sign out' : 'Sign in to sync'}
          </button>
          {loggedIn && (
            <div className="flex items-center gap-1.5">
              <button onClick={onShowBilling} className="p-1 rounded hover:bg-[var(--bg-hover)]" title="Billing">
                <CreditCard size={13} className="text-[var(--text-muted)]" />
              </button>
              {saveError
                ? <span title="Cloud sync failed — saved locally instead"><CloudOff size={13} className="text-amber-400" /></span>
                : <span title="Synced to your account"><Cloud size={13} className="text-[var(--text-muted)]" /></span>}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-secondary)]">{saveError && !loggedIn ? t('save_failed') : t('saves_automatically')}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={onExport} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]" aria-label="Export progress as JSON" title="Export progress">
              <Download size={13} className="text-[var(--text-muted)]" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]" aria-label="Import progress from JSON" title="Import progress">
              <Upload size={13} className="text-[var(--text-muted)]" />
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
          </div>
        </div>
      </div>
    </aside>
  );
}
