
var express = require('express');
var async = require('async');
var csrf = require('csurf');
var request = require('request'); 
var https = require('https');
var querystring = require('querystring');
var router = express.Router() ;
var User   = require('../models/user');
var Transaction = require('../models/transaction');
// var Role   = require('../models/role');
// var UserRole   = require('../models/userrole');
// var UserAuth   = require('../models/userauth');
var passwordHasher = require('aspnet-identity-pw');
var jwt = require('jsonwebtoken');
var speakeasy = require('speakeasy');
var config = require('../config'); // get our config file
var Helpers = require('./helpers'); 
var secretKey = config.secret;

// router.use('/dashboard', require('./dashboard'));
router.use('/api', require('./api/index'));
// router.use('/user', require('./user'));
// // router.use('/ico', require('./ico'));
// router.use('/exchange', require('./exchange'));
// router.use('/transaction', require('./transaction'));
// router.use('/wallet', require('./wallet'));
// router.use('/downline', require('./downline'));
// router.use('/investment', require('./investment'));
router.use('/admin', require('./admin/index'));



function randomString ( length) {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function randomAddress(walletType, length, callbackA) {
    var text = "S";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    async.parallel({
        check: function(callback) {
            User.GetUserByCoinAddress(walletType, text, function(result){
                callback(null, result);
            })
        }
    }, function(err, results) {
        if(results.check.status){
            //console.log("lap lai");
            randomAddress(walletType, length, callbackA);
        }else{
            //console.log(text);
            callbackA (text);
        }
        // results is now equals to: {one: 1, two: 2}
    });
    
}

router.get('/setup', function(req, res) {	
	var initdata   = require('../models/initdata'); // get our mongoose model
    initdata.Init();
    // var lendingPackage = require('../models/lendingpackage');
    // var item = {
    //     amount: 200000,
    //     dailyBonus: 0.8, 
    //     circleDays: 300,
    //     sponsorBonus: 5,
    //     endingCircleReceiveUSD : 80,
    //     endingCircleReceiveVNC : 20,
    //     priority : 9,
    // };
    // lendingPackage.Add(item, function(result){
    //     res.json(result);
    // })
});


router.get('/', function(req, res) {
    res.redirect("/admin");
    // var data = {
    //     title: 'Du lịch Nam Du',
    //     description: 'Du lịch, biển, đảo, Nam Du',
    //     header: 'Page Header',
    // };
    // res.render("layout/frontPage", data);
})


// router.get('/import-country', function(req, res) {
//     var passwordHasher = require('aspnet-identity-pw');
//     var abc = passwordHasher.hashPassword('vnc123456');
//     console.log(abc);
//     var Country = require('../models/country');
//     https.get('https://restcountries.eu/rest/v2/all', (resp) => {
//         let data = '';
//         // A chunk of data has been recieved.
//         resp.on('data', (chunk) => {
//             data += chunk;
//         });
//         // The whole response has been received. Print out the result.
//         resp.on('end', () => {
//             var listItems = JSON.parse(data);
//             Country.insertMany(listItems, function(err, results){
//                 console.log(err, results);
//             });
//             res.json(JSON.parse(data));
//         });
//     }).on("error", (err) => {
//         console.log("Error: " + err.message);
//     });
    
// })

router.get('/get-countries', function(req, res) {
    var Country = require('../models/country');
    Country.find({}).sort({name: 1}).exec(function(err, docs) {
        res.json(docs);
    });

    // var speakeasy = require('speakeasy');
    // var abc = speakeasy.generateSecret(
    //     { name: 'acommax.com',
    //         label: 'some issuer', length : 20
    //     });
    //     console.log(abc);
})


// router.get('/import-currency', function(req, res){
//     var Currency = require('../models/currency');
//     var listItems = [{ pair:"BTC", name : "Bitcoin", img:"/img/coin/1.png"}, { pair:"ETH", name : "Ethereum", img:"a"}, { pair:"LTC", name : "Litecoin", img:"a"}, { pair:"DASH", name : "Dash", img:"a"}];
//     Currency.insertMany(listItems, function(err, results){
//         res.json({err, results});
//     });
// })

// router.get('/forgot-password', function(req, res) {
//     var data = {
//         title : ' Forgot password',
//     }
//     res.render('home/forgot-password', data);
// })

router.post('/forgot-password', function(req, res) {
    var secret = config.reCaptchaKSecrect;
    if(req.headers.host.indexOf('localhost') > -1){
        secret = config.reCaptchaKSecrectLocal;
    }
    // res.json({status : true, mes : 'Đã gửi OTP. Vui lòng chờ giây lát .'});
    // return;
    if(req.body.type == "sms"){
        if(!req.body.Login){
            res.json({status: false, mes : 'Vui lòng nhập username'});
            return;
        }
        if(!req.body.phone){
            res.json({status: false, mes : 'Vui lòng nhập số điện thoại'});
            return;
        }
        async.parallel({
            getUser : function(callback){
                User.GetUserByUsername(req.body.Login, function(result){
                    callback(null, result);
                })
            }
        }, function(err, results){
            if(!results.getUser.status)
                res.json({status: false, mes : 'Username không tồn tại'});
            var userfinded = results.getUser.user._doc;
            var lastFourUser = userfinded.phone.substr(userfinded.phone.length - 4);
            var lastFourPhone = req.body.phone.substr(req.body.phone.length - 4);
            if(lastFourPhone != lastFourUser)
                res.json({status: false, mes : 'Số điện thoại bạn nhập không đúng'});
            var abc =  randomString(6);
            var setField = {$set: {smsOTP : abc }};
            // Update Amount of sender
            User.UpdateUser(userfinded._id, setField, function(err, up){
                if(err == null){
                    var Esms = require('../helpers/esms');
                    Esms.SendMessage(userfinded.phone, '(vncoins.vn) Ma OTP lay lai mat khau : ' + abc, 6, function(result){
                        //console.log(result, parseInt(result.CodeResult));
                        if(parseInt(result.CodeResult) == 100){
                            res.json({status : true, mes : 'Đã gửi OTP. Vui lòng chờ giây lát .'});
                        }else{
                            res.json({status : false, mes : 'Không gửi được sms, vui lòng thử lại sau.'});
                        }
                    })
                     
                }
                
            })
        })
    }else{

    }
    
})

router.get('/reset-password', function(req, res) {
    var data = {
        title : ' Reset password',
    }
    res.render('home/reset-password', data);
})

router.post('/reset-password', function(req, res) {
    if(!req.body.otp){
        res.json({status: false, mes : 'Vui lòng nhập mã OTP'});
        return;
    }
    if(!req.body.password){
        res.json({status: false, mes : 'Vui lòng nhập mật khẩu mới'});
        return;
    }
    if(!req.body.passwordConfirm){
        res.json({status: false, mes : 'Vui lòng xác nhận mật khẩu mới'});
        return;
    }
    if(req.body.password != req.body.passwordConfirm){
        res.json({status: false, mes : 'Xác nhận mật khẩu mới không đúng'});
        return;
    }

    User.findOne({smsOTP : req.body.otp}, function(err, result){
        // console.log(result);
        if(result == null){
            res.json({status: false, mes : 'Mã OTP không đúng'});
            return;
        }else{
            var setField = {$set: {smsOTP : "" , password : passwordHasher.hashPassword(req.body.password)}};
            User.UpdateUser(result._doc._id, setField, function(err, up){
                if(err == null){
                    res.json({status : true, mes : 'Đổi mật khẩu thành công. Đang chuyển sang trang đăng nhập.'});
                }else{
                    res.json({status : false, mes : 'Đổi mật khẩu thất bại, vui lòng thử lại.'});
                }
                
            })
        }
    })
    
})

// router.get('/register', function(req, res) {
//     var data = {
//         title: 'Register',
//         description: 'Page Description',
//         header: 'Page Header',
//     };
//     res.render("layout/authPage", data);
// })

// router.post('/register', function(req, res) {
//     var secret = config.reCaptchaKSecrect;
//     if(req.headers.host.indexOf('localhost') > -1){
//         secret = config.reCaptchaKSecrectLocal;
//     }
//     if(!req.body.sponsor){
//         res.json({status: false, mes : 'You can not register without sponsor .'});
//         return;
//     }
//     var check = Helpers.RegularUsername(req.body.username.toLowerCase());
//     if(check.status == false){
//         res.json(check);
//         return;
//     }
//     var checkpass = Helpers.RegularPassword(req.body.password);
//     if(checkpass.status == false){
//         res.json(checkpass);
//         return;
//     }
//     if(req.body.password !== req.body.confirmPassword){
//         res.json ( {status: false, mes : "Confirm password not corrrect"} );
//     }
//     var user = {
//         fullname : req.body.fullname,
//         username: req.body.username.toLowerCase(),
//         email : req.body.email.toLowerCase(),
//         password : passwordHasher.hashPassword(req.body.password),
//         phone : req.body.phonenumber,
//         sponsor : req.body.sponsor,
//         datecreate : new Date(),
//         idCountry : require('mongoose').Types.ObjectId(req.body.country)
//     };    
    
//     async.parallel({
//         checkCaptcha: function(callback){
//             var form = {
//                 secret : secret,
//                 response :  req.body['g-recaptcha-response'],
//             }
//             var uri = 'https://www.google.com/recaptcha/api/siteverify';
//             Helpers.DoApiRequest(form, uri, function(result){
//                 callback(null, result);
//             })
//         },
//         getSponsor: function(callback) {
//             User.GetUserByUsername(req.body.sponsor, function(result){
//                 callback(null, result);
//             })
//         },
//         CountSponsorDownline: function(callback) {
//             User.CountSponsorDownline(user.sponsor, function(count){
//                 callback(null, count);
//             })
//         },
//         countMember: function(callback){
//             User.count({},function(err, result){
//                 callback(null, result);
//             })
//         },
//     }, function(err, results) {
//         // if(results.checkCaptcha.success == false){
//         //     res.json({status: false, mes : 'Please verify the captcha.'});
//         //     return;
//         // }
//         if(results.getSponsor.status){
//             user.idSponsor = results.getSponsor.user.id;
//             user.sponsorAddress = results.getSponsor.user.sponsorAddress + '-' + results.CountSponsorDownline;
//             user.sponsorLevel = results.getSponsor.user.sponsorLevel + 1;
//             user.parentCode = results.getSponsor.user.code;
//         }else{
//             user.sponsorAddress =  results.CountSponsorDownline;
//             user.sponsorLevel = 0;
//             user.parentCode = -1;
//         }
//         user.code = results.countMember;
//         User.addUser(user, ["member"], function(result){
//             res.json(result);
//         });
//         // results is now equals to: {one: 1, two: 2}
//     });
     
// })

// router.get('/login', function(req, res){
//     var token = req.body.token || req.query.token || Helpers.getCookies(req.headers.cookie, "x-access-token");
//     if(token){
//         if(req.query.redirect){
//             res.redirect(req.query.redirect);
//         }else{
//             res.redirect("/dashboard");
//         }
//         return;
//     }
//     var data = {
//         title: 'Login',
//         description: 'Page Description',
//         header: 'Login page',
//         // _csrfToken : req.csrfToken()
//     };
//     res.render('layout/authPage', data);
// });


// router.post('/login', function(req, res){

//     var secret = config.reCaptchaKSecrect;
//     if(req.headers.host.indexOf('localhost') > -1){
//         secret = config.reCaptchaKSecrectLocal;
//     }
//     if(!req.body.Login){
//         res.json({status: false, mes: 'Please enter username or email'});
//     }else if(!req.body.Password){
//         res.json({status: false, mes: 'Please enter password'});
//     }else{
//         async.parallel({
//             checkCaptcha: function(callback){
//                 var form = {
//                     secret : secret,
//                     response :  req.body['g-recaptcha-response'],
//                 }
//                 var uri = 'https://www.google.com/recaptcha/api/siteverify';
//                 Helpers.DoApiRequest(form, uri, function(result){
//                     callback(null, result);
//                 })
//             },
//             username: function(callback) {
//                 User.GetUserByUsername(req.body.Login, function(result){
//                     callback(null, result);
//                 })
//             },
//             email: function(callback) {
//                 User.GetUserByEmail(req.body.Login, function(result){
//                     callback(null, result);
//                 })
//             }
//         }, function(err, results) {
//             // if(results.checkCaptcha.success == false){
//             //     res.json({status: false, mes : 'Please verify the captcha.'});
//             //     return;
//             // }
//             if(results.username.status == false && results.email.status == false){
//                 res.json({status: false, mes: 'Invalid username or email'});
//                 return;
//             }
//             var userfinded = results.username.user._doc;
//             if(results.email.status == true){
//                 userfinded = results.email.user._doc;
//             }
//             if(!passwordHasher.validatePassword(req.body.Password, userfinded.password)){
//                 res.json({status: false, mes: 'Password not correct'});
//             }else{
//                 var abc = {
//                     _id : userfinded._id,
//                     avatar : userfinded.avatar,
//                     code : userfinded.code,
//                     email : userfinded.email,
//                     enable2fa : userfinded.enable2fa,
//                     free : userfinded.free,
//                     fullname : userfinded.fullname,
//                     lock : userfinded.lock,
//                     lockWithdraw : userfinded.lockWithdraw,
//                     parentCode : userfinded.parentCode,
//                     phone : userfinded.phone,
//                     sponsor : userfinded.sponsor,
//                     sponsorAddress : userfinded.sponsorAddress,
//                     sponsorLevel : userfinded.sponsorAddress,
//                     username : userfinded.username,
//                     verify2fa : false,
//                 }
//                 var token = jwt.sign( abc, secretKey, { 
//                     expiresIn : 60*60*24 // expires in 24 hours
//                 });
                
//                 var setField = {$set: { free: 1}};
//                 User.UpdateUser(userfinded._id, setField, function(err, up){
//                     res.cookie('x-access-token', token, { expires: new Date(Date.now() + 1000*60*60*24)});
//                     res.json({status: true, mes: 'login success', token: token});
//                 })
                  
//             }   
//         });
//     }

// });

// router.get('/verify-authentication', function(req, res){
//     res.render('layout/authPage');
// });

// router.post('/verify2fa', Helpers.verify2FA, function(req, res){
//     User.GetUserByID(req.decoded._id, function(result){
//         var secret = result.user.secret2fa;
//         var verified = speakeasy.totp.verify({
//             secret: secret.base32,
//             encoding: 'base32',
//             token: req.body.authToken
//         });
//         if(verified){
//             var abc = {
//                 _id : req.decoded._id,
//                 avatar : req.decoded.avatar,
//                 code : req.decoded.code,
//                 email : req.decoded.email,
//                 enable2fa : req.decoded.enable2fa,
//                 free : req.decoded.free,
//                 fullname : req.decoded.fullname,
//                 lock : req.decoded.lock,
//                 lockWithdraw : req.decoded.lockWithdraw,
//                 parentCode : req.decoded.parentCode,
//                 phone : req.decoded.phone,
//                 sponsor : req.decoded.sponsor,
//                 sponsorAddress : req.decoded.sponsorAddress,
//                 sponsorLevel : req.decoded.sponsorAddress,
//                 username : req.decoded.username,
//                 verify2fa : true,
//             }
//             var token = jwt.sign( abc, secretKey, { 
//                 expiresIn : 60*60*24 // expires in 24 hours
//             });
//             res.cookie('x-access-token', token, { expires: new Date(Date.now() + 1000*60*60*24)});
//             res.json({status: true, mes: 'Verify 2FA success', token: token});
//         }else{
//             res.json({status : false, mes : "Verify 2FA failed"});
//         }
//     })
// });

module.exports = router