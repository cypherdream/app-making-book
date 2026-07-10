import { useState } from 'react';
import { X, Sparkles, Loader2, Plus, Trash2, Download, RefreshCw, Share2, Library, Eye } from 'lucide-react';
import {
  interpretPrompt, getPreset, generateProject, regenerateEntity,
  getCommunityTemplates, shareTemplate, previewProject,
} from '../services/builderApi';
import { useFocusTrap } from '../hooks/useFocusTrap';

const PRESETS = ['school', 'restaurant', 'crm', 'ecommerce', 'inventory'];
const FIELD_TYPES = ['string', 'number', 'boolean', 'date', 'text'];

/**
 * The Visual App Builder — prompt or preset in, reviewable/editable
 * spec, generate a real project out. The spec review step is not
 * cosmetic: per the "AI only understands intent, engine builds
 * deterministically" design, the user editing fields here directly
 * changes what the engine emits, with no LLM call in between.
 */
export default function AppBuilder({ onClose }) {
  const [tab, setTab] = useState('build'); // 'build' | 'community'
  const [prompt, setPrompt] = useState('');
  const [spec, setSpec] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [communityTemplates, setCommunityTemplates] = useState(null);
  const [includeAndroid, setIncludeAndroid] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const modalRef = useFocusTrap(true);

  const runInterpret = async () => {
    if (prompt.trim().length < 5) { setError('Describe your app in a bit more detail.'); return; }
    setBusy(true); setError('');
    try {
      setSpec(await interpretPrompt(prompt));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const runPreset = async (name) => {
    setBusy(true); setError('');
    try {
      setSpec(await getPreset(name));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateEntity = (index, patch) => {
    setSpec((s) => ({ ...s, entities: s.entities.map((e, i) => (i === index ? { ...e, ...patch } : e)) }));
  };
  const updateField = (entityIndex, fieldIndex, patch) => {
    setSpec((s) => ({
      ...s,
      entities: s.entities.map((e, i) =>
        i === entityIndex ? { ...e, fields: e.fields.map((f, fi) => (fi === fieldIndex ? { ...f, ...patch } : f)) } : e
      ),
    }));
  };
  const addField = (entityIndex) => {
    setSpec((s) => ({
      ...s,
      entities: s.entities.map((e, i) =>
        i === entityIndex ? { ...e, fields: [...e.fields, { name: 'field', type: 'string', required: true }] } : e
      ),
    }));
  };
  const removeField = (entityIndex, fieldIndex) => {
    setSpec((s) => ({
      ...s,
      entities: s.entities.map((e, i) => (i === entityIndex ? { ...e, fields: e.fields.filter((_, fi) => fi !== fieldIndex) } : e)),
    }));
  };
  const addEntity = () => {
    setSpec((s) => ({ ...s, entities: [...s.entities, { name: 'NewEntity', fields: [{ name: 'name', type: 'string', required: true }] }] }));
  };
  const removeEntity = (index) => {
    setSpec((s) => ({ ...s, entities: s.entities.filter((_, i) => i !== index) }));
  };

  const runGenerate = async () => {
    setBusy(true); setError('');
    try {
      const blob = await generateProject(spec, 'standalone', includeAndroid);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${spec.appName.replace(/\s+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const runPreview = async () => {
    setBusy(true); setError('');
    try {
      const result = await previewProject(spec, 'standalone', includeAndroid);
      setPreview(result);
      setPreviewFile(Object.keys(result.files)[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const runRegenerateEntity = async (entityName) => {
    setBusy(true); setError('');
    try {
      const files = await regenerateEntity(spec, entityName, 'standalone');
      const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityName}-regenerated.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const runShare = async () => {
    const name = window.prompt('Name this template for the community list:');
    if (!name) return;
    setBusy(true); setError('');
    try {
      await shareTemplate(name, `Generated from: "${prompt || 'preset'}"`, spec, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const loadCommunity = async () => {
    setBusy(true); setError('');
    try {
      setCommunityTemplates(await getCommunityTemplates());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="App Builder"
        className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles size={18} /> App Builder
          </h2>
          <button onClick={onClose} aria-label="Close"><X size={18} className="text-[var(--text-muted)]" /></button>
        </div>

        <div className="flex gap-2 mb-4 text-xs">
          <button onClick={() => setTab('build')} className={`px-3 py-1.5 rounded ${tab === 'build' ? 'bg-[#8B7FD6] text-black' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}>Build</button>
          <button onClick={() => { setTab('community'); loadCommunity(); }} className={`px-3 py-1.5 rounded flex items-center gap-1 ${tab === 'community' ? 'bg-[#8B7FD6] text-black' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}>
            <Library size={12} /> Community templates
          </button>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {tab === 'community' ? (
          <div className="space-y-2">
            {communityTemplates === null && <p className="text-xs text-[var(--text-muted)]">Loading…</p>}
            {communityTemplates?.length === 0 && <p className="text-xs text-[var(--text-muted)]">No public templates shared yet.</p>}
            {communityTemplates?.map((t) => (
              <div key={t.id} className="p-3 rounded border border-[var(--border)] text-xs">
                <div className="font-medium text-[var(--text-primary)]">{t.name}</div>
                <div className="text-[var(--text-muted)]">{t.description} · {t.downloadCount} downloads</div>
              </div>
            ))}
            <p className="text-[10px] text-[var(--text-muted)] mt-3">
              Free community sharing — not a paid marketplace (no payments, revenue split, or moderation queue yet).
            </p>
          </div>
        ) : !spec ? (
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Describe your app</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Build a school management app with students, teachers, and exams"
              rows={3}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-md p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60 mb-2"
            />
            <button
              onClick={runInterpret}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-[#8B7FD6] text-black text-xs font-medium py-2 rounded-md disabled:opacity-50 mb-4"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Interpret with AI
            </button>

            <div className="text-xs text-[var(--text-muted)] mb-2">Or start from a preset (instant, no AI call):</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => runPreset(p)} disabled={busy} className="px-2 py-1 rounded text-[11px] capitalize border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]">
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <input
              value={spec.appName}
              onChange={(e) => setSpec({ ...spec, appName: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-3 py-2 text-sm font-semibold text-[var(--text-primary)] mb-4"
            />

            {spec.entities.map((entity, ei) => (
              <div key={ei} className="mb-4 p-3 rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <input
                    value={entity.name}
                    onChange={(e) => updateEntity(ei, { name: e.target.value })}
                    className="bg-transparent text-sm font-medium text-[var(--text-primary)] border-b border-[var(--border)] focus:outline-none"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => runRegenerateEntity(entity.name)} title="Regenerate just this entity" className="p-1 rounded hover:bg-[var(--bg-hover)]">
                      <RefreshCw size={12} className="text-[var(--text-muted)]" />
                    </button>
                    <button onClick={() => removeEntity(ei)} title="Remove entity" className="p-1 rounded hover:bg-[var(--bg-hover)]">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
                {entity.fields.map((field, fi) => (
                  <div key={fi} className="flex items-center gap-1.5 mb-1">
                    <input
                      value={field.name}
                      onChange={(e) => updateField(ei, fi, { name: e.target.value })}
                      className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded px-2 py-1 text-[11px] text-[var(--text-primary)]"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(ei, fi, { type: e.target.value })}
                      className="bg-[var(--bg-input)] border border-[var(--border)] rounded px-1 py-1 text-[11px] text-[var(--text-primary)]"
                    >
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(ei, fi, { required: e.target.checked })} /> req
                    </label>
                    <button onClick={() => removeField(ei, fi)}><Trash2 size={11} className="text-[var(--text-muted)]" /></button>
                  </div>
                ))}
                <button onClick={() => addField(ei)} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 mt-1">
                  <Plus size={11} /> Add field
                </button>
              </div>
            ))}

            <button onClick={addEntity} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 mb-4">
              <Plus size={12} /> Add entity
            </button>

            <label className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mb-3">
              <input type="checkbox" checked={includeAndroid} onChange={(e) => setIncludeAndroid(e.target.checked)} />
              Include Android (Kotlin source + a CI workflow that builds a real APK/AAB on GitHub's free runners — no SDK needed locally)
            </label>

            {preview && (
              <div className="mb-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-input)]">
                <div className="text-[11px] text-[var(--text-muted)] mb-2">{preview.fileCount} files will be generated:</div>
                <select value={previewFile} onChange={(e) => setPreviewFile(e.target.value)} className="w-full mb-2 bg-[var(--bg-panel)] border border-[var(--border)] rounded px-2 py-1 text-[11px] text-[var(--text-primary)]">
                  {Object.keys(preview.files).map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <pre className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-panel)] p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                  {preview.files[previewFile]}
                </pre>
                {preview.warnings.length > 0 && (
                  <div className="mt-2 text-[10px] text-amber-400">{preview.warnings.join(' ')}</div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={runPreview}
                disabled={busy}
                className="px-3 flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded-md hover:bg-[var(--bg-input)]"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} Preview
              </button>
              <button
                onClick={runGenerate}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 bg-[#8B7FD6] text-black text-xs font-medium py-2 rounded-md disabled:opacity-50"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Generate & download
              </button>
              <button
                onClick={runShare}
                disabled={busy}
                className="px-3 flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded-md hover:bg-[var(--bg-input)]"
              >
                <Share2 size={12} /> Share
              </button>
            </div>
            {includeAndroid && (
              <p className="text-[10px] text-[var(--text-muted)] mt-2">
                After downloading: push the <code>android/</code> folder to a GitHub repo. The included
                <code> .github/workflows/build-android.yml</code> builds a real debug APK automatically
                (check the repo's Actions tab → the run's Artifacts once it finishes, usually a few minutes —
                that's the real "build progress" for the Android side; this app can't poll a build it doesn't
                have your repo/token to trigger).
              </p>
            )}
            <button onClick={() => setSpec(null)} className="w-full text-center text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] mt-3">
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
