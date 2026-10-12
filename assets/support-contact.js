/* Match the homepage form layout without claiming an unconfigured delivery succeeded. */
(function(){
 var form=document.getElementById('support-contact-form');
 if(!form)return;
 form.addEventListener('submit',function(event){
  event.preventDefault();
  var note=form.querySelector('.form__note');
  note.hidden=false;
  note.textContent='Отправка через эту форму пока не подключена. Свяжитесь с нами по телефону 8 (4852) 31-94-04 или через Telegram в шапке сайта.';
 });
})();
