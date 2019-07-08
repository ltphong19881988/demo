// get an instance of mongoose and mongoose.Schema
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config'); // get our config file
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
var InvestmentPackageSchema = new Schema ({
    name : {type : String, unique : true},
    min: Number,
    max: Number,
    sponsorBonus: Number,
    referralBonus : {},
    interest: Number, 
    extraBonus : {},
    capitalBack: Number,
    tradeBonus : Number,
    priority : {type : Number, unique : true}
});
var InvestmentPackage = mongoose.model('InvestmentPackage', InvestmentPackageSchema);
module.exports = InvestmentPackage ;

module.exports.Add = function(item, callback){
    var investPackage = new InvestmentPackage({
        min : item.min,
        max: item.max,
        sponsorBonus: item.sponsorBonus, 
        referralBonus: item.referralBonus,
        interest: item.interest,
        extraBonus : item.extraBonus,
        capitalBack : item.capitalBack,
        tradeBonus : item.tradeBonus,
        priority : item.priority,
    });

    investPackage.save(function(err, result) {
		if (err) {
            callback({status: false, result : null});
			throw err;
		}
		else {
            callback({status : true, result});
		}
	});
}

module.exports.Update = function(id, setFields, callback){
	var query = {
		_id : id,
	};
	InvestmentPackage.update(query, setField, {upsert: true}, function(err, up){
		if(err)
			callback({status : false, mes : err});
		callback({status : true, mes : 'update Country successfully'})
	})
}

module.exports.Delete = function(id, callback){
	InvestmentPackage.remove({ _id : id }, function(err) {
		if (!err) {
			callback({status : true, mes : 'delete Country successfully'});
		}
		else {
			callback({status : false, mes : err});
		}
	});
}

module.exports.Init = function( callback){
    var list = [];
    var item = {
        name : "Silver",
        min: 100,
        max: 1000,
        sponsorBonus: 7,
        referralBonus : {F2 : 4, F3 : 3, F4 : 1, F5 : 0.5, F6 : 0.2},
        interest: 0.6, 
        extraBonus : {min : 0.1, max : 0.15},
        capitalBack: 180,
        tradeBonus : 10,
        priority : 1,
    };
    list.push(item);
    item = {
        name : "GOLD",
        min: 1010,
        max: 5000,
        sponsorBonus: 7,
        referralBonus : {F2 : 4, F3 : 3, F4 : 1, F5 : 0.5, F6 : 0.2},
        interest: 0.62, 
        extraBonus : {min : 0.13, max : 0.2},
        capitalBack: 180,
        tradeBonus : 10,
        priority : 2,
    };
    list.push(item);
    item = {
        name : "RUBY",
        min: 5010,
        max: 10000,
        sponsorBonus: 7,
        referralBonus : {F2 : 4, F3 : 3, F4 : 1, F5 : 0.5, F6 : 0.2},
        interest: 0.64, 
        extraBonus : {min : 0.15, max : 0.25},
        capitalBack: 180,
        tradeBonus : 10,
        priority : 3,
    };
    list.push(item);
    item = {
        name : "DIAMOND",
        min: 10050,
        max: 30000,
        sponsorBonus: 8,
        referralBonus : {F2 : 5, F3 : 3, F4 : 1, F5 : 0.5, F6 : 0.2},
        interest: 0.66, 
        extraBonus : {min : 0.17, max : 0.27},
        capitalBack: 180,
        tradeBonus : 15,
        priority : 2,
    };
    list.push(item);
    item = {
        name : "BLUE DIAMOND",
        min: 30100,
        max: 50000,
        sponsorBonus: 8,
        referralBonus : {F2 : 5, F3 : 3, F4 : 1, F5 : 0.5, F6 : 0.2},
        interest: 0.68, 
        extraBonus : {min : 0.19, max : 0.29},
        capitalBack: 180,
        tradeBonus : 15,
        priority : 2,
    };
    list.push(item);

	InvestmentPackage.insertMany(list, function(err, docs) {
		if (!err) {
			callback({status : true, docs});
		}
		else {
			callback({status : false, err});
		}
	});
}

