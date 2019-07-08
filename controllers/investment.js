var express = require('express');
var moment = require('moment');
var async = require('async');
var router = express.Router();
var User = require('../models/user');
var Transaction = require('../models/transaction');
var InvestmentPackage = require('../models/investmentpackage');
var UserInvest = require('../models/userinvest');
var Commission = require('../models/commission');
// var UserAuth   = require('../models/userauth');
var config = require('../config'); // get our config file
var Helpers = require('./helpers');
// router.use('/animals', require('./animals'))




router.get('/', Helpers.isAuthenticated, function (req, res, next) {
    var data = {
        title: 'Lending Page',
        description: 'Page Description',
        header: 'Page Header',
    };
    res.render('layout/layout', data);

})

router.get('/get-investment-packages', Helpers.isAuthenticated, function (req, res, next) {
    InvestmentPackage.find({}).sort({ priority: 1 }).exec(function (err, result) {
        res.json(result);
    });
})

router.get('/get-package', Helpers.isAuthenticated, function (req, res, next) {
    var mongoose = require('mongoose');
    var objectId = mongoose.Types.ObjectId(req.query.id);
    InvestmentPackage.findOne({_id : objectId}).exec(function (err, result) {
        res.json(result);
    });
})

router.get('/get-balance', Helpers.isAuthenticated, function (req, res, next) {
    GetUSDBalance(req.decoded._id, function(result){
        res.json(result.usdBalance);
    })
})

router.post('/create-package', Helpers.isAuthenticated, function (req, res, next) {
    // res.json({status : false, mes : "Lending program will start at 30/01/2018"});
    // return;
    var amount = parseInt(req.body.amount);
    var mongoose = require('mongoose');
    var idUser = mongoose.Types.ObjectId(req.decoded._id);
    var idPackage = mongoose.Types.ObjectId(req.body.package);
    async.parallel({
        usdBalance: function (callback) {
            GetUSDBalance(idUser, function (result) {
                callback(null, result);
            })
        },
        getPackage: function (callback) {
            InvestmentPackage.findOne({ _id: idPackage }, function (err, result) {
                if (err || result == null) {
                    callback(null, { status: false, result: null });
                } else {
                    callback(null, { status: true, result: result._doc });
                }
            })
        },
        getSponsor: function (callback) {
            User.GetUserByID(req.decoded.idSponsor, function (result) {
                if (!result.status) {
                    callback(null, { status: false, user: null });
                } else {
                    callback(null, { status: true, user: result.user._doc });
                }
            })
        },
        getSponsorPackage: function (callback) {
            var idSponsor = mongoose.Types.ObjectId(req.decoded.idSponsor);
            GetBigestInvestmentPackage(idSponsor, function (result) {
                if (result == null) {
                    callback(null, { status: false, pk: null });
                } else {
                    callback(null, { status: true, pk: result });
                }
            })
        },

    }, function (err, results) {
        // console.log(results);
        // return;
        if (!results.getPackage.status || !results.usdBalance.status || amount < results.getPackage.min || amount > results.getPackage.max) {
            res.json({ status: false, mes: "Invalid lending package" });
            return;
        }
        if (results.usdBalance.usdBalance < results.getPackage.result.amount) {
            res.json({ status: false, mes: "Your USD balance is not enough" });
            return;
        }
        var timeInvest = moment().format();
        var userinvest = {
            idUser: idUser, 
            idInvestmentPackage: idPackage, 
            amount : amount,
            datecreate :  timeInvest,
        }
        UserInvest.Add(userinvest, function (userInvestresult) {
            console.log('add lending', result);
            if (!userInvestresult.status) {
                res.json({ status: false, mes: "Can not add lending package, please try again later" });
                return;
            } else {
                var listTransactions = [];
                // Minus balance of user 
                listTransactions.push({
                    source : "minus",
                    method : "invest",
                    methodType : results.getPackage.pk.name,
                    walletType : 'usd wallet',        // btc or vnc
                    walletAmount : 0,        
                    idUser : idUser,
                    idUserIncurred : idUser,
                    address : '',
                    amount : - amount,
                    datecreate : timeInvest,
                    status : 1,
                    txid : "",
                    description : "create investment package $" + amount ,
                    idHistory : userInvestresult._id
                });
                // add trade bonus
                listTransactions.push({
                    source : "plus",
                    method : "trade bonus",
                    methodType : "capital back",
                    walletType : 'trade wallet',        // btc or vnc
                    walletAmount : 0,        
                    idUser : idUser,
                    idUserIncurred : idUser,
                    address : '',
                    amount : amount * results.get.pk.tradeBonus / 100,
                    datecreate : timeInvest,
                    status : 1,
                    txid : "",
                    description : "bonus to trade wallet from invest $" + amount ,
                    idHistory : userInvestresult._id,
                });
                
                if (results.getSponsorPackage.status) {
                    // Direct commission for sponsor
                    var directCom = {
                        source : "plus",
                        method : "commission",
                        methodType : "direct bonus",
                        walletType : 'usd wallet',        // btc or vnc
                        walletAmount : 0,        
                        idUser : results.getSponsor.user._id,
                        idUserIncurred : idUser,
                        address : '',
                        amount : (amount * results.getSponsorPackage.pk.sponsorBonus) / 100,
                        datecreate : timeInvest,
                        status : 1,
                        txid : "",
                        description : "direct sponsor bonus from " + req.decoded.username + " invest $" + amount ,
                        idHistory : userInvestresult._id
                    }
                    listTransactions.push(directCom);

                }

                var cday = moment(timeLending).format('YYYY-MM-DD');
                var percent = results.package.result.interest + parseInt(results.package.result.extraBonus.min);
                // Add Interest bonus
                for (var i = 1; i <= results.getPackage.result.capitalBack; i++) {
                    var nday = moment(cday).add(i, 'd').format();
                    listTransactions.push({
                        source : "plus",
                        method : "commission",
                        methodType : "interest bonus",
                        walletType : 'usd wallet',        // btc or vnc
                        walletAmount : 0,        
                        idUser : idUser,
                        idUserIncurred : idUser,
                        address : '',
                        amount : (amount * percent) / 100,
                        datecreate : nday,
                        status : 1,
                        txid : "",
                        description : "interest bonus from invest $" + amount ,
                        idHistory : userInvestresult._id,
                    });
                }
                // add capital back
                var end_day = moment(cday).add(results.getPackage.result.capitalBack + 1, 'd').format();
                listTransactions.push({
                    source : "plus",
                    method : "commission",
                    methodType : "capital back",
                    walletType : 'usd wallet',        // btc or vnc
                    walletAmount : 0,        
                    idUser : idUser,
                    idUserIncurred : idUser,
                    address : '',
                    amount : amount,
                    datecreate : end_day,
                    status : 1,
                    txid : "",
                    description : "capital back from invest $" + amount ,
                    idHistory : userInvestresult._id,
                });

                Transaction.insertMany(listTransactions, function (err, added) {
                    console.log('add all commission ', err, added);
                    res.json({ status: true, mes: "Create lending successfully !" });
                    return;
                })

            }
        })
    });

})

