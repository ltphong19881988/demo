// var express = require('express');
// var router = express.Router() ;
// var User   = require('../models/user');
// var Role   = require('../models/role');
// var UserRole   = require('../models/userrole');
var request = require('request');
var path    = require('path');
var jsonfile = require('jsonfile')
var querystring = require('querystring');
var async = require('async');
var jwt = require('jsonwebtoken');
var Transaction = require('../models/transaction');
var User = require('../models/user');
var config = require('../config'); // get our config file
var secretKey = config.secret;
var urlRole = [
    {
        link : '/user/sendpoint',        role : 'send point'
    },
    {
        link : '/user/createaccount',        role : 'create account'
    },

]


function getCookies(cookie, cname){
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

function checkRole(url, userRole){
    
    for(var i = 0; i < urlRole.length; i++)
    {
        if(urlRole[i].link === url){
            for(var j = 0; j < userRole.length; j++){
                if(urlRole[i].role === userRole[j].name){
                    return true;
                }
            }
            return false;
        }
    }
    return true;
}

var Helpers = {};
module.exports = Helpers;

module.exports.RegularUsername = function (str) {
    // $pattern = "/^[a-z0-9_\.]{6,32}$/";
    var pattern = /^[a-z0-9_]{6,32}$/;
    var match = pattern.test(str);
    if ( ! match) {
        return  {status: false, mes : "Username from 6 - 32  alphanumeric characters and '_'"};
    }
    return {status:true, mes: ""};
}

module.exports.RegularPassword = function (str) {
    //      (/^
    //     (?=.*\d)                //should contain at least one digit
    //     (?=.*[a-z])             //should contain at least one lower case
    //     (?=.*[A-Z])             //should contain at least one upper case
    //     [a-zA-Z0-9]{8,}         //should contain at least 8 from the mentioned characters
    //     $/)
    var pattern = /^(?=.{6,})/;
    var match = pattern.test(str);
    if ( ! match) {
        return  {status: false, mes : "Passsword at least 6 characters"};
    }
    return {status:true, mes: ""};
}

module.exports.getCookies = function (cookie, cname){
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

module.exports.isAuthenticated = function (req, res, next) {
    // check header or url parameters or post parameters for token    
    var token = req.body.token || req.query.token || getCookies(req.headers.cookie, "x-access-token");
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, secretKey, function(err, decoded) {      
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });    
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;    
                // if(checkRole(req.originalUrl, decoded._doc.roles) === false){
                //     res.redirect("/login?redirect="+req.originalUrl);
                // }
                if(decoded.enable2fa == true){
                    if(decoded.verify2fa == true){
                        next();
                    }else{
                        res.redirect("/verify-authentication?redirect="+req.originalUrl);
                    }
                }else{
                    next();
                }
            }
        });

    } else {
        next();
        // res.redirect("/login?redirect="+req.originalUrl);
        // if there is no token
        // return an error
        // return res.status(403).send({ 
        //     success: false, 
        //     message: 'No token provided.' 
        // });

    }
}

module.exports.verify2FA = function (req, res, next) {
    var token = req.body.token || req.query.token || getCookies(req.headers.cookie, "x-access-token");
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, secretKey, function(err, decoded) {      
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });    
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;    
                next();
            }
        });

    } else {
        res.redirect("/login?redirect="+req.originalUrl);
    }
}

module.exports.randomInvoince = function (length, callbackA) {
    var text = "VNC";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    async.parallel({
        check: function(callback) {
            Transaction.findOne({txid : text}, function(err, result){
                callback(null, {err, result});
            })
        }
    }, function(err, results) {
        if(results.check.result != null){
            randomInvoince(length, callbackA);
        }else{
            callbackA (text);
        }
    });
    
}

module.exports.writeLog = function (file, obj, callback){
    jsonfile.writeFile(path.join(__dirname, '../log/')  + file, obj, {spaces: 2, flag : 'a'}, function(err) {
        //console.error(err)
        callback(err);
    })
}

