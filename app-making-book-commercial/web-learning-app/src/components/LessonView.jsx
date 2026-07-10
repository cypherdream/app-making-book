import { Bookmark, BookmarkCheck, ChevronRight, StickyNote, Focus } from 'lucide-react';
import { TRACK } from '../data/tracks';
import DiagramFlow from './DiagramFlow';
import CodeBlock from './CodeBlock';
import Quiz from './Quiz';

const FONT_SCALE = { sm: 'text-[13px]', base: 'text-sm', lg: 'text-base' };

export default function LessonView({
  lesson, isFirst, isLast, onPrev, onNext, bookmarked, onToggleBookmark,
  notes, onNoteChange, done, onMarkDone, fontSize, readingMode, onExitReading,
  recommended, onSelectRecommended,
}) {
  const track = TRACK[lesson.track];

  return (
    <div key={lesson.id} className={`max-w-2xl mx-auto p-6 md:p-10 animate-fade-in ${FONT_SCALE[fontSize]}`}>
      {readingMode && (
        <button onClick={onExitReading} className="mb-4 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
          <Focus size={11} /> Exit reading mode
        </button>
      )}

      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded" style={{ color: track.accent, background: track.accentSoft }}>
          {track.name} · {lesson.time}
        </span>
        <button
          onClick={onToggleBookmark}
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
          aria-pressed={!!bookmarked}
        >
          {bookmarked ? <BookmarkCheck size={16} style={{ color: track.accent }} /> : <Bookmark size={16} className="text-[var(--text-muted)]" />}
        </button>
      </div>

      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-2 mb-1">{lesson.title}</h2>
      <p className="text-[var(--text-muted)] mb-6">{lesson.objective}</p>

      <DiagramFlow steps={lesson.diagram} accent={track.accent} />

      {lesson.body.map((section, i) => (
        <div key={i} className="mb-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">{section.h}</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed">{section.p}</p>
        </div>
      ))}

      {lesson.code && <CodeBlock code={lesson.code.text} filename={lesson.code.filename} />}

      {lesson.lineNotes && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-4 mb-4">
          <div className="text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Line by line</div>
          <ul className="space-y-1.5">
            {lesson.lineNotes.map((n, i) => (
              <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                <span style={{ color: track.accent }} aria-hidden="true">—</span> {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.quiz && <Quiz question={lesson.quiz.q} options={lesson.quiz.options} correct={lesson.quiz.correct} />}

      <div className="mb-4">
        <label htmlFor={`notes-${lesson.id}`} className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
          <StickyNote size={12} aria-hidden="true" /> Your notes (saved automatically)
        </label>
        <textarea
          id={`notes-${lesson.id}`}
          value={notes ?? ''}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Jot down anything you want to remember about this lesson…"
          rows={3}
          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-md p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60 resize-y"
        />
      </div>

      <button
        onClick={onMarkDone}
        className="mt-2 px-4 py-2 rounded-md text-xs font-medium text-black transition focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/70"
        style={{ background: track.accent }}
      >
        {done ? 'Marked complete ✓' : 'Mark lesson complete'}
      </button>

      {done && recommended && (
        <button
          onClick={() => onSelectRecommended(recommended.id)}
          className="mt-4 w-full text-left p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] transition"
        >
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide mb-1">Suggested next</div>
          <div className="text-sm text-[var(--text-primary)]">{recommended.title}</div>
        </button>
      )}

      <div className="flex items-center justify-between mt-8 pt-4 border-t border-[var(--border)]">
        <button onClick={onPrev} disabled={isFirst} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 disabled:pointer-events-none flex items-center gap-1">
          <ChevronRight size={12} className="rotate-180" /> Previous
        </button>
        <button onClick={onNext} disabled={isLast} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 disabled:pointer-events-none flex items-center gap-1">
          Next <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
