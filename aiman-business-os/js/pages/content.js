/* ============================================================
   Content Studio — 30-day Instagram planner, captions,
   hashtags, ideas, campaigns
   ============================================================ */

const CONTENT_TABS = ['30-Day Calendar', 'Drafts', 'Published', 'Caption Library', 'Hashtags', 'Ideas', 'Campaigns'];
let contentTab = 0;

Pages.content = () => {
  const cal = DB.content.calendar;
  return pageHead('Content Studio', `Instagram · ${cal.filter(c => c.status === 'published').length} published, ${cal.filter(c => c.status === 'draft').length} drafted, ${cal.filter(c => c.status === 'idea').length} planned this month`,
    `<button class="btn primary" data-new-post>${icon('plus')}New post</button>`)
    + UI.tabs(CONTENT_TABS, contentTab)
    + `<div id="content-body">${contentBody()}</div>`;
};

const TYPE_COLOR = { Post: 'var(--info)', Reel: 'var(--accent)', Carousel: 'var(--good)', Story: 'var(--text-3)' };

function contentBody() {
  const name = CONTENT_TABS[contentTab];
  const cal = DB.content.calendar;

  if (name === '30-Day Calendar') {
    const cells = [];
    for (let d = 1; d <= 28; d++) {
      const item = cal.find(c => c.day === d);
      cells.push(item
        ? `<div class="ig-cell ${item.status === 'published' ? 'published' : ''}" data-post-day="${d}" title="Click to cycle status: idea → draft → published">
            <div class="spread"><span class="ig-day">Jul ${d}</span>${item.status === 'published' ? `<span style="color:var(--good)">${icon('check')}</span>` : ''}</div>
            <span class="ig-type" style="color:${TYPE_COLOR[item.type]}">${item.type}</span>
            <span class="ig-title">${UI.esc(item.title)}</span>
          </div>`
        : `<div class="ig-cell empty-day" data-add-day="${d}" title="Add a post on Jul ${d}"><span class="tiny">Jul ${d}</span></div>`);
    }
    return `${Charts.legend(Object.entries(TYPE_COLOR).map(([label, color]) => ({ label, color })))}
      <div style="height:14px"></div>
      <div class="ig-grid">${cells.join('')}</div>`;
  }

  if (name === 'Drafts' || name === 'Published') {
    const want = name === 'Drafts' ? 'draft' : 'published';
    const items = cal.filter(c => c.status === want);
    return UI.card({
      title: name, icon: name === 'Drafts' ? 'note' : 'check',
      body: items.length ? items.map(i => `
        <div class="row">
          <span class="badge" style="color:${TYPE_COLOR[i.type]};min-width:76px;justify-content:center">${i.type}</span>
          <div class="row-main"><div class="row-title">${UI.esc(i.title)}</div><div class="row-sub">Scheduled Jul ${i.day}</div></div>
          ${UI.statusBadge(want === 'draft' ? 'Draft' : 'Published')}
          <button class="btn ghost sm">${icon('dots')}</button>
        </div>`).join('') : UI.empty('content', `No ${want} posts`, 'They\'ll show up here as the calendar moves.'),
    });
  }

  if (name === 'Caption Library') {
    return `<div class="grid" style="grid-template-columns:1fr 1fr 1fr">
      ${DB.content.captions.map(c => `
        <div class="card hoverable prompt-card">
          <span class="row-title" style="font-size:13.5px">${UI.esc(c.title)}</span>
          <div class="pc-body" style="font-family:var(--font-ui)">${UI.esc(c.body)}</div>
          <div class="spread" style="margin-top:12px">
            ${c.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
            <button class="btn sm">Copy</button>
          </div>
        </div>`).join('')}
    </div>`;
  }

  if (name === 'Hashtags') {
    return UI.card({
      title: 'Hashtag sets', icon: 'hash',
      body: DB.content.hashtags.map(h => `
        <div class="row" style="align-items:flex-start">
          <div class="row-main">
            <div class="row-title">${UI.esc(h.group)}</div>
            <div class="small t3" style="margin-top:4px;line-height:1.7">${UI.esc(h.tags)}</div>
          </div>
          <button class="btn sm">Copy set</button>
        </div>`).join(''),
    });
  }

  if (name === 'Ideas') {
    return UI.card({
      title: 'Content ideas', icon: 'lightbulb',
      body: `<div class="quick-add" style="margin-bottom:12px">${icon('plus')}<input data-content-idea placeholder="Capture a content idea… (Enter to save)"></div>`
        + DB.content.ideas.map((i, ii) => `<div class="note-chip" style="position:relative">
            <button class="row-del" data-del-cidea="${ii}" style="position:absolute;top:7px;right:7px">${icon('x')}</button>
            <div style="padding-right:26px">${UI.esc(i)}</div></div>`).join(''),
    });
  }

  if (name === 'Campaigns') {
    return UI.card({
      title: 'Campaigns', icon: 'flag',
      body: UI.table(['Campaign', 'Window', 'Posts', 'Status'],
        DB.content.campaigns.map(c => [
          `<span class="strong">${UI.esc(c.name)}</span>`, c.window, `<span class="num">${c.posts}</span>`, UI.statusBadge(c.status),
        ])),
    });
  }
  return '';
}

function wireContent() {
  const body = document.querySelector('#content-body');
  if (body && !body.dataset.wired) {
    body.dataset.wired = '1';
    body.addEventListener('click', e => {
      const add = e.target.closest('[data-add-day]');
      if (add) return Create.contentPost({ day: +add.dataset.addDay });
      const cyc = e.target.closest('[data-post-day]');
      if (cyc) {
        const item = DB.content.calendar.find(c => c.day === +cyc.dataset.postDay);
        if (!item) return;
        const CYCLE = ['idea', 'draft', 'published'];
        item.status = CYCLE[(CYCLE.indexOf(item.status) + 1) % CYCLE.length];
        saveDB();
        body.innerHTML = contentBody();
        UI.toast(`"${item.title.slice(0, 30)}" → ${item.status}`);
      }
      const delIdea = e.target.closest('[data-del-cidea]');
      if (delIdea) {
        DB.content.ideas.splice(+delIdea.dataset.delCidea, 1);
        saveDB();
        body.innerHTML = contentBody();
      }
    });
    body.addEventListener('keydown', e => {
      const input = e.target.closest('[data-content-idea]');
      if (input && e.key === 'Enter' && input.value.trim()) {
        DB.content.ideas.unshift(input.value.trim());
        saveDB();
        body.innerHTML = contentBody();
        UI.toast('Idea captured');
      }
    });
  }
}

Pages._mount.content = () => {
  wireTabs(document.querySelector('.page'), tab => {
    contentTab = tab;
    document.querySelector('#content-body').innerHTML = contentBody();
  });
  document.querySelector('[data-new-post]')?.addEventListener('click', () => Create.contentPost());
  wireContent();
};
