
var express = require('express');
var async = require('async');
var csrf = require('csurf');
var request = require('request');
var querystring = require('querystring');
var moment = require('moment');
var passwordHasher = require('aspnet-identity-pw');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require('../../models/user');
var Transaction = require('../../models/transaction');
var InvestmentPackage = require('../../models/investmentpackage');
// var Role   = require('../models/role');
// var UserRole   = require('../models/userrole');
// var UserAuth   = require('../models/userauth');

var config = require('../../config'); // get our config file
var Helpers = require('../helpers');
var secretKey = config.secret;

var getCookies = function (cookie, cname){
    if(!cookie){
        return "";
    }
    var name = cname + "=";
    var ca = cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";    
}

// Helpers.writeLog("abc", {username : 'phongle', status : true}, function(result){});

// router.use(function (req, res, next) {
//     var token = req.body.token || req.query.token || getCookies(req.headers.cookie, "x-access-token");

//     // decode token
//     if (token) {
//         // verifies secret and checks exp
//         jwt.verify(token, secretKey, function(err, decoded) {      
//             if (err) {
//                 return res.json({ success: false, message: 'Failed to authenticate token.' });    
//             } else {
//                 // if everything is good, save to request for use in other routes
//                 req.decoded = decoded;    
//                 if(req.decoded.username != 'root'){
//                     res.redirect("/login?redirect="+req.originalUrl);
//                 }else{
//                     next();
//                 }
                
//             }
//         });

//     } else {
//         res.redirect("/login?redirect="+req.originalUrl);
//     }
// })

router.use('/media', require('./media'));
router.use('/category', require('./category'));
router.use('/product', require('./product'));
router.use('/member', require('./member'));
router.use('/promotion', require('./promotion'));
router.use('/order', require('./order'));
router.use('/video', require('./video'));
router.use('/notification', require('./notification'));

router.get('/check-transfer-lending', function (req, res, next) {
    User.find({ username: 'linhpham1' }, function (err, listuser) {
        res.json(listuser);
        async.forEachOfSeries(listuser, function (value, key, callbackOut) {
            async.parallel({
                totalTransfer: function (callback) {
                    Commission.find({ idUser: value._id, type: 'transfer to usd' }, function (err, listTransfer) {
                        var sum = 0;
                        listTransfer.forEach(element => {
                            sum += element.amount;
                        });
                        callback(null, sum);
                    })
                },
                totalLending: function (callback) {
                    Commission.find({ idUser: value._id, type: 'lending' }, function (err, listLending) {
                        var sum = 0;
                        listLending.forEach(element => {
                            sum += element.amount;
                        });
                        callback(null, sum);
                    })
                }
            }, function (err, results) {
                console.log(value.username, results.totalTransfer, results.totalLending);
                console.log(' --- sum : ', results.totalTransfer + results.totalLending, '\n');
                callbackOut();
            });
        }, function (err) {

        })
    })
})

router.get('/', function (req, res, next) {
    res.render("layout/admin");
})

