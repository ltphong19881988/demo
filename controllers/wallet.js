var express = require('express');
var async = require('async');
var request = require('request');
var querystring = require('querystring');
var router = express.Router() ;
var moment = require('moment');
var passwordHasher = require('aspnet-identity-pw');
var User   = require('../models/user');

var jwt = require('jsonwebtoken');
var speakeasy = require('speakeasy');
var config = require('../config'); // get our config file
var secretKey = config.secret;
var Helpers = require('./helpers');
var Currency = require('../models/currency');
var UserWallet = require('../models/userwallet');
var InvestmentPackage = require('../models/investmentpackage');
var Transaction = require('../models/transaction');

// router.use('/animals', require('./animals'))
var Client = require('coinbase').Client;
var client = new Client({'apiKey': config.coinBase.apiKey, 'apiSecret': config.coinBase.apiSecret});
// client.getCurrentUser(function(err, user) {
//   console.log(user);    //7d51c73a-4d31-586a-b206-550c9de0ed08
// });
// client.getAccount(config.coinBase.btcAccount.id, function(err, accounts) {
//     console.log(accounts);
// });


function GetUSDBalance(idUser, callback){
    Transaction.aggregate(
        //[{ $match: { idUser : req.decoded._id, datecreate : { $lte : curday }, walletType : 'usd wallet' }},
        [{ $match: { idUser : idUser, walletType : 'usd wallet' }},
        { $group: {
            _id : idUser,
            total:       { $sum: "$amount" },
        }}], function(err, result){
            if(err || result.length == 0){
                callback(0);
            }else{
                callback(result[0].total);
            }
        }
    )
}

function GetCurrencyPrice(pair, callback){
    client.getExchangeRates({'currency': pair.toUpperCase()}, function(err, rates) {
        if(err){
            callback(null);
        }else{
            callback(rates);
        }
    });
}

router.get('/', Helpers.isAuthenticated, function(req, res, next) {    
    // console.log(req.decoded);
    var data = {
        title: 'Wallet Page',
        description: 'Page Description',
        header: 'Page Header'        
    };

    res.render('wallet/index', data);    
})

router.get('/get-currency-price', Helpers.isAuthenticated, function(req, res, next) {    
    var mongoose = require('mongoose');
    var idUser = mongoose.Types.ObjectId(req.decoded._id);
    var curday = moment(moment().add(1, 'd').format('YYYY-MM-DD')).format();
    curday = new Date(curday);

    async.parallel({
        btcPrice : function(callback){
            GetCurrencyPrice('btc', function(result){
                callback(null, result);
            })
        },
        ethPrice : function(callback){
            GetCurrencyPrice('eth', function(result){
                callback(null, result);
            })
        },
    }, function(err, results){
        res.json(results);
    });

   
})

router.get('/get-wallet', Helpers.isAuthenticated, function(req, res, next) {    
    var mongoose = require('mongoose');
    var idUser = mongoose.Types.ObjectId(req.decoded._id);
    var curday = moment(moment().add(1, 'd').format('YYYY-MM-DD')).format();
    curday = new Date(curday);
    Currency.find({}, function(err, listCurrencies){
        async.forEachOf(listCurrencies, function (value, key, callbackOut) {
            async.parallel({
                getWallet : function(callback){
                    var accountID = config.coinBase[value.pair.toLowerCase() + "Account"];
                    if(typeof accountID === 'undefined' ){
                        callback(null, 'generate failed');
                    }else{
                        accountID = accountID.id;
                        UserWallet.findOne({idUser : req.decoded._id, idCurrency : value._id}, function(err, userWallet){
                            if(userWallet != null){
                                callback(null, userWallet.data.address);
                            }else{
                                client.getAccount(accountID, function(err, account) {
                                    account.createAddress({name : req.decoded.username}, function(err, result) {
                                        var item = {
                                            idUser : req.decoded._id,
                                            idCurrency : value._id,
                                            data : result,
                                        }
                                        UserWallet.Add(item, function(abc){
                                            if(abc.status){
                                                callback(null, abc.result.data.address);
                                            }else{
                                                callback(null, 'generate failed');
                                            }
                                        })
                                    });
                                });
                                
                            }
                        });
                    }
                },
                getBalance : function(callback){
                    Transaction.aggregate(
                        [{ $match: { idUser : req.decoded._id, datecreate : { $lte : curday }, walletType : value.pair.toLowerCase(), method : 'deposit' }},
                        { $group: {
                            _id : req.decoded._id,
                            total:       { $sum: "$amount" },
                        }}], function(err, result){
                            if(err || result.length == 0){
                                callback(null, 0 );
                            }else{
                                callback(null, result[0].total );
                            }
                        }
                    )
                }
            }, function(err, results){
                value._doc["address"] = results.getWallet;
                value._doc["balance"] = results.getBalance;
                callbackOut();
            });
        }, function (err) {
            GetUSDBalance(idUser, function(usdBalance){
                res.json({listCurrencies, usdBalance : usdBalance, enable2fa : req.decoded.enable2fa});
            })            
        });
    })    
})

