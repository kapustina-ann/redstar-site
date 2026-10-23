/* Real captured states of the original site's component selector. */
(function(){
 document.querySelectorAll('.gl-demo').forEach(function(demo){
  var controls=demo.querySelector('.gl-demo__controls');
  var buttons=Array.from(demo.querySelectorAll('[data-gl-state]'));
  var panels=Array.from(demo.querySelectorAll('[data-gl-panel]'));
  function select(value){
   buttons.forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.glState===value));});
   panels.forEach(function(panel){panel.hidden=panel.dataset.glPanel!==value;});
  }
  buttons.forEach(function(button){button.addEventListener('click',function(){select(button.dataset.glState);});});
  select('0');controls.hidden=false;
 });
})();
