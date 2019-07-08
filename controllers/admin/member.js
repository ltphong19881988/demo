
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


router.get("/index", function(req, res, next){
    var data = {
        title: 'List member',
    }
    res.render("admin/member/index", data);
})

router.post('/all-member-index', function(req, res, next){
    var option = {};
    var skip = parseInt(req.body.skip); var limit = parseInt(req.body.limit);
    if(req.body.datecreate_from != '' && req.body.datecreate_from != null){
        // console.log(new Date(moment().add(1, 'd').format('YYYY-MM-DD')));
        var from = new Date(moment(req.body.datecreate_from, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        var to = new Date(moment(req.body.datecreate_from, 'DD/MM/YYYY').add(1, 'days').format('YYYY-MM-DD'));
        if(req.body.datecreate_to != '' && req.body.datecreate_to != null){
            to = new Date(moment(req.body.datecreate_to, 'DD/MM/YYYY').add(1, 'days').format('YYYY-MM-DD'));
        }
        option.datecreate = {$gt : from, $lt : to};
    }
    async.forEachOf(req.body, function(value, key){
        if(key != 'cur_page' && key != 'skip' && key != 'limit' && key != 'datecreate_from' && key != 'datecreate_to')
        {
            if(key != null && key != '')
                option[key] = { $regex: value  };
        }
    })

    User.aggregate([
        {
            $match: option,
        },
        { 
            $sort: { datecreate: 1 }
        },
        {
            $lookup:
            {
                from: "commissions",
                localField: "_id",
                foreignField: "idUser",
                as: "usertrans"
            },
        },
        {
            $project: {
                "usertrans": {
                   "$filter": {
                       "input": "$usertrans",
                       "as": "trans",
                       "cond": { $or: [ {$eq : ["$$trans.type",  'lending']} ]}
                   }
                },
                "_id": 1,
                "username": 1,
                "email": 1,
                "phone": 1,
                "sponsor": 1,
                "datecreate": 1,
                "lock": 1,
                "lockWidthdraw": 1,
                
            }
        },
        {
            $project: {
                "_id": 1,
                "username": 1,
                "email": 1,
                "phone": 1,
                "sponsor": 1,
                "datecreate": 1,
                "lock": 1,
                "lockWidthdraw": 1,
                'count' : {$size: "$usertrans"},
                'sum' : {$sum : '$usertrans.amount'}
            }
        },
        { $skip : skip },
        { $limit : limit },
    ], function(err, result){
        res.json(result);
    })
})

router.post('/count-all-member-index', function(req, res, next){
    var option = {};
    if(req.body.datecreate_from != '' && req.body.datecreate_from != null){
        var from = new Date(moment(req.body.datecreate_from, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        var to = new Date(moment(req.body.datecreate_from, 'DD/MM/YYYY').add(1, 'days').format('YYYY-MM-DD'));
        if(req.body.datecreate_to != '' && req.body.datecreate_to != null){
            to = new Date(moment(req.body.datecreate_to, 'DD/MM/YYYY').add(1, 'days').format('YYYY-MM-DD'));
        }
        option.datecreate = {$gt : from, $lt : to};
    }
    async.forEachOf(req.body, function(value, key){
        if(key != 'cur_page' && key != 'skip' && key != 'limit' && key != 'datecreate_from' && key != 'datecreate_to')
        {
            if(key != null && key != '')
                option[key] = { $regex: value  };
        }
    })
    User.count(option, function(err, result){
        res.json({"_id":null,"totalAmount":0,"count":result});
    })
})

router.get('/all-member-index-to-excel', function(req, res, next){
    var wb = new xl.Workbook();
    // Add Worksheets to the workbook
    var ws = wb.addWorksheet('Danh sách thành viên VNC');
    // var ws2 = wb.addWorksheet('Sheet 2');
    // Create a reusable style
    var style = wb.createStyle({
        font: {
            color: '#1b418b',
            size: 12
        },
        //numberFormat: '$#,##0.00; ($#,##0.00); -'
    });

    var option = {};
    async.forEachOf(req.body, function(value, key){
        if(key != 'cur_page' && key != 'skip' && key != 'limit')
        {
            if(key != null && key != '')
                option[key] = { $regex: value  };
        }
    })

    User.aggregate([
        {
            $match: option,
        },
        { 
            $sort: { datecreate: 1 }
        },
        {
            $lookup:
            {
                from: "commissions",
                localField: "_id",
                foreignField: "idUser",
                as: "usertrans"
            },
        },
        {
            $project: {
                "usertrans": {
                   "$filter": {
                       "input": "$usertrans",
                       "as": "trans",
                       "cond": { $or: [ {$eq : ["$$trans.type",  'lending']} ]}
                   }
                },
                "username": 1,
                "email": 1,
                "phone": 1,
                "sponsor": 1,
                "datecreate": 1,
                "lock": 1,
                "lockWidthdraw": 1,
                
            }
        },
        {
            $project: {
                "username": 1,
                "email": 1,
                "phone": 1,
                "sponsor": 1,
                "datecreate": 1,
                "lock": 1,
                "lockWidthdraw": 1,
                'count' : {$size: "$usertrans"},
                'sum' : {$sum : '$usertrans.amount'}
            }
        },
    ], function(err, result){
        var row = 2;
        ws.cell(1, 1).string("Username").style(style);
        ws.cell(1, 2).string("Email").style(style);
        ws.cell(1, 3).string("Điện thoại").style(style);
        ws.cell(1, 4).string("Ngày tạo").style(style);
        ws.cell(1, 5).string("Người giới thiệu").style(style);
        ws.cell(1, 6).string("Khóa đăng nhập").style(style);
        ws.cell(1, 7).string("Khóa rút tiền").style(style);
        ws.cell(1, 8).string("Số gói lending").style(style);
        ws.cell(1, 9).string("Tổng tiền lending").style(style);
        result.forEach(ele => {
            //console.log(ele.datecreate);
            if(!ele.username) { ele.username = '';}
            if(!ele.email) { ele.email = '';}
            if(!ele.phone) { ele.phone = '';}
            if(!ele.datecreate) { ele.datecreate = '';}
            if(!ele.sponsor) { ele.sponsor = '';}
            if(!ele.lock) { ele.lock = false;}
            if(!ele.lockWithdraw) { ele.lockWithdraw = false;}
            ws.cell(row, 1).string(ele.username);
            ws.cell(row, 2).string(ele.email);
            ws.cell(row, 3).string(ele.phone);
            ws.cell(row, 4).string(moment(ele.datecreate).format('DD/MM/YYYY'));
            ws.cell(row, 5).string(ele.sponsor);
            ws.cell(row, 6).bool(ele.lock);
            ws.cell(row, 7).bool(ele.lockWithdraw);
            ws.cell(row, 8).number(ele.count).style(style);
            ws.cell(row, 9).number((0 - ele.sum)).style(style);
            row ++;
        })
        wb.write('Danh sach thanh vien VNC.xlsx', res);
    })

    // User.find(option, null, {sort : {datecreate : 1}},  function(err, result){

    // }).select({ "username": 1, "_id": 0, "email" : 1, "phone" : 1, "datecreate" : 1, "sponsor" : 1, "lock" : 1, "lockWithdraw" : 1});
 
    // // Set value of cell A1 to 100 as a number type styled with paramaters of style
    // ws.cell(1,1).number(100).style(style);
    
    // // Set value of cell B1 to 300 as a number type styled with paramaters of style
    // ws.cell(1,2).number(200).style(style);
    
    // // Set value of cell C1 to a formula styled with paramaters of style
    // ws.cell(1,3).formula('A1 + B1').style(style);
    
    // // Set value of cell A2 to 'string' styled with paramaters of style
    // ws.cell(2,1).string('string').style(style);
    
    // // Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
    // ws.cell(3,1).bool(true).style(style).style({font: {size: 14}});
    
    //wb.write('Excel.xlsx', res);
})

router.get('/all-lending-member-to-excel', function(req, res, next){
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Danh sách lending VNC');
    // Create a reusable style
    var style = wb.createStyle({
        font: {
            color: '#1b418b',
            size: 12
        },
        //numberFormat: '$#,##0.00; ($#,##0.00); -'
    });

    var option = {};
    option.type = 'lending';
    Commission.aggregate([
        {
            $match: option,
        },
        { 
            $sort: { datecreate: 1 }
        },
        {
            $lookup:
            {
                from: "users",
                localField: "idUser",
                foreignField: "_id",
                as: "usertrans"
            },
        },
        {
            $unwind: "$usertrans"
        },
        {
            $project: {
                "usertrans": 1,
                "amount": 1,
                "datecreate": 1,                
            }
        },
    ], function(err, result){
        var row = 2;
        ws.cell(1, 1).string("Username").style(style);
        ws.cell(1, 2).string("Email").style(style);
        ws.cell(1, 3).string("Điện thoại").style(style);
        ws.cell(1, 4).string("Người giới thiệu").style(style);
        ws.cell(1, 5).string("Khóa đăng nhập").style(style);
        ws.cell(1, 6).string("Khóa rút tiền").style(style);

        ws.cell(1, 8).string("Ngày lending").style(style);
        ws.cell(1, 9).string("Số tiền lending").style(style);
        result.forEach(ele => {
            //console.log(ele.datecreate);
            if(!ele.usertrans.username) { ele.usertrans.username = '';}
            if(!ele.usertrans.email) { ele.usertrans.email = '';}
            if(!ele.usertrans.phone) { ele.usertrans.phone = '';}
            if(!ele.usertrans.datecreate) { ele.usertrans.datecreate = '';}
            if(!ele.usertrans.sponsor) { ele.usertrans.sponsor = '';}
            if(!ele.usertrans.lock) { ele.usertrans.lock = false;}
            if(!ele.usertrans.lockWithdraw) { ele.usertrans.lockWithdraw = false;}
            ws.cell(row, 1).string(ele.usertrans.username);
            ws.cell(row, 2).string(ele.usertrans.email);
            ws.cell(row, 3).string(ele.usertrans.phone);
            ws.cell(row, 4).string(ele.usertrans.sponsor);
            ws.cell(row, 5).bool(ele.usertrans.lock);
            ws.cell(row, 6).bool(ele.usertrans.lockWithdraw);

            ws.cell(row, 8).string(moment(ele.datecreate).format('DD/MM/YYYY'));
            ws.cell(row, 9).number((0 - ele.amount)).style(style);
            row ++;
        })
        wb.write('Danh sách lending VNC.xlsx', res);
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

router.post('/edit-member', function(req, res, next){
    // console.log(req.body);
    var _id = require('mongoose').Types.ObjectId(req.body.key);
    User.findOne({_id : _id}, function(err, result){
        // console.log(result);
        if(result == null){
            res.json({status : false, mes : "Không tìm thấy id"});
        }else{
            var setFields = {lock : req.body.lock, lockWithdraw : req.body.lockWithdraw, phone : req.body.phone};
            if(req.body.resetPassword == "on"){
                setFields.password = passwordHasher.hashPassword('vnc123456');
            }
            User.update({_id : _id}, {$set : setFields}, {upsert : true}, function(err, result){
                if(err == null){
                    res.json({status : true, mes : "Thay đổi thông tin thành công"});
                }else{
                    res.json({status : false, mes : "Không cập nhật được thông tin"});
                }
                
            })
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

router.get('/tree', function (req, res, next) {
    var data = {
        title: 'admin all user',
    }
    res.render("admin/member/tree", data);
})

router.get('/list-user', function (req, res, next) {
    var data = {
        title: 'admin all user',
    }
    res.render("admin/member/list-user", data);
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
                        if(listTran != null){
                            listTran.forEach(element => {
                                kq += element.amount;
                            });
                        }
                        
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




module.exports = router
