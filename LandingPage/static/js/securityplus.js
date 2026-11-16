(() => {
 'use strict';
 const root = document.getElementById('securityplusPage');if(!root)return;
 const config=window.WMOL_SECURITYPLUS_CONFIG || {};
 const base=config.assetBase || '/static/img/securityplus/';
 // Only publish verified download links for this app; disabled choices are visible but inert.
 root.querySelectorAll('[data-sp-platform]').forEach(a=>{const name=a.dataset.spPlatform,url=(config.downloads||{})[name]||'';if(url && /^https:\/\//i.test(url)){a.href=url;a.removeAttribute('aria-disabled');a.querySelector('small').textContent='Download';}else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.querySelector('small').textContent='Coming soon';}});
 const heroImg=root.querySelector('[data-sp-hero-image]');
 if(heroImg && config.homeScreenshotReady){const test=new Image();test.onload=()=>{heroImg.src=test.src;heroImg.hidden=false;root.querySelector('[data-sp-hero-placeholder]').hidden=true;};test.src=base+(config.homeScreenshot||'home.png');}
 // The fixed-size screenshot gallery and viewer live in securityplus-gallery-v19.js.
 const tabs=[...root.querySelectorAll('[data-sp-tab]')];function select(name,updateHash=false){tabs.forEach(b=>{let on=b.dataset.spTab===name;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;root.querySelector('[data-sp-panel="'+b.dataset.spTab+'"]').hidden=!on;});if(updateHash)history.replaceState(null,'','#'+(name==='contact'?'contact':name==='terms'?'terms-of-use':'privacy-policy'));}
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>select(b.dataset.spTab,true));b.addEventListener('keydown',e=>{let j=i;if(e.key==='ArrowRight')j=(i+1)%tabs.length;else if(e.key==='ArrowLeft')j=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=tabs.length-1;else return;e.preventDefault();select(tabs[j].dataset.spTab,true);tabs[j].focus();});});
 function syncHash(){const hash=location.hash.replace('#','');if(hash==='terms-of-use'||hash==='terms')select('terms');else if(hash==='privacy-policy'||hash==='privacy')select('privacy');else if(hash==='contact')select('contact');}
 window.addEventListener('hashchange',syncHash);syncHash();
 // Suppress an inactive result / unsupported purchase claim; expose unverified price as an explicit placeholder.
 const price=root.querySelector('[data-sp-price]');if(price){if(typeof config.monthlyUSD==='number'&&config.monthlyUSD>=0){price.textContent='$'+config.monthlyUSD.toFixed(2);}else{price.textContent='Price to be confirmed';}}
})();
