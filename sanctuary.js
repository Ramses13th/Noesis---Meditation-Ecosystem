'use strict';

const temple = 'https://templeofzeus.org/';
const apolloSource = 'https://tozrituals.org/rituals/god/apollo-azazel-power-ritual';
const seasons = [
  [2,1,'Anthesteria','1–2 Feb',['Sahukathar'],['Sahiburah']],
  [3,20,'Earine Isemeria','20–21 Mar',['Epistemodia'],['Epistemot']],
  [4,30,'Thargelia','30 Apr–1 May',['Theoteknia'],['Eilotil']],
  [6,23,'Therinai Tropai','23–24 Jun',['Hierologia','Diaugeia'],['Birburim','Atibilibil']],
  [7,31,'Thalysia','31 Jul–1 Aug',['Eunomia'],['Varvarim']],
  [9,20,'Phthinoporine Isemeria','20–21 Sep',['Pantomysteia'],['Kagoim']],
  [10,31,'Genesia','31 Oct–1 Nov',['Alethomnesis'],['Istoriyach']],
  [12,22,'Cheimerinai Tropai','22–23 Dec',['Theophoros',"Ma'at"],['Yehuborim','Izfet']]
];
// Calendar dates are local civil days. A festival vigil begins the new season.
function seasonAt(date) {
  const mmdd = (date.getMonth()+1)*100 + date.getDate();
  return seasons.filter(s=>s[0]*100+s[1]<=mmdd).at(-1) || seasons.at(-1);
}
function art(index) {
  const icon=el('i',undefined,'item-art');
  icon.style.setProperty('--x',index%4);
  icon.style.setProperty('--y',Math.floor(index/4));
  icon.setAttribute('aria-hidden','true');
  return icon;
}
function button(text,handler,primary=false) {
  const b=el('button',text,'action'+(primary?' primary':''));
  b.type='button'; b.onclick=handler;
  return b;
}
function riteID(title) { return 'rite/'+dayKey(new Date())+'/'+title; }
function completed(title) { return data.entries.some(e=>e.id===riteID(title)); }
function finishRite(title) {
  const id=riteID(title);
  save(previous=>{
    const entries=previous.entries.some(e=>e.id===id)?previous.entries:[...previous.entries,
      {id,date:Date.now(),tool:null,level:0,seconds:0,note:'',focus:0,complete:false,rite:title}];
    return {...previous,entries,...(title==='Ritual of Apollon'?{apolloMark:0,apolloStep:0}:{})};
  });
  $('reader-body').replaceChildren(art(3),el('h3','Practice recorded'),el('p','Your journal now holds today’s seal for '+title+'.'));
  $('reader-actions').replaceChildren(button('Done',()=>$('reader').close(),true));
  $('reader').classList.remove('apollo-mode');
  renderRites();
}
function riteCard(title,kind,index,open) {
  const b=button('',open);
  b.classList.add('rite-button');
  const copy=el('span');
  copy.append(el('small',kind+(completed(title)?' · ✓ Logged today':'')),el('b',title));
  b.append(art(index),copy);
  return b;
}
function sourceFor(name) {
  const slug=({Yehuborim:'yehubor',"Ma'at":'maat'})[name] || name.toLowerCase();
  return temple+'liturgical-terms-'+slug;
}
function readerHeader(title,kind,href,sourceLabel) {
  $('reader-title').textContent=title;
  $('reader-kind').textContent=kind;
  $('reader-source').href=href;
  $('reader-source').textContent=sourceLabel+' ↗';
  if (!$('reader').open) $('reader').showModal();
  $('reader').scrollTop=0;
}
const apolloStages = [
  ['Prepare','Open the official ritual for the sigil and spoken affirmations. Set your device where you can use the counter comfortably.',[]],
  ['First rune group','Read the opening affirmation, then count each rune. Follow the group with its affirmation.',['Fehu','Laguz','Berkano']],
  ['Second rune group','Count the runes, then read the second group’s affirmation.',['Ansuz','Sowilo','Algiz']],
  ['Third rune group','Count each rune, then return to the sigil for the affirmation.',['Othala','Mannaz','Eihwaz']],
  ['Fourth rune group','Follow this group with the corresponding affirmation.',['Kenaz','Sowilo','Wunjo']],
  ['Fifth rune group','Count each set and read the accompanying affirmation.',['Tiwaz','Sowilo','Thurisaz']],
  ['Sixth rune group','Complete these sets and their affirmation.',['Algiz','Sowilo','Berkano']],
  ['Name of Apollon','After this set, read the restoration passage in the official ritual.',['A-PO-LON']],
  ['Closing vibrations','Complete the two sets in order.',['ZEFS AENAOS','SATANAMA']],
  ['Closing affirmation','Speak the closing affirmation three times, then give the final salutation once.',[]],
  ['Quiet reflection','Rest your attention on the official sigil, then take a few quiet minutes for reflection.',[]]
];
function renderRites() {
  const now=new Date(), season=seasonAt(now), next=seasons[(seasons.indexOf(season)+1)%seasons.length];
  $('rite-date').textContent=new Intl.DateTimeFormat('en-GB',{dateStyle:'full'}).format(now);
  $('season-name').textContent=season[2]+' season';
  $('season-next').textContent='Next festival · '+next[2]+' · '+next[3];
  $('atlas-season').textContent='Cure · '+season[4].join(' & ')+'   /   Banish · '+season[5].join(' & ');
  const cards=[];
  for(const [names,label,index] of [[season[4],'Cure',8],[season[5],'Banish',10]]) {
    for(const name of names) cards.push(riteCard(name,label,index,()=>originalPrayer(name,label)));
  }
  $('season-pair').replaceChildren(...cards);
  $('regular-rites').replaceChildren(riteCard('Ritual of Apollon','Guided counter · about 25 min',0,()=>openApollo()),
    riteCard('Prayer to Zeus for Protection','Prayer reader',6,()=>originalPrayer('Prayer to Zeus for Protection','Protection')));
  $('wheel').replaceChildren(...seasons.map(s=>el('div',s[3]+' · '+s[2]+' · Cure: '+s[4].join(' & ')+' / Banish: '+s[5].join(' & '),'wheel-row'+(s===season?' current':''))));
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderRites();});
let lastCalendarDay=dayKey(new Date());
setInterval(()=>{const today=dayKey(new Date());if(today!==lastCalendarDay){lastCalendarDay=today;renderRites();}},30000);
$('quiet-clock').onchange=()=>save(prev=>({...prev,quietClock:$('quiet-clock').checked}));
$('note-dialog').addEventListener('close',()=>{
  if($('note-dialog').dataset.session==='yes'){
    $('note-dialog').dataset.session='';
    location.hash='atlas';go('atlas');window.scrollTo(0,0);
  }
});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
renderRites();

