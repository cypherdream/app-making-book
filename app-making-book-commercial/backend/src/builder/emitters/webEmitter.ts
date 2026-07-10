import type { AppSpec, entitySchema } from '../schema/appSpec';
import type { z } from 'zod';

type Entity = z.infer<typeof entitySchema>;

const INPUT_TYPE_MAP: Record<string, string> = {
    string: 'text',
    number: 'number',
    boolean: 'checkbox',
    date: 'date',
    text: 'textarea',
};

/**
 * Emits a real React component per entity — a list view with inline
 * create/delete, following the same component style as the rest of
 * this codebase (see web-learning-app/src/components/Sidebar.jsx for
 * the style this matches: hooks at top, plain fetch calls, no extra
 * state library).
 */
function emitEntityComponent(entity: Entity, apiBase: string): string {
    const lower = entity.name.toLowerCase();
    const inputs = entity.fields.map((f) => {
        const type = INPUT_TYPE_MAP[f.type];
        if (type === 'textarea') {
            return `        <textarea placeholder="${f.name}" value={form.${f.name} || ''} onChange={(e) => setForm({ ...form, ${f.name}: e.target.value })} />`;
        }
        if (type === 'checkbox') {
            return `        <label><input type="checkbox" checked={!!form.${f.name}} onChange={(e) => setForm({ ...form, ${f.name}: e.target.checked })} /> ${f.name}</label>`;
        }
        return `        <input type="${type}" placeholder="${f.name}" value={form.${f.name} || ''} onChange={(e) => setForm({ ...form, ${f.name}: e.target.value })} />`;
    }).join('\n');

    return `import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ${entity.name}List() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const load = () => {
    fetch(\`\${API_URL}${apiBase}\`)
      .then((r) => r.json())
      .then(setItems)
      .catch((err) => setError(err.message));
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    const res = await fetch(\`\${API_URL}${apiBase}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({}); load(); } else { setError((await res.json()).error); }
  };

  const remove = async (id) => {
    await fetch(\`\${API_URL}${apiBase}/\${id}\`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h2>${entity.name}s</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={create}>
${inputs}
        <button type="submit">Add ${entity.name}</button>
      </form>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            ${entity.fields.map((f) => `{item.${f.name}}`).join(' — ')}
            <button onClick={() => remove(item.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`;
}

export function emitWebFiles(spec: AppSpec, standalone = false): Record<string, string> {
    const files: Record<string, string> = {};
    const prefix = standalone ? 'web/src/generated' : 'src/generated';
    for (const entity of spec.entities) {
        files[`${prefix}/${entity.name}List.jsx`] = emitEntityComponent(entity, `/api/${entity.name.toLowerCase()}s`);
    }
    return files;
}
