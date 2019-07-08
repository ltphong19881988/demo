
var express = require('express');
var async = require('async');
var mongoose = require('mongoose');
var csrf = require('csurf');
var request = require('request');
var querystring = require('querystring');
var moment = require('moment');
var passwordHasher = require('aspnet-identity-pw');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require('../../models/user');
var Category = require('../../models/category');
var CategoryType = require('../../models/category-type');
var Post = require('../../models/post');
var OrderCart = require('../../models/order-cart');
var OrderService = require('../../models/order-service');
var Promotion = require('../../models/promotion');
// var UserAuth   = require('../models/userauth');

var config = require('../../config'); // get our config file
var Tool = require('../../helpers/tool');
var secretKey = config.secret;


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

router.post('/check-code', function(req, res, next){
    if(!req.body.code || req.body.code.indexOf(' ') > -1){
        res.json({status: false, mes: 'invalid code'}); return;
    }
    Promotion.findOne({code : req.body.code}).exec(function(err, doc){
        if(err || doc == null){
            res.json({status: false, mes: 'code không đúng'}); 
        }else{
            if(doc.status == true){
                res.json({status: false, mes: 'code đã sử dụng'}); 
            }else{
                res.json({status: true, mes: 'code ok', code: doc}); 
            }
            
        }
    })
})

router.post('/add-cart', function(req, res, next){
    console.log((req.body));
    async.parallel({
        checkUser : function(callback){
            User.findOne({username : req.body.username}).exec(function(err, doc){
                if(err || doc == null){
                    callback(null, {status: false, mes: 'không tìm thấy user'});
                }else{
                    callback(null, {status: true, user: doc});
                }
            })
        },
        checkPromotionCode : function(callback){
            Promotion.findOne({code : req.body.promotionCode}).exec(function(err, doc){
                if(err || doc == null){
                    callback(null, false);
                }else{
                    if(doc.status == true ){
                        ccallback(null, {status: false, mes: 'không tìm thấy mã code'});
                    }else{
                        callback(null, {status: true, promotion: doc});
                    }
                }
            })
        }
    }, function(err, results){
        if(!results.checkUser.status ){
            res.json(results.checkUser);
        }else{
            var listProduct = JSON.parse(req.body.orderCart);
            var totalPrice = 0;
            listProduct.forEach(element => {
                totalPrice += (element.quantity * element.price);
            });
            if(results.checkPromotionCode.status){
                var pro = results.checkPromotionCode.promotion;
                if(pro.type == 0){
                    totalPrice -= pro.price;
                }else{
                    totalPrice -= ((totalPrice * pro.price)/100)
                }
            }
            var abc = {
                idUser: results.checkUser.user._id,
                username : results.checkUser.user.username,
                listProduct : listProduct,
                paymentInfo :  JSON.parse(req.body.paymentInfo),
                promotion : results.checkPromotionCode.promotion ,
                totalPrice: totalPrice,
                type : 0, // 0: just create, 
            }
            OrderCart.create(abc, function(err, orderCart){
                if(!err){
                    if(results.checkPromotionCode.status){
                        Promotion.updateOne(
                            {_id : results.checkPromotionCode.promotion._id},
                            {
                                status : true, dateused : orderCart.datecreate,
                            },
                            {
                              upsert: true,
                            }
                        ).exec(function(err, pro){
                            if(err){
                                console.log(err, pro);
                            }else{
                                res.json({status: true, mes: 'Xác nhận mua hàng thành công'});
                            }
                        })
                    }else{
                        res.json({status: true, mes: 'Xác nhận mua hàng thành công'});
                    }
                    
                }else{
                    res.json({status: false, mes: 'Lỗi không xác định, vui lòng thử lại sau hoặc xóa giỏ hàng và làm lại'});
                }
            })
        }
    });
})

router.post('/add-order-services', function(req, res, next){
    console.log((req.body));
    async.parallel({
        checkUser : function(callback){
            User.findOne({username : req.body.username}).exec(function(err, doc){
                if(err || doc == null){
                    callback(null, {status: false, mes: 'User đăng nhập không đúng'});
                }else{
                    callback(null, {status: true, user: doc});
                }
            })
        },
    }, function(err, results){
        if(!results.checkUser.status ){
            res.json(results.checkUser);
        }else{
            var listServices = req.body.orderServices;
            var totalPrice = 0;
            listServices.forEach(element => {
                // totalPrice += (element.quantity * element.price);
                totalPrice += element.price;
            });
            // if(results.checkPromotionCode && results.checkPromotionCode.status){
            //     var pro = results.checkPromotionCode.promotion;
            //     if(pro.type == 0){
            //         totalPrice -= pro.price;
            //     }else{
            //         totalPrice -= ((totalPrice * pro.price)/100)
            //     }
            // }
            var abc = {
                idUser: results.checkUser.user._id,
                username : results.checkUser.user.username,
                listService : listServices,
                // promotion : results.checkPromotionCode.promotion ,
                totalPrice: totalPrice,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                type : 0, // 0: just create, 
            }
            OrderCart.create(abc, function(err, orderCart){
                if(!err){
                    // if(results.checkPromotionCode.status){
                    //     Promotion.updateOne(
                    //         {_id : results.checkPromotionCode.promotion._id},
                    //         {
                    //             status : true, dateused : orderCart.datecreate,
                    //         },
                    //         {
                    //           upsert: true,
                    //         }
                    //     ).exec(function(err, pro){
                    //         if(err){
                    //             console.log(err, pro);
                    //         }else{
                    //             res.json({status: true, mes: 'Xác nhận mua hàng thành công'});
                    //         }
                    //     })
                    // }else{
                    //     res.json({status: true, mes: 'Xác nhận mua hàng thành công'});
                    // }
                    res.json({status: true, mes: 'Xác nhận mua hàng thành công'});
                }else{
                    console.log('err', err);
                    res.json({status: false, mes: 'Lỗi không xác định, vui lòng thử lại sau hoặc xóa giỏ hàng và làm lại'});
                }
            })
        }
    });
})

router.get('/:id', function(req, res, next){
    var _id = require('mongoose').Types.ObjectId(req.body.key);
    User.findOne({_id : _id}, function(err, result){
        if(result == null){
            res.json({status : false, mes : "user not found"});
        }else{
            res.json({status : false, mes : "user found", user : result});
        }
    })
})

// not right, must edit
router.put('/:id', function(req, res, next){
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

router.delete('/:id', function(req, res, next){
    var _id = mongoose.Types.ObjectId(req.params.id);
    User.deleteOne({_id : _id}, function(err, result){
        if(err){
            res.json({status : false, mes : "id user not found"});
        }else{
            res.json({status : true, mes : "delete user success"});
        }
    })
})



module.exports = router
