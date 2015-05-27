'use strict';

var isChannelReady;
var isInitiator;
var isStarted;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pc_config = webrtcDetectedBrowser === 'firefox' ?
  {'iceServers':[{'url':'stun:23.21.150.121'}]} : // number IP
  {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};

var pc_constraints = {
  'optional': [
    {'DtlsSrtpKeyAgreement': true}
  ]};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio':true,
  'OfferToReceiveVideo':true }};

/////////////////////////////////////////////

var room = location.pathname.substring(1);
if (room === '') {
//  room = prompt('Enter room name:');
  room = 'foo';
} else {
  //
}

var socket = io.connect();

if (room !== '') {
  console.log('Create or join room', room);
  socket.emit('create or join', room);
}

socket.on('created', function (room){
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function (room){
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function (room){
  console.log('This peer has joined room ' + room);
  isChannelReady = true;
});

socket.on('log', function (array){
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message){
	console.log('Sending message: ', message);
  socket.emit('message', message);
}

socket.on('message', function (message){
  console.log('Received message:', message);
  if (message === 'got user media') {
  	maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
      candidate:message.candidate});
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

var remoteVideo = document.querySelector('#remoteVideo');

var canvasRemoteElement = document.querySelector('#canvasRemoteVideo');
var canvasFireElement = document.querySelector('#canvasFireLocalVideo');
var ctxRemote = canvasRemoteElement.getContext('2d');
var ctxFire = canvasFireElement.getContext('2d');


function drawEllipseByCenter(ctx, cx, cy, w, h) {
  drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h);
}

function drawEllipse(ctx, x, y, w, h) {
  var kappa = .5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
  ctx.stroke();
}

var init = false;

function snapshot(){
    var canvasToUse = canvasRemoteElement;
    var contextToUse = ctxRemote;
    var videoToUse = remoteVideo;

    canvasRemoteElement.width = remoteVideo.videoWidth;
    canvasRemoteElement.height = remoteVideo.videoHeight;
    if (remoteStream){
        ctxRemote.drawImage(remoteVideo, 0,0);        
    }

    var delta = landscapeMode ? 50 : 50;
    var landscapeMode = document.body.classList.contains('landscape');
    var idealWidth = Math.min(canvasToUse.parentElement.clientWidth, videoToUse.videoWidth + 100);
    var minVideoWidth = Math.min(canvasToUse.parentElement.clientWidth - 50, videoToUse.videoWidth);
    var ratio = videoToUse.videoWidth / videoToUse.videoHeight;
    var idealHeight = Math.min(idealWidth / ratio, videoToUse.videoHeight);
    var useVideoWidth = idealWidth === videoToUse.videoWidth + 100;
    if (landscapeMode){
      idealWidth = Math.min(window.innerHeight - 147 /*header*/ - 60 /*footer*/, videoToUse.videoWidth + 100);
      minVideoWidth = Math.min(window.innerHeight - 147 /*header*/ - 60 /*footer*/ - 50, videoToUse.videoWidth);
      idealHeight = Math.min(idealWidth / ratio, videoToUse.videoHeight);
      useVideoWidth = idealWidth === videoToUse.videoWidth + 100;
    }

    canvasToUse.width = idealWidth; //landscapeMode ? idealHeight : idealWidth;
    canvasToUse.height = canvasToUse.width;
    canvasToUse.style.top = ((canvasToUse.parentElement.clientHeight - canvasToUse.height) / 2)+"px";
    canvasToUse.style.left = ((canvasToUse.parentElement.clientWidth - canvasToUse.width) / 2)+"px";

    canvasFireElement.width = idealWidth;// landscapeMode ? idealHeight : idealWidth;
    canvasFireElement.height = canvasFireElement.width;
    canvasFireElement.style.top = ((canvasToUse.parentElement.clientHeight - canvasFireElement.height) / 2)+"px";
    canvasFireElement.style.left = ((canvasToUse.parentElement.clientWidth - canvasFireElement.width) / 2)+"px";

    var refValue = idealWidth;// landscapeMode ? idealHeight : idealWidth;
    if (localStream){
      if (!init 
          && canvasToUse.width == Math.round(refValue)
          && canvasToUse.height == Math.round(refValue)
          && canvasFireElement.width == Math.round(refValue)
          && canvasFireElement.height == Math.round(refValue)){

        if (canvasFireElement.width != 100){

          init = true;
          canvasDemo.canvas = document.getElementById('canvasFireLocalVideo');
          canvasDemo.init(isInitiator ? 'red' : 'blue', {width :minVideoWidth, height : idealHeight + 100});
        }
      }

      var deltaX = 0, deltaY = 0;
      


      ctxFire.save();
      ctxFire.beginPath();
      
      deltaX =  (canvasFireElement.width - minVideoWidth) / 2;
      deltaY =  (canvasFireElement.height- idealHeight) / 2;
      ctxFire.fillStyle = "rgba(0, 0, 0, 0)";
      drawEllipse(ctxFire, deltaX, deltaY, minVideoWidth, idealHeight);
      // Clip to the current path
      ctxFire.clip(); 
      // Undo the clipping
      if (init){
        canvasDemo.refresh();
      }
      ctxFire.restore();
     

      // Save the state, so we can undo the clipping
      contextToUse.save();
      contextToUse.beginPath();
      deltaX =  (canvasToUse.width - minVideoWidth +delta) / 2;
      deltaY =  (canvasToUse.height - idealHeight+delta) / 2;
      contextToUse.fillStyle = "rgba(0, 0, 0, 0)";
      drawEllipse(contextToUse, deltaX , deltaY, minVideoWidth-delta , idealHeight-delta);
      // Clip to the current path
      contextToUse.clip();
      contextToUse.drawImage(videoToUse,0,0, videoToUse.videoWidth, videoToUse.videoHeight, deltaX, deltaY, minVideoWidth, idealHeight);
      // Undo the clipping
      contextToUse.restore();
      
    }

    window.requestAnimationFrame(snapshot);
}


function handleUserMedia(stream) {
  localStream = stream;
  console.log('Adding local stream.');
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

function handleUserMediaError(error){
  console.log('navigator.getUserMedia error: ', error);
}

var constraints = {video: true,   maxWidth: 1280, maxHeight: 720};


// On appel le user Media
getUserMedia(constraints, // Contraintes De vidéos
  handleUserMedia,  // En cas de succès
  handleUserMediaError // En cas d'erreur
  );
console.log('Getting user media with constraints', constraints);

snapshot();
console.log('Getting snapshot', constraints);
// On fait appel au serveur turn pour l'authent
if (location.hostname != "localhost") {
  requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
}

function maybeStart() {
  if (!isStarted && localStream && isChannelReady) {
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function(e){
	sendMessage('bye');
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pc_config, pc_constraints);
    pc.onicecandidate = handleIceCandidate;
    console.log('Created RTCPeerConnnection with:\n' +
      '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
      '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      return;
  }
  pc.onaddstream = handleRemoteStreamAdded;
  pc.onremovestream = handleRemoteStreamRemoved;

  
}

function handleIceCandidate(event) {
  console.log('handleIceCandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
}

function doCall() {
  var constraints = {'optional': [], 'mandatory': {}};
  // temporary measure to remove Moz* constraints in Chrome
  if (webrtcDetectedBrowser === 'chrome') {
    for (var prop in constraints.mandatory) {
      if (prop.indexOf('Moz') !== -1) {
        delete constraints.mandatory[prop];
      }
     }
   }
  constraints = mergeConstraints(constraints, sdpConstraints);
  console.log('Sending offer to peer, with constraints: \n' +
    '  \'' + JSON.stringify(constraints) + '\'.');
  pc.createOffer(setLocalAndSendMessage, null, constraints);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

function mergeConstraints(cons1, cons2) {
  var merged = cons1;
  for (var name in cons2.mandatory) {
    merged.mandatory[name] = cons2.mandatory[name];
  }
  merged.optional.concat(cons2.optional);
  return merged;
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

function requestTurn(turn_url) {
  var turnExists = false;
  for (var i in pc_config.iceServers) {
    if (pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turn_url);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
      	console.log('Got TURN server: ', turnServer);
        pc_config.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turn_url, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
}
function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  pc.close();
  pc = null;
}

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndex = i;
        break;
      }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}

