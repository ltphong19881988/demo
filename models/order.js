// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var Order = new Schema ({
    idUser: { type: Schema.Types.ObjectId, ref: 'User' },
	idPost: { type: Schema.Types.ObjectId, ref: 'Post' },
	quantity : Number,
	price: Number,
	datecreate : { type : Date, default: Date.now },
	type : Number, // 0: just create, 
});
var Order = mongoose.model('Order', Order);
module.exports = Order ;

module.exports.Init = function(){
	Order.findOne({name:'member'}, function(err, rolefinded){
		if (err)throw err;

		if (!rolefinded) {
			var member = new Role({ 
				name: 'member', 
				des: 'member basic',
				priority: 1 
			});
			// save the sample user
			member.save(function(err) {
				if (err) throw err;
				console.log('Role member saved successfully');
			});
		} else if (rolefinded) {	
			console.log(' Role member is existed.');
		}
	});
	
	Role.findOne({name:'admin'}, function(err, rolefinded){
		if (err)throw err;

		if (!rolefinded) {
			var admin = new Role({ 
				name: 'admin', 
				des: 'admin basic',
				priority: 0
			});
			// save the sample user
			admin.save(function(err) {
				if (err) throw err;
				console.log('Role admin saved successfully');
			});
		} else if (rolefinded) {	
			console.log(' Role admin is existed.');
		}
	});
	
	
}

