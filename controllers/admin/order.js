
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
var OrderCart = require('../../models/order-cart');
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

router.post("/all-order-cart", function(req, res, next){
    console.log(req.body);
    getAllOrder( function(results){
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

router.get("/cart/:id", function(req, res, next){
    var id = mongoose.Types.ObjectId(req.params.id);
    OrderCart.aggregate([
        {
            $match: {_id : id},
        },
        {
            $lookup:
            {
                from: "users",
                localField: "idUser",
                foreignField: "_id",
                as: "userdetail"
            },
        },
        { $unwind : "$userdetail" },
    ], function(err, result){
        console.log(result);
        if(err || result.length == 0){
            res.json({status: false, mes : 'Không tìm thấy id'});
        }else{
            res.json({status : true, orderCart : result[0]});
        }
    })

})

router.put("/cart/:id", function(req, res, next){
    console.log(req.body);
    var id = mongoose.Types.ObjectId(req.params.id);
    OrderCart.findOne({_id: id}, function(err, order){
        if(err || order == null){
            res.json({status : false, mes : 'Cập nhật thất bại, không tìm thấy id'});
        }else{
            if(order.type == 1 && req.body.setField.type == false){
                return res.json({status : false, mes : 'Cập nhật thất bại, bạn không thể sửa đơn hàng bị hủy bởi người mua'});
            }
            if(order.type == 0 && req.body.setField.type == true) req.body.setField.type = 2 ;
            OrderCart.findOneAndUpdate({_id : id}, req.body.setField ).exec(function(err, post){
                if(err){
                    res.json({status : false, mes : 'Cập nhật thất bại'});
                }else{
                    res.json({status : true, mes : 'Cập nhật thành công'});
                }
            });
        }
    })
    
})

router.delete("/cart/:id", function(req, res, next){
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



router.get('/*', function (req, res, next) {
    res.render("layout/admin");
})



var getAllOrder = function( callback){
    OrderCart.aggregate([
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


