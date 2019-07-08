
var express = require('express');
var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');
// var request = require('request');
// var cheerio = require('cheerio');
var moment = require('moment');
var jwt = require('jsonwebtoken');
var xl = require('excel4node');
var router = express.Router();
const fileManager = require('file-manager-js');
var User = require('../../models/user');
var Category = require('../../models/category');
var CategoryType = require('../../models/category-type');
var Post = require('../../models/post');
var PostContent = require('../../models/post-content');
var Tool = require('../../helpers/tool');
// var Role   = require('../models/role');


var config = require('../../config'); // get our config file
var Helpers = require('../helpers');
var secretKey = config.secret;


router.post('/all-videos', function(req, res, next){
    console.log(req.body);
    let option = {
        idCategory : mongoose.Types.ObjectId('5d07642f4a8f29677183e5ca'),
        postType : 1,
    };
    Post.aggregate([
        {
            $match: option,
        },
        { 
            $sort: {datecreate : 1}
        },
        { $skip : parseInt(req.body.start) },
        { $limit : parseInt(req.body.length) },
    ], function(err, result){
        res.json(result);
    })
})

router.post("/add",  function(req, res, next){
    console.log(req.body);
    if(!req.body.videoTitle || req.body.videoTitle == ''){
        return res.json({status: false, mes: 'Vui lòng nhập tên video'});
    }
    if(!req.body.videoUrl || req.body.videoUrl == ''){
        return res.json({status: false, mes: 'Vui lòng nhập đường dẫn video'});
    }

    Tool.getUniqueNameKey('nameKey', Tool.change_alias(req.body.videoTitle), Post, function(nameKey){
        let item = {
            nameKey: nameKey,
            idCategory : mongoose.Types.ObjectId('5d07642f4a8f29677183e5ca'),
            idCategoryType :  mongoose.Types.ObjectId('5ce6e3e814a02912548dd901'),
            postType : 1, // 1 : rieng-biet, 0 : dinh kem theo category
            videoUrl : req.body.videoUrl,
            videoTitle : req.body.videoTitle,
            // pictures : [],
        }

        Post.create(item, function(err, result){
            if(err){
                return res.json({status: false, err : err})
            }else{
                return res.json({status : true, mes : "Thêm video thành công"});
            }
        })
    
    })

})

router.get("/:id", function(req, res, next){
    var id = mongoose.Types.ObjectId(req.params.id);
    console.log(req.params.id, id);
    Post.findOne({_id : id}, function(err, vid){
        console.log(err, vid);
        if(err || vid == null){
            res.json({status : false, mes : "Không tìm thấy id video"});
        }else{
            res.json({status : true, video : vid});
        }
    })
})

router.put("/:id", function(req, res, next){
    var _id = mongoose.Types.ObjectId(req.params.id);
    console.log(req.body);
    Post.findOne({_id : _id}, function(err, result){
        if(err || result == null){
            res.json({status : false, mes : "Không tìm thấy id video"});
        }else{
            var setFields = req.body.video;
            Post.update({_id : _id}, {$set : setFields}, {upsert : true}, function(err, result){
                if(err == null){
                    res.json({status : true, mes : "Thay đổi thông tin thành công"});
                }else{
                    res.json({status : false, mes : "Không cập nhật được thông tin"});
                }
                
            })
        }
    })
})

router.delete("/:id", function(req, res, next){
    var _id = mongoose.Types.ObjectId(req.params.id);
    Post.deleteOne({_id : _id}, function(err, result){
        if(err){
            res.json({status : false, mes : "Không tìm thấy id cần xóa"});
        }else{
            res.json({status : true, mes : "Xóa video thành công"});
        }
    })
})





router.get('/*', function (req, res, next) {
    res.render("layout/admin");
})

module.exports = router


var getAllPost = function(){
    Post.a
}