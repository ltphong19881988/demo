// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var speakeasy = require('speakeasy');
var passwordHasher = require('aspnet-identity-pw');
var Role   = require('./role');
const websiteName = "toc.vn";
// var UserRole   = require('./userrole');

// set up a mongoose model and pass it using module.exports
var UserSchema = new Schema ({
	username: { type: String, unique: true, required: true },
	email : { type: String, unique: true, required: true },
	password: String, 
	first_name: String, 
	last_name: String,
	name : String,
	fullname: String, 
	phone : String,
	sponsor : String,
	idSponsor : { type: Schema.Types.ObjectId, ref: 'User' },
	sponsorAddress : String,
	sponsorLevel : Number,
	birthday : { type : Date, default: Date.now },
	datecreate : { type : Date, default: Date.now },
	idCountry : { type: Schema.Types.ObjectId, ref: 'Country' },
	roles : [{ type: Schema.Types.ObjectId, ref: 'Role' }], 
	free : { type : Number, default: 1 },
	avatar : { type : String, default: "/uploads/img/no-avatar.png" },
	code : Number,
	parentCode : Number,
	lock : { type : Boolean, default: false },
	lockWithdraw : { type : Boolean, default: false },
	smsOTP : { type : String, default: "" },
	enable2fa : { type : Boolean, default: false },
	secret2fa : {},
	facebook : {},
});

UserSchema.pre('save', function(next){
	var user = this ;
	User.find({$or:[{username: user.username}, {email: user.email}]}, function(err, users){
		if(err) {
			return next(err);
		} else if(users.length > 0) {
			// if (users.find( {email: user.email})){
			// 	user.invalidate('email', 'email is already registered'); 
			// 	next( new Error("email is already registered"));
			// }
			// else if (users.find(users , {username: user.username})){
			// 	user.invalidate('username', 'username is already taken'); 
			// 	next( new Error("username is already taken"));
			// }
			//return next( new Error("username or email is already registered"));
			return next()
		}
		else{
			next();				
		}   
	})
})

var User = mongoose.model('User', UserSchema);
module.exports = User;

module.exports.addUser = function (item, callback) {
	  //implementation code goes here
	async.parallel({
		checkUsername : function(callback){
			User.findOne({username : item.username}).exec(function(err, userfinded){
				if(userfinded == null ) callback(null, true);
				else callback (null, false);
			})
		},
		checkEmail : function(callback){
			User.findOne({email : item.email}).exec(function(err, userfinded){
				if(userfinded == null ) callback(null, true);
				else callback (null, false);
			})
		}
    }, function(err, results){
		if(!results.checkUsername){
			callback({status: false, mes: "username is existed"});
			return;
		}
		if(!results.checkEmail){
			callback({status: false, mes: "email is existed"});
			return;
		}
		var abc = speakeasy.generateSecret({name: websiteName, issuer: item.username, length: 20});
		console.log('pass', item.password);
		console.log('user ne', passwordHasher.hashPassword(item.password));
		var user = new User({ 
			username: item.username, 
			email : item.email,
			password: passwordHasher.hashPassword(item.password),
			first_name: item.first_name, 
			last_name: item.last_name,
			name : item.name,
			fullname : item.fullname,
			phone : item.phone,
			sponsor : item.sponsor,
			idSponsor : item.idSponsor,
			sponsorAddress : item.sponsorAddress,
			sponsorLevel : item.sponsorLevel,
			birthday : item.birthday,
			datecreate : item.datecreate,
			idCountry : item.idCountry,
			roles : item.roles,
			code : item.code,
			parentCode : item.parentCode,
			secret2fa : abc,
			facebook : item.facebook,
		}); 
		console.log('chuan bi save ne', user);
		user.save(function(err, savedUser) {
			if (err) {
				// throw err;
				callback({status: false, mes: "error", err : err});
			}
			else {
				if(!savedUser){
					callback({status: false, mes: "can't save user"});
				}else{
					callback({status: true, mes: "user saved", user : savedUser});
				}
			}
		});

    })

}


