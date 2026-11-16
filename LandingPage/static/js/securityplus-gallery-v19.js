(() => {
 'use strict';
 const root=document.getElementById('securityplusPage');if(!root)return;
 const config=window.WMOL_SECURITYPLUS_CONFIG || {};
 const base=config.assetBase || '/static/img/securityplus/';
 const captions = [
  ['Always know what to do next','See how the system works, open your study plan, and get started from day one.','Welcome'],
  ['Your study plan, step by step.','See how studying, practice, review, and recovery fit together across the 25-week plan. Follow the performance system with a clear next step each day.','Study plan'],
  ['Get straight to what matters','See what you need to learn next and open the resources for that part of the plan. Spend your time learning with the material already organized for you.','Resources'],
  ['Make it make sense','Work through Security+ concepts with clear explanations and concrete examples.','Explanation'],
  ['Your resources, side by side.','Keep the companion beside your other resources on a computer so you can work through your IDEAS without losing your place.','Desktop'],
  ['Put what you know to work','Work through a practice question and use the explanation to check your understanding of the security decision.','Practice'],
  ['Review with a reason','Choose what to practice, revisit questions you missed, and use the explanations to strengthen your understanding.','Review'],
  ['Light or dark mode','Choose the appearance you prefer for studying, practice, and review.','Light Mode']
 ];

 const slideImg=root.querySelector('[data-sp-slide-image]');
 const place=root.querySelector('[data-sp-gallery-placeholder]');
 const stage=root.querySelector('[data-sp-tour-frame]');
 const imageButton=root.querySelector('[data-sp-open-preview]');
 const copy=root.querySelector('[data-sp-slide-copy]');
 const thumbs=[...root.querySelectorAll('[data-sp-thumb]')];
 const dotsBox=root.querySelector('[data-sp-dots]');
 const progress=root.querySelector('[data-sp-slide-count]');
 const previous=root.querySelector('[data-sp-prev]');
 const next=root.querySelector('[data-sp-next]');
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let active=0, displayed=0, renderVersion=0, swiped=false;
 let outgoing=null;
 // All captions occupy one grid cell. The tallest reserves the space at every
 // viewport width; switching slides never moves the controls or page below it.
 const descriptions=captions.map(([heading,description],index)=>{
  const panel=document.createElement('div');panel.className='sp-slide-description';
  const h=document.createElement('h3');h.textContent=heading;
  const p=document.createElement('p');p.textContent=description;
  panel.append(h,p);panel.classList.toggle('is-current',index===0);
  panel.setAttribute('aria-hidden',String(index!==0));return panel;
 });
 copy.replaceChildren(...descriptions);
 const dots=captions.map((_,index)=>{
  const button=document.createElement('button');button.type='button';button.className='sp-dot';
  button.addEventListener('click',()=>show(index));dotsBox.append(button);return button;
 });
 // Decode ahead of time. Keep the current image visible during a slow request.
 const images=new Map();
 function loadImage(index){
  if(images.has(index))return images.get(index);
  const promise=new Promise(resolve=>{
   const file=(config.slides||[])[index]?.[0];
   if(!config.screenshotReady||!file){resolve(null);return;}
   const image=new Image();
   image.onload=async()=>{try{await image.decode();}catch(_){}resolve(image);};
   image.onerror=()=>resolve(null);image.src=base+file;
  });
  images.set(index,promise);return promise;
 }
 function updateControls(index){
  previous.disabled=index===0;next.disabled=index===captions.length-1;
  progress.textContent=(index+1)+'/'+captions.length;
  dots.forEach((button,i)=>{
   button.classList.toggle('is-current',i===index);
   button.setAttribute('aria-pressed',String(i===index));
   button.setAttribute('aria-label','Show gallery slide '+(i+1)+' of '+captions.length+': '+captions[i][2]);
  });
  thumbs.forEach((button,offset)=>{
   const target=index+offset-1, valid=target>=0&&target<captions.length;
   button.disabled=!valid;button.dataset.empty=String(!valid);
   button.tabIndex=valid?0:-1;button.setAttribute('aria-hidden',String(!valid));
   button.dataset.active=String(offset===1);button.replaceChildren();
   if(!valid){button.removeAttribute('aria-label');return;}
   button.dataset.target=String(target);
   button.setAttribute('aria-label','Show image '+(target+1)+': '+captions[target][2]);
   button.setAttribute('aria-pressed',String(offset===1));
   const number=document.createElement('b');number.textContent=String(target+1).padStart(2,'0');
   const label=document.createElement('small');label.textContent=captions[target][2];
   const file=(config.slides||[])[target]?.[0];
   if(file){const image=new Image();image.alt='';image.src=base+file;button.append(image);}
   button.append(number,label);
  });
 }
 async function show(index){
  if(index<0||index>=captions.length)return;
  const direction=index>=active?1:-1, current=++renderVersion;active=index;
  updateControls(index);stage.setAttribute('aria-busy','true');
  const image=await loadImage(index);
  if(current!==renderVersion)return;
  slideImg.getAnimations().forEach(animation=>animation.cancel());
  if(outgoing){outgoing.remove();outgoing=null;}
  const changed=displayed!==index;
  if(image&&changed&&!slideImg.hidden&&!reducedMotion.matches&&typeof slideImg.animate==='function'){
   const ghost=slideImg.cloneNode();ghost.removeAttribute('data-sp-slide-image');
   ghost.alt='';ghost.setAttribute('aria-hidden','true');ghost.className='sp-outgoing-image';
   imageButton.append(ghost);outgoing=ghost;
   const fade=ghost.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX('+(-direction*10)+'px)'}],{duration:240,easing:'ease-out'});
   fade.onfinish=()=>{ghost.remove();if(outgoing===ghost)outgoing=null;};
  }
  displayed=index;
  descriptions.forEach((panel,i)=>{panel.classList.toggle('is-current',i===index);panel.setAttribute('aria-hidden',String(i!==index));});
  place.querySelector('strong').textContent=captions[index][2];
  stage.dataset.shape=(config.slides||[])[index]?.[1]||'portrait';
  imageButton.setAttribute('aria-label','Enlarge screenshot: '+captions[index][2]);
  imageButton.disabled=!image;place.hidden=!!image;slideImg.hidden=!image;
  if(image){
   slideImg.src=image.src;slideImg.width=image.naturalWidth;slideImg.height=image.naturalHeight;
   slideImg.alt='Security+ Companion App — '+captions[index][2];
   if(changed&&!reducedMotion.matches&&typeof slideImg.animate==='function')slideImg.animate([{opacity:0,transform:'translateX('+(direction*10)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:280,easing:'cubic-bezier(.2,.7,.3,1)'});
  }
  stage.removeAttribute('aria-busy');
 }
 previous.addEventListener('click',()=>show(active-1));next.addEventListener('click',()=>show(active+1));
 thumbs.forEach(button=>button.addEventListener('click',()=>{if(!button.disabled)show(Number(button.dataset.target));}));
 root.querySelector('[data-sp-tour]').addEventListener('keydown',event=>{
  if(event.target.closest('button,a'))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(active+(event.key==='ArrowLeft'?-1:1));}
 });
 let touch=null;
 stage.addEventListener('touchstart',event=>{swiped=false;touch=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
 stage.addEventListener('touchend',event=>{
  if(!touch)return;const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;touch=null;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)){swiped=true;show(active+(dx<0?1:-1));}
 },{passive:true});
 stage.addEventListener('touchcancel',()=>{touch=null;swiped=false;},{passive:true});
 show(0);captions.forEach((_,index)=>loadImage(index));
  const viewer = root.querySelector('#spViewer');
  const viewport = viewer.querySelector('.sp-viewer-viewport');
  const canvas = viewer.querySelector('.sp-viewer-canvas');
  const viewerImage = viewer.querySelector('.sp-viewer-image');
  const viewerTitle = viewer.querySelector('#spViewerTitle');
  const viewerCaption = viewer.querySelector('#spViewerCaption');
  const closePreview = viewer.querySelector('[data-close-preview]');
  let zoom = 1;
  let opener = null;
  let savedScroll = {x:0,y:0};
  let pan = null;
  function sizePreview(nextZoom = zoom) {
    if (!viewer.open || !viewerImage.naturalWidth || !viewport.clientWidth || !viewport.clientHeight) return;
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / Math.max(1, viewport.scrollWidth);
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(1, viewport.scrollHeight);
    zoom = Math.max(1, Math.min(4, nextZoom));
    const fit = Math.min((viewport.clientWidth - 16) / viewerImage.naturalWidth,
      (viewport.clientHeight - 16) / viewerImage.naturalHeight, 1);
    viewerImage.style.width = `${Math.max(1, viewerImage.naturalWidth * fit * zoom)}px`;
    viewerImage.style.height = `${Math.max(1, viewerImage.naturalHeight * fit * zoom)}px`;
    viewer.classList.toggle('is-zoomed', zoom > 1);
    viewport.scrollLeft = zoom === 1 ? 0 : centerX * viewport.scrollWidth - viewport.clientWidth / 2;
    viewport.scrollTop = zoom === 1 ? 0 : centerY * viewport.scrollHeight - viewport.clientHeight / 2;
  }
  function openPreview(button) {
    if (swiped) { swiped = false; return; }
    const img = slideImg;
    if (!img || img.hidden || !img.naturalWidth) return;
    if (typeof viewer.showModal !== 'function') {
      window.open(img.currentSrc || img.src, '_blank', 'noopener');
      return;
    }
    const [heading, description] = captions[displayed];
    opener = button;
    savedScroll = {x:window.scrollX,y:window.scrollY};
    zoom = 1;
    viewerImage.style.width = '1px';
    viewerImage.style.height = '1px';
    viewerImage.alt = img.alt;
    viewerTitle.textContent = heading;
    viewerCaption.textContent = description;
    viewerImage.src = img.currentSrc || img.src;
    viewer.showModal();
    document.documentElement.classList.add('sp-viewer-open');
    closePreview.focus({preventScroll:true});
    viewport.scrollLeft = viewport.scrollTop = 0;
    requestAnimationFrame(() => sizePreview(1));
  }
  root.querySelectorAll('[data-sp-open-preview]').forEach(button => {
    button.addEventListener('click', () => openPreview(button));
  });
  viewerImage.addEventListener('load', () => sizePreview());
  closePreview.addEventListener('click', () => viewer.close());
  // Native dialog handles Escape, focus containment, and background inertness.
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('sp-viewer-open');
    viewer.classList.remove('is-panning');
    pan = null;
    window.scrollTo({left:savedScroll.x,top:savedScroll.y,behavior:'instant'});
    if (opener && opener.isConnected) opener.focus({preventScroll:true});
  });
  let backdropStart = false;
  viewer.addEventListener('pointerdown', event => {
    backdropStart = event.target === viewer || event.target === viewport || event.target === canvas;
  });
  viewer.addEventListener('click', event => {
    if (backdropStart && zoom === 1 && (event.target === viewer || event.target === viewport || event.target === canvas)) viewer.close();
    backdropStart = false;
  });
  viewerImage.addEventListener('dblclick', () => sizePreview(zoom > 1 ? 1 : 2));
  viewer.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!['+', '=', '-', '0'].includes(event.key)) return;
    event.preventDefault();
    sizePreview(event.key === '0' ? 1 : zoom + (event.key === '-' ? -.5 : .5));
  });
  // Touch uses native scrolling and pinch zoom; mouse users can drag to pan.
  viewport.addEventListener('pointerdown', event => {
    if (zoom <= 1 || event.pointerType !== 'mouse' || event.button !== 0) return;
    event.preventDefault();
    pan = {id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
    viewport.setPointerCapture(event.pointerId);
    viewer.classList.add('is-panning');
  });
  viewport.addEventListener('pointermove', event => {
    if (!pan || pan.id !== event.pointerId) return;
    viewport.scrollLeft = pan.left - (event.clientX - pan.x);
    viewport.scrollTop = pan.top - (event.clientY - pan.y);
  });
  function stopPan() {pan = null; viewer.classList.remove('is-panning');}
  viewport.addEventListener('pointerup', stopPan);
  viewport.addEventListener('pointercancel', stopPan);
  viewport.addEventListener('lostpointercapture', stopPan);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => sizePreview()).observe(viewport);
  else window.addEventListener('resize', () => sizePreview());

})();
