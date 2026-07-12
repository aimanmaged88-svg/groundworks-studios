/* ============================================================
   BUSINESS STUDIO OS — Live data (clean start)
   Empty studio, ready for real work. One sample client + project
   left in so the layout isn't blank — delete them when you add
   your own. Everything persists to this browser (see storage.js).
   ============================================================ */

const DB = {

  user: { name: 'Aiman', initials: 'AM', business: 'Groundwork Labs', role: 'Founder' },

  clients: [
    {
      id: 'c-sample', name: 'Test Client', contact: 'Sample Contact', initials: 'TC',
      industry: 'Example — delete me', location: 'Sydney, NSW',
      email: 'hello@example.com', phone: '', site: '',
      status: 'Active', value: 0, projects: 1, since: 'Jul 2026',
      summary: 'This is a sample record so you can see how a client looks. Open it, edit it, or delete it and add your first real client.',
      notes: [],
      timeline: [
        { date: 'Jul 11', text: 'Sample client created' },
      ],
    },
  ],

  projects: [
    { id: 'p-sample', name: 'Test Project', clientId: 'c-sample', stage: 'Planning', progress: 10, due: '—', tags: ['Example'], hours: 0,
      desc: 'A sample project so the board and dashboard aren\'t empty. Delete it when you add real work.' },
  ],

  stages: ['Ideas', 'Planning', 'Design', 'Development', 'Testing', 'Review', 'Ready', 'Completed'],

  tasks: [],

  events: [],

  invoices: [],

  finance: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    income:   [0, 0, 0, 0, 0, 0, 0],
    expenses: [0, 0, 0, 0, 0, 0, 0],
    revenueMTD: 0, revenueDelta: 0,
    outstanding: 0, outstandingCount: 0,
    profitYTD: 0,
    taxEstimate: 0,
    subscriptions: [],
    upcoming: [],
    expensesList: [],
  },

  briefing: { lines: [] },

  notifications: [],

  activity: [],

  quickNotes: [],

  weeklyGoals: [],

  health: [],

  conversations: [],

  aiChats: [],

  prompts: [],

  decisions: [],

  ideas: [],

  voiceNotes: [],

  meetingNotes: [],

  content: {
    calendar: [],
    captions: [],
    hashtags: [],
    ideas: [],
    campaigns: [],
  },

  documents: [],

  analytics: {
    leads:   [0, 0, 0, 0, 0, 0, 0],
    conversions: [0, 0, 0, 0, 0, 0, 0],
    hours:   [0, 0, 0, 0, 0, 0, 0],
    appsBuilt: 0, sitesBuilt: 0, hoursMonth: 0, completion: 0, growth: 0,
  },

  weather: null,

};

/* helpers */
const fmt$ = n => '$' + n.toLocaleString('en-AU');
const clientById = id => DB.clients.find(c => c.id === id);
const projectById = id => DB.projects.find(p => p.id === id);
const projectsFor = cid => DB.projects.filter(p => p.clientId === cid);
const tasksFor = filt => DB.tasks.filter(filt);
