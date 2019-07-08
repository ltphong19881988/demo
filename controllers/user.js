var express = require('express');
var moment = require ('moment');
var async = require('async');
var passwordHasher = require('aspnet-identity-pw');
var router = express.Router() ;
var User   = require('../models/user');
var DayUtil   = require('../helpers/dayutil');
var UserAuth   = require('../models/userauth');
var jwt = require('jsonwebtoken');
var config = require('../config'); // get our config file
var secretKey = config.secret;
var Helpers = require('./helpers');
var speakeasy = require('speakeasy');
var QRCode = require('qrcode');






// router.get('/checkauth', function(req, res, next) {
//     var data = {
//         title: 'Game guide',
//         description: 'Page Description',
//         header: 'Page Header'
//     };
//     res.render("user/checkauth", data);
// })



router.post('/checktoken', function(req, res, next) {
    UserAuth.CheckToken(req.body.token,function(result){
        res.json(result);
    })
})

router.get('/logout', Helpers.isAuthenticated, function(req, res, next) {
    User.GetUserByID(req.decoded._id,function(result){
        var token = "";
        if(result.status){
            token = jwt.sign( result.user._doc, secretKey, { 
                expiresIn : 0 // expires in 24 hours
            });
        }
        res.cookie('x-access-token', token, { expires: new Date(Date.now())});
        res.redirect("/");
    })    
})

router.get('/index', Helpers.isAuthenticated, function(req, res, next) {
    var data = {
        title : "user home page",
    };
    res.render("user/index", data);
})

router.post('/profiles', Helpers.isAuthenticated, function(req, res, next) {
    var setField = {fullname : req.body.fullname, phone : req.body.phone};
    if(req.body.avatar.indexOf("base64") != -1){
        var base64Data = req.body.avatar.split(';base64,').pop();
        var filepath = process.cwd() + "/public/uploads/img/" + req.decoded.username + "_avatar.png";
        setField["avatar"] = "/uploads/img/" + req.decoded.username + "_avatar.png";
        require("fs").writeFile(filepath, base64Data, {encoding: 'base64'}, function(err) {
            if(err == null){
            }else{
            }
        });
    }
    
    User.UpdateUser(req.decoded._id, setField, function(err, up){
        if(err == null){
            res.json({status:true, mes : 'Update profiles successfully'});
        }else{
            res.json({status:false, mes : err});
        }
    })
})

router.post('/change-password', Helpers.isAuthenticated, function(req, res, next) {
    if(!req.body.currentPassword){
        res.json({status: false, mes: 'Please enter Current Password'});
    }else if(!req.body.newPassword){
        res.json({status: false, mes: 'Please enter New Password'});
    }else if(req.body.newPassword != req.body.confirmPassword){
        res.json({status: false, mes: 'Password confirm is not match'});
    }else{
        User.GetUserByID(req.decoded._id,function(result){
            if(!passwordHasher.validatePassword(req.body.currentPassword, result.user.password)){
                res.json({status: false, mes: 'Current Password is not correct'});
            }else{
                var query = {
                    _id : result.user.id,
                };
                var setField = {$set: { password: passwordHasher.hashPassword(req.body.newPassword)}};
                User.update(query, setField, {upsert: true}, function(err, up){
                    res.json({status: true, mes: 'Change password successfully'});
                })
            }
        })  
        
    }
})

router.get('/getuserinfo', Helpers.isAuthenticated, function(req, res, next) {
    User.GetUserByID(req.decoded._id, function(result){
        // Helpers.CheckAddress(result.user, function(check){
        //     if(check == 0){
        //         result.user.password = '';
        //         res.json(result.user);
        //     }else{
        //         User.GetUserByID(req.decoded._id, function(result){
        //             result.user.password = '';
        //             res.json(result.user);
        //         })
        //     }
        // });
        result.user.password = '';
        res.json(result.user);
    })
})

router.post('/autocomplete', function(req, res, next) {
    User.AutoComplete(req.body.q, function(result){
        res.json(result);
    });

})

router.get('/createaccount', function(req, res, next) {
    var data = {
        title: 'Game guide',
        description: 'Page Description',
        header: 'Page Header'
    };
    res.render("layout/adminlayout", data);
})

router.post('/createaccount', function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    UserAuth.CheckToken(token,function(result){
        //console.log(result);
        if(result.status == true){
            var user = {
                username: req.body.username,
                fullname: req.body.fullname,
                phone: req.body.phone,
                sponsor: result.decoded._doc.username,
                email : req.body.email,
                password : req.body.password,
                datecreate : new Date()
            };
            var role = ["member"];
            if(req.body.createaccount == "on"){
                role.push("create account");
            }
            User.addUser(user, role, function(result){
                res.json(result);
            });
        }
    })

})

router.get('/tree-root', Helpers.isAuthenticated, function(req, res, next) {
    var root = { "text" : req.decoded.username, "children" : false , "id" : req.decoded._id };
    User.count({idSponsor : req.decoded._id}, function(err, count){
        if(count > 0) root.children = true;
        root.text += " - " + count + " members  ";
        res.json([root]);
    })
})

router.get('/tree-children', Helpers.isAuthenticated, function(req, res, next) {
    var mongoose = require('mongoose');
    var objectId = mongoose.Types.ObjectId(req.query.id);
    var abc = [];
    User.find({idSponsor : objectId}, function(err, listuser){
        async.forEachOf(listuser, function (value, key, callbackOut) {
            async.parallel({
                checkChildren: function (callback) {
                    User.count({idSponsor : value._id}, function(err, count){
                        if(count == 0) {
                            callback(null, {status :false, count : 0});
                        }else{
                            callback(null, {status :true, count : count});
                        }
                    })
                },
            }, function (err, results) {
                var item = {"text" : value.username + " - " + results.checkChildren.count + " members", "children" : results.checkChildren.status, "id" : value._id} ;
                abc.push(item);
                callbackOut();
            });
        }, function (err) {
            res.json(abc);
        })

    })
    
})

router.get('/2fa-info', Helpers.isAuthenticated, function(req, res, next) {
    User.GetUserByID(req.decoded._id, function(result){
        var secret = result.user.secret2fa;
        QRCode.toDataURL(secret.otpauth_url, function(err, image_data) {
            res.json({key : secret.base32, dataImg : image_data, enable2fa : result.user.enable2fa});
        });
    })
})

router.post('/verify-auth', Helpers.isAuthenticated, function(req, res, next) {
    var abc ;
    User.GetUserByID(req.decoded._id, function(result){
        if(result.user.enable2fa === true){
            abc = false;
        }else{
            abc = true;
        }
        var secret = result.user.secret2fa;
        var verified = speakeasy.totp.verify({
            secret: secret.base32,
            encoding: 'base32',
            token: req.body.authToken
        });
        if(verified){
            var setField = { enable2fa : abc};
            User.UpdateUser(req.decoded._id, setField, function(err, up){
                if(!err){
                    if(abc === true){
                        res.json({status : true, mes : "Enable 2FA successfully"});
                    }else{
                        res.json({status : true, mes : "Disable 2FA successfully"});
                    }
                }else{
                    res.json({status : false, mes : "Verify 2FA failed"});
                }
            })
        }else{
            res.json({status : false, mes : "Verify token not correct."});
        }
    })
    
})

router.get('/*', Helpers.isAuthenticated, function(req, res, next) {
    res.render("layout/layout");
})

module.exports = router