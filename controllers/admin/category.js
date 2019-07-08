
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
var Post = require('../../models/post');
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

router.get("/all-category", function(req, res, next){
    var options = {};
    if(req.query.idParent){
        options.idParent = mongoose.Types.ObjectId(req.query.idParent);
    }
    getAllCategory(options, function(results){
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

router.post("/add-category", function(req, res, next){
    console.log(req.body);
    if(!req.body.name || req.body.name == ''){
        res.json({status: false, mes : "Chưa nhập tên danh mục"}); return;
    }
    var idParent = null;
    if(req.body.idParent && req.body.idParent != '')
        idParent = mongoose.Types.ObjectId(req.body.idParent);
    var cate = {
        name: req.body.name,
        idParent : idParent,
        idCategoryType : mongoose.Types.ObjectId(req.body.idCategoryType),
        priority: parseInt(req.body.priority) + 1,
    }
    Tool.getUniqueNameKey('nameKey', Tool.change_alias(req.body.name), Post, function(nameKey){
        Category.create(cate, function(err, results){
            // console.log(err, results);
            var post = {
                nameKey: nameKey,
                idCategory : results._id,
                idCategoryType : results.idCategoryType,
                postType : 0,
                pictures : [],
            }
            Post.create(post, function(err, result){
                var postContent = {
                    idPost : result._id,
                    title : results.name,
                    content : '',
                }
                PostContent.create(postContent, function(err, result){
                    res.json({status: true, mes : "Thêm danh mục thành công", results : results});
                })
            })
            
        })
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

router.delete("/:id", function(req, res, next){
    console.log(req.params.id);
    var id = mongoose.Types.ObjectId(req.params.id);
    Category.findOne({_id : id}).exec(function(err, cate){
        if(!cate) {
            res.json({status: false, mes : "Lỗi : không tìm thấy id category"}); return;
        }else{
            Post.findOne({idCategory : cate._id, postType : 0}).exec(function(err, post){
                if(post){
                    PostContent.deleteMany({nameKeyPost : post.nameKey}).exec(function(){});
                    Post.remove({_id : post._id}).exec(function(err, result){
                        console.log(err, result);
                        res.json({status: true, mes : "Xóa category thành công"}); return;
                    });
                }else{
                    Category.remove({_id : id}).exec(function(err, result){
                        console.log(err, result);
                        res.json({status: true, mes : "Xóa category thành công"}); return;
                    })
                }
            })
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



var getAllCategory = function(options, callback){
    Category.aggregate([
        {
            $match: options,
        },
        { 
            $sort: {idCategoryType: 1, idParent: 1, priority:1}
        },
        {
            $lookup:
            {
                from: "categorytypes",
                localField: "idCategoryType",
                foreignField: "_id",
                as: "categoryType"
            },
        },
        { $unwind : "$categoryType" },
        {
            $project: {
                "categoryType": 1,
                "_id": 1,
                "name": 1,
                "priority": 1,
                "idParent": 1,
                "datecreate": 1,
            }
        },

    ], function(err, result){
        callback(result);
    })
}

module.exports = router


