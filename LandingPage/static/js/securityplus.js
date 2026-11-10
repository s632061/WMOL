(() => {
 'use strict';
 const root = document.getElementById('securityplusPage');if(!root)return;
 const config=window.WMOL_SECURITYPLUS_CONFIG || {};
 const base=config.assetBase || '/static/img/securityplus/';
 // Only publish verified download links for this app; disabled choices are visible but inert.
 root.querySelectorAll('[data-sp-platform]').forEach(a=>{const name=a.dataset.spPlatform,url=(config.downloads||{})[name]||'';if(url && /^https:\/\//i.test(url)){a.href=url;a.removeAttribute('aria-disabled');a.querySelector('small').textContent='Download';}else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.querySelector('small').textContent='Coming soon';}});
 const heroImg=root.querySelector('[data-sp-hero-image]');
 if(heroImg && config.homeScreenshotReady){const test=new Image();test.onload=()=>{heroImg.src=test.src;heroImg.hidden=false;root.querySelector('[data-sp-hero-placeholder]').hidden=true;};test.src=base+(config.homeScreenshot||'home.png');}
 const captions = [
  ['Always know what to do next','See how the system works, open your study plan, and get started from day one.','Welcome'],
  ['Your study plan, step by step.','See how studying, practice, review, and recovery fit together across the 25-week plan. Follow the performance system with a clear next step each day.','Study plan'],
  ['Get straight to what matters','See what you need to learn next and open the resources for that part of the plan. Spend your time learning with the material already organized for you.','Resources'],
  ['Make it make sense','Work through Security+ concepts with clear explanations and concrete examples.','Explanation'],
  ['Your resources, side by side.','Keep the companion beside your other resources on a computer so you can work through your IDEAS without losing your place.','Desktop'],
  ['Put what you know to work','Work through a practice question and use the explanation to check your understanding of the security decision.','Practice'],
  ['Review with a reason','Choose what to practice, revisit questions you missed, and use the explanations to strengthen your understanding.','Review'],
  ['Light or dark mode','Choose the appearance you prefer for studying, practice, and review.','Appearance'],
  ['Put your preparation to the test','Use the Exam Phase to practice applying concepts across the certification objectives.','Exam Phase']
 ];
 const slideImg=root.querySelector('[data-sp-slide-image]');const place=root.querySelector('[data-sp-gallery-placeholder]');
 const stage=root.querySelector('[data-sp-tour-frame]');const title=root.querySelector('[data-sp-slide-title]');const caption=root.querySelector('[data-sp-slide-caption]');
 const thumbs=[...root.querySelectorAll('[data-sp-thumb]')];let active=0;let renderVersion=0;
 function show(index){if(index<0||index>=captions.length)return;active=index;const current=++renderVersion;const [h,p,short]=captions[index];title.textContent=h;caption.textContent=p;place.querySelector('strong').textContent=short;place.hidden=false;slideImg.hidden=true;slideImg.removeAttribute('src');const slot=(config.slides||[])[index]||[];const shape=slot[1]||'portrait';stage.dataset.shape=shape;
  if(config.screenshotReady && slot[0]){const im=new Image();im.onload=()=>{if(current!==renderVersion)return;slideImg.src=im.src;slideImg.alt='Security+ Companion App — '+short;slideImg.hidden=false;place.hidden=true;};im.onerror=()=>{if(current!==renderVersion)return;slideImg.hidden=true;place.hidden=false;};im.src=base+slot[0];}
  root.querySelector('[data-sp-prev]').disabled=index===0;root.querySelector('[data-sp-next]').disabled=index===captions.length-1;
  thumbs.forEach((b,k)=>{const n=index+k-1;const isValid=n>=0&&n<captions.length;b.disabled=!isValid;b.hidden=!isValid;b.dataset.active=String(k===1);if(!isValid){b.textContent='';return;}const item=captions[n];b.dataset.target=String(n);b.replaceChildren();const icon=document.createElement('b');icon.textContent=String(n+1).padStart(2,'0');const label=document.createElement('small');label.textContent=item[2];b.append(icon,label);b.setAttribute('aria-label','Show image '+(n+1)+': '+item[2]);if(config.screenshotReady && (config.slides||[])[n]?.[0]){const thumb=new Image();thumb.alt='';thumb.loading='lazy';thumb.onload=()=>{if(+b.dataset.target===n && !b.hidden) b.insertBefore(thumb,icon)};thumb.src=base+config.slides[n][0];}}
  );
 }
 root.querySelector('[data-sp-prev]').addEventListener('click',()=>show(active-1));root.querySelector('[data-sp-next]').addEventListener('click',()=>show(active+1));
 thumbs.forEach(b=>b.addEventListener('click',()=>{if(!b.disabled)show(+b.dataset.target)}));
 root.querySelector('[data-sp-tour]').addEventListener('keydown',e=>{if(e.target.matches('button,a'))return;if(e.key==='ArrowLeft'){e.preventDefault();show(active-1);}if(e.key==='ArrowRight'){e.preventDefault();show(active+1);}});
 // Touch swipes only when the user actually swipes the image stage.
 let touchX=null;stage.addEventListener('touchstart',e=>{if(e.touches.length===1)touchX=e.touches[0].clientX;},{passive:true});stage.addEventListener('touchend',e=>{if(touchX===null)return;const diff=e.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(diff)>55)show(active+(diff<0?1:-1));},{passive:true});
 show(0);
 const tabs=[...root.querySelectorAll('[data-sp-tab]')];function select(name,updateHash=false){tabs.forEach(b=>{let on=b.dataset.spTab===name;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;root.querySelector('[data-sp-panel="'+b.dataset.spTab+'"]').hidden=!on;});if(updateHash)history.replaceState(null,'','#'+(name==='contact'?'contact':name==='terms'?'terms-of-use':'privacy-policy'));}
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>select(b.dataset.spTab,true));b.addEventListener('keydown',e=>{let j=i;if(e.key==='ArrowRight')j=(i+1)%tabs.length;else if(e.key==='ArrowLeft')j=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=tabs.length-1;else return;e.preventDefault();select(tabs[j].dataset.spTab,true);tabs[j].focus();});});
 function syncHash(){const hash=location.hash.replace('#','');if(hash==='terms-of-use'||hash==='terms')select('terms');else if(hash==='privacy-policy'||hash==='privacy')select('privacy');else if(hash==='contact')select('contact');}
 window.addEventListener('hashchange',syncHash);syncHash();
 // Suppress an inactive result / unsupported purchase claim; expose unverified price as an explicit placeholder.
 const price=root.querySelector('[data-sp-price]');if(price){if(typeof config.monthlyUSD==='number'&&config.monthlyUSD>=0){price.textContent='$'+config.monthlyUSD.toFixed(2);}else{price.textContent='Price to be confirmed';}}
})();
