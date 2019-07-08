// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var PostContent = new Schema ({
	idPost : { type: Schema.Types.ObjectId, ref: 'Post' },
	languageCode: { type: String,  default: 'vn' },
	title : { type: String },
	descriptions : String,
	content : String,
	seoKeyWord : String,
	seoDescriptions : String,

});
var PostContent = mongoose.model('PostContent', PostContent);
module.exports = PostContent ;

module.exports.Init = function(){	
	
	
}

