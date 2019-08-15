// =======================
// get the packages we need ============
// =======================
var http = require('http');
var express     = require('express');
// var session = require('express-session');
var app         = express();
// var csrf = require('csurf');
var bodyParser  = require('body-parser');
// var cookieParser = require('cookie-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var path    = require('path');


//var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
// var User   = require('./app/models/user'); // get our mongoose model


// =======================
// configuration =========
// =======================
var port = process.env.PORT || 2000; // used to create, sign, and verify tokens
mongoose.Promise = require('bluebird');
mongoose.connect(config.database.connectStr, {
    keepAlive: true,
    reconnectTries: Number.MAX_VALUE,
    useMongoClient: true,
    user : config.database.user,
    pass : config.database.pass
}); // connect to database
app.set('superSecret', config.secret); // secret variable
app.set('views', (path.join(__dirname, 'views')));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'angular')));
// use body parser so we can get info from POST and/or URL parameters
// app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false }));
// use morgan to log requests to the console
app.use(morgan('dev'));
// app.use(csrf({ cookie: true }));
// app.use(session({secret:'mommaighkeoljiop', key:'session_cookie', saveUninitialized: false, resave: true}));
// app.use(session({
//   // Here we are creating a unique session identifier
//   secret: 'shhhhhhh',
//   resave: true,
//   saveUninitialized: true
// }));
// =======================
// routes ================
// =======================
// basic route
// app.get('/', function(req, res) {
//     res.send('Hello! The API is at http://localhost:' + port + '/api');
// });


// API ROUTES -------------------
//Routes
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use('/', require('./controllers'));
// app.use(express.errorHandler());
// app.use(express.logger({
// 		format:'tiny',
// 		stream:fs.createWriteStream('app.log',{'flagd':'w'})
// 	}));
// app.use(function(req,res){
// 		res.status(400);
// 		res.send('File Not Found');
// 	});

// =======================
// start the server ======
// =======================
var server = http.createServer(app);
// app.listen(port, function(e){
//     console.log(e);
// });

var socketapp = require("./socketapp.js");


server.listen(port, function(){
    console.log('Magic happens at http://localhost:' + port);
    //socketapp.Init(server);
});


// console.log(__dirname);
// const fileManager = require('file-manager-js');
// fileManager.list('/').then((info) => {
//     console.log(info);
    
// }).catch((error) => {
    
// });

// setTimeout(() => {
//     async.parallel({
//         marketCap: function(callback){
//             request({
//                 uri: 'https://api.coinmarketcap.com/v1/ticker/?limit=10',
//                 method: 'GET',
//               }, function (err, response) {
//                     callback(err, JSON.parse(response.body));
//             });
//         },
//         vncoins: function(callback){
//             request({
//                 uri: 'https://id.sancoinvietnam.com/api/PriceVNCOINS',
//                 method: 'GET',
//               }, function (err, response) {
//                     callback(err, JSON.parse(response.body));
//             });
//         },
//     }, function(err, results){
//         var bitcoin ;
//         results.marketCap.forEach(element => {
//             if(element.symbol == "BTC"){
//                 bitcoin = element;
//             }
//         });
//         results.marketCap[results.marketCap.length - 1].id = 'vncoins';
//         results.marketCap[results.marketCap.length - 1].name = 'VNCOINS';
//         results.marketCap[results.marketCap.length - 1].symbol = 'VNC';
//         results.marketCap[results.marketCap.length - 1].price_usd = parseFloat(results.vncoins);
//         results.marketCap[results.marketCap.length - 1].price_btc = parseFloat(results.vncoins) / parseFloat(bitcoin.price_usd);
//         var query = {
//             name : 'coinPrice',
//         };
//         var setField = {$set: { data: results.marketCap}};
//         configDB.update(query, setField, {upsert: true}, function(err, up){
//             console.log(err, up);
//         });
//     });
// }, 1000 * 60 * 3);