router.get('/statistic', function (req, res, next) {
    var result = {
        btc : {symbol : 'btc'}, eth : {symbol : 'eth'}, vnc : {symbol:'vnc'}, usd : {symbol:'usd'}
    }
    async.forEach(result, function(element, callbackOut) {
        element.totalDeposit = 0;
        element.totalWithdraw = 0;
        element.totalTransferUSD = 0;
        element.totalLending = 0;
        element.totalBonus = 0;
        async.parallel({
            totalDeposit : function(callback){
                var query = Transaction.aggregate({ $match: {
                    walletType: element.symbol ,
                    type: { $regex: "deposit" }
                } },
                { $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }});

                if(element.symbol == "usd"){
                    var query = Commission.aggregate({ $match: {
                        type: { $regex: "transfer to usd" }
                    } },
                    { $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }});
                }else{
                    
                    
                }
                query.exec(function(err, result){
                    callback(null, result[0]);
                })
                
            },
            totalWithdraw : function(callback){
                var query = Transaction.aggregate({ $match: {
                         walletType: element.symbol ,
                         type: { $regex: "withdraw" }
                } },
                { $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }});
                if(element.symbol == "usd"){
                    var query = Commission.aggregate({ $match: {
                        type: { $regex: "withdraw" }
                    } },
                    { $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }});
                }
                query.exec(function(err, result){
                    callback(null, result[0]);
                })
            },
            totalTransferUSD : function(callback){
                var query = Transaction.aggregate({ $match: {
                    walletType: element.symbol ,
                    type: { $regex: "transfer to usd" }
                } },
                { $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }});
                if(element.symbol == "usd"){
                    var query = Commission.aggregate({ $match: {
                        type: { $regex: "lending" }
                    } },
                    { $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }});
                }
                query.exec(function(err, result){
                    callback(null, result[0]);
                })

            },
            totalBonus : function(callback){
                var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
                var query = Transaction.aggregate({ $match: {
                    walletType: element.symbol ,
                    type: { $regex: "bonus" }
                } },
                { $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }});
                if(element.symbol == "usd"){
                    var query = Commission.aggregate({ $match: {
                        type: { $regex: "bonus" },
                        datecreate: { $lte: curday }
                    } },
                    { $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }});
                }
                query.exec(function(err, result){
                    callback(null, result[0]);
                })

            }
        }, function(err, results){
            // console.log(results.totalDeposit);
            if(results.totalDeposit)
                element.totalDeposit = results.totalDeposit.total;
            if(results.totalWithdraw)
                element.totalWithdraw = results.totalWithdraw.total;
            if(results.totalTransferUSD){
                
                if(element.symbol == "usd"){
                    element.totalLending = results.totalTransferUSD.total;
                }else{
                    element.totalTransferUSD = results.totalTransferUSD.total;
                }
            }
            if(results.totalBonus)
                element.totalBonus = results.totalBonus.total;
            callbackOut();
        })
        
    }, function(err){
        res.json(result);
    });

    
})

router.get('/list-user', function (req, res, next) {
    var data = {
        title: 'admin all user',
    }
    res.render("admin/list-user", data);
})