module.exports.InitWalletClient = function(str){
    var form = {
        port : 8332, 
        rpcuser : 'dark',
        rpcpass : 'alluneedev',
    };
    if(str.toLowerCase() == 'btc'){
        form.host = '210.211.109.165';
    }else{
        form.host = '125.212.253.142';
    }
    return form;
}

module.exports.DoApiRequest = function(form, urlPost, callback){
    var formData = querystring.stringify(form);
    var contentLength = formData.length;
    request({
        headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        uri: urlPost,
        body: formData,
        method: 'POST'
      }, function (err, response) {
            if (!err && response.statusCode === 200) {
                callback(JSON.parse(response.body));
            }else{
                callback(false);
            }
    });
}

module.exports.GetRequest = function(url, callback){
    request({
        uri: url,
        method: 'GET'
      }, function (err, response) {
            if (!err && response.statusCode === 200) {
                callback(JSON.parse(response.body));
            }else{
                callback(false);
            }
    });
}

module.exports.RequestBalance = function(user, callback){
    console.log(user.username);
    var btcAddress = user.btcAddress;
    var formBTC = this.InitWalletClient('btc');
    formBTC.account = user.username;
    formBTC.take = 9999;
    formBTC.skip = 0;
    var formVNC = this.InitWalletClient('vnc');
    formVNC.account = user.username;
    formVNC.take = 9999;
    formVNC.skip = 0;

    async.parallel({
        // Should be set User free is 0 until Update Amount finished .
        set:function(callback){
            var query = {
                _id : user.id,
            };
            var setField = {$set: { free: 0}};
            User.update(query, setField, {upsert: true}, function(err, up){
                callback(null, true);
            })
        },
        walletVNC: function(callback) {
            Helpers.DoApiRequest(formVNC, 'http://45.76.149.248:8080/api/owncoin/listtransactions', function(result){
                callback(null, result);
            });
        },
        walletBTC: function(callback) {
            Helpers.DoApiRequest(formBTC, 'http://45.76.149.248:8080/api/owncoin/listtransactions', function(result){
                callback(null, result);
            });
        },
        dbVNC: function(callback) {
            Transaction.GetTransactionsByIdUserOption(user.id, 'vnc', 'deposit', function(result){
                callback(null, result);
            });
        },
        dbBTC: function(callback) {
            Transaction.GetTransactionsByIdUserOption(user.id, 'btc', 'deposit', function(result){
                callback(null, result);
            });
        }
    }, function(err, results) {
        var listExistVNC = [];
        var listExistBTC = [];
        results.dbVNC.transactions.forEach(ele =>{
            listExistVNC.push(ele.txid);
        });
        results.dbBTC.transactions.forEach(ele =>{
            listExistBTC.push(ele.txid);
        });
        var listAdd = [];
        var amountVNC = 0;
        var amountBTC = 0;
        if(results.walletVNC.status != false){
            results.walletVNC.forEach(ele => {
                if(ele.category == 'receive' && ele.confirmations >= 3 && listExistVNC.indexOf(ele.txid) == -1){
                    var trans = {
                        source : 'vncoins',
                        idUser : user.id,
                        address : user.vncAddress,           // address of btc or vnc
                        walletType : 'vnc',        // btc or vnc
                        amount : ele.amount,
                        type: 'deposit',        // buy, sell, deposit, withdraw, fee
                        datecreate :  require('moment')(ele.timereceived*1000).format(),
                        status : 1,            //
                        txid : ele.txid,
                        description : 'deposit vnc'
                    }
                    listAdd.push(trans);
                    amountVNC += (ele.amount);
                }
            });
        } 
        if(results.walletBTC.status != false){
            results.walletBTC.forEach(ele => {
                if(ele.category == 'receive' && ele.confirmations >= 3 && listExistBTC.indexOf(ele.txid) == -1){
                    var trans = {
                        source : 'vncoins',
                        idUser : user.id,
                        address : user.btcAddress,           // address of btc or vnc
                        walletType : 'btc',        // btc or vnc
                        amount : ele.amount,
                        type: 'deposit',        // buy, sell, deposit, withdraw, fee
                        datecreate :  require('moment')(ele.timereceived*1000).format(),
                        status : 1,            //
                        txid : ele.txid,
                        description : 'deposit btc'
                    }
                    listAdd.push(trans);
                    amountBTC += (ele.amount);
                }
            });
        }
        
        if(listAdd.length > 0){
            console.log('btcAmount: ', user.btcAmount, 'vncAmount: ', user.vncAmount);
            Transaction.insertMany(listAdd, function(err, added){
                if(!err){
                    var query = {
                        _id : user.id,
                    };
                    var setField = {$set: { vncAmount: parseFloat(user.vncAmount + amountVNC).toFixed(8), btcAmount: parseFloat(user.btcAmount + amountBTC).toFixed(8), free : 1}};
                    User.update(query, setField, {upsert: true}, function(err, up){
                        console.log('updated ', setField);
                        callback();
                    })
                }else{
                    // Log Error
                    console.log(err);
                    callback();
                }
                
            });
        }else{
            console.log('nothing');
            var query = {
                _id : user.id,
            };
            var setField = {$set: {  free : 1}};
            User.update(query, setField, {upsert: true}, function(err, up){
                callback();
            })
        }

    });

    
}


