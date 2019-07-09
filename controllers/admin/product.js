
var express = require('express');
var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
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
var InvestmentPackage = require('../../models/investmentpackage');
// var Role   = require('../models/role');
// var UserRole   = require('../models/userrole');
// var UserAuth   = require('../models/userauth');

var config = require('../../config'); // get our config file
var Tool = require('../../helpers/tool');
var secretKey = config.secret;

var change_alias = function (alias) {
    var str = alias;
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
    str = str.replace(/ + /g," ");
    str = str.replace(/ /g,"-");
    str = str.trim(); 
    return str;
}

router.post('/all-post', function(req, res, next){
    console.log(req.body);
    let options = {
        postType : 1,
    }
    if(req.body.idCategoryType) {
        options.idCategoryType = mongoose.Types.ObjectId(req.body.idCategoryType) ;
    }
    Post.aggregate([
        {
            $match: options,
        },
        { 
            $sort: {datecreate : 1}
        },
        {
            $lookup:
            {
                from: "categories",
                localField: "idCategory",
                foreignField: "_id",
                as: "category"
            },
        },
        { $unwind : "$category" },
        {
            $lookup:
            {
                from: "postcontents",
                localField: "_id",
                foreignField: "idPost",
                as: "postContent"
            },
        },
        { $unwind : "$postContent" },
        {
            $project: {
                "categoryName": '$category.name',
                "nameKey": 1,
                "normalPrice": 1,
                "pictures": 1,
                "salePrice": 1,
                "datecreate": 1,
                "title" : '$postContent.title',
            }
        },
    ], function(err, result){
        res.json(result);
    })
})

router.post("/item", function(req, res, next){
    if(!req.body.title || req.body.title == "" || req.body.title == " "){
        res.json({status: false, mes: "Chưa nhập tiêu đề"}); return;
    }
    if( ! mongoose.Types.ObjectId.isValid(req.body.idCategory)){
        res.json({status: false, mes: "Chưa chọn danh mục"}); return;
    }

    async.parallel({
        getCate : function(callback){
            Category.findOne({_id : mongoose.Types.ObjectId(req.body.idCategory)}).exec(function(err, cateFinded){
                if(err || cateFinded == null){
                    callback(null, { status: false, mes : 'Không tìm thấy danh mục'});
                }else{
                    callback(null, {status : true, cateFinded : cateFinded});
                }
            })
        },
        getNameKey: function(callback){
            Tool.getUniqueNameKey('nameKey', Tool.change_alias(req.body.title), Post, function(nameKey){
                callback( null , nameKey );
            })
        }
    }, function(err, results){
        if(results.getCate.status == false){
            return res.json(results.getCate) ;
        }
        var normalPrice = 0;
        if(req.body.nomarlPrice)
            normalPrice = typeof parseFloat(req.body.nomarlPrice) == "number" ? parseFloat(req.body.nomarlPrice) : 0 ;
        var salePrice = 0;
        if(req.body.salePrice)
            salePrice = typeof parseFloat(req.body.salePrice) == "number" ? parseFloat(req.body.salePrice) : 0 ;
        var item = {
            nameKey: change_alias(req.body.title),
            idCategory : mongoose.Types.ObjectId(req.body.idCategory),
            idCategoryType : cateFinded.idCategoryType,
            postType : 1, 
            normalPrice : normalPrice,
            salePrice : salePrice,
            pictures : req.body.imgs,
            tags: [],
        }
        Post.create(item, function(err, post){
            // console.log('add post', err, post);
            if(err != null) return res.json ({status: false, mes : 'Không lưu được, vui lòng thử lại sau'}) ;
            var postContent = {
                idPost: post._id,
                title : req.body.title,
                descriptions : req.body.descriptions,
                content : req.body.content,
                seoKeyWord : req.body.title,
                seoDescriptions : req.body.descriptions,
            }
            PostContent.create(postContent, function(err, result){
                // console.log('add post Content', err, result);
                res.json({status: true, mes : "Thêm thành công", post : post, postContent : result});
            })
            
        })

    })

})

router.get("/item/:id",  function(req, res, next){
    var id = mongoose.Types.ObjectId(req.params.id);
    let options = {
        _id : id,
    }
    Post.aggregate([
        {
            $match: options,
        },
        {
            $lookup:
            {
                from: "categories",
                localField: "idCategory",
                foreignField: "_id",
                as: "category"
            },
        },
        { $unwind : "$category" },
        {
            $lookup:
            {
                from: "postcontents",
                localField: "_id",
                foreignField: "idPost",
                as: "postContent"
            },
        },
        { $unwind : "$postContent" },
    ], function(err, result){
        if(result.length > 0)
            res.json(result[0]);
        else res.json (null);
    })
})

router.put("/item",  function(req, res, next){
    console.log(req.body);
    if(!req.body.title || req.body.title == "" || req.body.title == " "){
        res.json({status: false, mes: "Chưa nhập tiêu đề"}); return;
    }
    if( ! mongoose.Types.ObjectId.isValid(req.body.idCategory)){
        res.json({status: false, mes: "Chưa chọn danh mục"}); return;
    }
    async.parallel({
        checkCategory : function(callback){
            Category.findOne({_id : mongoose.Types.ObjectId(req.body.idCategory)}, function(err, cate){
                if(err || cate == null){
                    callback( null, {status: false, mes : 'Sai danh mục sản phẩm'}) ;
                }else{
                    callback( null, {status: true, cate : cate }) ;
                }
            })
        },
        checkPost : function(callback){
            Post.findOne({_id : mongoose.Types.ObjectId(req.body._id)}, function(err, post){
                if(err || post == null){
                    callback( null, {status: false, mes : 'Sai id sản phẩm'}) ;
                }else{
                    callback( null, {status: true, post : post }) ;
                }
            })
        },
        getNameKey : function(callback){
            Tool.getUniqueNameKey('nameKey', Tool.change_alias(req.body.title), Post, function(nameKey){
                callback( null , nameKey );
            })
        }
    }, function(err, results){
        if(!results.checkCategory.status){
            return res.json(results.checkCategory) ;
        }
        if(!results.checkPost.status){
            return res.json(results.checkPost) ;
        }
        var post = results.checkPost.post ;
        var postChange = {
            idCategory : results.checkCategory.cate._id,
            idCategoryType : results.checkCategory.cate.idCategoryType,
            allowOrder : (req.body.allowOrder == 'true'),
            nameKey : req.body.nameKey,
            pictures : req.body.imgs,
            normalPrice : typeof parseFloat(req.body.nomarlPrice) == "number" ? parseFloat(req.body.nomarlPrice) : 0,
            salePrice : typeof parseFloat(req.body.salePrice) == "number" ? parseFloat(req.body.salePrice) : 0,
        }
        if(post.nameKey != req.body.nameKey) postChange.nameKey = results.getNameKey ;
        Post.findOneAndUpdate({_id : post._id}, postChange, {upsert:true}, function(err, doc){
            if(err){
                res.json({status : false, mes: 'lỗi không xác định, vui lòng thử lại', err : err});
            }else{
                var contentId = mongoose.Types.ObjectId(req.body.contentId);
                var contentChange = {
                    descriptions : req.body.descriptions,
                    content : req.body.content,
                }
                
                PostContent.findOneAndUpdate({_id : contentId}, contentChange, function(err, abc) {
                    // console.log('update content', err, abc) ;
                    res.json({status: true, mes : 'Cập nhật thành công'})
                })
            }
        });
    })

    
})




router.get('/*', function (req, res, next) {
    res.render("layout/admin");
})

module.exports = router


var getAllPost = function(){
    Post.a
}