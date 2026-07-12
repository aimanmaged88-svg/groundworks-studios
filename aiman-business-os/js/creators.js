/* ============================================================
   BUSINESS STUDIO OS — create/edit/delete flows
   Every entity in the app can be created here; everything
   saves to the browser instantly.
   ============================================================ */

const Create = (() => {
  const clientNames = () => ['None', ...DB.clients.map(c => c.name)];
  const clientIdFor = name => DB.clients.find(c => c.name === name)?.id || null;
  const done = msg => { saveDB(); App.refresh(); UI.toast(msg); };

  function task(preset = {}) {
    UI.modal({
      title: 'New task',
      fields: [
        { name: 'title', label: 'What needs doing?', full: true, required: true, placeholder: 'e.g. Send Kahil the launch checklist' },
        { name: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'], value: 'Medium' },
        { name: 'due', label: 'Due', value: preset.due || 'Today', placeholder: 'Today, Fri, Jul 20…' },
        { name: 'client', label: 'Client', type: 'select', options: clientNames() },
        { name: 'tag', label: 'Tag', value: 'general' },
      ],
      submitLabel: 'Add task',
      onSubmit(v) {
        DB.tasks.unshift({
          id: uid('t'), title: v.title, projectId: null, clientId: clientIdFor(v.client),
          priority: v.priority, due: v.due || 'Today', status: 'Todo',
          tags: [v.tag || 'general'], done: false,
        });
        done('Task added');
      },
    });
  }

  function project() {
    UI.modal({
      title: 'New project',
      fields: [
        { name: 'name', label: 'Project name', full: true, required: true, placeholder: 'e.g. Kahil Meats — Phase 2' },
        { name: 'client', label: 'Client', type: 'select', options: clientNames() },
        { name: 'stage', label: 'Stage', type: 'select', options: DB.stages, value: 'Ideas' },
        { name: 'due', label: 'Due', value: '—' },
        { name: 'tag', label: 'Tag', value: 'App' },
        { name: 'desc', label: 'Brief', type: 'textarea', full: true, placeholder: 'One paragraph on what this is.' },
      ],
      submitLabel: 'Create project',
      onSubmit(v) {
        DB.projects.unshift({
          id: uid('p'), name: v.name, clientId: clientIdFor(v.client), stage: v.stage,
          progress: v.stage === 'Completed' ? 100 : 0, due: v.due || '—',
          tags: [v.tag || 'App'], hours: 0, desc: v.desc || '',
        });
        done('Project created');
      },
    });
  }

  function client() {
    UI.modal({
      title: 'New client',
      fields: [
        { name: 'name', label: 'Business name', required: true, placeholder: 'e.g. Bass Hill Bakery' },
        { name: 'contact', label: 'Contact person', placeholder: 'e.g. Sam' },
        { name: 'industry', label: 'Industry', placeholder: 'e.g. Café · Food' },
        { name: 'status', label: 'Status', type: 'select', options: ['Lead', 'Proposal', 'Active', 'Review'], value: 'Lead' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', placeholder: '04xx xxx xxx' },
        { name: 'site', label: 'Website' },
        { name: 'value', label: 'Estimated value ($)', type: 'number', min: 0, value: 0 },
        { name: 'location', label: 'Location', value: 'Sydney, NSW' },
        { name: 'summary', label: 'Notes / summary', type: 'textarea', full: true },
      ],
      submitLabel: 'Add client',
      onSubmit(v) {
        const initials = v.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CL';
        const now = new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
        DB.clients.push({
          id: uid('c'), name: v.name, contact: v.contact || '—', initials,
          industry: v.industry || '—', location: v.location || '—',
          email: v.email || '—', phone: v.phone || '—', site: v.site || '—',
          status: v.status, value: +v.value || 0, projects: 0, since: now,
          summary: v.summary || 'New client — add context as you go.',
          notes: [], comms: [], timeline: [{ date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), text: 'Client added' }],
        });
        journeyTasks(DB.clients[DB.clients.length - 1]);
        done('Client added — feedback journey tasks created');
      },
    });
  }

  /* edit every detail of an existing client */
  function editClient(c) {
    const val = s => (s && s !== '—') ? s : '';
    UI.modal({
      title: 'Edit client',
      fields: [
        { name: 'name', label: 'Business name', required: true, value: c.name },
        { name: 'contact', label: 'Contact person', value: val(c.contact) },
        { name: 'industry', label: 'Industry', value: val(c.industry) },
        { name: 'status', label: 'Status', type: 'select', options: ['Lead', 'Proposal', 'Active', 'Review'], value: c.status },
        { name: 'email', label: 'Email', type: 'email', value: val(c.email) },
        { name: 'phone', label: 'Phone', value: val(c.phone), placeholder: '04xx xxx xxx' },
        { name: 'site', label: 'Website', value: val(c.site) },
        { name: 'value', label: 'Value ($)', type: 'number', min: 0, value: c.value || 0 },
        { name: 'location', label: 'Location', value: val(c.location) },
        { name: 'summary', label: 'Notes / summary', type: 'textarea', full: true, value: val(c.summary) },
      ],
      submitLabel: 'Save changes',
      onSubmit(v) {
        c.name = v.name.trim() || c.name;
        c.contact = v.contact.trim() || '—';
        c.industry = v.industry.trim() || '—';
        c.status = v.status;
        c.email = v.email.trim() || '—';
        c.phone = v.phone.trim() || '—';
        c.site = v.site.trim() || '—';
        c.value = +v.value || 0;
        c.location = v.location.trim() || '—';
        c.summary = v.summary.trim() || c.summary;
        c.initials = c.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || c.initials;
        done('Client updated');
      },
    });
  }

  function invoice() {
    const nextNum = Math.max(1000, ...DB.invoices.map(i => +String(i.id).split('-')[1] || 1000)) + 1;
    UI.modal({
      title: 'New invoice',
      fields: [
        { name: 'id', label: 'Invoice #', value: 'INV-' + nextNum, required: true },
        { name: 'client', label: 'Client', type: 'select', options: DB.clients.map(c => c.name) },
        { name: 'amount', label: 'Amount ($)', type: 'number', min: 0, required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Paid', 'Overdue'], value: 'Draft' },
        { name: 'due', label: 'Due', full: true, value: 'Jul 30', placeholder: 'e.g. Jul 30' },
      ],
      submitLabel: 'Add invoice',
      onSubmit(v) {
        DB.invoices.unshift({ id: v.id, client: v.client, amount: +v.amount || 0, status: v.status, due: v.due || '—' });
        done('Invoice added');
      },
    });
  }

  function event(preset = {}) {
    UI.modal({
      title: 'New calendar event',
      fields: [
        { name: 'title', label: 'Event', full: true, required: true, placeholder: 'e.g. Kahil launch call' },
        { name: 'day', label: 'Day of July', type: 'number', min: 1, value: preset.day || TODAY_DAY },
        { name: 'time', label: 'Time', placeholder: '14:00 (blank = all day)' },
        { name: 'type', label: 'Type', type: 'select', options: ['meeting', 'deadline', 'task', 'content'], value: 'meeting' },
      ],
      submitLabel: 'Add event',
      onSubmit(v) {
        DB.events.push({ day: Math.max(1, Math.min(31, +v.day || TODAY_DAY)), title: v.title, time: v.time || '', type: v.type });
        done('Event added');
      },
    });
  }

  function note() {
    UI.modal({
      title: 'Quick note',
      fields: [{ name: 'text', label: 'Note', type: 'textarea', full: true, placeholder: 'Capture the thought…' }],
      submitLabel: 'Save note',
      onSubmit(v) {
        if (!v.text.trim()) return;
        DB.quickNotes.unshift({ text: v.text.trim(), time: 'Just now' });
        done('Note captured');
      },
    });
  }

  function contentPost(preset = {}) {
    UI.modal({
      title: 'New content post',
      fields: [
        { name: 'title', label: 'Post idea / title', full: true, required: true },
        { name: 'day', label: 'Day of July', type: 'number', min: 1, value: preset.day || TODAY_DAY },
        { name: 'type', label: 'Format', type: 'select', options: ['Post', 'Reel', 'Carousel', 'Story'], value: 'Post' },
        { name: 'status', label: 'Status', type: 'select', options: ['idea', 'draft', 'published'], value: 'idea' },
      ],
      submitLabel: 'Add to calendar',
      onSubmit(v) {
        DB.content.calendar.push({ day: Math.max(1, Math.min(31, +v.day || 1)), type: v.type, title: v.title, status: v.status });
        done('Post scheduled');
      },
    });
  }

  function aiChat() {
    UI.modal({
      title: 'Save an AI chat',
      fields: [
        { name: 'title', label: 'Chat title', full: true, required: true, placeholder: 'e.g. Pricing strategy for app builds' },
        { name: 'source', label: 'Source', type: 'select', options: ['Claude', 'ChatGPT'], value: 'Claude' },
        { name: 'tags', label: 'Tags (comma separated)', value: 'general' },
        { name: 'preview', label: 'Summary / key takeaway', type: 'textarea', full: true },
      ],
      submitLabel: 'Save chat',
      onSubmit(v) {
        DB.aiChats.unshift({
          id: uid('a'), source: v.source, title: v.title, preview: v.preview || '',
          time: 'Today', tags: v.tags.split(',').map(s => s.trim()).filter(Boolean),
        });
        done('Chat saved to AI Hub');
      },
    });
  }

  function prompt() {
    UI.modal({
      title: 'New prompt',
      fields: [
        { name: 'title', label: 'Prompt name', full: true, required: true },
        { name: 'tags', label: 'Tag', value: 'general' },
        { name: 'body', label: 'Prompt', type: 'textarea', full: true, required: true },
      ],
      submitLabel: 'Save prompt',
      onSubmit(v) {
        DB.prompts.unshift({ title: v.title, body: v.body, tags: [v.tags || 'general'], uses: 0 });
        done('Prompt saved');
      },
    });
  }

  function idea() {
    UI.modal({
      title: 'New business idea',
      fields: [
        { name: 'title', label: 'Idea', full: true, required: true },
        { name: 'body', label: 'Detail', type: 'textarea', full: true },
      ],
      submitLabel: 'Save idea',
      onSubmit(v) {
        DB.ideas.unshift({ title: v.title, body: v.body || '', date: 'Today' });
        done('Idea captured');
      },
    });
  }

  /* the feedback journey: every new client gets touchpoint reminders */
  function journeyTasks(client) {
    DB.tasks.unshift(
      {
        id: uid('t'), title: `Send ${client.name} the welcome + feedback link (sign-up)`,
        projectId: null, clientId: client.id, priority: 'Medium', due: 'Today',
        status: 'Todo', tags: ['journey'], done: false,
      },
      {
        id: uid('t'), title: `Week-one check-in with ${client.name} — "how did we go?"`,
        projectId: null, clientId: client.id, priority: 'Medium', due: 'Next week',
        status: 'Todo', tags: ['journey'], done: false,
      },
    );
  }

  return { task, project, client, editClient, invoice, event, note, contentPost, aiChat, prompt, idea, journeyTasks };
})();
