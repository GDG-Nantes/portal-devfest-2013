// Server part
var connect = require('connect');
console.log(__dirname);
console.log(process.cwd());
var app = connect.createServer(
    connect.static(process.cwd())
).listen(80);
console.log('Start server on port : '+80);

// Define socket part
var io   = require('socket.io');
var wsServer = io.listen(app);
wsServer.sockets.on('connection', function(socket) {
    console.log('### connection');
    socket.on('message', function(message) {
        console.log('### message: '+message);
        socket.broadcast.emit('message', message);
    });    
});