router.get('/get-usd-histories', Helpers.isAuthenticated, function(req, res, next){
    var mongoose = require('mongoose');
    var idUser = mongoose.Types.ObjectId(req.decoded._id);
    var curday = moment(moment().add(1, 'd').format('YYYY-MM-DD')).format();
    curday = new Date(curday);
    Transaction.aggregate(
        [
            { $match: { idUser : idUser, datecreate : { $lte : curday }, walletType : 'usd wallet' }},
        ], function(err, result){
            res.json(result);
        }
    )
})

router.post('/transfer', Helpers.isAuthenticated, function(req, res, next) { 
    if(req.body.username == null || req.body.username == ''){
        res.json({status: false, mes: "Please enter username"}); return;
    } 
    if(Number.isNaN(req.body.amount) || !req.body.amount){
        res.json({status: false, mes: "Please enter amount or amount numer is not correct"}); return;
    }
    var mongoose = require('mongoose');
    var idUser = mongoose.Types.ObjectId(req.decoded._id);
    var curday = moment(moment().add(1, 'd').format('YYYY-MM-DD')).format();
    curday = new Date(curday);
    
    async.parallel({
        getReceiver : function(callback){
            User.findOne({username : req.body.username}, function(err, userfinded){
                if(err || userfinded == null){
                    callback(null, null);
                }else{
                    callback(null, userfinded);
                }
            })   
        },
        usdBalance: function(callback){
            GetUSDBalance(idUser, function(usdBalance){
                callback(null, usdBalance);
            }) 
        },
        check2FA : function(callback){
            if(req.decoded.enable2fa == false){
                callback(null, true);
            }else{
                User.GetUserByID(idUser, function(result){
                    var secret = result.user.secret2fa;
                    var verified = speakeasy.totp.verify({
                        secret: secret.base32,
                        encoding: 'base32',
                        token: req.body.authToken
                    });
                    if(verified){
                        callback(null, true);
                    }else{
                        callback(null, false);
                    }
                }) 
            }
        }
    }, function(err, results){
        if(results.getReceiver == null ){
            res.json({status: false, mes: "Username is not founded"}); return;
        }
        var amount = parseFloat(req.body.amount);
        console.log(amount);
        if(results.usdBalance < amount) {
            res.json({status: false, mes: "Your usd balance is not enough"}); return;
        }
        if(!results.check2FA){
            res.json({status: false, mes: "Verify 2FA Token failed"}); return;
        }
        
        var listTransactions = [];
        var timeInvest = moment().format();
        // Minus balance of sender 
        listTransactions.push({
            source : "minus",
            method : "transfer",
            methodType : "send",
            walletType : 'usd wallet',        // btc or vnc
            walletAmount : 0,        
            idUser : idUser,
            idUserIncurred : idUser,
            address : '',
            amount : - amount,
            datecreate : timeInvest,
            status : 1,
            txid : "",
            description : "send $" + amount + " to " + results.getReceiver.username ,
        });
        // Plus balance of sender 
        listTransactions.push({
            source : "plus",
            method : "transfer",
            methodType : "get",
            walletType : 'usd wallet',        // btc or vnc
            walletAmount : 0,        
            idUser : results.getReceiver._id,
            idUserIncurred : idUser,
            address : '',
            amount : amount,
            datecreate : timeInvest,
            status : 1,
            txid : "",
            description : "get $" + amount + " from " + req.decoded.username ,
        });
        Transaction.insertMany(listTransactions, function (err, added) {
            console.log('add all commission ', err, added);
            if(err){
                res.json({ status: false, mes: "Transfer failed. Please try again later" });
            }else{
                res.json({ status: true, mes: "Transfer USD successfully !" });
            }
            
        })
    });
     
})

