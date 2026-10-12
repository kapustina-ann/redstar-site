document.querySelectorAll('.seo-reasons').forEach(section=>{
 const list=section.querySelector('.seo-reasons__tabs');
 const tabs=[...list.querySelectorAll('button')];
 const panels=tabs.map(tab=>document.getElementById(tab.getAttribute('aria-controls')));
 list.setAttribute('role','tablist');list.setAttribute('aria-orientation','vertical');
 function select(index,focus=false){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});if(focus)tabs[index].focus();}
 tabs.forEach((tab,i)=>{tab.setAttribute('role','tab');panels[i].setAttribute('role','tabpanel');panels[i].tabIndex=0;tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(next,true);});});
 section.classList.add('is-enhanced');select(0);
});
