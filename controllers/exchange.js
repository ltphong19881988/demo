var express = require('express');
var moment = require('moment');
var async = require('async');
var router = express.Router() ;
var User   = require('../models/user');
var TradeHistory   = require('../models/tradehistory');
// var UserRole   = require('../models/userrole');
// var UserAuth   = require('../models/userauth');
var OrderBook = require('../models/orderbook');
var config = require('../config'); // get our config file
var Helpers = require('./helpers');
var ExchangeListen = require('../exchangelisten');
// router.use('/animals', require('./animals'))




router.get('/', function(req, res, next) {
    res.send('Comming soon');
    // var data = {
    //     title: 'Exchange Page',
    //     description: 'Page Description',
    //     header: 'Page Header',
    //     lastPrice : 0.0001,
    // };

    // TradeHistory.findOne({}).sort({datacreate: -1}).exec(function(err, th) {
    //     // console.log(err, th);
    //     if(err != null && th != null){
    //         data.lastPrice = th.btcRate;
    //     }
    //     res.render('exchange/index', data);
    // });
    
    
})

router.post('/createsellorder', Helpers.isAuthenticated, function(req, res, next){
    var item = new OrderBook({
        idUser : req.decoded._id,
        btcAmount : parseFloat(req.body['sell-want-quantity']),
        btcRate : parseFloat(req.body['sell-price']),
        // usdRate : item.usdRate,
        vncAmount : parseFloat(req.body['sell-offer-quantity']),
        type : 'sell',
        datecreate : moment().format()
    });

    if((parseFloat(item.vncAmount) * parseFloat(item.btcRate)) != parseFloat(item.btcAmount) ){
        res.json( {status : false, mes : 'Invalid post data'});
        return;
    }

    async.parallel({
        getUser: function(callback) {
            User.GetUserByID(req.decoded._id, function(result){
                if(result.user.free == 0){
                    callback(null, {status : false, mes : 'Please watting process ...'});
                }else{
                    var setField = {$set: { free: 0}};
                    User.UpdateUser(req.decoded._id, setField, function(err, up){
                        if(err == null){
                            callback(null, result.user._doc);
                        }else{
                            callback(null, {status : false, mes : 'Something wrongs, please try again later ...'});
                        }
                    })
                }
            });
        },
    }, function(err, results) {  
        if(results.getUser.status == false){
            res.json( {status : false, mes : results.getUser.mes});
            return;
        }
        if(parseFloat(results.getUser.vncAmount) < parseFloat(req.body['sell-offer-quantity'])){
            var setField = {$set: { free: 1}};
            User.UpdateUser(req.decoded._id, setField, function(err, up){
                res.json( {status : false, mes : 'Your VNC balance is not enough'});
            })
            return;
        }
        OrderBook.Add(item, function(result){
            console.log('sell order', result);
            if(result.status == true){
                var setField = {$set: { vncAmount: parseFloat(results.getUser.vncAmount) - parseFloat(req.body['sell-offer-quantity']) , free : 1 }};
                User.UpdateUser(req.decoded._id, setField, function(err, up){
                    //Call to exchangelisten
                    ExchangeListen.CreateSellOrder(result.data);
                    res.json( {status : true, mes : 'Oder created'});
                })
            }else{
                var setField = {$set: { free : 1 }};
                User.UpdateUser(req.decoded._id, setField, function(err, up){
                    res.json({status : false, mes : 'Something wrong, please try again later ...'});
                })
                
            }
        })
    });
})

router.post('/createbuyorder', Helpers.isAuthenticated, function(req, res, next){
    var item = new OrderBook({
        idUser : req.decoded._id,
        btcAmount : parseFloat(req.body['buy-offer-quantity']),
        btcRate : parseFloat(req.body['buy-price']),
        // usdRate : item.usdRate,
        vncAmount : parseFloat(req.body['buy-offer-quantity']) / parseFloat(req.body['buy-price']),
        type : 'buy',
        datecreate : moment().format()
    });

    if((parseFloat(item.vncAmount) * parseFloat(item.btcRate)) != parseFloat(item.btcAmount) ){
        res.json( {status : false, mes : 'Invalid post data'});
        return;
    }

    async.parallel({
        getUser: function(callback) {
            User.GetUserByID(req.decoded._id, function(result){
                if(result.user.free == 0){
                    callback(null, {status : false, mes : 'Please watting process ...'});
                }else{
                    var setField = {$set: { free: 0}};
                    User.UpdateUser(req.decoded._id, setField, function(err, up){
                        if(err == null){
                            callback(null, result.user._doc);
                        }else{
                            callback(null, {status : false, mes : 'Something wrongs, please try again later ...'});
                        }
                    })
                }
            });
        },
    }, function(err, results) {  
        if(results.getUser.status == false){
            var setField = {$set: { free: 1}};
            User.UpdateUser(req.decoded._id, setField, function(err, up){
                if(err == null){
                    res.json( {status : false, mes : results.getUser.mes});
                }else{
                    res.json( {status : false, mes : 'Something wrongs, please try again later ...'});
                }
            })
            return;
        }
        if(parseFloat(results.getUser.btcAmount) < parseFloat(req.body['buy-offer-quantity'])){
            var setField = {$set: { free: 1}};
            User.UpdateUser(req.decoded._id, setField, function(err, up){
                res.json( {status : false, mes : 'Your BTC balance is not enough'});
            })
            return;
        }
        OrderBook.Add(item, function(result){
            if(result.status == true){
                var setField = {$set: { btcAmount: parseFloat(results.getUser.btcAmount) - parseFloat(req.body['buy-offer-quantity']) , free : 1 }};
                User.UpdateUser(req.decoded._id, setField, function(err, up){
                    //Call to exchangelisten
                    ExchangeListen.CreateBuyOrder(result.data);
                    res.json( {status : true, mes : 'Oder created'});
                })
            }else{
                res.json({status : false, mes : 'Something wrong, please try again later ...'});
            }
        })
    });


})

router.get('/getlistbuyorder', Helpers.isAuthenticated, function(req, res, next){
    OrderBook.find({type : 'buy', status : 0}).sort({btcRate: -1, datecreate : 1}).exec(function(err, result) {        
        res.json(result);
    });
})

router.get('/getlistsellorder', Helpers.isAuthenticated, function(req, res, next){
    OrderBook.find({type : 'sell', status : 0}).sort({btcRate: 1, datecreate : 1}).exec(function(err, result) { 
        console.log('getlistsellorder', result);       
        res.json(result);
    });
})


module.exports = router