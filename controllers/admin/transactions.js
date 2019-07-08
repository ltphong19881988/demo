
var express = require('express');
var async = require('async');
var csrf = require('csurf');
var request = require('request');
var querystring = require('querystring');
var moment = require('moment');
var passwordHasher = require('aspnet-identity-pw');
var jwt = require('jsonwebtoken');
var xl = require('excel4node');
var passwordHasher = require('aspnet-identity-pw');
var router = express.Router();
var User = require('../../models/user');
var Transaction = require('../../models/transaction');
var Commission = require('../../models/commission');
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

var getOptions = function(req){
    var option = {};
    
    if(req.body.walletType != null && req.body.walletType != '' && req.body.walletType != ' ')
        option.walletType = { $regex: req.body.walletType, "$options": "i" };
    if(req.body.type != null && req.body.type != '' && req.body.type != ' ')
        option.type = { $regex: req.body.type, "$options": "i" };
    if(req.body.address != null && req.body.address != '' && req.body.address != ' ')
        option.address = { $regex: req.body.address, "$options": "i" };
    if(req.body.txid != null && req.body.txid != '' && req.body.txid != ' ')
        option.txid = { $regex: req.body.txid, "$options": "i" };
    if(req.body.source != null && req.body.source != '' && req.body.source != ' ')
        option.source = { $regex: req.body.source, "$options": "i" };

    if(req.body.datecreate_from != '' && req.body.datecreate_from != null){
        var from = new Date(moment(req.body.datecreate_from, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss'));
        var to = new Date(moment(req.body.datecreate_from, 'DD/MM/YYYY').add(1, 'days').format('YYYY-MM-DD HH:mm:ss'));
        if(req.body.datecreate_to != '' && req.body.datecreate_to != null){
            to = new Date(moment(req.body.datecreate_to, 'DD/MM/YYYY').add(1, 'days').format('YYYY-MM-DD HH:mm:ss'));
        }
        option.datecreate = {$gt : from, $lt : to};
    }
    // console.log(option);
    return option;
}

var checkUserFilter = function(option, req, callback){
    var listUser = [];
    if(req.body["userdetail.username"] != null && req.body["userdetail.username"] != '' && req.body["userdetail.username"] != ' '){
        User.find({username : { $regex: req.body["userdetail.username"], "$options": "i" } }, function(err, result){
            result.forEach(element => {
                listUser.push(element._id);
            });
            if(listUser.length > 0){
                option.idUser = { $in : listUser };
            }
            callback( 1);
        }).select({'_id' : 1});
    }else{
        callback( 0)
    }
}

router.get("/index", function(req, res, next){
    var data = {
        title: 'List transactions',
    }
    res.render("admin/transactions/index", data);
})

router.post('/all-transactions-index', function(req, res, next){
    var option = getOptions(req);
    var skip = parseInt(req.body.skip); var limit = parseInt(req.body.limit);
    
    async.parallel({
        checkUser : function(callback){
            checkUserFilter(option, req, function(result){
                callback(null, result);
            })
        }
    }, function(err, results){
        GetTransactionsFilters(option, skip, limit, function(result){
            // console.log(result);
            res.json(result);
        })
    })

    
})

router.post('/count-all-transactions-index', function(req, res, next){
    var option = getOptions(req);
    async.parallel({
        checkUser : function(callback){
            checkUserFilter(option, req, function(result){
                callback(null, result);
            })
        }
    }, function(err, results){
        SumTransactionsAmountFilters(option, function(result){
            if(result.length > 0){
                res.json(result[0]);
            }else{
                res.json({"_id":null,"totalAmount":0,"count":0});
            }
            
        })
    })
})

function GetTransactionsFilters(option, skip, limit, callback){
    Transaction.aggregate([
        {
            $match: option,
        },
        {
            $lookup:
            {
                from: "users",
                localField: "idUser",
                foreignField: "_id",
                as: "userdetail"
            },
        },
        {
            $project: {
                "userdetail": 1,
                "address": 1,
                "walletType": 1,
                "type": 1,
                "amount": 1,
                "datecreate": 1,
                "status": 1,
                "txid": 1,
                "source" : 1,
            }
        },
        { $skip : skip },
        { $limit : limit },
    ], function(err, result){
        callback(result);
    })
}

function CountTransactionsFilters(option, callback){
    Transaction.aggregate([
        {
            $match: option,
        },
        {
            $lookup:
            {
                from: "users",
                localField: "idUser",
                foreignField: "_id",
                as: "userdetail"
            },
        },
        {
            $project: {
                "userdetail": 1,
                "address": 1,
                "walletType": 1,
                "type": 1,
                "amount": 1,
                "datecreate": 1,
                "status": 1,
                "txid": 1,
                "source" : 1,
            }
        },
        //{ $group: { _id: null, count: { $sum: 1 } } },
        {
            $count: "passing_scores"
        }
    ], function(err, result){
        if(result.length == 0){
            callback(0);
        }else{
            callback(result[0].passing_scores);
        }
        
    })
}

function SumTransactionsAmountFilters(option, callback){
    Transaction.aggregate([
        {
            $match: option,
        },
        {
            $lookup:
            {
                from: "users",
                localField: "idUser",
                foreignField: "_id",
                as: "userdetail"
            },
        },
        {
            $project: {
                "userdetail": 1,
                "address": 1,
                "walletType": 1,
                "type": 1,
                "amount": 1,
                "datecreate": 1,
                "status": 1,
                "txid": 1,
                "source" : 1,
            }
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: '$amount'},
                count: { $sum: 1 } 
            } 
        },
    ], function(err, result){
        callback(result);
        
    })
}

