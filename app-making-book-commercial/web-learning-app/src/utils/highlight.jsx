const KEYWORDS = new Set([
  'class', 'fun', 'val', 'var', 'interface', 'object', 'import', 'package',
  'return', 'if', 'else', 'private', 'public', 'suspend', 'override',
  'abstract', 'const', 'let', 'function', 'export', 'default', 'async',
  'await', 'new', 'this', 'try', 'catch', 'throw', 'typeof', 'extends',
  'implements', 'in', 'of', 'null', 'true', 'false', 'void', 'type', 'from',
]);

export function highlight(code) {
  const tokens = code.split(/(\s+|[(){}[\];,.<>:])/g);
  return tokens.map((t, i) => {
    if (KEYWORDS.has(t)) return <span key={i} style={{ color: '#C792EA' }}>{t}</span>;
    if (/^["'`].*["'`]$/.test(t)) return <span key={i} style={{ color: '#A6D189' }}>{t}</span>;
    if (/^\d+$/.test(t)) return <span key={i} style={{ color: '#F2B366' }}>{t}</span>;
    if (/^@\w+/.test(t)) return <span key={i} style={{ color: '#7EC1E8' }}>{t}</span>;
    if (/^\/\//.test(t)) return <span key={i} style={{ color: '#6B7280' }}>{t}</span>;
    return <span key={i}>{t}</span>;
  });
}
