'use strict';
// Documents stay inert. Extract text nodes only; never mount a downloaded page.
const originalCache=new Map();
function fileForReading(name) {
  if(name==='Ritual of Apollon')return 'apollon';
  if(name==='Prayer to Zeus for Protection')return 'protection';
  return ({Yehuborim:'yehubor',"Ma'at":'maat'})[name]||name.toLowerCase();
}
function readableText(node) {
  if(!node)return '';
  const copy=node.cloneNode(true);
  copy.querySelectorAll('script,style,svg,button,img,.ritual-step-type,.eye-left,.eye-right,[aria-hidden="true"]').forEach(e=>e.remove());
  copy.querySelectorAll('br').forEach(e=>e.replaceWith('\n'));
  copy.querySelectorAll('p,li,div').forEach(e=>e.append('\n'));
  return copy.textContent.replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
async function readOriginal(name) {
  const slug=fileForReading(name);
  if(originalCache.has(slug))return originalCache.get(slug);
  const promise=(async()=>{
    let html;
    if(window.noesisLocalPages?.[slug]) {
      const bytes=Uint8Array.from(atob(window.noesisLocalPages[slug]),c=>c.charCodeAt(0));
      html=new TextDecoder().decode(bytes);
    }else{
      if(location.protocol==='file:')return null;
      const result=await fetch('./readings/'+slug+'.html');
      if(!result.ok)return null;
      html=await result.text();
    }
    const template=document.createElement('template');
    template.innerHTML=html;
    const doc=template.content;
    if(slug==='apollon'){
      const steps=[...doc.querySelectorAll('main .ritual-step')].map(readableText);
      if(steps.length!==17)return null;
      return {steps,ending:readableText(doc.querySelector('.ritual-final-step')),intro:readableText(doc.querySelector('.ritual-intro-inner')),close:readableText(doc.querySelector('.ritual-ending-box'))};
    }
    if(slug==='protection'){
      const heading=[...doc.querySelectorAll('h2')].find(h=>h.textContent.trim()==='The Prayer');
      const quote=heading?.parentElement?.querySelector('blockquote') || doc.querySelector('.legacy-content blockquote, .article-reading blockquote');
      return quote?readableText(quote):null;
    }
    const heading=[...doc.querySelectorAll('h3,h2')].find(h=>/prayer by osiris/i.test(h.textContent));
    if(heading?.nextElementSibling)return readableText(heading.nextElementSibling);
    if(slug==='maat'||slug==='izfet')return readableText(doc.querySelector('.legacy-content'));
    return null;
  })().catch(()=>null);
  originalCache.set(slug,promise);
  return promise;
}
let readerTicket=0;
let largePrint=false;
function originalPrayer(title,kind) {
  const ticket=++readerTicket;
  const href=title==='Prayer to Zeus for Protection'?temple+'prayer':sourceFor(title);
  readerHeader(title,kind,href,'Original page');
  $('reader').classList.remove('apollo-mode');
  const body=$('reader-body'),actions=$('reader-actions');
  body.replaceChildren(el('p','Opening reading…'));
  actions.replaceChildren();
  readOriginal(title).then(full=>{
    if(ticket!==readerTicket||!$('reader').open)return;
    const isTeaching=title==="Ma'at"||title==='Izfet';
    if(!full){
      body.replaceChildren(el('p','The full text is available in the personal edition and on the official page.'));
      const open=el('a','Read full text ↗','action primary');
      open.href=href;open.target='_blank';open.rel='noopener';
      actions.replaceChildren(open,button('Log after reading',()=>finishRite(title)));
      return;
    }
    const article=el('article',undefined,'full-prayer');
    article.classList.toggle('large-type',largePrint);
    const paragraphs=full.split(/\n+/).map(p=>p.trim()).filter(Boolean);
    for(const p of paragraphs)article.append(el('p',p));
    const font=button(largePrint?'Standard text':'Larger text',()=>{
      largePrint=!largePrint;article.classList.toggle('large-type',largePrint);
      font.textContent=largePrint?'Standard text':'Larger text';
    });
    body.replaceChildren(el('p',isTeaching?'Seasonal teaching · full reading':'Full prayer · read aloud at your own pace','tiny'),article);
    actions.replaceChildren(button('Finish & save seal',()=>finishRite(title),true),font);
  });
}
let apolloBook=null;
let apolloSigil='https://tozrituals.org/images/sigils/Apollo_1.svg';
let ritualActive=false;
const runeGlyph={Fehu:'ᚠ',Laguz:'ᛚ',Berkano:'ᛒ',Ansuz:'ᚨ',Sowilo:'ᛋ',Algiz:'ᛉ',Othala:'ᛟ',Mannaz:'ᛗ',Eihwaz:'ᛇ',Kenaz:'ᚲ',Wunjo:'ᚹ',Tiwaz:'ᛏ',Thurisaz:'ᚦ'};
async function openApollo() {
  const ticket=++readerTicket;
  readerHeader('Ritual of Apollon','Ritual sanctuary',apolloSource,'Official ritual & sigil');
  $('reader').classList.add('apollo-mode');
  $('reader-body').textContent='Opening sanctuary…';$('reader-actions').replaceChildren();
  apolloBook=await readOriginal('Ritual of Apollon');
  if(ticket!==readerTicket||!$('reader').open)return;
  ritualActive=true;drawApollo();
}
function drawApollo() {
  const step=data.apolloStep||0, [heading,guide,sets]=apolloStages[step];
  const groupSize=step===9?3:sets.length*10;
  const count=Math.min(data.apolloMark||0,groupSize);
  const counted=sets.length?count:0;
  const cumulative=apolloStages.slice(0,step).reduce((n,row)=>n+row[2].length*10,0)+counted;
  const body=$('reader-body'),actions=$('reader-actions');
  const setMode=groupSize && count<groupSize;
  const name=step===9?'Closing affirmation':sets[Math.floor(count/10)]||heading;
  const cycle=step===9?3:10;
  const currentCount=step===9?count:count%10;
  const ledger=el('div',undefined,'ritual-ledger');
  ledger.append(el('span',heading),el('strong',cumulative+' / 210'));
  const meter=el('progress',undefined,'reading-progress');meter.max=210;meter.value=cumulative;meter.setAttribute('aria-label','Vibrations counted');
  const write=(i,n)=>{
    save(previous=>({...previous,apolloStep:i,apolloMark:n}));
    drawApollo();
  };
  const tap=()=>{
    if(!ritualActive||!$('reader').open||!setMode)return;
    write(step,count+1);
    const face=$('reader-body').querySelector('.counter-face');
    if(face)face.focus({preventScroll:true});
  };
  const stage=el('div',undefined,'altar-stage');
  const face=el(setMode?'button':'div',undefined,'counter-face');
  const img=el('img');img.src=window.noesisPrivateSigil||apolloSigil;img.alt='Apollon’s ritual sigil';
  img.onerror=()=>{img.hidden=true;face.classList.add('no-sigil');};
  face.append(img);
  if(setMode){
    face.type='button';
    face.setAttribute('aria-label','Count one '+name+' repetition');
    face.onclick=tap;
    face.style.setProperty('--arc',(360*currentCount/cycle)+'deg');
  }
  stage.append(face);
  const meta=el('div',undefined,'altar-meta');
  if(setMode){
    const rune=el('div',runeGlyph[name]||'☼','rune-display');rune.setAttribute('aria-hidden','true');
    meta.append(rune,el('h3',name),el('div',currentCount+' / '+cycle,'counter'),el('p','Tap the sigil once after each repetition.','tiny'));
    const beads=el('div',undefined,'beads');
    for(let n=0;n<cycle;n++)beads.append(el('i',undefined,n<currentCount?'lit':''));
    meta.append(beads);
  }else {
    meta.append(el('h3',step===0?'Opening invocation':step===10?'Rest in silence':step===9?'Final salutation':'Affirmation'));
    if(groupSize)meta.append(el('p','✓ Set complete','tag'));
    meta.append(el('p',step===0?'Settle your gaze on the sigil, then speak the opening invocation.':step===10?'Take a few quiet minutes before recording your practice.':'Speak the passage below at your own pace.','tiny'));
  }
  stage.append(meta);
  body.replaceChildren(ledger,meter,stage);
  if(sets.length)body.append(el('p',sets.map((s,i)=>(count>=10*(i+1)?'✓ ':'')+s).join('   ·   '),'set-list'));
  let passage='';
  if(apolloBook){
    if(step===0)passage=apolloBook.steps[0];
    else if(step>=1&&step<=7&&!setMode)passage=apolloBook.steps[step*2];
    else if(step===9)passage=apolloBook.steps[16]+(apolloBook.close?'\n'+apolloBook.close:'');
    else if(step===10)passage=apolloBook.ending;
  }
  if(passage)body.append(el('div',passage,'ritual-script'));
  else if(!setMode && step!==8 && !apolloBook){
    const link=el('a','Read this passage in the official ritual ↗','reading-link');
    link.href=apolloSource;link.target='_blank';link.rel='noopener';body.append(link);
  }
  actions.replaceChildren();
  if(!setMode){
    const next=step===0?'Begin rune practice':step===8?'Begin closing affirmation':step===9?'Enter reflection':step===10?'Finish & save seal':'Start next set';
    actions.append(button(next,()=>{if(step===10){ritualActive=false;finishRite('Ritual of Apollon');}else write(step+1,0);},true));
  }
  if(count>0)actions.append(button('Undo last count',()=>write(step,count-1)));
  else if(step>0)actions.append(button('Back one stage',()=>write(step-1,apolloStages[step-1][2].length*10 || (step-1===9?3:0))));
  body.append(el('p','Progress saved · you can close and return here.','tiny'));
}
$('reader').addEventListener('close',()=>{if(document.getElementById('reader').open)return;readerTicket++;ritualActive=false;$('reader').classList.remove('apollo-mode');});

