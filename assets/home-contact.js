(function(){
var form=document.getElementById('home-contact-form');
if(!form)return;
form.addEventListener('submit',function(event){
event.preventDefault();
form.querySelector('.form__note').textContent='Отправка через форму пока не подключена. Позвоните нам: 8 (4852) 31-94-04.';
});
})();
