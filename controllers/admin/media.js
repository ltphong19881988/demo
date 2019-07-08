
var express = require('express');
var async = require('async');
var fs = require('fs');
var request = require('request');
var blobUtil = require('blob-util');
var querystring = require('querystring');
var moment = require('moment');
var passwordHasher = require('aspnet-identity-pw');
var jwt = require('jsonwebtoken');
var xl = require('excel4node');
var passwordHasher = require('aspnet-identity-pw');
var router = express.Router();
const fileManager = require('file-manager-js');
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


router.post("/list", function(req, res, next){
    var dauxanh = config.publicPath + req.body.value;
    console.log(dauxanh);
    fileManager.list(dauxanh).then(( info) => {
        var kq = {dirs : [], files: []};
        info.dirs.forEach(element => {
            console.log(element);
            kq.dirs.push(element.replace(/\\/g, '/').replace(dauxanh, ''));
        });
        info.files.forEach(element => {
            kq.files.push(element.replace(/\\/g, '/').replace(dauxanh, ''));
        });
        res.json(kq);
    }).catch((error) => {
        console.log(error);
        res.json({dirs: [], files: []});
    });
})

router.post("/list-deep", function(req, res, next){
    var dauxanh = config.publicPath + req.body.value;
    console.log(dauxanh);
    fileManager.listDeep( dauxanh).then((info) => {
        var kq = {dirs : [], files: []};
        info.dirs.forEach(element => {
            console.log('dir', element);
            kq.dirs.push(element.replace(/\\/g, '/').replace(dauxanh, ''));
        });
        info.files.forEach(element => {
            
            var abc = element.replace(/\\/g, '/').replace(dauxanh,'');
            if(abc.indexOf('/') < 0)
                kq.files.push(abc);
        });
        res.json(kq);
    }).catch((error) => {
        res.json({dirs: [], files: []});
    });
})

router.post("/folder",  function(req, res, next){
    if(req.body.type === "add"){
        fileManager.createDir(req.body.path + req.body.name).then((info) => {
            console.log('ok', info);
            res.json(info);
        }).catch((error) => {
            console.log('error', error);
            res.json(error);
        });
    }
    if(req.body.type === "remove"){
        fileManager.removeDir(req.body.path)
        .then((path) => {
            res.json(path);
        })
        .catch((error) => {
            res.json(error);
        })
    }
})


router.post("/uploadfile", function(req, res, next){
    console.log(req.body);
    if(req.body.type == "upload"){
        var base64Data = req.body.img.data.replace(/^data:image\/png;base64,/, "").replace(/^data:image\/jpeg;base64,/, "");
        var imageName = req.body.path + req.body.img.name;
        fs.access(imageName, fs.F_OK, (err) => {
            if (err) {
                console.error(err);
                fs.writeFile(imageName, base64Data, 'base64', function(err) {
                    res.json({status : true, mes : "Upload thành công"});
                });
            }else{
                res.json({status : false, mes : 'Ảnh đã tồn tại'});
            }
        })
    }
    if(req.body.type === 'remove'){
        fileManager.removeFile(req.body.path)
        .then((path) => {
            res.json(path);
        })
        .catch((error) => {
            res.json(error);
        })
    }
})





router.get('/*', function (req, res, next) {
    res.render("layout/admin");
})

module.exports = router
