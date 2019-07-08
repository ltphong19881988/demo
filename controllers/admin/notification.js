
var express = require('express');
var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');
var request = require('request');
// var cheerio = require('cheerio');
var moment = require('moment');
var jwt = require('jsonwebtoken');
var xl = require('excel4node');
var router = express.Router();
const fileManager = require('file-manager-js');
var User = require('../../models/user');
var Notification = require('../../models/notification');
var Tool = require('../../helpers/tool');
// var Role   = require('../models/role');


var config = require('../../config'); // get our config file
var Helpers = require('../helpers');
var secretKey = config.secret;


router.get('/test-fcm', function(req, res, next){
    Notification.findOne({}, function(err, noti){
        sendNotification(noti, function(result){
            if(result.error == null && result.response.statusCode == 200){
                console.log('dau ma', result.response);
                var notiChange = {
                    sendStatus : true,
                    fcmResponse : result.body,
                }
                Notification.update({_id : noti._id}, notiChange, {upsert: true}, function(err, doc){
                    console.log('update noti', err, doc);
                    res.json(result);
                });
            }
            
        })
    })
})

router.post('/all-notifications', function(req, res, next){
    var option = {};
    Notification.aggregate([
        {
            $match: option,
        },
        { 
            $sort: {datecreate : 1}
        },
        { $skip : parseInt(req.body.start) },
        { $limit : parseInt(req.body.length) },
    ], function(err, result){
        console.log('all noti', result);
        res.json(result);
    })
})


router.post("/add",  function(req, res, next){
    // let abc = new Date(moment(req.body.startTime, "YYYY-MM-DDThh:mm:ss.SSSZ").format('YYYY-MM-DD HH:mm:ss') ) ;
    // console.log(req.body, abc ) ;
    if(!req.body.title || req.body.videoTitle == ''){
        return res.json({status: false, mes: 'Vui lòng nhập tên video'});
    }
    if(!req.body.body || req.body.videoUrl == ''){
        return res.json({status: false, mes: 'Vui lòng nhập đường dẫn video'});
    }

        let item = {
            title : req.body.title,
            body : req.body.body,
            startTime : req.body.startTime, 
        }

        Notification.create(item, function(err, result){
            if(err){
                return res.json({status: false, err : err})
            }else{
                return res.json({status : true, mes : "Thêm thông báo thành công"});
            }
        })
    

})

router.get("/:id", function(req, res, next){
    var _id = mongoose.Types.ObjectId(req.params.id);
    Notification.findOne({_id : _id}, function(err, result){
        if(err || result == null){
            res.json({status : false, mes : "Không tìm thấy id thông báo"});
        }else{
            res.json({status : true, noti : result});
        }
    })
})

router.put("/:id", function(req, res, next){
    var _id = mongoose.Types.ObjectId(req.params.id);
    Notification.findOne({_id : _id}, function(err, result){
        if(err || result == null){
            res.json({status : false, mes : "Không tìm thấy id thông báo"});
        }else{
            var setFields = req.body.noti;
            console.log(req.body.noti);
            Notification.update({_id : _id}, {$set : setFields}, {upsert : true}, function(err, result){
                if(err == null){
                    res.json({status : true, mes : "Thay đổi thông báo thành công"});
                }else{
                    res.json({status : false, mes : "Không cập nhật được thông báo"});
                }
                
            })
        }
    })
})

router.delete("/:id", function(req, res, next){
    var _id = mongoose.Types.ObjectId(req.params.id);
    Notification.deleteOne({_id : _id}, function(err, result){
        if(err){
            res.json({status : false, mes : "Không tìm thấy id cần xóa"});
        }else{
            res.json({status : true, mes : "Xóa thông báo thành công"});
        }
    })
})





router.get('/*', function (req, res, next) {
    res.render("layout/admin");
})

module.exports = router


var sendNotification = function(item, callback){
    Notification.Init(item, function(abc){
        // console.log('abc', abc);
        request.post({
            headers: {
                'content-type' : 'application/json',
                'Authorization' : 'key='+config.fcmKey ,
            },
            url:     'https://fcm.googleapis.com/fcm/send',
            body:   abc,
            json: true
        }, function(error, response, body){
            
            callback({error, response, body});
        });
    });
    
}