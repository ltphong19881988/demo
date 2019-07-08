
var socketIo = require('socket.io');
var socketioJwt = require('socketio-jwt');
var jwt = require('jsonwebtoken');
var auth = require('./models/userauth');
var exchangelisten = require('./exchangelisten.js');

var sio;
module.exports.Init = function(server){
    sio = socketIo.listen(server);
    // sio.use(function(socket, next){
    //     if (socket.handshake.query && socket.handshake.query.token){
    //       jwt.verify(socket.handshake.query.token, 'alluneedev', function(err, decoded) {
    //         if(err) return next(new Error('Authentication error'));
    //         socket.decoded = decoded;
    //         next();
    //       });
    //     }
    //     next(new Error('Authentication error'));
    //   })
    exchangelisten.Init(sio);
};

