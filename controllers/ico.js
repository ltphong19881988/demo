var express = require('express');
var async = require('async');
var moment = require('moment');
var router = express.Router() ;
var User   = require('../models/user');
var Role   = require('../models/role');
var UserRole   = require('../models/userrole');
var UserAuth   = require('../models/userauth');
var Hash   = require('../models/hash');
var Transaction = require('../models/transaction');
var jwt = require('jsonwebtoken');
var dbConfig = require('../models/config');
var config = require('../config'); // get our config file
var secretKey = config.secret;
var Helpers = require('./helpers');
// router.use('/animals', require('./animals'))

var MongoClient = require('mongodb').MongoClient;
var url = config.database;




// router.get('/', function(req, res, next) {
//     res.redirect("/market/index");
// })
router.get('/', Helpers.isAuthenticated, function(req, res, next) {
    var data = {
        title: 'ICO Page',
        description: 'Page Description',
        header: 'Page Header'        
    };
    res.render('ico/index', data);    
})

router.get('/btcprice', Helpers.isAuthenticated, function(req, res, nex){
    Helpers.GetRequest("https://www.bitstamp.net/api/v2/ticker_hour/btcusd/", function(result){
        var query = {name:'icoconfig'};
        var setField = {$set : {btcPrice:result.last}};
        Helpers.UpdateCollection('config', query, setField, function(err, up){
            // console.log('update btc Price', err, up);
            res.json(result);
        })
        
    })
})

router.get('/ico-info', Helpers.isAuthenticated, function(req, res, next) {
    var curNow = moment().toDate().getTime();
    var startDay = moment(config.ico.startDay).toDate().getTime();
    var dark = config.ico.round[0];
    for(var i = 0; i < config.ico.round.length; i ++){
        var item = config.ico.round[i];
        var from = moment(item.from).toDate().getTime();
        var to = moment(item.to).toDate().getTime();
        if(curNow >= from && curNow <= to){
            dark = config.ico.round[i];
        }
    }
    var nextRound = startDay - curNow;
    if(nextRound < 1000){
        nextRound = 0;
        var hours = moment().format('HH');
        var mins = moment().format('mm');
        var secs = moment().format('ss');
        if(hours >= 0 && hours < 6){
            nextRound = (5 - hours)*60*60*1000 + (59-mins)*60*1000 + (60-secs)*1000;
        }else{
            // nextRound = (23-(hours-6))*60*60*1000 + (59-mins)*60*1000 + (60-secs)*1000;
            nextRound = 0;
        }
        
    }
    var data = {
        info: config.ico,
        nextRound: nextRound,
        curRound: dark,
    };
    res.json(data);    
})

