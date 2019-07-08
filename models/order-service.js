// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var OrderService = new Schema ({
	idUser: { type: Schema.Types.ObjectId, ref: 'User' },
	username : String,
	listService : [],
	promotion : {} ,
	paymentInfo: {},
	startTime: Date,
	endTime: Date,
	totalPrice: Number,
	datecreate : { type : Date, default: Date.now },
	type : Number, // 0: just create, 
});
var OrderService = mongoose.model('OrderService', OrderService);
module.exports = OrderService ;

module.exports.Init = function(){
	
}