router.get('/get-tree-user', function (req, res, next) {
    var skip = 0;
    var limit = 10;
    if (req.query.page != null && parseInt(req.query.page) > 1) {
        skip = (parseInt(req.query.page) - 1) * 10;
    }
    var query = User.find({});
    if (req.query.username != null && req.query.username != '') {
        User.findOne({ username: req.query.username }, function (err, result) {
            var abc = { $regex: '^' + result.sponsorAddress + '-' };
            User.find({ sponsorAddress: abc, sponsorLevel: { $lte: result.sponsorLevel + 2 } }).exec(function (err, listuser) {
                if (err) {
                    throw err;
                }
                result._doc.parentCode = -1;
                result.parentCode = -1;
                listuser.push(result);
                async.forEachOfSeries(listuser, function (value, key, callbackOut) {
                    async.parallel({
                        usdLending: function (callback) {
                            var usdBalance = 0;
                            var count = 0;
                            var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
                            var abc = ["lending"];
                            Commission.find({ $and: [{ idUser: value._id }, { datecreate: { $lte: curday } }, { type: { $in: abc } }] }, function (err, result) {
                                result.forEach(element => {
                                    count++;
                                    usdBalance += element.amount;
                                });
                                callback(null, { count, amount: Math.abs(usdBalance).toFixed(2) });
                            })
                        },
                        countMember: function (callback) {
                            var zzz = { $regex: '^' + value.sponsorAddress + '-' };
                            User.count({ sponsorAddress: zzz }, function (err, count) {
                                callback(null, count);
                            })
                        }
                    }, function (err, results) {
                        listuser[key]._doc.usdLending = results.usdLending.amount;
                        listuser[key]._doc.countLending = results.usdLending.count;
                        listuser[key]._doc.datecreate = moment(listuser[key]._doc.datecreate).format('YYYY-MM-DD');
                        listuser[key]._doc.countMember = results.countMemer;
                        // listuser[key]._doc.usdDaily = results.usdDaily.toFixed(2);
                        // listuser[key]._doc.usdCommission = results.usdCommission.toFixed(2);
                        callbackOut();
                    })
                }, function (err) {
                    res.json(listuser);
                })
            });
        })
    } else {
        User.find({ parentCode: -1 }, function (err, listuser) {
            async.forEachOfSeries(listuser, function (value, key, callbackOut) {
                async.parallel({
                    // usdBalance: function (callback) {
                    //     var usdBalance = 0;
                    //     Commission.find({ idUser: value._id, $or: [{ type: 'lending' }, { type: 'transfer to usd' }] }, function (err, result) {
                    //         result.forEach(element => {
                    //             usdBalance += element.amount;
                    //         });
                    //         callback(null, usdBalance);
                    //     })
                    // },
                    // usdDaily: function (callback) {
                    //     var usdBalance = 0;
                    //     var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
                    //     var abc = ['daily bonus', 'daily withdraw'];
                    //     Commission.find({ idUser: value._id, type: { $in: abc }, datecreate: { $lte: curday } }, function (err, result) {
                    //         result.forEach(element => {
                    //             usdBalance += element.amount;
                    //         });
                    //         callback(null, usdBalance);
                    //     })
                    // },
                    // usdCommission: function (callback) {
                    //     var usdBalance = 0;
                    //     var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
                    //     var abc = ["sponsor bonus", "pay back", "team point bonus", "commission withdraw", "receive"];
                    //     Commission.find({ $and: [{ idUser: value._id }, { datecreate: { $lte: curday } }, { type: { $in: abc } }] }, function (err, result) {
                    //         result.forEach(element => {
                    //             usdBalance += element.amount;
                    //         });
                    //         callback(null, usdBalance);
                    //     })
                    // },
                    usdLending: function (callback) {
                        var usdBalance = 0;
                        var count = 0;
                        var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
                        var abc = ["lending"];
                        Commission.find({ $and: [{ idUser: value._id }, { datecreate: { $lte: curday } }, { type: { $in: abc } }] }, function (err, result) {
                            result.forEach(element => {
                                count++;
                                usdBalance += element.amount;
                            });
                            callback(null, { count, amount: Math.abs(usdBalance).toFixed(2) });
                        })
                    },
                    countMember: function (callback) {
                        var zzz = { $regex: '^' + value.sponsorAddress + '-' };
                        User.count({ sponsorAddress: zzz }, function (err, count) {
                            callback(null, count);
                        })
                    }
                }, function (err, results) {
                    // listuser[key].usdLending = results.usdBalance.toFixed(2);
                    listuser[key]._doc.usdLending = results.usdLending.amount;
                    listuser[key]._doc.countLending = results.usdLending.count;
                    listuser[key]._doc.datecreate = moment(listuser[key]._doc.datecreate).format('YYYY-MM-DD');
                    listuser[key]._doc.countMember = results.countMember;
                    // listuser[key]._doc.usdCommission = results.usdCommission.toFixed(2);
                    callbackOut();
                })
            }, function (err) {
                res.json(listuser);
            })
        })

    }

})

