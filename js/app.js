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

	    var canvasElement = document.querySelector('#canvasVideo');
	    var ctx = canvasElement.getContext('2d');


        function snapshot(){
		    canvasElement.width = video.videoWidth;
        	canvasElement.height = video.videoHeight;
        	if (localMediaStream){
        		ctx.drawImage(video, 0,0);
        		var imgDataBase64 = canvasElement.toDataURL();
        		ws.emit('message', {type : 'image', data : imgDataBase64});
        	}

        	window.requestAnimationFrame(snapshot);
        }

        snapshot();

	    // Note: onloadedmetadata doesn't fire in Chrome when using it with getUserMedia.
	    // See crbug.com/110938.
	    video.onloadedmetadata = function(e) {
	      // Ready to go. Do some stuff.
	    };
	  }, onFailSoHard);


  	
  	var ws = io.connect('http://'+window.location.hostname+':80');
  	ws.on('connect',function(){
  		console.log("Ws Open");               
    });
  	ws.on("message", function(json){
        if (json.type === "image"){						
  			var img = document.querySelector("#canvasWs");
  			img.src = json.data;

        }
    });



});


/*
angular.module('RealTimeInnov.single',['RealTimeInnov.rtcsingle', 'RealTimeInnov.components','RealTimeInnov.model'])
.controller('SingleCtrl', ['$rootScope','$scope', '$http', 'RTCServicesSingle', 'ModelServices', function($rootScope, $scope, $http, rtc,model) {

	//$scope.localConnection = false;
	$scope.conferenceRoomName = "";
	$scope.conferenceNameDisabled = "";

	// Ids
	$scope.webcamId = "webcamId";
	$scope.screenId = "screenId";
	$scope.remoteId = "remoteId";
	$scope.remoteScreenId = "remoteScreenId";
	$scope.screenShotId = "screenShotId";

	// Modification dynamique du css du masque de webcam
	$scope.topMasque = 0;
	$scope.leftMasque = 0;
	$scope.widthMasque = 100;
	$scope.heightMasque = 100;

	$scope.heightCanvas = (window.innerHeight * 0.4)+"px";
	$scope.widthCanvas = (window.innerWidth * 0.3)+"px";
	

	$scope.requestVideo = function(){				
		
		rtc.requestStreams({
			videoId : $scope.webcamId,
			webcam : true,
			screen : false
		});
	
	}	

	$scope.call = function(){
		rtc.rtcConnection();
	}

	$scope.hangout = function(){
		rtc.hangup();
	}

	$scope.offerWebCam = function(){
		rtc.requestStreams({
			videoId : $scope.webcamId,
			webcam : true,
			screen : false
		});
		//rtc.offerWebCam();
	}

	$scope.offerScreen = function(){
		rtc.requestStreams({
			videoId : $scope.screenId,
			webcam : false,
			screen : true
		});
		//rtc.offerScreen();
	}

	var first = true;

	function rtcReady(event, data){
		$rootScope.$broadcast('videoRtcEvent', {
			videoId : first ? $scope.remoteId : $scope.remoteScreenId,
			stream : data
		});

		first = false;
	}

	$scope.photo = function(){
		$rootScope.$broadcast('takePhotoEvent', {videoId : $scope.screenId});
		$rootScope.$broadcast('takePhotoEvent', {videoId : $scope.webcamId});
	}

	$rootScope.$on('videoRtcEvent', function(event, param){
		
	});
	

	function updatePhoto(){
		
		$rootScope.$broadcast('updatePhotoEvt',{
			id:$scope.screenShotId,
			videos:[{				
					videoId: $scope.screenId,
					x: $scope.leftMasque,
					y: $scope.topMasque,
					width: $scope.widthMasque,
					height: $scope.heightMasque,
					delta:true
				}
				,
				{				
					videoId: $scope.webcamId,
					x: 0,
					y: 0,
					width: 100,
					height: 100,
					posX : 20,
					posY : 20,
					finalWidth : 20,
					finalHeight : 20,
					delta:true
				}
			]
		});
		requestAnimationFrame(updatePhoto);		
		
	}
	



	//PAS BIEN
	$scope.draw = function(){
		



		var idCanvas = "myCanvas";
		var canvas = document.getElementById(idCanvas);
		idCanvas = "canvas-screenShotId";
		var canvasScreenShot = document.getElementById(idCanvas);
	    var context = canvas.getContext('2d');
	    var contextScreenShot = canvasScreenShot.getContext('2d');

		context.beginPath();
		context.rect(0, 0, canvas.clientWidth,canvas.clientHeight);
		context.fillStyle = 'black';
		context.fill();

		var videoId = "webcamId";
		//videoId = "1";
	 	var videoDom= document.getElementById("video-"+videoId);	
		videoId = "screenId";
		//videoId = "1";
	 	var videoDomScreen= document.getElementById("video-"+videoId);	
		//context.drawImage(videoDom, 0, 0, 320,176, 5,5,130,130);
		//context.drawImage(videoDom, 0,0, 320,176,5,5,230,130);					
		
		
		function drawVideo(contextCanvas, canvasToUse, videoToWrite, videoDomToWrite){

			var useWidth = canvasToUse.clientWidth;
			var useHeight = canvasToUse.clientHeight;
			var ratio = videoDomToWrite.videoWidth / videoDomToWrite.videoHeight;
			if( (useWidth/ratio) > useHeight){
				useWidth = useHeight * ratio;
			}else{
				useHeight = useWidth / ratio;
			}
			var deltaX = videoToWrite.delta ? ((canvasToUse.clientWidth - useWidth) / 2) : 0;
			var deltaY = videoToWrite.delta ? ((canvasToUse.clientHeight - useHeight) / 2) : 0;

			contextCanvas.drawImage(videoDomToWrite, // Image source
						videoToWrite.x * (useWidth / 100), // x de départ dans l'image source
						videoToWrite.y * (useHeight / 100), // y de départ dans l'image source
						videoToWrite.width * (videoDomToWrite.videoWidth / 100), // largeur à prendre dans l'image d'origine depuis le x
						videoToWrite.height * (videoDomToWrite.videoHeight / 100), // hauteur à prendre dans l'image d'orgine depuis le y
						deltaX + (videoToWrite.posX ? videoToWrite.posX * (useWidth / 100) : 0), // point de départ en x pour écrire dans le canvas
						deltaY + (videoToWrite.posY ? videoToWrite.posY * (useHeight / 100): 0), // point de départ en y pour écrire dans le canvas
						videoToWrite.finalWidth ? videoToWrite.finalWidth * (useWidth / 100) : useWidth, // largeur de l'image finale dans le canvas
						videoToWrite.finalHeight ? videoToWrite.finalHeight * (useHeight / 100): useHeight // hauteur de l'image finale dans le canvas
						);

			if (socketPush && ready){
				socketPush.send(JSON.stringify({type:"image",data:canvasToUse.toDataURL('image/webp', 1)}));
			}
		}


		//var video = {x:0,y:0,width:100,height:100, delta : true};
		//drawVideo(context, canvas, video, videoDomScreen);
		//drawVideo(contextScreenShot, canvasScreenShot, video, videoDomScreen);		
		var video = {x:0,y:0,width:100,height:100, posX : 0, posY :0, finalWidth: 100, finalHeight : 100, delta : true};
		drawVideo(context, canvas, video, videoDom);
		//drawVideo(contextScreenShot, canvasScreenShot, video, videoDom);		

		requestAnimationFrame($scope.draw);		
		
	}	
	setTimeout($scope.draw,1000);
	//requestAnimationFrame($scope.draw);	


	var bufferSound = [];
	var idSound = "monSon";
	var audio = document.getElementById(idSound);
	audio.addEventListener('onended',function(){
		if (bufferSound.length > 0){
			audio.src = bufferSound.shift();

		}
	});
	var idImg = "monImage";
	var img = document.getElementById(idImg);

	function openWebSocket(){
		var socket = new WebSocket(model.WEBSOCKET_URL);

		socket.onopen = function(){
			ready = true;
			trace("WebSocket Open : ");
		}
		socket.onerror = function(error){
			trace("WebSocket error : "+error);
		}
		socket.onmessage = function(message){
			var json = JSON.parse(message.data);			
			if (json.type === "image"){								
				img.src = json.data;
			}else if (json.type === "sound"){
				
				if (bufferSound.length == 0){
					audio.src = json.data;
				}
				bufferSound.push(json.data);
			}
		}
		socket.onclose = function(){
				trace("WebSocket Close : ");
		}
		return socket;
	}	
	var socketPush = openWebSocket();
	var socketRead = openWebSocket();
	var ready = false;


	var onFail = function(e) {
		console.log('Rejected!', e);
	};

	var onSuccess = function(s) {
		var context = new webkitAudioContext();
		var mediaStreamSource = context.createMediaStreamSource(s);
		recorder = new Recorder(mediaStreamSource,{workerPath:'../components/recorder/recorderWorker.js'});		
		setInterval(stopRecording,100);
		
	}

	window.URL = window.URL || window.webkitURL;
	navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	var recorder;
	var audio = document.querySelector('audio');

	function startRecording() {
		if (navigator.getUserMedia) {
		  navigator.getUserMedia({audio: true}, onSuccess, onFail);
		} else {
		  console.log('navigator.getUserMedia not present');
		}
	}

	var canStop = true;
	function stopRecording() {
		if (!canStop) return;
		recorder.stop();
		canStop = false;
		recorder.exportWAV(function(s) {
			if (socketPush && ready){
				socketPush.send(JSON.stringify({type:"sound",data:window.URL.createObjectURL(s)}));
			}	
			recorder.record();
			canStop = true;
		});
	}

	startRecording();

	    
}])
;
*/