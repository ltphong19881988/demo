
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
// var Role   = require('../models/role');
// var UserRole   = require('../models/userrole');
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

router.post('/', function(req, res, next){
    // var _id = require('mongoose').Types.ObjectId(req.body.key);
    var options = {};
    if(req.body.idCategoryType){
        options.idCategoryType = mongoose.Types.ObjectId(req.body.idCategoryType);
    }
    if(req.body.idParent){
        options.idParent = mongoose.Types.ObjectId(req.body.idParent);
    }
    Category.aggregate([
        {
            $match: options,
        },
        { 
            $sort: {idCategoryType: 1, idParent: 1, priority:1}
        },
        {
            $lookup:
            {
                from: "categorytypes",
                localField: "idCategoryType",
                foreignField: "_id",
                as: "categoryType"
            },
        },
        { $unwind : "$categoryType" },
        {
            $lookup:
            {
                from: "posts",
                localField: "_id",
                foreignField: "idCategory",
                as: "post"
            },
        },
        { $unwind : "$post" },
        {
            $match: {'post.postType' : 0},
        },
        {
            $project: {
                "categoryType": 1,
                'post' : 1,
                "_id": 1,
                "name": 1,
                "priority": 1,
                "idParent": 1,
                "datecreate": 1,
            }
        },

    ], function(err, result){
        // console.log(err, result);
        res.json(result);
    })
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