router.get('/get-all-user', function (req, res, next) {
    var skip = 0;
    var limit = 10;
    if (req.query.page != null && parseInt(req.query.page) > 1) {
        skip = (parseInt(req.query.page) - 1) * 10;
    }
    var query = User.find({});
    if (req.query.username != null && req.query.username != '') {
        query = query.where('username', { $regex: req.query.username });
    }
    query = query.sort({ datecreate: 1 }).skip(skip).limit(limit);
    query.exec(function (err, listuser) {
        async.forEachOfSeries(listuser, function (value, key, callbackOut) {
            async.parallel({
                btcTrans: function(callback){
                    var kq = 0;
                    var abc = Transaction.find({idUser: value._id, walletType : 'btc'}).sort({ datecreate: 1 });
                    abc.exec(function(err, listTran){
                        listTran.forEach(element => {
                            kq += element.amount;
                        });
                        callback(null, kq);
                    })
                },
                ethTrans: function(callback){
                    var kq = 0;
                    var abc = Transaction.find({idUser: value._id, walletType : 'eth'}).sort({ datecreate: 1 });
                    abc.exec(function(err, listTran){
                        listTran.forEach(element => {
                            kq += element.amount;
                        });
                        callback(null, kq);
                    })
                },
                vncTrans: function(callback){
                    var kq = 0;
                    var abc = Transaction.find({idUser: value._id, walletType : 'vnc'}).sort({ datecreate: 1 });
                    abc.exec(function(err, listTran){
                        listTran.forEach(element => {
                            kq += element.amount;
                        });
                        callback(null, kq);
                    })
                },
                // usdBalance: function (callback) {
                //     var usdBalance = 0;
                //     Commission.find({ idUser: value._id, $or: [{ type: 'lending' }] }, function (err, result) {
                //         result.forEach(element => {
                //             usdBalance += element.amount;
                //         });
                //         callback(null, usdBalance);
                //     })
                // },
                // usdDaily: function (callback) {
                //     var usdBalance = 0;
                //     var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
                //     var abc = ['daily bonus', 'daily withdraw'];
                //     Commission.find({ idUser: value._id, type: { $in: abc }, datecreate: { $lte: curday } }, function (err, result) {
                //         result.forEach(element => {
                //             usdBalance += element.amount;
                //         });
                //         callback(null, usdBalance);
                //     })
                // },
                // usdCommission: function (callback) {
                //     var usdBalance = 0;
                //     var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
                //     var abc = ["sponsor bonus", "pay back", "team point bonus", "commission withdraw", "receive"];
                //     Commission.find({ $and: [{ idUser: value._id }, { datecreate: { $lte: curday } }, { type: { $in: abc } }] }, function (err, result) {
                //         result.forEach(element => {
                //             usdBalance += element.amount;
                //         });
                //         callback(null, usdBalance);
                //     })
                // },

            }, function (err, results) {
                listuser[key]._doc.btcTrans = - results.btcTrans.toFixed(2);
                listuser[key]._doc.ethTrans = results.ethTrans.toFixed(2);
                listuser[key]._doc.vncTrans = results.vncTrans.toFixed(2);
                callbackOut();
            })
        }, function (err) {
            res.json(listuser);
        })
    });
    // User.find({}).where('username', { $regex : 'p'}).sort({datecreate : 1}).skip(skip).limit(limit).exec(function(err, listuser){
    //     res.json(listuser);
    // });
})

router.get('/lending', function(req, res, next){
    
})



function GetAllTransactions(query, callbackabc){
    query.exec(function(err, list){
        var listKQ = [];
        async.forEachOfSeries(list, function (value, key, callbackOut) {
            async.parallel({
                getUser : function(callback){
                    User.findOne({_id : value.idUser}, function(err, user){
                        if(err != null)
                            callback(null, "");
                        else
                            callback(null, user.username);
                    })
                }
            }, function(err, results){
                list[key]._doc.username =  results.getUser;
                list[key].username =  results.getUser;
                listKQ.push(list[key]._doc);
                callbackOut();
            });
        }, function(errs, results){
            console.log(listKQ);
            callbackabc(listKQ);
        })

       
    })
}


router.get('/lock', function (req, res, next) {
    var username = req.query.username;
    var value = req.query.value;
    User.update({username : username}, {$set : {lock : value}}, {upsert : true}, function(err, result){
        console.log(err, result);
        res.json(result);
    })
})


router.get('/count-all-user', function (req, res, next) {
    var query = User.count({});
    if (req.query.username != null && req.query.username != '') {
        query = query.where('username', { $regex: req.query.username });
    }
    query.exec(function (err, result) {
        res.json(result);
    })
})