async function makeTransferCode(snapshot) {
  const packet=[1,snapshot.goal,!!snapshot.paper,snapshot.sound!==false,!!snapshot.quietClock,
    snapshot.checkpoint??null,snapshot.mastered,snapshot.apolloStep||0,snapshot.apolloMark||0,
    snapshot.entries.map(e=>[e.id,e.date,e.tool,e.level,e.seconds,e.complete?1:0,e.focus,e.note,e.rite||'',e.updated||e.date]),snapshot.readings||{}];
  const raw=new TextEncoder().encode(JSON.stringify(packet));
  let bytes=raw,mode='R';
  if(typeof CompressionStream==='function'){
    const packed=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    if(packed.length<raw.length){bytes=packed;mode='G';}
  }
  let binary='';
  for(let start=0;start<bytes.length;start+=8192)binary+=String.fromCharCode(...bytes.subarray(start,start+8192));
  return 'NOESIS1-'+mode+'-'+btoa(binary).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
async function readTransferCode(code) {
  const match=code.replace(/\s/g,'').match(/^NOESIS1-([RG])-([A-Za-z0-9_-]+)$/);
  if(!match)throw Error('Paste the entire code beginning with NOESIS1-.');
  let bytes=Uint8Array.from(atob(match[2].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  if(match[1]==='G'){
    if(typeof DecompressionStream!=='function')throw Error('Use a current browser for this compressed code, or import a JSON file.');
    bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }
  const [ver,goal,paper,sound,quietClock,checkpoint,mastered,apolloStep,apolloMark,rows,readings]=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(ver!==1||!Array.isArray(rows))throw Error('Unsupported transfer code.');
  return normalize({goal,paper,sound,quietClock,checkpoint,mastered,apolloStep,apolloMark,readings,
    entries:rows.map(([id,date,tool,level,seconds,done,focus,note,rite,updated])=>({id,date,tool,level,seconds,complete:done===1,focus,note,rite,updated}))});
}
function importJourney(backup) {
  const stored=save(previous=>{
    const items=new Map(previous.entries.map(e=>[e.id,e]));
    for(const e of backup.entries){
      const old=items.get(e.id);
      if(!old || (e.updated||e.date)>(old.updated||old.date))items.set(e.id,e);
    }
    return {...previous,...backup,entries:[...items.values()],readings:{...previous.readings,...backup.readings},
      checkpoint:backup.checkpoint??previous.checkpoint,mastered:[...new Set([...previous.mastered,...backup.mastered])]};
  });
  selected.dot=lastStage();renderPractice();go(view);renderRites();
  return stored;
}
document.querySelectorAll('.transfer-open').forEach(b=>b.onclick=()=>{
  $('transfer-code').value='';$('transfer-status').textContent='';$('transfer').showModal();
});
$('copy-code').onclick=async()=>{
  try{
    const code=await makeTransferCode(data);
    $('transfer-code').value=code;
    try{await navigator.clipboard.writeText(code);$('transfer-status').textContent='Copied. Paste this code into Restore code on your other device.';}
    catch{$('transfer-code').focus();$('transfer-code').select();$('transfer-status').textContent='Your code is selected. Use Copy on your device.';}
  }catch{$('transfer-status').textContent='Code creation failed. You can also export a file from Journal.';}
};
$('restore-code').onclick=async()=>{
  try{
    const backup=await readTransferCode($('transfer-code').value);
    const stored=importJourney(backup);
    $('transfer-status').textContent=stored?'Restored. Your journal now has '+data.entries.length+' entries. Existing sessions have been kept.':'Restored in memory. Storage is unavailable on this device.';
  }catch(e){$('transfer-status').textContent=e.message.startsWith('Use a current')?e.message:'Could not restore. Paste the complete Noesis code and try again.';}
};
$('backup-file').onchange=async()=>{
  const file=$('backup-file').files[0];$('backup-file').value='';
  if(!file)return;
  try{const stored=importJourney(normalize(JSON.parse(await file.text())));if(stored)toast('Backup restored.');}
  catch{toast('Choose a valid Noesis JSON backup.');}
};
