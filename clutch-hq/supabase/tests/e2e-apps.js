// End-to-end run of both apps (local files) against the LIVE backend, using the TEST accounts.
const { chromium } = require('playwright');
const STAFF='file:///home/user/groundworks-studios/clutch-hq/index.html';
const FAM='file:///home/user/groundworks-studios/clutch-app/index.html';
let failed=0; const ok=(c,n,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'  '+x)); if(!c)failed++;};
(async()=>{
  const SP=process.argv[2];
  const b=await chromium.launch({args:['--ignore-certificate-errors']});
  const mk=async(w,h)=>{const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:w<500?2:1.5,ignoreHTTPSErrors:true});
    const p=await ctx.newPage(); p.errs=[]; p.on('pageerror',e=>p.errs.push(e.message)); return p;};

  // ---------- STAFF as admin ----------
  const waitApp=async(p,sel)=>{ await p.waitForSelector(sel+':not([hidden])',{timeout:45000}); await p.waitForTimeout(600); };
  const A=await mk(1440,900);
  await A.goto(STAFF); await A.waitForTimeout(2500);
  ok(await A.isVisible('#gate'),'staff gate shows');
  await A.screenshot({path:SP+'/S0-gate.png'});
  await A.fill('input[name=email]','test-admin@example.com'); await A.fill('input[name=password]','admin-pass12');
  await A.click('#gform button.pri'); await waitApp(A,'#shell');
  ok(await A.isVisible('#shell'),'admin signs in and the shell loads', JSON.stringify(A.errs).slice(0,200));
  await A.screenshot({path:SP+'/S1-week.png',fullPage:true});
  // teams
  await A.goto(STAFF+'#/teams'); await A.waitForTimeout(1200);
  const tcards=await A.$$eval('.team .cm',n=>n.map(x=>x.textContent));
  ok(tcards.some(t=>t.includes('Coach TEST Coach')),'team card names its coach',JSON.stringify(tcards));
  // players sort + drawer
  await A.goto(STAFF+'#/players'); await A.waitForTimeout(800);
  await A.selectOption('select[data-f=sort]','jersey'); await A.waitForTimeout(400);
  const firstRow=await A.textContent('tbody tr');
  ok(firstRow.includes('#4'),'jersey sort puts #4 first',firstRow.slice(0,60));
  await A.screenshot({path:SP+'/S2-players.png',fullPage:true});
  await A.click('tbody tr'); await A.waitForTimeout(1200);
  const drawer=await A.textContent('#drawer');
  ok(drawer.includes('Parent code'),'player drawer has the parent-code button');
  ok(drawer.includes('Payment plan'),'player drawer has payment plan');
  await A.screenshot({path:SP+'/S3-player.png'});
  // kid code from staff
  await A.click('[data-act=kidCode]'); await A.waitForTimeout(2500);
  const codeTxt=(await A.textContent('.bigcode')||'').trim();
  ok(/^\d{6}$/.test(codeTxt),'staff generates a kid code',codeTxt);
  await A.screenshot({path:SP+'/S4-kidcode.png'});
  await A.click('#modal [data-act=closeAll]'); await A.click('#drawer [data-act=closeAll]').catch(()=>{});
  // money
  await A.goto(STAFF+'#/money'); await A.waitForTimeout(800);
  const moneyTxt=await A.textContent('#main');
  ok(moneyTxt.includes('Payment plans'),'money shows payment plans');
  ok(moneyTxt.includes('Coming in'),'money shows coming-in tile');
  await A.screenshot({path:SP+'/S5-money.png',fullPage:true});
  // coaches
  await A.goto(STAFF+'#/coaches'); await A.waitForTimeout(800);
  ok((await A.textContent('#main')).includes('Working With Children Check'),'coaches view loads');
  // community queue approve flow will be tested after kid posts. Seasons + settings:
  await A.goto(STAFF+'#/seasons'); await A.waitForTimeout(600);
  ok((await A.textContent('#main')).includes('Close and archive'),'seasons view loads');
  await A.goto(STAFF+'#/regos'); await A.waitForTimeout(800);
  ok((await A.textContent('#main')).includes('Message everyone'),'regos has the blast button');
  await A.screenshot({path:SP+'/S6-regos.png',fullPage:true});

  // ---------- FAMILY as parent A ----------
  const P=await mk(390,844);
  await P.goto(FAM); await P.waitForTimeout(2000);
  await P.screenshot({path:SP+'/F0-pick.png'});
  await P.click('button[data-g=parent]'); await P.waitForTimeout(300);
  await P.fill('input[name=email]','test-parent-a@example.com'); await P.fill('input[name=password]','parentA-pass1');
  await P.click('form[data-g=signin] button.pri'); await waitApp(P,'#main');
  const homeTxt=await P.textContent('#main').catch(()=>'' );
  ok(homeTxt.includes('Kid A1')&&homeTxt.includes('Kid A2'),'parent home shows both kids',JSON.stringify(P.errs).slice(0,200));
  ok(homeTxt.includes('Coach TEST Coach')||homeTxt.includes('coach TEST Coach'),'kid card names the coach');
  await P.screenshot({path:SP+'/F1-home.png',fullPage:true});
  // schedule + availability
  await P.goto(FAM+'#/sched'); await P.waitForTimeout(1500);
  const togs=await P.$$('.tog button'); ok(togs.length>0,'schedule has In/Out toggles');
  if(togs.length){ await togs[0].click(); await P.waitForTimeout(1200); }
  await P.screenshot({path:SP+'/F2-sched.png',fullPage:true});
  // chat: coach thread
  await P.goto(FAM+'#/chat'); await P.waitForTimeout(3500);
  const chatTxt=await P.textContent('#main');
  ok(chatTxt.includes('Family chat')&&chatTxt.includes('Coach ·'),'parent sees family + coach threads',chatTxt.slice(0,120));
  ok(chatTxt.includes('Clutch admins'),'parent sees the club thread');
  const convs=await P.$$('.convbtn');
  for(const c of convs){ const t=await c.textContent(); if(t.includes('Coach') && t.includes('Div 1')){ await c.click(); break; } }
  await P.waitForTimeout(1200);
  await P.fill('.tcomp textarea','TEST from parent: is training on this week?');
  await P.click('.tcomp button'); await P.waitForTimeout(1500);
  ok((await P.textContent('#tmsgs')).includes('TEST from parent'),'parent message lands in the coach thread');
  await P.screenshot({path:SP+'/F3-chat.png'});
  // board post (pending)
  await P.goto(FAM+'#/club'); await P.waitForTimeout(1000);
  await P.fill('form[data-form=post] textarea','TEST post: great win on the weekend boys!');
  await P.click('form[data-form=post] button.pri'); await P.waitForTimeout(1500);
  ok((await P.textContent('#main')).includes('waiting for approval'),'parent post shows as waiting');
  await P.screenshot({path:SP+'/F4-club.png',fullPage:true});
  // kid code from parent (More)
  await P.goto(FAM+'#/more'); await P.waitForTimeout(800);
  await P.screenshot({path:SP+'/F5-more.png',fullPage:true});
  const btns=await P.$$('[data-act=kidCode]');
  await btns[0].click(); await P.waitForTimeout(2500);
  const kcode=((await P.textContent('.bigcode'))||'').trim();
  ok(/^\d{6}$/.test(kcode),'parent generates a kid code',kcode);
  await P.click('[data-act=closeSheet]');

  // ---------- FAMILY as the kid ----------
  const K=await mk(390,844);
  await K.goto(FAM); await K.waitForTimeout(1800);
  await K.click('button[data-g=kid]'); await K.waitForTimeout(400);
  await K.screenshot({path:SP+'/K0-code.png'});
  for(let i=0;i<6;i++) await K.fill(`[data-ci="${i}"]`, kcode[i]);
  await K.click('form[data-g=kidgo] button.pri'); await waitApp(K,'#main');
  const kidTxt=await K.textContent('#main').catch(()=>'');
  ok(kidTxt.includes('Kid A1')||kidTxt.toLowerCase().includes('next game')||kidTxt.includes('points'),'kid signs in with the code and sees the hero',JSON.stringify(K.errs).slice(0,300));
  await K.screenshot({path:SP+'/K1-hero.png',fullPage:true});
  // kid chat: family + coach only
  await K.goto(FAM+'#/chat'); await K.waitForTimeout(3500);
  const kChat=await K.textContent('#main');
  ok(kChat.includes('Family chat'),'kid sees the family thread');
  ok(!kChat.includes('Clutch admins'),'kid does NOT see the club/admin thread');
  await K.screenshot({path:SP+'/K2-chat.png'});
  // kid comments... first check board shows nothing pending from others
  await K.goto(FAM+'#/club'); await K.waitForTimeout(1000);
  ok(!(await K.textContent('#main')).includes('great win on the weekend'),'kid cannot see the parent post before approval');

  // ---------- back to STAFF: approve the post ----------
  await A.goto(STAFF+'#/community'); await A.waitForTimeout(3500);
  const q1=await A.textContent('#main');
  ok(q1.includes('great win on the weekend'),'the parent post is in the approval queue');
  await A.click('.modq [data-act=mod][data-v=approved]'); await A.waitForTimeout(1500);
  await A.screenshot({path:SP+'/S7-community.png',fullPage:true});
  // kid should now see it (realtime or reload)
  await K.reload(); await waitApp(K,'#main');
  await K.goto(FAM+'#/club'); await K.waitForTimeout(3000);
  ok((await K.textContent('#main')).includes('great win on the weekend'),'kid sees the post once approved');
  // kid likes + comments
  await K.click('[data-act=like]'); await K.waitForTimeout(800);
  await K.fill('form[data-form=comment] input','TEST comment from the kid');
  await K.click('form[data-form=comment] button'); await K.waitForTimeout(1200);
  ok((await K.textContent('#main')).includes('waiting'),'kid comment is waiting for approval');
  await K.screenshot({path:SP+'/K3-board.png',fullPage:true});
  // coach sees the parent's thread message
  const C=await mk(1440,900);
  await C.goto(STAFF); await C.waitForTimeout(2000);
  await C.fill('input[name=email]','test-coach@example.com'); await C.fill('input[name=password]','coach-pass12');
  await C.click('#gform button.pri'); await waitApp(C,'#shell');
  ok(await C.isVisible('#shell'),'coach signs in');
  const nav=await C.textContent('#nav');
  ok(!nav.includes('Money')&&!nav.includes('Registrations'),'coach nav hides admin-only pages');
  await C.goto(STAFF+'#/messages'); await C.waitForTimeout(3000);
  const convTxt=await C.textContent('#main');
  ok(convTxt.includes('TEST from parent'),'coach sees the parent message preview');
  await C.screenshot({path:SP+'/S8-coach-msgs.png'});
  console.log(failed?`\n${failed} FAILED`:'\nALL PASSED');
  console.log('staff errs',JSON.stringify(A.errs).slice(0,300)); console.log('parent errs',JSON.stringify(P.errs).slice(0,300)); console.log('kid errs',JSON.stringify(K.errs).slice(0,300));
  await b.close(); process.exit(failed?1:0);
})().catch(e=>{console.error('CRASH',e); process.exit(2);});