router.get('/get-commission', Helpers.isAuthenticated, function(req, res, next) {   
    var mongoose = require('mongoose');
    var idUser = mongoose.Types.ObjectId(req.decoded._id);
    var curday = moment(moment().add(1, 'd').format('YYYY-MM-DD')).format();
    curday = new Date(curday); 
    async.parallel({
        interestCommission : function(callback){
            Transaction.aggregate(
                [{ $match: { idUser : idUser, datecreate : { $lte : curday }, walletType : "usd wallet", method : 'commission', methodType : "interest bonus" }},
                { $group: {
                    _id : idUser,
                    total:       { $sum: "$amount" },
                }}], function(err, result){
                    if(err || result.length == 0){
                        callback(null, 0 );
                    }else{
                        callback(null, result[0].total );
                    }
                }
            )
        },
        bonusCommission : function(callback){
            Transaction.aggregate(
                [{ $match: { idUser : idUser, datecreate : { $lte : curday }, walletType : "usd wallet", method : 'commission', methodType : {$in: [ "direct bonus", "referral bonus"]}}},
                { $group: {
                    _id : idUser,
                    total:       { $sum: "$amount" },
                }}], function(err, result){
                    if(err || result.length == 0){
                        callback(null, 0 );
                    }else{
                        callback(null, result[0].total );
                    }
                }
            )
        }
    }, function(err, results){
        res.json({interestBalance : results.interestCommission, bonusBalance : results.bonusCommission});
    });
})