router.post('/transfer', Helpers.isAuthenticated, function (req, res, next) {
    var configDB = require('../models/config');
    if (req.body.from.toLowerCase() == 'usd') {
        res.json({ status: false, mes: "Chưa hỗ trợ chuyển USD sang các loại coin." });
        return;
    }
    configDB.findOne({ data: { $elemMatch: { "id": 'bitcoin' } } }).exec(function (err, result) {
        var from = null; var to = null;
        result.data.filter(function (x) {
            if (x.symbol == req.body.from) {
                from = x;
            }
            if (x.symbol == req.body.to) {
                to = x;
            }
        });
        if (from == null && to == null) {
            res.json({ status: false, mes: "Invalid coin type input" });
            return;
        }
        if (!req.body.amount) {
            res.json({ status: false, mes: "please enter amount" });
            return;
        }
        if (typeof parseFloat(req.body.amount) != "number") {
            res.json({ status: false, mes: " amount must be number" });
            return;
        }
        // console.log(from, to);
        if (from != null) {
            User.findOne({ _id: req.decoded._id }, function (err, result) {
                var userFinded = result._doc;
                var balance = result[req.body.from.toLowerCase() + 'Amount'];
                // console.log('balance ', balance);
                if (balance < parseFloat(req.body.amount)) {
                    res.json({ status: false, mes: " Your " + req.body.from + " balance is not enough" });
                    return;
                }
                var time = new Date();
                var commission = {
                    amount: parseFloat(req.body.amount) * parseFloat(from.price_usd),
                    idUser: req.decoded._id,
                    type: 'transfer to usd',           // transfer , direct, ...
                    coinTransfer: req.body.from.toLowerCase(),   // BTC, ETH, VNC
                    coinTransferAmount: - parseFloat(req.body.amount),
                    datecreate: time,
                    coinPrice: parseFloat(from.price_usd),
                };

                async.parallel({
                    updateUser: function (callback) {
                        var setField = { $set: { free: 0 } };
                        User.UpdateUser(req.decoded._id, setField, function (err, up) {
                            callback(err, up);
                        });
                    },
                    addCommission: function (callback) {
                        Commission.Add(commission, function (result) {
                            callback(null, result);
                        })
                    },
                }, function (err, results) {
                    // console.log('results : ', results);
                    if (!results.addCommission.status) {
                        var setField = { $set: { free: 1 } };
                        User.UpdateUser(req.decoded._id, setField, function (err, up) {
                            res.json({ status: false, mes: " Can not process your transfer now, please try again later" });
                            return;
                        });
                    } else {
                        var trans = {
                            idUser: req.decoded._id,
                            address: req.decoded[req.body.from.toLowerCase() + 'Address'],           // address of btc or vnc
                            walletType: req.body.from.toLowerCase(),        // btc or vnc
                            amount: - parseFloat(req.body.amount),
                            type: commission.type,        // buy, sell, deposit, withdraw
                            datecreate: time,
                            status: 1,
                            txid: results.addCommission.result._id,
                            refbalance: balance,
                            description: 'transfer ' + parseFloat(req.body.amount) + ' ' + req.body.from.toLowerCase() + ' to usd',
                            source: 'VNCOINS'
                        };
                        Transaction.Add(trans, function (result) {
                            if (!result.status) {
                                var setField = { $set: { free: 1 } };
                                User.UpdateUser(req.decoded._id, setField, function (err, up) {
                                    Helpers.writeLog('err.json', { date: time, mes: 'Add commission transfer success, add transactions failed, not yet update user .', commission, trans, userbalance: balance }, function () { });
                                    res.json({ status: false, mes: " Can not process your transfer now, please try again later" });
                                    return;
                                });
                            } else {
                                var abc = { free: 1 };
                                abc[req.body.from.toLowerCase() + 'Amount'] = userFinded[req.body.from.toLowerCase() + 'Amount'] - parseFloat(req.body.amount);
                                var setField = { $set: abc };
                                User.UpdateUser(req.decoded._id, setField, function (err, up) {
                                    res.json({ status: true, mes: " Transfer successfully" });
                                    return;
                                });
                            }

                        })
                    }

                });

            })

        } else {
            var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
            GetLendingBalance(idUser, function (result) {
                if (result.usdBalance < parseFloat(req.body.amount)) {
                    res.json({ status: false, mes: " Your " + req.body.from + " balance is not enough" });
                    return;
                }
                var time = new Date();
                var commission = {
                    amount: - parseFloat(req.body.amount),
                    idUser: req.decoded._id,
                    type: 'transfer to ' + req.body.to.toLowerCase(),           // transfer , direct, ...
                    coinTransfer: req.body.to.toLowerCase(),   // BTC, ETH, VNC
                    coinTransferAmount: parseFloat(req.body.amount) / parseFloat(to.price_usd),
                    datecreate: time,
                    coinPrice: parseFloat(to.price_usd),
                };
                async.parallel({
                    getUser: function (callback) {
                        User.findOne({ username: req.decoded.username }, function (err, result) {
                            callback(null, { err, result });
                        })
                    },
                    updateUser: function (callback) {
                        var setField = { $set: { free: 0 } };
                        User.UpdateUser(req.decoded._id, setField, function (err, up) {
                            callback(err, up);
                        });
                    },
                    addCommission: function (callback) {
                        Commission.Add(commission, function (result) {
                            callback(null, result);
                        })
                    },
                }, function (err, results) {
                    console.log(results);
                    if (!results.addCommission.status || results.getUser.err != null || results.getUser.result == null) {
                        var setField = { $set: { free: 1 } };
                        User.UpdateUser(req.decoded._id, setField, function (err, up) {
                            res.json({ status: false, mes: " Can not process your transfer now, please try again later" });
                            return;
                        });
                    } else {
                        var userFinded = results.getUser.result._doc;
                        var trans = {
                            idUser: req.decoded._id,
                            address: req.decoded[req.body.to.toLowerCase() + 'Address'],           // address of btc or vnc
                            walletType: req.body.to.toLowerCase(),        // btc or vnc
                            amount: parseFloat(req.body.amount) / parseFloat(to.price_usd),
                            type: commission.type,        // buy, sell, deposit, withdraw
                            datecreate: time,
                            status: 1,
                            txid: results.addCommission.result._id,
                            refbalance: userFinded[req.body.to.toLowerCase() + 'Amount'],
                            description: 'transfer ' + parseFloat(req.body.amount) + ' usd to ' + req.body.to.toLowerCase(),
                            source: 'VNCOINS'
                        };
                        Transaction.Add(trans, function (result) {
                            if (!result.status) {
                                console.log('add trans failed');
                                var setField = { $set: { free: 1 } };
                                User.UpdateUser(req.decoded._id, setField, function (err, up) {
                                    Helpers.writeLog('err.json', { date: time, mes: 'Add commission transfer success, add transactions failed, not yet update user .', commission, trans, userbalance: balance }, function () { });
                                    res.json({ status: false, mes: " Can not process your transfer now, please try again later" });
                                    return;
                                });
                            } else {
                                console.log('added trans');
                                var abc = { free: 1 };
                                abc[req.body.to.toLowerCase() + 'Amount'] = userFinded[req.body.to.toLowerCase() + 'Amount'] + trans.amount;
                                var setField = { $set: abc };
                                User.UpdateUser(req.decoded._id, setField, function (err, up) {
                                    res.json({ status: true, mes: " Transfer successfully" });
                                    return;
                                });
                            }

                        })
                    }

                });
            })
            // async.parallel({
            //     receiced: function(callback){
            //         commission
            //     },
            //     used : function(callback){

            //     }
            // }, function(err, results){

            // });
        }

    })
})