router.get('/run-all-lending', function (req, res, next) {
    var idLending = require('mongoose').Types.ObjectId(req.query.idlending);
    Commission.find({ _id: idLending }).sort({ datecreate: 1 }).exec(function (err, listLending) {
    //Commission.find({ type: 'lending' }).sort({ datecreate: 1 }).exec(function (err, listLending) {        
        res.json(listLending);
        async.forEachOfSeries(listLending, function (value, key, callbackOut) {
            Commission.count({ idLending: value._id }, function (err, result) {

                if (result == 0 && Math.abs(value.amount) > 500) {
                    //console.log(value.id, Math.abs(value.amount) , err, result);
                    User.findOne({ _id: value.idUser }, function (err, finded) {
                        if (finded.sponsor == '' || finded.sponsor == null) {
                            console.log(finded.username, ' khong co sponsor ');
                            callbackOut();
                        } else {
                            console.log(finded.username, ' - ', finded.sponsor);
                            async.parallel({
                                getSponsor: function (callback) {
                                    User.GetUserByID(finded._doc.idSponsor, function (result) {
                                        if (!result.status) {
                                            callback(null, { status: false, user: null });
                                        } else {
                                            callback(null, { status: true, user: result.user._doc });
                                        }
                                    })
                                },
                                getSponsorPackage: function (callback) {
                                    var idSponsor = finded._doc.idSponsor;
                                    Commission.aggregate(
                                        [{ $match: { idUser: idSponsor, type: 'lending', datecreate: { $lte: new Date(value.datecreate.toISOString()) } } },
                                        {
                                            $group: {
                                                _id: idSponsor,
                                                totalUSD: { $sum: "$amount" },
                                            }
                                        }], function (err, result) {
                                            if (result.length == 0) {
                                                callback(null, null);
                                            } else {
                                                InvestmentPackage.find({ amount: { $lte: - result[0].totalUSD } }).sort({ amount: -1 }).exec(function (err, listPackage) {
                                                    if (err) {
                                                        callback(null, null);
                                                    } else {
                                                        callback(null, listPackage[0]);
                                                    }

                                                })
                                            }
                                        }
                                    )
                                },
                                getPackage: function (callback) {
                                    InvestmentPackage.findOne({ _id: value.idInvestmentPackage }, function (err, result) {
                                        if (err || result == null) {
                                            callback(null, { status: false, result: null });
                                        } else {
                                            callback(null, { status: true, result: result._doc });
                                        }
                                    })
                                },
                            }, function (err, results) {
                                console.log(results);
                                var listBonus = [];
                                if (results.getSponsorPackage != null) {
                                    var directCom_USD = {
                                        // amount: - value.amount * results.getSponsorPackage.sponsorBonus / 100,
                                        amount: - value.amount * results.getPackage.result.sponsorBonus / 100,
                                        idUser: finded.idSponsor,
                                        idUserIncurred: value.idUser,
                                        type: 'sponsor bonus',           // transfer , direct, ...
                                        datecreate: moment(value.datecreate).add(2, 'd').format(),
                                        idLending: value._id
                                    }
                                    listBonus.push(directCom_USD);
                                    var directTrans = {
                                        idUser: finded.idSponsor,
                                        idUserIncurred: value.idUser,
                                        walletType: 'vnc',        // btc or vnc
                                        amount: value.coinTransferAmount * results.getPackage.result.sponsorBonus / 100,
                                        type: 'sponsor bonus',        // buy, sell, deposit, withdraw
                                        datecreate: value.datecreate,
                                        status: 1,
                                        txid: value._id,
                                        refbalance: results.getSponsor.user['vncAmount'],
                                        description: 'direct commission from ' + finded.username + ' lending ' + (- value.amount) + ' USD',
                                        source: 'vncoins'
                                    }
                                    Transaction.Add(directTrans, function (result) {
                                        if (!result.status) {
                                            Helpers.writeLog('err.json', { date: time, mes: 'Add sponsor bonus transaction failed  not yet update user .', value, directTrans }, function () { });
                                        } else {
                                            console.log('add trans');
                                            var abc = {};
                                            abc['vncAmount'] = results.getSponsor.user['vncAmount'] + directTrans.amount;
                                            var setField = { $set: abc };
                                            User.UpdateUser(finded.idSponsor, setField, function (err, up) {
                                                if (err != null) {
                                                    Helpers.writeLog('err.json', { date: time, mes: 'Add sponsor bonus transaction success,  not yet update user .', value, directTrans }, function () { });
                                                } else {
                                                    console.log('update user');
                                                }
                                            });
                                        }
                                    })
                                }

                                var cday = moment(value.datecreate).format('YYYY-MM-DD');
                                if (results.getPackage.result.dailyBonus > 0) {
                                    for (var i = 1; i <= results.getPackage.result.circleDays; i++) {
                                        var nday = moment(cday).add(i, 'd').format();
                                        listBonus.push({
                                            amount: results.getPackage.result.amount * results.getPackage.result.dailyBonus / 200,
                                            idUser: value.idUser,
                                            type: 'daily bonus',           // transfer
                                            coinTransfer: 'USD',   // BTC, ETH, VNC
                                            coinTransferAmount: -1,
                                            datecreate: nday,
                                            coinPrice: -1,
                                            idInvestmentPackage: results.getPackage._id,
                                            idLending: value._id
                                        });
                                    }
                                }
                                var end_day = moment(cday).add(results.getPackage.result.circleDays + 1, 'd').format();
                                listBonus.push({
                                    amount: results.getPackage.result.amount * results.getPackage.result.endingCircleReceiveUSD / 100,
                                    idUser: value.idUser,
                                    type: 'pay back',           // transfer
                                    coinTransfer: 'USD',   // BTC, ETH, VNC
                                    coinTransferAmount: -1,
                                    datecreate: end_day,
                                    coinPrice: -1,
                                    idInvestmentPackage: results.getPackage._id,
                                    idLending: value.id
                                });
                                Commission.insertMany(listBonus, function (err, added) {
                                    console.log(err, added);
                                    callbackOut();
                                })

                            })
                        }

                    })
                } else {
                    callbackOut();
                }
            })

        }, function (err) {
            console.log('done');
        })
    })
})