router.post('/withdraw', Helpers.isAuthenticated, function(req, res, next){
    
    if(!req.body.vncAmount){
        res.json({status : false, mes : "please enter amount"});
        return;
    }
    if(typeof parseFloat(req.body.vncAmount) != "number" || parseFloat(req.body.vncAmount) <= 0){
        res.json({status : false, mes : " amount must be number"});
        return;
    }
    if(!req.body.vncAddress){
        res.json({status : false, mes : "please enter address"});
        return;
    }
    if(!req.body.confirmPassword){
        res.json({status : false, mes : "please enter password"});
        return;
    }

    if(req.body.formWalletType.toLowerCase() == 'usddaily' || req.body.formWalletType.toLowerCase() == 'usdcommission' ){
        // res.json({status : false, mes : "This functionality is being updated, please try again later"});
        // return;
        async.parallel({
            checkTime : function (callback){
                if(req.body.formWalletType.toLowerCase() == 'usdcommission'){
                    callback(null, {status : true});
                }else{
                    var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
                    Commission.findOne({idUser : idUser, type : 'daily withdraw'}).sort({datecreate : -1}).exec(function(err, finded){
                        if(finded != null){
                            var curTime = new Date();
                            var nextTime = new Date(moment(finded.datecreate).add(15,'d').format('YYYY-MM-DD'));
                            if(curTime < nextTime){
                                callback(null, {status : false, mes : 'The next time withdraw is ' + nextTime});
                            }else{
                                callback(null, {status : true});
                            }
                        }else{
                            callback(null, {status : true});
                        }                    
                        
                    })
                }
            },
            checkPass : function(callback){
                User.findOne({username : req.decoded.username}, function(err, result) {
                    if(err != null || result == null){
                        callback(null, {status : false, mes : 'invalid user login '});
                    }else{
                        // check user free 
                        if(result.free == 0){
                            callback(null, {status : false, mes : "There are another processing, please try again later.."});
                        }else{
                            var setField = {$set: { free: 0}};
                            User.UpdateUser(req.decoded._id, setField, function(err, up){});
                            if(!passwordHasher.validatePassword(req.body.confirmPassword, result.password)){
                                callback(null, {status : false, mes : "Confirm password is not correct"});
                            }else{
                                callback(null, {status: true, mes : ""});
                            } 
                        }
                          
                    }
                });
            },
            checkbalance : function(callback){
                var abc = ["sponsor bonus", "pay back", "team point bonus", "commission withdraw", "receive"];
                if(req.body.formWalletType.toLowerCase() == 'usddaily'){
                    abc = ['daily bonus', 'daily withdraw'];
                }
                var usdBalance = 0;
                var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
                var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
                Commission.find({ idUser: idUser, type : {$in : abc}, datecreate: { $lte: curday } }, function (err, result) {
                    if(err == null){
                        result.forEach(element => {
                            usdBalance += element.amount;
                        });
                        callback(null, { status: true, usdBalance });
                    }else{
                        callback(null, { status: true, usdBalance : 0 });
                    }
                })
            },
            checkReceiver : function(callback){
                User.findOne({username : req.body.vncAddress}, function(err, result) {
                    if(err || result == null){
                        callback(null, {status : false, user : null});
                    }else{
                        callback(null, {status : true, user : result._doc});
                    }
                });
            },
            getInvoice : function(callback){
                Helpers.randomInvoince(9, function(invoince){
                    callback(null, invoince);
                })
            }
        }, function(err, results){
            if(results.checkTime.status == false){
                var setField = {$set: { free: 1}};
                User.UpdateUser(req.decoded._id, setField, function(err, up){ });
                res.json({status : false, mes : results.checkTime.mes}); return;
            }
            if(results.checkPass.status == false){
                var setField = {$set: { free: 1}};
                User.UpdateUser(req.decoded._id, setField, function(err, up){ });
                res.json({status : false, mes : results.checkPass.mes}); return;
            }
            if(results.checkbalance.usdBalance < parseFloat(req.body.vncAmount) ){
                var setField = {$set: { free: 1}};
                User.UpdateUser(req.decoded._id, setField, function(err, up){ });
                res.json({status : false, mes : 'Your balance is not enough'}); return;
            }
            var listTrans = [];
            var time = new Date();
            var typeX = "commission withdraw";
            if(req.body.formWalletType.toLowerCase() == 'usddaily'){
                typeX = "daily withdraw";
            }
            var t = {
                amount: - parseFloat(req.body.vncAmount),
                idUser: req.decoded._id, 
                type: typeX,           // transfer , direct, ...
                coinTransfer: 'VND',   // BTC, ETH, VNC
                coinTransferAmount : parseFloat(req.body.vncAmount) * 22700,
                datecreate : time,
                txid :  time.getTime() + '-' + results.getInvoice,
                source : req.body.source,
                receiver : req.body.vncAddress,
            }
            listTrans.push(t);
            if(req.body.source == 'vncoins' && results.checkReceiver.status){
                var r = {
                    amount: parseFloat(req.body.vncAmount),
                    idUser : results.checkReceiver.user._id,
                    idUserIncurred: req.decoded._id, 
                    type: 'receive',           // transfer , direct, ...
                    coinTransfer: 'VND',   // BTC, ETH, VNC
                    coinTransferAmount : parseFloat(req.body.vncAmount) * 22700,
                    datecreate : time,
                    txid :  time.getTime() + '-' + results.getInvoice,
                    source : req.body.source,
                }
                Commission.insertMany(listTrans, function(err, db){
                    var setField = {$set: { free: 1}};
                    User.UpdateUser(req.decoded._id, setField, function(err, up){ });
                    if(err != null){
                        res.json({status : false, mes : 'Error : can not process your request, please try again later'}); return;
                    }else{
                        res.json({status : true, mes : 'Withdraw completed !'}); return;
                    }
                });
            }else if(req.body.source == 'yopay'){
                var form = {
                    code : time.getTime() + '-' + results.getInvoice,
                    money : parseFloat(req.body.vncAmount) * 22700,
                    wallet : req.body.vncAddress,
                    source : 'YOPAY' // VNCOINS, ETHEREUM, BITCOIN, YOPAY 
                };
                var urlPost = 'https://id.yopay.vn/api/transfer';
                var token = jwt.sign( form, 'yopay@)!&');
                Helpers.DoApiRequest({data: token}, urlPost, function(result){
                    if(result == false){
                        var setField = {$set: {free : 1}};
                        // Update Amount of sender
                        User.UpdateUser(req.decoded._id, setField, function(err, up){
                            res.json({status : false, mes : 'transfer failed ! Can not connect to yopay.vn'}); return;
                        })
                    }else if(result.status == false){
                        var setField = {$set: {free : 1}};
                        // Update Amount of sender
                        User.UpdateUser(req.decoded._id, setField, function(err, up){
                            res.json({status : false, mes : 'transfer failed ! ' + result.ms}); return;
                        })
                    }else{
                        Commission.insertMany(listTrans, function(err, db){
                            var setField = {$set: { free: 1}};
                            User.UpdateUser(req.decoded._id, setField, function(err, up){ });
                            if(err != null){
                                res.json({status : false, mes : 'Error : can not process your request, please try again later'}); return;
                            }else{
                                res.json({status : true, mes : 'Withdraw completed !'}); return;
                            }
                        })
                    }
                })

            }else{
                var setField = {$set: { free: 1}};
                User.UpdateUser(req.decoded._id, setField, function(err, up){ 
                    res.json({status : false, mes : 'Error : can not process your request, please try again later'}); return;
                });
            }
        })
    }else{
        async.parallel({
            checkbalance: function(callback) {
                User.GetUserByID(req.decoded._id, function(result){
                    if(result.user.free == 0){
                        callback(null, {status : false, balance : balance, mes : 'Please watting process ...'});
                    }else{
                        var balance = result.user.vncAmount;
                        if(req.body.walletType == 'btc'){
                            balance = result.user.btcAmount;
                        }
                        if(req.body.walletType == 'eth'){
                            balance = result.user.ethAmount;
                        }
    
                        if(!passwordHasher.validatePassword(req.body.confirmPassword, result.user.password)){
                            callback(null, {status : false, balance : balance, mes : "Confirm password is not correct", pass : result.user.password});
                        }else{
                            if((parseFloat(req.body.vncAmount) + 0.0005) > balance){
                                callback(null, {status : false, balance : balance, mes : "Your balance is not enough", pass : result.user.password});
                            }else{
                                var setField = {$set: { free: 0}};
                                User.UpdateUser(req.decoded._id, setField, function(err, up){});
                                callback(null, {status: true, balance: balance, pass : result.user.password});
                            }
                        }   
                        
                    }
                    
                });
            },
            checkReceiver: function(callback) {
                // CHeck if withdraw address in system or not 
                // IF in system, add transaction for receiver
                User.findOne().where(req.body.walletType + 'Address', req.body.vncAddress).exec(function(err, result) {
                    if(err || result == null){
                        callback(null, {status : false, user : null});
                    }else{
                        callback(null, {status : true, user : result._doc});
                    }
                });
            },
            getInvoice : function(callback){
                Helpers.randomInvoince(9, function(invoince){
                    callback(null, invoince);
                })
            }
        }, function(err, results) {   
            // Helpers.writeLog('err.json', results, function(){});
            // res.json({status: false, mes: 'Password not correct'});
            // return;
            
            if(!results.checkbalance.status){
                res.json({status : false, mes : results.checkbalance.mes});
                return;
            }
            var type = 'send';
            var status = 1;
            // if(results.checkReceiver.status == false){
            //     type = 'withdraw'; status = 0;
            // }
            // Add transaction for sender
            var listTrans = [];
            var time = new Date();
            var t = {
                idUser : req.decoded._id,
                address : req.body.vncAddress,           // address of btc or vnc
                walletType : req.body.walletType,        // btc or vnc
                amount : -parseFloat(req.body.vncAmount),
                type: type,        // buy, sell, deposit, withdraw, send, get, fee
                datecreate :  time ,
                status : status,            //
                txid : time.getTime() + '-' + results.getInvoice,
                refbalance : results.checkbalance.balance,
                source : req.body.source
            }
            listTrans.push(t);
            var fee = {
                idUser : req.decoded._id,
                address : req.body.vncAddress,           // address of btc or vnc
                walletType : req.body.walletType,        // btc or vnc
                amount : -0.0005,
                type: "fee",        // buy, sell, deposit, withdraw, send, get, fee
                datecreate :  time ,
                status : 1,            //
                txid : time.getTime() + '-' + results.getInvoice,
                refbalance : results.checkbalance.balance,
                source : req.body.source
            }
            listTrans.push(fee);
    
            if(results.checkReceiver.status){
                var tReceiver = {
                    idUser : results.checkReceiver.user._id,
                    address : results.checkReceiver.user[req.body.walletType + 'Address'],           // address of btc or vnc
                    walletType : req.body.walletType,        // btc or vnc
                    amount : parseFloat(req.body.vncAmount),
                    type: "get",        // buy, sell, deposit, withdraw, send, get, fee
                    datecreate :  time ,
                    status : 1,            //
                    txid : time.getTime() + '-' + results.getInvoice,
                    refbalance : results.checkReceiver.user[req.body.walletType + 'Amount'],
                    source : req.body.source
                };
                listTrans.push(tReceiver);
                Transaction.insertMany(listTrans, function(err, db){
                    // console.log(err, db);
                    if(!err){
                        var abc = {free : 1};
                        abc[req.body.walletType + 'Amount'] = parseFloat(results.checkbalance.balance - req.body.vncAmount - 0.0005 );
                        var setField = {$set: abc};
                        // Update Amount of sender
                        User.UpdateUser(req.decoded._id, setField, function(err, up){
                            // console.log('update user send', err, up);
                            if(results.checkReceiver.status){
                                // Update Amount of reveiver
                                var xyz = {free : 1};
                                xyz[req.body.walletType + 'Amount'] = parseFloat(results.checkReceiver.user[req.body.walletType + 'Amount'] + parseFloat(req.body.vncAmount) );
                                var setField = {$set: xyz};
                                User.UpdateUser(results.checkReceiver.user._id, setField, function(err, up){ 
                                    // console.log('update user receive ', err, up);
                                    if(err == null){
                                        res.json({status : true, mes : "Withdraw completed ..."});
                                    }else{
    
                                    }
                                });
                            }
                            
                        })
                    }else{
                        res.json({status : false, mes : "Something wrong, try again later"});
                        return;
                    }
                    
                })
    
            }else{
    
                var form = {
                    code : time.getTime() + '-' + results.getInvoice,
                    money : parseFloat(req.body.vncAmount),
                    wallet : req.body.vncAddress,
                    source : req.body.formWalletType // VNCOINS, ETHEREUM, BITCOIN, YOPAY 
                };
                var urlPost = 'https://id.yopay.vn/api/transfer';
                var token = jwt.sign( form, 'yopay@)!&');
                Helpers.DoApiRequest({data: token}, urlPost, function(result){
                    if(result == false){
                        var setField = {$set: {free : 1}};
                        // Update Amount of sender
                        User.UpdateUser(req.decoded._id, setField, function(err, up){
                            res.json({status : false, mes : 'transfer failed ! Can not connect to yopay.vn'});
                            return;
                        })
                    }else if(result.status == true){
                        Transaction.insertMany(listTrans, function(err, db){
                            if(!err){
                                var abc = {free : 1};
                                abc[req.body.walletType + 'Amount'] = parseFloat(results.checkbalance.balance - req.body.vncAmount - 0.0005 );
                                var setField = {$set: abc};
                                // Update Amount of sender
                                User.UpdateUser(req.decoded._id, setField, function(err, up){
                                    if(!err){
                                        res.json({status : true, mes : " Withdraw completed ..."});
                                    }else{
                                        Helpers.writeLog('err.json', {date : new Date(), mes : 'Transfer Yopay success, add transactions success, update user failed .', listTrans, userbalance : results.checkbalance}, function(){});
                                        res.json({status : false, mes : "Something wrong, try again later"});
                                    }
                                })
                            }else{
                                Helpers.writeLog('err.json', {date : new Date(), mes : 'Transfer Yopay success, add transactions failed, not yet update user .', listTrans, userbalance : results.checkbalance}, function(){});
                                res.json({status : false, mes : "Something wrong, try again later"});
                            }
                        })
                    }else{
                        var setField = {$set: {free : 1}};
                        User.UpdateUser(req.decoded._id, setField, function(err, up){
                            res.json({status : false, mes : 'transfer failed ! ' + result.ms});
                            return;
                        })
                    }
                })
                
            }
    
        });
    }
    

})

router.get('/*', Helpers.isAuthenticated, function(req, res, next) {    
    res.render('layout/layout');    
})


module.exports = router