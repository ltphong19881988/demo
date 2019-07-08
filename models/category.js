// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var Category = new Schema ({
	name: { type: String, unique: true, required: true },
	nameKey: {type:String},
	idParent : { type: Schema.Types.ObjectId, ref: 'Category' },
	idCategoryType : { type: Schema.Types.ObjectId, ref: 'CategoryType' },
	des: String, 
	datecreate : { type : Date, default: Date.now },
    priority: { type : Number, default: 1 },
});
var Category = mongoose.model('Category', Category);
module.exports = Category ;

module.exports.ListTreeAllCategory = function(){
	Category.findOne({name:'member'}, function(err, Categoryfinded){
		if (err)throw err;

		if (!Categoryfinded) {
			var member = new Category({ 
				name: 'member', 
				des: 'member basic',
				priority: 1 
			});
			// save the sample user
			member.save(function(err) {
				if (err) throw err;
				console.log('Category member saved successfully');
			});
		} else if (Categoryfinded) {	
			console.log(' Category member is existed.');
		}
	});
	
}

var GetAllChildren = function(idParent){
	Category
}


