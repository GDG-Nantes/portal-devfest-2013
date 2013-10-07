$(function(){
	var onFailSoHard = function(e) {
    	console.log('Reeeejected!', e);
  	};

  	window.URL = window.URL || window.webkitURL;
	navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

  	// Not showing vendor prefixes.
  	navigator.getUserMedia({video: true}, function(localMediaStream) {
	    var video = document.querySelector('#srcVideo');
	    video.src = window.URL.createObjectURL(localMediaStream);

	    var canvasElement = document.querySelector('canvas');
	    var ctx = canvas.getContext('2d');

	    canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;

        function snapshot(){
        	if (localMediaStream){
        		ctx.drawImage(video, 0,0);
        	}

        	windows.requestAnimationFrame(snapshot);
        }

        snapshot();

	    // Note: onloadedmetadata doesn't fire in Chrome when using it with getUserMedia.
	    // See crbug.com/110938.
	    video.onloadedmetadata = function(e) {
	      // Ready to go. Do some stuff.
	    };
	  }, onFailSoHard);
});