
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
var Transaction = require('../../models/transaction');
var InvestmentPackage = require('../../models/investmentpackage');
// var Role   = require('../models/role');
// var UserRole   = require('../models/userrole');
// var UserAuth   = require('../models/userauth');

var config = require('../../config'); // get our config file
var Tool = require('../../helpers/tool');
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


// router.use('/category', require('./category'));
// router.use('/product', require('./product'));
router.get('/check-token', function(req, res){
    // console.log(req);
    var access_token = req.headers.access_token;
    if (access_token) {
        // verifies secret and checks exp
        jwt.verify(access_token, secretKey, function(err, decoded) {      
            if (err) {
                return res.status(400).send({
                    status : false,
                    mes: 'Failed to authenticate token.', 
                    err : err
                });
            } else {
                return res.send({
                    status : true,
                    mes: 'Token authenticated.', 
                });
            }
        });

    } else {
        return res.status(400).send({
            status : false,
            mes: 'no access token found'
        });

    }
})

router.post('/login', function(req, res){

    var secret = config.reCaptchaKSecrect;
    if(req.headers.host.indexOf('localhost') > -1){
        secret = config.reCaptchaKSecrectLocal;
    }
    if(!req.body.login){
        res.json({status: false, mes: 'Please enter username or email'});
    }else if(!req.body.password){
        res.json({status: false, mes: 'Please enter password'});
    }else{
        async.parallel({
            // checkCaptcha: function(callback){
            //     var form = {
            //         secret : secret,
            //         response :  req.body['g-recaptcha-response'],
            //     }
            //     var uri = 'https://www.google.com/recaptcha/api/siteverify';
            //     Helpers.DoApiRequest(form, uri, function(result){
            //         callback(null, result);
            //     })
            // },
            username: function(callback) {
                User.GetUserByUsername(req.body.login, function(result){
                    callback(null, result);
                })
            },
            email: function(callback) {
                User.GetUserByEmail(req.body.login, function(result){
                    callback(null, result);
                })
            }
        }, function(err, results) {
            // if(results.checkCaptcha.success == false){
            //     res.json({status: false, mes : 'Please verify the captcha.'});
            //     return;
            // }
            if(results.username.status == false && results.email.status == false){
                res.json({status: false, mes: 'Invalid username or email'});
                return;
            }
            var userfinded = results.username.user._doc;
            if(results.email.status == true){
                userfinded = results.email.user._doc;
            }
            if(!passwordHasher.validatePassword(req.body.password, userfinded.password)){
                res.json({status: false, mes: 'Password not correct'});
            }else{
                var abc = {
                    _id : userfinded._id,
                    avatar : userfinded.avatar,
                    code : userfinded.code,
                    email : userfinded.email,
                    enable2fa : userfinded.enable2fa,
                    free : userfinded.free,
                    first_name : userfinded.first_name,
                    last_name : userfinded.last_name,
                    lock : userfinded.lock,
                    lockWithdraw : userfinded.lockWithdraw,
                    parentCode : userfinded.parentCode,
                    phone : userfinded.phone,
                    sponsor : userfinded.sponsor,
                    sponsorAddress : userfinded.sponsorAddress,
                    sponsorLevel : userfinded.sponsorAddress,
                    username : userfinded.username,
                    verify2fa : false,
                }
                var token = jwt.sign( abc, secretKey, { 
                    expiresIn : 60*60*24 // expires in 24 hours
                });
                
                var setField = {$set: { free: 1}};
                User.UpdateUser(userfinded._id, setField, function(err, up){
                    res.cookie('x-access-token', token, { expires: new Date(Date.now() + 1000*60*60*24)});
                    res.json({status: true, mes: 'login success', token: token, user: abc});
                })
                  
            }   
        });
    }

});

router.post('/add-user', function(req, res, next){
    console.log('body', req.body);
    if( !req.body.user ) {
        res.json({status: false, mes : "missing user data"}); return;
    }
    var user = JSON.parse(req.body.user);
    // console.log(user);
    // if( ! Tool.RegularUsername(user.username).status ) {
    //     res.json(Tool.RegularUsername(user.username)); return;
    // }
    // email fsgres
    User.addUser(user, function(result){
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