router.post('/buy', Helpers.isAuthenticated, function(req, res, next) {
    if(!req.body.btcAmount){
        res.json({status : false, mes : "please enter btc amount"});
        return;
    }
    if(typeof parseFloat(req.body.btcAmount) != "number" ){
        res.json({status : false, mes : "btc amount must be number"});
        return;
    }
    if(!req.body.vncAmount){
        res.json({status : false, mes : "please enter vnc amount"});
        return;
    }
    if(typeof parseFloat(req.body.vncAmount) != "number" ){
        res.json({status : false, mes : "vnc amount must be number"});
        return;
    }

    async.parallel({
        getConfig: function(callback){
            dbConfig.GetConfigByName('icoconfig', function(result) {
                var curNow = moment().toDate().getTime();
                var startDay = moment(config.ico.startDay).toDate().getTime();
                var dark = config.ico.round[0];
                for(var i = 0; i < config.ico.round.length; i ++){
                    var item = config.ico.round[i];
                    var from = moment(item.from).toDate().getTime();
                    var to = moment(item.to).toDate().getTime();
                    if(curNow >= from && curNow <= to){
                        dark = config.ico.round[i];
                    }
                }
                var abc = {
                    status: result.status, 
                    curRound : dark, 
                    soldOut :  result.config.data.soldOut, 
                    btcPrice : result.config.data.btcPrice
                };
                callback(null, abc);

            });

            // Helpers.GetConfigByName('icoconfig', function(result){
            //     console.log('lay ra', result);
            //     var curNow = moment().toDate().getTime();
            //     var startDay = moment(config.ico.startDay).toDate().getTime();
            //     var dark = config.ico.round[0];
            //     for(var i = 0; i < config.ico.round.length; i ++){
            //         var item = config.ico.round[i];
            //         var from = moment(item.from).toDate().getTime();
            //         var to = moment(item.to).toDate().getTime();
            //         if(curNow >= from && curNow <= to){
            //             dark = config.ico.round[i];
            //         }
            //     }
            //     var abc = {
            //         status: result.status, 
            //         curRound : dark, 
            //         soldOut :  result.data.data.soldOut, 
            //         btcPrice : result.data.btcPrice
            //     };
            //     console.log('tra ra', abc);
            //     callback(null, abc);
            // })
        },
        checkbalance: function(callback) {
            User.GetUserByID(req.decoded._id, function(result){
                
                if(result.user.free == 0){
                    callback(null, {status : false, balance : balance, mes : 'Please watting process ...'});
                }else{
                    var balance = result.user.btcAmount;
                    var query = {
                        _id : req.decoded._id,
                    };
                    var setField = {$set: { free: 0}};
                    User.update(query, setField, {upsert: true}, function(err, up){
                        console.log(err, up);
                        if(err == null){
                            callback(null, {status : true, balance : balance});
                        }else{
                            callback(null, {status : false, balance : balance, mes : "Something wrongs, please try again later ..."});
                        }
                    })
                    // if((parseFloat(req.body.btcAmount) ) > balance){
                    //     callback(null, {status : false, balance : balance, mes : "Your BTC balance is not enough"});
                    // }else{
                    //     callback(null, {status: true, balance: balance});
                    // }
                }
                
            });
        }
    }, function(err, results) {
        if(!results.getConfig.status || results.getConfig.soldOut == true){
            res.json({status: false, mes : 'ICO is not open or sold out'});
            return;
        } 
        if(!results.checkbalance.status){
            res.json(results.checkbalance); 
            return;
        }
        var totalBTC = results.getConfig.curRound.price * parseFloat(req.body.vncAmount) / results.getConfig.btcPrice;
        // console.log(totalBTC, results.checkbalance);
        if(totalBTC > results.checkbalance.balance){
            res.json({status : false, mes : "Your BTC balance is not enough"});
            return;
        }
        // Add transaction for sender
        var time = new Date();
        var btcTran = {
            idUser : req.decoded._id,
            address : req.decoded.btcAddress,           // address of btc or vnc
            walletType : "btc",        // btc or vnc
            amount : -parseFloat(req.body.btcAmount),
            type: "buy",        // buy, sell, deposit, withdraw, fee
            datecreate :  time ,
            status : 1,            //
            txid : "",
            description : 'Buy ' + req.body.vncAmount + ' vnc'
        }
        var vncTran = {
            idUser : req.decoded._id,
            address : req.decoded.vncAddress,           // address of btc or vnc
            walletType : "vnc",        // btc or vnc
            amount : parseFloat(req.body.vncAmount),
            type: "buy",        // buy, sell, deposit, withdraw, fee
            datecreate :  time ,
            status : 1,            //
            txid : ""
        }

        Transaction.insertMany([btcTran, vncTran], function(err, db){
            if(!err){
                var query = {
                    _id : req.decoded._id,
                };
                var setField = {$set: { 
                    btcAmount: parseFloat(results.checkbalance.balance - req.body.btcAmount).toFixed(8) , 
                    free : 1
                }};
                User.update(query, setField, {upsert: true}, function(err, up){
                    res.json({status : true, mes : "Successfull ..."});
                })
            }else{
                var query = {
                    _id : req.decoded._id,
                };
                var setField = {$set: { 
                    btcAmount: parseFloat(results.checkbalance.balance - req.body.btcAmount).toFixed(8) , 
                    free : 1
                }};
                User.update(query, setField, {upsert: true}, function(err, up){
                    res.json({status : false, mes : "Something wrong, try again later"});
                })
                
                
            }
            
        })

    });
    
    
})



module.exports = router