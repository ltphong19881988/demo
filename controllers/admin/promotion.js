
var express = require('express');
var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');
var request = require('request');
var blobUtil = require('blob-util');
var querystring = require('querystring');
var moment = require('moment');

var jwt = require('jsonwebtoken');
var xl = require('excel4node');
var passwordHasher = require('aspnet-identity-pw');
var router = express.Router();
const fileManager = require('file-manager-js');
var User = require('../../models/user');
var Category = require('../../models/category');
var CategoryType = require('../../models/category-type');
var Promotion = require('../../models/promotion');
var PostContent = require('../../models/post-content');
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

// router.get('/abc-xyz', function(req, res, next){
//     CategoryType.Init();
// })

router.post("/all-promotion", function(req, res, next){
    console.log(req.body);
    getAllPromotion( function(results){
        res.json(results);
    });
})

router.get("/all-category-type", function(req, res, next){
    CategoryType.find({}).sort({priority:1}).exec(function(err, results){
        if(err){
            res.json([]);
        }else{
            
            res.json(results);
        }
    })
})

var addPromotion = function(price, type, dem, quantity, callback){
    var item = {
        code : Tool.randomStr(10),
        price: price,
        type : type, // 0: number, 1 : % ;
    }
    Promotion.create(item, function(err, doc){
        if(err){
            addPromotion(price, type, dem, quantity, callback);
        }else{
            dem ++;
            if(dem < quantity){
                addPromotion(price, type, dem, quantity, callback);
            }else{
                callback(dem);
            }
        }
    })
}
router.post("/add-promotion", function(req, res, next){
    console.log(req.body);
    if(!req.body.type || req.body.type == ''){
        res.json({status: false, mes : "Chưa chọn loại khuyến mãi"}); return;
    }
    if(!req.body.price || req.body.price == ''){
        res.json({status: false, mes : "Chưa nhập giá trị khuyễn mãi"}); return;
    }
    if(!req.body.quantity || req.body.quantity == ''){
        res.json({status: false, mes : "Chưa nhập số lượng mã"}); return;
    }
    var dem = 0;
    var dauxanh = parseInt(req.body.quantity);
    addPromotion(parseFloat(req.body.price), parseInt(req.body.type), 0, dauxanh, function(abc){
        res.json({status: true, mes: "Tạo mã khuyễn mãi thành công " + abc});
    })

    
})

router.get("/:id", function(req, res, next){
    var id = mongoose.Types.ObjectId(req.params.id);
    async.parallel({
        getCate: function(callback){
            Category.findOne({_id : id}).exec(function(err, cate){
                callback(null, cate);
            });
        },
        getPost : function(callback){
            Post.findOne({idCategory : id, postType : 0}).exec(function(err, post){
                if(post){
                    PostContent.findOne({idPost : post._id}).exec(function(err, postContent){
                        callback(null, {post : post, postContent : postContent});
                    })
                }else{
                    callback(null, {post: null, postContent : null});
                }
            });
        }
    }, function(err, results){
        res.json({cate : results.getCate, post : results.getPost.post, postContent: results.getPost.postContent});
    })

})

router.put("/:id", function(req, res, next){
    console.log(req.body);
    var id = mongoose.Types.ObjectId(req.params.id);
    async.parallel({
        updateCate: function(callback){
            Category.findOneAndUpdate({_id : id}, {name : req.body.title}, {upsert:true}, function(err, doc){
                console.log('update cate', err, doc);
                callback(null, doc);
            });
        },
        getNameKey : function(callback){
            Tool.getUniqueNameKey('nameKey', Tool.change_alias(req.body.title), Post, function(result){
                callback(null, result);
            })
        },
    }, function(err, results){
        Post.findOne({idCategory : id, postType : 0}).exec(function(err, doc){
            if(!doc){
                var item = {
                    nameKey: results.getNameKey,
                    idCategory : id,
                    idCategoryType : mongoose.Types.ObjectId(req.body.idCategoryType),
                    postType : 0,
                    pictures : req.body.imgs,
                }
                Post.create(item, function(err, result){
                    var postContent = {
                        idPost : result._id,
                        nameKeyPost: results.getNameKey,
                        title : req.body.title,
                        content : req.body.content,
                    }
                    PostContent.create(postContent, function(err, result){
                        res.json({status: true, mes : "Sửa danh mục thành công"});
                    })
                })
            }else{
                if(Tool.change_alias(req.body.title) == doc.nameKey){
                    results.getNameKey = doc.nameKey;
                }
                Post.findOneAndUpdate({_id : doc._id}, {nameKey : results.getNameKey, pictures : req.body.imgs} ).exec(function(err, post){
                    
                });
                PostContent.findOneAndUpdate({idPost : doc._id, languageCode : 'vn'}, {title : req.body.title, content : req.body.content} ).exec(function(err, postContent){
                    
                });
                res.json({status: true, mes : "Sửa danh mục thành công"});
            }
        })

    })
    
})

router.delete("/item/:id", function(req, res, next){
    var id = mongoose.Types.ObjectId(req.params.id);
    Promotion.findOne({_id : id}).exec(function(err, pro){
        if(err || pro == null) {
            res.json({status: false, mes : "Lỗi : không tìm thấy id"}); return;
        }else{
            Promotion.remove({_id : pro._id}).exec(function(err, result){
                if(err){
                    res.json({status: false, mes : "Xóa promotion thất bại"}); return;
                }else{
                    res.json({status: true, mes : "Xóa promotion thành công"}); return;
                }
                
            });
        }
    })
    
})

router.post("/uploadfile", function(req, res, next){
    console.log(req.body);
    req.body.imgs.forEach(element => {
        var base64Data = element.data.replace(/^data:image\/png;base64,/, "").replace(/^data:image\/jpeg;base64,/, "");
        var imageName = req.body.path + element.name;
        fs.writeFile(imageName, base64Data, 'base64', function(err) {
            console.log(err);
        });
    });
    res.json('fewầ')
})


router.get('/*', function (req, res, next) {
    res.render("layout/admin");
})



var getAllPromotion = function( callback){
    Promotion.aggregate([
        {
            $match: {},
        },
        { 
            $sort: {type: 1, datecreate: 1}
        },

    ], function(err, result){
        callback(result);
    })
}

module.exports = router


