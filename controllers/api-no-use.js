

var express = require('express');
var router = express.Router() ;
var async = require('async');
var request = require('request');
var querystring = require('querystring');
var crypto = require("crypto");
var User   = require('../models/user');
var Role   = require('../models/role');
var UserRole   = require('../models/userrole');
var UserAuth   = require('../models/userauth');
var Transaction = require('../models/transaction');
var Hash   = require('../models/hash');
var jwt = require('jsonwebtoken');
var config = require('../config'); // get our config file
var secretKey = config.secret;
// router.use('/animals', require('./animals'))

//router.use('/bitcoin', require('./bitcoin'));
//router.use('/ether', require('./ether'));


getClientAddress = function (req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0] 
    || req.connection.remoteAddress;
};


router.post('/tranfer', function(req, res, next) {
    // console.log(req.body.data);
    // { code: 'YP22ZKM3', money: 1, wallet: 'sdgfdsfsdf' } save code (invoice)
    
    jwt.verify(req.body.data, 'yopay@)!&', function(err, result) {
        
        if(err){
            res.json({status: false, ms : 'Failed authentication token'});
            return;
        }var walletType = '';
        if(result.source == 'VNCOINS') walletType = 'vnc';
        if(result.source == 'ETHEREUM') walletType = 'eth';
        if(result.source == 'BITCOIN') walletType = 'btc';
        if(result.source == 'YOPAY') walletType = 'yopay';
        User.findOne({}).where(walletType + 'Address', result.wallet).exec(function(err, finded){
            console.log('find user, wallet ' , err, finded);
            if(err != null || finded == null){
                res.json({status: false, ms : 'Invalid address'});
                return;
            }
            var trans =  {
                idUser : finded._id,
                address : finded[walletType + 'Address'],           // address of btc or vnc
                walletType : walletType,        // btc or vnc
                amount : parseFloat(result.money),
                type: "yopay deposit",        // buy, sell, deposit, withdraw, fee
                datecreate :  new Date() ,
                status : 1,            //
                txid : result.code,
                description : 'Deposit ' + result.source + ' from yopay '
            }

            Transaction.Add(trans, function(result){     
                console.log('add trans', result);
                if(result.status == false){
                    res.json({status: false, ms : 'Can not save transactions .'});
                    return;
                }else{
                    var abc = {}; abc[walletType + 'Amount'] = parseFloat(finded[walletType + 'Amount']) + parseFloat(trans.amount);
                    var setField = {$set : abc};
                    User.UpdateUser(finded._id, setField, function(err, up){
                        console.log('update user ', err, up);
		                res.json({status:true, ms : 'Transfer successfully'});
                    })
                }
            });
        })
        
	});
})

router.get('/', function(req, res, next) {
    res.redirect("/api/index");
})
router.get('/index', function(req, res, next) {
    var data = {
        title: 'Game guide',
        description: 'Page Description',
        header: 'Page Header'        
    };
    res.json( data);    
})

router.get('/coin-price', function(req, res, next){
    var configDB = require('../models/config');
    var currency = req.query.currency;
    configDB.findOne({data: {$elemMatch:{ "id": 'bitcoin'}}}).exec(function(err, result){
        // res.json(result);
        if(currency == 'alls' || currency == 'undefined'){
            res.json(result.data);
        }else{
            result.data.filter(function(x) { 
                if(x.id == currency)
                    res.json(x);
            });
        }   
        
        // result.data.forEach(element => {
        //     if(element.id == 'bitcoin')
        //     res.json({err,element});
        // });
    })

})

router.get('/inithash', function(req, res, next){
    var number = req.query.number || req.body.number;
    Hash.Init(number, function(result){
        res.json(result);
    });
})

router.get('/listhash', function(req, res, next){
    Hash.ListHash(function(result){
        res.json(result);
    });
})

router.post('/geturljson', function(req, res, next){
    var url = req.body.url || req.query.url;

            request.post({
                url: 'http://45.76.191.50/api/geturljson',
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                body:    "url="+url,
                json : true
            }, function (error, response) {
                if (!error && response.statusCode === 200) {
                    // Print the json response
                    res.json(response.body);
                }else{
                    res.json(false);
                }
            })


})

router.post('/geturlcommand', function(req, res, next){
    var form = {
    };
    for(var key in req.body) {
            var value = req.body[key];
            form[key] = value;
    }
    var formData = querystring.stringify(form);
    var contentLength = formData.length;
    request({
        headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        uri: 'http://45.76.191.50/api/geturlcommand',
        body: formData,
        method: 'POST'
      }, function (err, response) {
        //it works!
            if (!err && response.statusCode === 200) {
                // Print the json response
                res.json(response.body);
            }else{
                res.json(false);
            }
    });
});

function hmacsha512sign(key, str) {
    var hmac = crypto.createHmac("sha512", key);
    var signed = hmac.update(new Buffer(str, 'utf-8')).digest("hex");
    signed = signed.replace('-','').toLowerCase();
    return signed;
}

router.post('/postapipolo', function(req, res, next){
    var ApiKey = req.body.ApiKey || req.query.ApiKey;
    var ApiSecret = req.body.ApiSecret || req.query.ApiSecret;
    var form = {
        nonce : new Date().getTime()
    };
    for(var key in req.body) {
        if(key != "ApiKey" && key != "ApiSecret"){
            var value = req.body[key];
            form[key] = value;
        }
        
    }
    var formData = querystring.stringify(form);
    var contentLength = formData.length;

    async.parallel({
        data: function(callback) {
            request({
                headers: {
                    "Key" : ApiKey,
                    "Sign" : hmacsha512sign(ApiSecret, formData),
                    'Content-Length': contentLength,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                uri: 'https://poloniex.com/tradingApi',
                body: formData,
                method: 'POST'
              }, function (err, res) {
                //it works!
                    if (!err && res.statusCode === 200) {
                        // Print the json response
                        callback(false, res.body);
                    }else{
                        callback(true, res.body);
                    }
              });
        },

    }, function(err, results) {
        // results is now equals to: {one: 1, two: 2}
            res.json({error : err , data : results.data});
    });
})


module.exports = router