router.get('/get-usd-balance', Helpers.isAuthenticated, function (req, res, next) {
    var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
    GetUSDBalance(idUser, function (result) {
        res.json(result);
    })
})

router.get('/get-lending-balance', Helpers.isAuthenticated, function (req, res, next) {
    var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
    GetLendingBalance(idUser, function (result) {
        res.json(result);
    })
})

router.get('/get-commission-balance', Helpers.isAuthenticated, function (req, res, next) {
    var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
    GetCommissionBalance(idUser, function (result) {
        res.json(result);
    })
})

router.get('/get-daily-balance', Helpers.isAuthenticated, function (req, res, next) {
    var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
    GetDailyBalance(idUser, function (result) {
        res.json(result);
    })
})

router.get('/my-all-packages', Helpers.isAuthenticated, function (req, res, next) {
    var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
    Commission.find({ idUser: idUser, type: 'lending' }, function (err, result) {
        // console.log(result);
        if (err) {
            res.json([]);
        } else {
            res.json(result);
        }
    }).populate('InvestmentPackage');
})

router.get('/my-all-commissions', Helpers.isAuthenticated, function (req, res, next) {
    var idUser = require('mongoose').Types.ObjectId(req.decoded._id);
    var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
    // console.log(curday);
    // Commission.find({ idUser: idUser, $or: [{ type: 'daily bonus' }, { type: 'sponsor bonus' }], datecreate: { $lte: curday } }, function (err, result) {
    var abc = ["sponsor bonus", "pay back", "team point bonus", "commission withdraw", "receive", 'daily bonus', 'daily withdraw'];
    Commission.find({ idUser: idUser, type: {$in : abc}, datecreate: { $lte: curday } }, function (err, result) {
        if (err) {
            res.json([]);
        } else {
            res.json(result);
        }
    })
})