module.exports.checkUsername = function(str, callback){
	User.findOne({username : str}, function(err, userfinded){
		if(userfinded == null){
			callback(false);
		} else if (userfinded){
			callback(true);
		}
	});
}

module.exports.GetUserByUsername = function(str, callback){
	User.findOne({username : str}, function(err, userfinded){
		if(err){
			throw err;
		}
		if(!userfinded){
			callback({status: false, user : null});
		} else if (userfinded){
			callback({status: true, user : userfinded});
		}
	}).populate("roles");
}

module.exports.GetUserByEmail = function(str, callback){
	User.findOne({email : str}, function(err, userfinded){
		if(err){
			throw err;
		}
		if(!userfinded){
			callback({status: false, user : null});
		} else if (userfinded){
			callback({status: true, user : userfinded});
		}
	}).populate("roles");
}

module.exports.GetUserByID = function(str, callback){
	// console.log("id", str);
	User.findOne({_id : str}, function(err, userfinded){
		if(err){
			throw err;
		}
		if(!userfinded){
			callback({status: false, user : null});
		} else if (userfinded){
			callback({status: true, user : userfinded});
		}
	}).populate("roles");
}

module.exports.GetUserByCoinAddress = function(walletType, address, callback){
	User.findOne().where(walletType + 'Address', address).populate('roles').exec(function(err, result) {
		if(err || result == null){
			callback({status : false, user : null});
		}else{
			callback({status : true, user : result._doc});
		}
	});
}

module.exports.CountSponsorDownline = function(str, callback){
	User.count({sponsor : str}, function(err, count){
		if(err){
			throw err;
		}
		callback(count);
	});
}

//db.users.find({name: /a/})  //like '%a%'
//db.users.find({name: /^pa/}) //like 'pa%' 
//db.users.find({name: /ro$/}) //like '%ro'
module.exports.ListSponsorDownline = function(str, callback){
	var abc = { $regex : '^' + str + '-'};
	User.find({sponsorAddress : abc}).sort({sponsorAddress : 1}).exec(function(err, userfinded){
		if(err){
			throw err;
		}
		if(!userfinded){
			callback({status: false, listuser : null});
		} else if (userfinded){
			callback({status: true, listuser : userfinded});
		}
	});
}

module.exports.ListF1 = function(str, callback){
	User.find({sponsor : str}, function(err, userfinded){
		if(err){
			throw err;
		}
		if(!userfinded){
			callback({status: false, listuser : null});
		} else if (userfinded){
			// for(var i = 0; i < userfinded.length; i ++){
			// 	userfinded[i].phone = '907095482059';
			// }
			callback({status: true, listuser : userfinded});
		}
	});
}

module.exports.UpdateUser = function (id, setField, callback){
	var query = {
		_id : id,
	};
	User.update(query, setField, {upsert: true}, function(err, up){
		callback(err, up);
	})
}

module.exports.checkEmail = function(str, callback){
	User.findOne({email : str}, function(err, emailfinded){
		if(err){
			throw err;
		}
		if(!emailfinded){
			callback(false);
		} else if (emailfinded){
			callback(true);
		}
	});
}

module.exports.AutoComplete = function(str, callback){
	//User.find({username : {'$regex' : str, '$options' : 'i'}}, function(err, listfinded){
	User.find({username : new RegExp(str, 'i')}, function(err, listfinded){
		if(err){
			throw err;
		}
		if(!listfinded){
			callback(null);
		} else if (listfinded){
			callback(listfinded);
		}
	}).select('username');
}

module.exports.GetPoint = function(iduser, callback){
	//User.find({username : {'$regex' : str, '$options' : 'i'}}, function(err, listfinded){
	User.findOne({_id : iduser}, function(err, finded){
		if(err){
			throw err;
		}
		if(!finded){
			callback(0);
		} else if (finded){
			callback(finded.point);
		}
	}).select('point');
}

