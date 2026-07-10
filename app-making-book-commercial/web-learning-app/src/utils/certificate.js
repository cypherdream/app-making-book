// Generates a completion certificate entirely client-side using the
// Canvas API — no backend, no PDF service, no cost. Downloads as PNG,
// which is universally viewable/printable/shareable without needing
// a PDF reader.
export function generateCertificate({ name, completedCount, totalCount, date }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#8B7FD6';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
  ctx.strokeStyle = 'rgba(139,127,214,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '28px sans-serif';
  ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 180);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(name || 'Learner', canvas.width / 2, 320);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '26px sans-serif';
  ctx.fillText('has completed', canvas.width / 2, 380);

  ctx.fillStyle = '#D69A3C';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('app-making-book — Learn the Repository', canvas.width / 2, 440);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '22px sans-serif';
  ctx.fillText(`${completedCount} of ${totalCount} lessons · ${date}`, canvas.width / 2, 500);

  return canvas.toDataURL('image/png');
}

export function downloadCertificate(dataUrl, filename = 'certificate.png') {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