router.get('/*', Helpers.isAuthenticated, function (req, res, next){
    res.render("layout/layout");
});




function GetUSDBalance(idUser, callback) {
    var curday = moment(moment().add(1, 'd').format('YYYY-MM-DD')).format();
    curday = new Date(curday);
    Transaction.aggregate(
        [{ $match: { idUser : idUser, datecreate : { $lte : curday } }},
        { $group: {
            _id : idUser,
            usdBalance:       { $sum: "$amount" },
        }}], function(err, result){
            if(err || result.length == 0){
                callback({status : false, usdBalance : 0 });
            }else{
                callback({status : true, usdBalance : result[0].usdBalance });
            }
        }
    )
}

function GetLendingBalance(idUser, callback) {
    var usdBalance = 0;
    Commission.find({ idUser: idUser, $or: [{ type: 'lending' }, { type: 'transfer to usd' }] }, function (err, result) {
        result.forEach(element => {
            usdBalance += element.amount;
        });
        callback({ status: true, usdBalance });
    })
}

function GetCommissionBalance(idUser, callback) {
    var usdBalance = 0;
    var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
    var abc = ["sponsor bonus", "pay back", "team point bonus", "commission withdraw", "receive"];
    // Commission.find({ idUser: idUser, datecreate: { $lte: curday } }, function (err, result) {
    Commission.find({ $and : [ {idUser: idUser}, {datecreate: { $lte: curday }}, {type : {$in : abc}}] }, function (err, result) {
        result.forEach(element => {
            usdBalance += element.amount;
        });
        callback({ status: true, usdBalance });
    })
}

function GetDailyBalance(idUser, callback) {
    var usdBalance = 0;
    var curday = new Date(moment().add(1, 'd').format('YYYY-MM-DD'));
    var abc = ['daily bonus', 'daily withdraw'];
    Commission.find({ idUser: idUser, type : {$in : abc}, datecreate: { $lte: curday } }, function (err, result) {
        result.forEach(element => {
            usdBalance += element.amount;
        });
        callback({ status: true, usdBalance });
    })
}

function GetBigestInvestmentPackage(idUser, callback) {
    UserInvest.find({idUser: idUser}).sort({amount : 1}).exec(function(err, result){
        if(result.length > 0){
            var abc = result[0];
            InvestmentPackage.findOne({_id : abc.idInvestmentPackage}).exec(function(err, ip){
                callback(ip);
            })
        }else{
            callback(null);
        }
    })
}


module.exports = router