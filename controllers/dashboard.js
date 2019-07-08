var express = require('express');
var async = require('async');
var request = require('request');
var querystring = require('querystring');
var router = express.Router() ;
var passwordHasher = require('aspnet-identity-pw');
var User   = require('../models/user');
var Transaction   = require('../models/transaction');
var jwt = require('jsonwebtoken');
var config = require('../config'); // get our config file
var secretKey = config.secret;
var Helpers = require('./helpers');
// router.use('/animals', require('./animals'))




// router.get('/', function(req, res, next) {
//     res.redirect("/market/index");
// })
router.get('/', Helpers.isAuthenticated, function(req, res, next) {    
    // console.log(req.decoded);
    var data = {
        title: 'Dashboard Page',
        description: 'Page Description',
        header: 'Page Header'        
    };
    // res.redirect('/lending');
    res.render('layout/layout', data);    
})
router.get('/*', Helpers.isAuthenticated, function(req, res, next) {    
    // console.log(req.decoded);
    var data = {
        title: 'abc',
        description: 'Page Description',
        header: 'Page Header'        
    };
    // res.redirect('/lending');
    res.render('layout/layout', data);    
})




module.exports = router