router.get('/sum-transactions-amount', function(req, res, next){
    var option = getOptions(req);
    async.parallel({
        checkUser : function(callback){
            checkUserFilter(option, req, function(result){
                callback(null, result);
            })
        }
    }, function(err, results){
        SumTransactionsAmountFilters(option, function(result){
            res.json(result);
        })
    })
})

router.post('/transactions-to-excel', function(req, res, next){
    var wb = new xl.Workbook();
    // Add Worksheets to the workbook
    var ws = wb.addWorksheet('Lich su giao dich');
    // var ws2 = wb.addWorksheet('Sheet 2');
    // Create a reusable style
    var style = wb.createStyle({
        font: {
            color: '#1b418b',
            size: 12
        },
        numberFormat: '$#,##0.00; ($#,##0.00); -'
    });

    var option = {};
    if(req.body.walletType != null && req.body.walletType != '' && req.body.walletType != ' ')
        option.walletType = { $regex: req.body.walletType, "$options": "i" };
    if(req.body.type != null && req.body.type != '' && req.body.type != ' ')
        option.type = { $regex: req.body.type, "$options": "i" };
    if(req.body.address != null && req.body.address != '' && req.body.address != ' ')
        option.address = { $regex: req.body.address, "$options": "i" };
    if(req.body.txid != null && req.body.txid != '' && req.body.txid != ' ')
        option.txid = { $regex: req.body.txid, "$options": "i" };
    if(req.body.source != null && req.body.source != '' && req.body.source != ' ')
        option.source = { $regex: req.body.source, "$options": "i" };

    if(req.body.datecreate_from != '' && req.body.datecreate_from != null){
        var from = new Date(moment(req.body.datecreate_from, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss'));
        var to = new Date(moment(req.body.datecreate_from, 'DD/MM/YYYY').add(1, 'days').format('YYYY-MM-DD HH:mm:ss'));
        if(req.body.datecreate_to != '' && req.body.datecreate_to != null){
            to = new Date(moment(req.body.datecreate_to, 'DD/MM/YYYY').add(1, 'days').format('YYYY-MM-DD HH:mm:ss'));
        }
        option.datecreate = {$gt : from, $lt : to};
    }
    var listUser = [];

    async.parallel({
        checkUser : function(callback){
            if(req.body["userdetail.username"] != null && req.body["userdetail.username"] != '' && req.body["userdetail.username"] != ' '){
                User.find({username : { $regex: req.body["userdetail.username"], "$options": "i" } }, function(err, result){
                    result.forEach(element => {
                        listUser.push(element._id);
                    });
                    if(listUser.length > 0){
                        option.idUser = { $in : listUser };
                    }
                    callback(null, 1);
                }).select({'_id' : 1});
            }else{
                callback(null, 0)
            }
        }
    }, function(err, results){
        Transaction.aggregate([
            {
                $match: option,
            },
            {
                $lookup:
                {
                    from: "users",
                    localField: "idUser",
                    foreignField: "_id",
                    as: "userdetail"
                },
            },
            {
                $project: {
                    "userdetail": 1,
                    "address": 1,
                    "walletType": 1,
                    "type": 1,
                    "amount": 1,
                    "datecreate": 1,
                    "status": 1,
                    "txid": 1,
                    "source" : 1,
                }
            },
        ], function(err, result){
            var row = 2;
            ws.cell(1, 1).string("Username").style(style);
            ws.cell(1, 2).string("Loại tiền").style(style);
            ws.cell(1, 3).string("Loại giao dịch").style(style);
            ws.cell(1, 4).string("Số lượng").style(style);
            ws.cell(1, 5).string("Ngày tạo").style(style);
            ws.cell(1, 6).string("Địa chỉ ví").style(style);
            ws.cell(1, 7).string("TxID").style(style);
            ws.cell(1, 8).string("Nguồn").style(style);

            result.forEach(ele => {
                if(!ele.userdetail[0].username) { ele.userdetail[0].username = '';}
                if(!ele.address) { ele.address = '';}
                if(!ele.walletType) { ele.walletType = '';}
                if(!ele.type) { ele.type = '';}
                if(!ele.datecreate) { ele.datecreate = '';}
                if(!ele.txid) { ele.txid = '';}
                if(!ele.source) { ele.source = '';}
                ws.cell(row, 1).string(ele.userdetail[0].username);
                ws.cell(row, 2).string(ele.walletType);
                ws.cell(row, 3).string(ele.type);
                ws.cell(row, 4).number(ele.amount);
                ws.cell(row, 5).string(moment(ele.datecreate).format('DD/MM/YYYY'));
                ws.cell(row, 6).string(ele.address);
                ws.cell(row, 7).string(ele.txid).style(style);
                
                ws.cell(row, 8).string(ele.source).style(style);
                row ++;
            })
            wb.write('Lich su giao dich.xlsx', res);

        })
    })

})

router.get("/view-details/:id", function(req, res, next){
    var _id = require('mongoose').Types.ObjectId(req.params.id);
    User.findOne({_id : _id}, function(err, result){
        result._doc.datecreate = moment(result._doc.datecreate).format('DD/MM/YYYY HH:mm:ss');        
        if(result._doc.lockWithdraw == null){
            result._doc.lockWithdraw = false;
            User.update({username : result._doc.username}, {$set : {lockWithdraw : false}}, {upsert : true}, function(err, result){
                if(err == null){
                    res.render("admin/member/view-details", result._doc);
                }
            })
        }else{
            res.render("admin/member/view-details", result._doc);
        }
        
    })
})



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





module.exports = router
