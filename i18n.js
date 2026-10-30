/* WhiteSheep Game Studio: client-side i18n without external dependencies. */
(()=>{
'use strict';
const languages={"ko":{"lang.label":"언어 변경","nav.apps":"게임과 앱","nav.about":"스튜디오","nav.support":"문의","footer.privacy":"웹사이트 개인정보 안내"},"ja":{"lang.label":"言語を変更","nav.apps":"ゲーム・アプリ","nav.about":"スタジオ","nav.support":"お問い合わせ","footer.privacy":"ウェブサイトのプライバシー"},"en":{"lang.label":"Change language","nav.apps":"Games & Apps","nav.about":"Studio","nav.support":"Contact","footer.privacy":"Website Privacy"}};
const selected=(()=>{try{return localStorage.getItem('whitesheep-language')}catch{return null}})();
const browser=(navigator.language||'ko').toLowerCase().split('-')[0];
let lang=languages[selected]?selected:(languages[browser]?browser:'ko');
const picker=document.querySelector('.language-picker');
const trigger=document.getElementById('language-trigger');
const menu=document.getElementById('language-menu');
if(!picker||!trigger||!menu)return;
const names={ko:'한국어',ja:'日本語',en:'English'};
const originals=new WeakMap();
const lookup=(text,language)=>{
  if(language==='ko')return text;
  const dict=window.WHITESHEEP_TRANSLATIONS?.[language]||{};
  return Object.prototype.hasOwnProperty.call(dict,text)?dict[text]:text;
};
function translateText(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];let node;
  while((node=walker.nextNode())){
    const parent=node.parentElement;
    if(!parent||parent.closest('script,style,svg,.language-picker'))continue;
    if(!node.nodeValue.trim())continue;
    nodes.push(node);
  }
  for(const textNode of nodes){
    if(!originals.has(textNode))originals.set(textNode,textNode.nodeValue);
    const original=originals.get(textNode);
    const match=original.match(/^(\\s*)([\\s\\S]*?)(\\s*)$/);
    if(match)textNode.nodeValue=match[1]+lookup(match[2],lang)+match[3];
  }
  const elements=document.querySelectorAll('[placeholder],[aria-label],[alt]');
  for(const el of elements){for(const attr of ['placeholder','aria-label','alt']){
    if(!el.hasAttribute(attr))continue;
    const key='data-i18n-original-'+attr;
    if(!el.hasAttribute(key))el.setAttribute(key,el.getAttribute(attr));
    el.setAttribute(attr,lookup(el.getAttribute(key),lang));
  }}
}
function apply(){
 document.documentElement.lang=lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=languages[lang][el.dataset.i18n]||languages.ko[el.dataset.i18n]||el.textContent});
 picker.querySelector('.current-language').textContent=names[lang];
 menu.querySelectorAll('[data-language]').forEach(b=>{let active=b.dataset.language===lang;b.setAttribute('aria-checked',String(active));b.querySelector('.language-check').textContent=active?'✓':''});
 translateText();
}
function close(){menu.hidden=true;trigger.setAttribute('aria-expanded','false')}
trigger.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('[data-language="'+lang+'"]').focus()});
menu.addEventListener('click',event=>{const b=event.target.closest('[data-language]');if(!b)return;lang=b.dataset.language;try{localStorage.setItem('whitesheep-language',lang)}catch{}apply();close();trigger.focus()});
document.addEventListener('click',e=>{if(!picker.contains(e.target))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){close();trigger.focus()}});
apply();
})();
