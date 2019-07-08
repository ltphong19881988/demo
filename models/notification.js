// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var Notification = new Schema ({
	title : String,
	body : String,
	data : {},
	isHTML : { type: Boolean, default: 'false' },
	// "data":{
	// 	"landing_page":"/tabs/account",
	// 	"price":"$3,000.00"
	//   },
	to : { type: String, default: '/topics/all' },
	datecreate : { type : Date, default: Date.now },
	startTime : Date,
	sendStatus : {type : Boolean, default : false },
	fcmResponse : {} ,
});

var Notification = mongoose.model('Notification', Notification);
module.exports = Notification ;

module.exports.Init = function(noti, callback){
	let item = {
		notification : {
			title : noti.title,
			body : noti.body,
			sound : 'default' ,
			click_action :  'FCM_PLUGIN_ACTIVITY' ,
			icon :  'notification_icon' ,
		},
		data : noti.data,
		// "data":{
		// 	"landing_page":"/tabs/account",
		// 	"price":"$3,000.00"
		//   },
		to : noti.to,
		priority : 'high' ,
		restricted_package_name : '' ,
	}
	callback (item);
}

