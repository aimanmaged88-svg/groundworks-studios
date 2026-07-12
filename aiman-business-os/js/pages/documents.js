/* ============================================================
   Documents — folders + files with type identity
   ============================================================ */

const DOC_STYLE = {
  folder: { icon: 'folder', bg: 'var(--accent-soft)', color: 'var(--accent)' },
  pdf:    { icon: 'fileText', bg: 'var(--bad-soft)', color: 'var(--bad)' },
  image:  { icon: 'image', bg: 'var(--info-soft)', color: 'var(--info)' },
  video:  { icon: 'video', bg: 'var(--good-soft)', color: 'var(--good)' },
};

function docRow(d) {
  const s = DOC_STYLE[d.type] || DOC_STYLE.pdf;
  return `<div class="row clickable">
    <span class="doc-icon" style="width:34px;height:34px;border-radius:10px;background:${s.bg};color:${s.color};display:grid;place-items:center">${icon(s.icon)}</span>
    <div class="row-main"><div class="row-title">${UI.esc(d.name)}</div><div class="row-sub">${d.size || d.items + ' items'} · ${d.date || 'Folder'}</div></div>
    <button class="btn ghost sm">${icon('download')}</button>
  </div>`;
}

Pages.documents = () => {
  const folders = DB.documents.filter(d => d.type === 'folder');
  const files = DB.documents.filter(d => d.type !== 'folder');
  return pageHead('Documents', 'Contracts, quotes, brand files and client assets.',
    `<button class="btn">${icon('search')}Search files</button><button class="btn primary">${icon('plus')}Upload</button>`)
    + `<div class="label" style="margin-bottom:12px">Folders</div>
    <div class="doc-grid" style="margin-bottom:28px">
      ${folders.map(d => {
        const s = DOC_STYLE.folder;
        return `<div class="card hoverable doc-card">
          <span class="doc-icon" style="background:${s.bg};color:${s.color}">${icon(s.icon)}</span>
          <div><div class="row-title">${UI.esc(d.name)}</div><div class="row-sub">${d.items} items</div></div>
        </div>`;
      }).join('')}
    </div>
    <div class="label" style="margin-bottom:12px">Recent files</div>
    <div class="doc-grid">
      ${files.map(d => {
        const s = DOC_STYLE[d.type] || DOC_STYLE.pdf;
        return `<div class="card hoverable doc-card">
          <div class="spread"><span class="doc-icon" style="background:${s.bg};color:${s.color}">${icon(s.icon)}</span>
          <span class="tag" style="text-transform:uppercase">${d.type}</span></div>
          <div><div class="row-title" style="font-size:12.5px;word-break:break-all;white-space:normal">${UI.esc(d.name)}</div>
          <div class="row-sub">${d.size} · ${d.date}</div></div>
        </div>`;
      }).join('')}
    </div>`;
};
