'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduced) {
    document.documentElement.classList.add('motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('seen'); observer.unobserve(entry.target); }
    }), {rootMargin:'0px 0px -20px 0px',threshold:0.04});
    $$('.reveal').forEach(el => observer.observe(el));
  }

  const menu = $('.menu-toggle'), nav = $('#navigation');
  const main = $('main'), footer = $('footer');
  let menuOpen = false, lastFocus = null;
  function syncLock() { document.body.classList.toggle('locked',menuOpen || !!$('dialog[open]')); }
  function toggleMenu(open, restore = true) {
    if (open) lastFocus = document.activeElement;
    menuOpen = open;
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'关闭章节目录':'打开章节目录');
    nav.classList.toggle('open',open);nav.inert = !open;
    main.inert=open;footer.inert=open;
    syncLock();
    if (open) requestAnimationFrame(() => $('.nav-links a').focus({preventScroll:true}));
    else if(restore) (lastFocus || menu).focus({preventScroll:true});
  }
  menu.addEventListener('click',() => toggleMenu(!menuOpen));
  $$('.nav-links a').forEach(a => a.addEventListener('click',() => toggleMenu(false,false)));
  document.addEventListener('keydown',e => {
    if(e.key==='Escape' && menuOpen) {toggleMenu(false);e.preventDefault();}
    if(e.key==='Tab' && menuOpen) {
      const elements=[menu,...nav.querySelectorAll('a,button')];
      const first=elements[0],last=elements.at(-1);
      if(e.shiftKey && document.activeElement===first){last.focus();e.preventDefault();}
      else if(!e.shiftKey && document.activeElement===last){first.focus();e.preventDefault();}
    }
  });

  let scrollPending=false;
  const chapters=$$('.chapter');
  function updateScroll(){
    const top=window.scrollY,range=document.documentElement.scrollHeight-innerHeight;
    const progress=range>0?Math.max(0,Math.min(1,top/range)):0;
    $('.progress i').style.transform=`scaleX(${progress})`;
    $('#read-progress').textContent=String(Math.round(progress*100)).padStart(2,'0')+'%';
    $('.site-header').classList.toggle('scrolled',top>80);
    $('.chapter-status').classList.toggle('visible',top>innerHeight*.75 && progress<.995);
    let title=top<$('#overview').offsetTop-innerHeight*.4?'空间序章':'01 总体设计';
    for(const chapter of chapters) if(top+innerHeight*.42>=chapter.offsetTop)title=chapter.dataset.chapter;
    if(top+innerHeight*.5>$('.ending').offsetTop)title='日常，围绕院落展开';
    $('#chapter-current').textContent=title;
    scrollPending=false;
  }
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});
  addEventListener('resize',updateScroll);addEventListener('load',updateScroll);updateScroll();

  const steps=[
    ['场地植入','依据场地边界与校园肌理，植入整体建筑体量，形成围合的初始体块。'],
    ['庭院切分','在中心位置切分出开放庭院，形成向校园前方开放的 U 形布局。'],
    ['高低塑形','根据功能与空间关系，塑造两翼与后部连接体的高低层次，形成主次分明的体量关系。'],
    ['开放界面','打开 U 形朝向校园前方的界面，形成通透的入口空间与景观联系。'],
    ['公共嵌入','在庭院中心嵌入独立公共建筑，并于前侧布置低层附属用房，丰富校园公共活动空间。'],
    ['屋顶激活','结合坡屋顶与屋顶平台激活屋顶空间，形成多层次的学习、休憩与交流场景。']
  ];
  const stepButtons=$$('[data-step]');
  function selectStep(index,focus=false){
    const num=index+1;
    stepButtons.forEach((button,i)=>{button.setAttribute('aria-selected',String(index===i));button.tabIndex=index===i?0:-1;});
    $('#step-image').src=`assets/massing-${num}.webp`;$('#step-image').alt=steps[index][0]+'分析';
    $('#step-number').textContent='0'+num;$('#step-title').textContent=steps[index][0];$('#step-copy').textContent=steps[index][1];
    $('#step-panel').setAttribute('aria-labelledby','step-tab-'+num);
    if(focus)stepButtons[index].focus();
  }
  stepButtons.forEach((button,index)=>{
    button.addEventListener('click',()=>selectStep(index));
    button.addEventListener('keydown',e=>{
      let target=index;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')target=(index+1)%6;
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp')target=(index+5)%6;
      else if(e.key==='Home')target=0;else if(e.key==='End')target=5;else return;
      e.preventDefault();selectStep(target,true);
    });
  });

  const modalFocus=new Map();
  function showDialog(dialog){
    modalFocus.set(dialog,document.activeElement);
    dialog.showModal();syncLock();
  }
  $$('[data-open]').forEach(button=>button.addEventListener('click',()=>{
    if(menuOpen)toggleMenu(false,false);
    showDialog(document.getElementById(button.dataset.open));
  }));
  $$('dialog').forEach(dialog=>{
    dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('close',()=>{syncLock();const el=modalFocus.get(dialog);if(el&&!el.closest('[inert]'))el.focus({preventScroll:true});});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const box=dialog.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)dialog.close();}});
  });
  const pages=$$('.source-page');
  $('#source-search').addEventListener('input',e=>{
    const query=e.target.value.trim().toLowerCase();let count=0;
    pages.forEach(page=>{const matched=!query||page.dataset.sourceText.includes(query);page.hidden=!matched;if(matched)count++;if(query)page.open=matched;else page.open=false;});
    $('#search-count').textContent=query?`找到 ${count} 页相关内容`:'共 60 页';
    $('#no-results').hidden=count!==0;
  });

  const lightbox=$('#lightbox'),stage=$('#image-stage'),image=$('#lightbox-image');
  let scale=1,x=0,y=0;
  const pointers=new Map();
  let gesture=null;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function paint(){
    const maxX=Math.max(0,(image.clientWidth*scale-stage.clientWidth)/2)+ (scale>1?stage.clientWidth*.15:0);
    const maxY=Math.max(0,(image.clientHeight*scale-stage.clientHeight)/2)+ (scale>1?stage.clientHeight*.15:0);
    x=clamp(x,-maxX,maxX);y=clamp(y,-maxY,maxY);
    image.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
    $('#zoom-reset').textContent=Math.round(scale*100)+'%';
    $('#zoom-out').disabled=scale<=1;$('#zoom-in').disabled=scale>=8;
  }
  function zoom(next){scale=clamp(next,1,8);if(scale===1){x=0;y=0;}paint();}
  $$('[data-image]').forEach(button=>button.addEventListener('click',()=>{
    scale=1;x=0;y=0;pointers.clear();gesture=null;
    image.src=`assets/${button.dataset.image}-full.webp`;
    image.alt=button.dataset.title;$('#lightbox-title').textContent=button.dataset.title;
    showDialog(lightbox);image.style.transform='';requestAnimationFrame(paint);
  }));
  image.addEventListener('load',paint);
  $('#zoom-in').addEventListener('click',()=>zoom(scale*1.5));
  $('#zoom-out').addEventListener('click',()=>zoom(scale/1.5));
  $('#zoom-reset').addEventListener('click',()=>zoom(1));
  stage.addEventListener('dblclick',()=>zoom(scale>1?1:2.5));
  stage.addEventListener('wheel',e=>{e.preventDefault();zoom(scale*(e.deltaY<0?1.15:1/1.15));},{passive:false});
  function startGesture(){
    const pts=[...pointers.values()];
    if(pts.length===1)gesture={type:'pan',sx:pts[0].x,sy:pts[0].y,x,y};
    else if(pts.length>=2)gesture={type:'pinch',distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),scale};
    else gesture=null;
  }
  stage.addEventListener('pointerdown',e=>{
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');startGesture();
  });
  stage.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(gesture?.type==='pinch'&&pointers.size>=2){const pts=[...pointers.values()];zoom(gesture.scale*Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)/Math.max(1,gesture.distance));}
    else if(gesture?.type==='pan'&&scale>1){x=gesture.x+e.clientX-gesture.sx;y=gesture.y+e.clientY-gesture.sy;paint();}
  });
  function pointerEnd(e){pointers.delete(e.pointerId);if(!pointers.size)stage.classList.remove('dragging');startGesture();}
  stage.addEventListener('pointerup',pointerEnd);stage.addEventListener('pointercancel',pointerEnd);
  lightbox.addEventListener('keydown',e=>{
    if(e.key==='+'||e.key==='='){zoom(scale*1.5);e.preventDefault();}
    if(e.key==='-'){zoom(scale/1.5);e.preventDefault();}
    if(e.key==='0'){zoom(1);e.preventDefault();}
  });
})();
