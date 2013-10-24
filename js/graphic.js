document.addEventListener('DOMContentLoaded', function(){

	var header = document.querySelector('header');
	header.style.webkitTransform = "translateY("+((window.innerHeight/2) - (header.clientHeight / 2))+"px) rotate(-90deg)";

	var footer = document.querySelector('footer');
	footer.style.webkitTransform = "translateY(-"+((window.innerHeight/2) - (footer.clientHeight / 2))+"px) rotate(-90deg)";

});