module.exports.CheckAddress = function(user, callback){
    //console.log(user);
    var formVNC = this.InitWalletClient('vnc');
    formVNC.address = user.vncAddress;
    var formBTC = this.InitWalletClient('btc');
    formBTC.address = user.btcAddress;
    async.parallel({
        btcAccount : function(callback){
            Helpers.DoApiRequest(formBTC, 'http://45.76.149.248:8080/api/owncoin/getaccount', function(result){
                // console.log(formBTC);
                if(result == user.username){
                    // console.log('result btcAccount', result);
                    callback(null, 0);
                }else{
                    formBTC.account = user.username;
                    var uri = 'http://45.76.149.248:8080/api/owncoin/getaccountaddress';
                    Helpers.DoApiRequest(formBTC, uri, function(result){
                        var setField = {$set: {  btcAddress : result}};
                        User.UpdateUser(user._id, setField, function(err, up){
                            // console.log(err, up);
                            callback(null, 1);
                        })
                    })
                }                
            });
        },
        vncAccount : function(callback){
            Helpers.DoApiRequest(formVNC, 'http://45.76.149.248:8080/api/owncoin/getaccount', function(result){
                if(result == user.username){
                    // console.log('result vncAccount', result);
                    callback(null, 0);
                }else{
                    formVNC.account = user.username;
                    var uri = 'http://45.76.149.248:8080/api/owncoin/getaccountaddress';
                    Helpers.DoApiRequest(formVNC, uri, function(result){
                        var setField = {$set: {  vncAddress : result}};
                        User.UpdateUser(user._id, setField, function(err, up){
                            // console.log(err, up);
                            callback(null, 1);
                        })
                        
                    })
                }  
            });
        },
    },function(err, results){
        if(results.btcAccount == 0 && results.vncAccount == 0){
            callback(0);
        }else{
            callback(1);
        }
        
    })
    
}


var MongoClient = require('mongodb').MongoClient;
var url = config.database;

module.exports.GetConfigByName = function(str, callback){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection("config").findOne({name:str}, function(err, result) {
            // console.log('db', result);
            db.close();
            if (err) {
                throw err;
                callback({status:false, data: result});
            }else{
                callback({status:true, data : result});
            }
            
        });
    });
}

module.exports.UpdateCollection = function(collection, query, setField, callback ){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection(collection).update(query, setField, {upsert: true}, function(err, result) {
            db.close();
            callback(err, result.result);
        });
    });
}
