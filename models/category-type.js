// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var CategoryType = new Schema ({
    name: { type: String, unique: true, required: true },
    des: String, 
    priority: Number
});
var CategoryType = mongoose.model('CategoryType', CategoryType);
module.exports = CategoryType ;

module.exports.Init = function(){
	var listType = ['Sản phẩm', 'Dịch Vụ', 'Bài viết', 'Videos'];
	listType.forEach(element => {
		CategoryType.findOne({name: element}, function(err, CategoryTypefinded){
			if (err)throw err;
	
			if (!CategoryTypefinded) {
				var cateType = new CategoryType({ 
					name: element,
					des: 'category type',
					priority: listType.indexOf(element),
				});
				// save the sample user
				cateType.save(function(err) {
					if (err) throw err;
					console.log('CategoryType saved successfully');
				});
			} else if (CategoryTypefinded) {	
				console.log(' CategoryType is existed.');
			}
		});
	});
	

	
	
}