router.get('/delete-all-commission', function (req, res, next) {

    Commission.find({ type: 'lending' }, function (err, listLending) {
        // Commission.find({ type: 'lending', _id : require('mongoose').Types.ObjectId(req.query.id)}, function (err, listLending) {
        //console.log(listLending.length);
        async.forEachOfSeries(listLending, function (value, key, callbackOut) {
            console.log(value.id);
            DeleteAllCommissionLending(value, function (result) {
                console.log(result);
                callbackOut();
            })
        }, function (errs) {
            console.log('done');

        })
        res.json('done');
    })
})




function DeleteAllCommissionLending(value, callbackOut) {
    var abc = ['daily bonus', 'pay back'];
    Commission.remove({ idLending: value._id, type: { $in: abc } }, function (err, result) {
        // console.log('remove daily bonus ', err, result);
    })
    Commission.remove({ idLending: value._id, type: 'sponsor bonus' }, function (err, result) {
        // console.log('remove sponsor bonus ', err, result);
    })

    Transaction.findOne({ walletType: 'vnc', type: 'sponsor bonus', txid: value._id.toString() }, function (err, result) {
        if (result != null) {
            User.findOne({ _id: result.idUser }, function (err, finded) {
                var abc = {};
                abc['vncAmount'] = finded['vncAmount'] - result.amount;
                var setField = { $set: abc };
                User.UpdateUser(finded._id, setField, function (err, up) {
                    Transaction.remove({ _id: result._id }, function (err, up) {
                        console.log(1);
                        callbackOut(1);
                    })
                });

            })
        } else {
            console.log(0);
            callbackOut(0);
        }

    })
}


router.post('/transfer', function (req, res, next) {
    User.findOne({username : req.body.username}).exec(function(err, user){
        if(err != null || user == null){
            res.json({status : false, mes : "Invalid Username"}); return;
        }else{
            var trans = {
                source: "plus",				// plus, minus
                method: "deposit",        // buy, sell, deposit, withdraw, send, get, fee, commission, invest
                methodType: "transfer",        // if commission we have many type
                walletType : 'usd wallet',        // btc or eth
                walletAmount : 0,
                idUser : user._id,
                address : '',           // address of btc or vnc
                amount : parseFloat(req.body.amount),
                status : 1,            // -1 cancel, 0 pending, 1 approved
                txid : '',
                real : false
            };

            Transaction.Add(trans, function(result){
                if(result.status){
                    res.json({status : true, mes : "Transfer $" + req.body.amount + " to " + user.username + " successfully"});
                }else{
                    res.json({status : false, mes : "Error. transfer transaction can't be saved"});
                }
            })
        }
    })
})

router.get('/*', function (req, res, next) {
    res.render("layout/admin");
})

// GetTotalDeposit(true, function(result){
//     console.log(result);
// })

function GetTotalDeposit (type, callback){
    Transaction.aggregate(
        //[{ $match: { idUser : idUser, datecreate : { $lte : curday } }},
        [{ $match: { method : "deposit" , real : true}},
        { $group: {
            _id : "$method",
            total:       { $sum: "$amount" },
        }}], function(err, result){
            if(err || result.length == 0){
                callback({status : false, total : 0 });
            }else{
                callback({status : true, total : result[0].total });
            }
        }
    )
}

module.exports = router
