//request handlers

//dependencies
const _data = require('./mongoData');
const helpers = require('./helpers');
const config = require('./config');
const path = require('path');
const _mongo = require('./mongoData');

var handlers = {};

//define users
handlers.users = function(data,callback){
	//we don't accept any other methods in this route
	var acceptableMethods = ['','get','post','put','delete'];
	if(acceptableMethods.indexOf(data.method)){
		handlers._users[data.method](data,callback);
	} else{
		callback(405);
	}
};

//container _users indicates that it is a private function of users
// and not something someone will call directly from this library
handlers._users = {};

//compulsory fields: firstName lastName phone password tosAgreement

//_users post
handlers._users.post = function(data,callback){
	//bite that payload has all fields
	var firstName = typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length>0 ? data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length>0 ? data.payload.lastName.trim() : false;
	var phone = typeof(data.payload.phone)=='string'? data.payload.phone.trim() : false;
	var password = typeof(data.payload.password)=='string' && data.payload.password.trim().length>0 ?data.payload.password.trim():false;
	var tosAgreement = typeof(data.payload.tosAgreement)=='boolean' && data.payload.tosAgreement==true ? true :false;
	
	if(firstName && lastName && phone && password && tosAgreement){
		//make sure he does not exist
		 _mongo.read('users',phone,function(err,data){
		 	console.log("checking already exists");
			if(err){
				//hash the password
				var hashedPassword = helpers.hash(password);

				// making user object only if password got hashed
				if(hashedPassword){
					var userObject = {
						'firstName' : firstName,
						'lastName' : lastName,
						'phone' : phone,
						'hashedPassword' : hashedPassword
					};

				//store the user on disk
					_mongo.create('users',phone,userObject,function(err){
						if(!err){
							console.log("about to return success");
							callback(200,userObject);
							console.log("returned success");
						} else {
							callback(500,{'error':'cannot insert into collection'})
						}
					});
					// _data.create('users',phone,userObject, function(err){
					// 	if(!err){
					// 		callback(200);
					// 	} else {
					// 		console.log(err);
					// 		callback(500,{'error':'cannot create new user'});
					// 	}
					// });
				} else {
					callback(500,{'error':'cannot hash password'});
				}

			 } else {
			 	console.log("does not exist");
			 	callback(400,{'error':'phone no. already exists'});
			 	console.log("callback with error done")
			 }
		 });
	} else {
		callback(400,{'error':'missing compulsory fields'});
	}

};


//_users get
// compulsory data is phone
// ONLY LET USERS ACCESS THEIR OWN DATA
handlers._users.get = function(data,callback){
	//get has no payload
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length <= 10 ?data.queryStringObject.phone.trim():false;
	console.log("checking phone",phone);
	if(phone){
		console.log('phone success will get token now');
		//get the token from the header
		var token = typeof(data.headers.token)=='string' ? data.headers.token: false;
		console.log("got token",token);
		//verify the token
		handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				//bite if user exists
				console.log('token is valid');
				_data.read('users',phone,function(err,data){
					if(!err && data){
						console.log('no err in reading and data is returned \n calling back');
						//remove hashed password
						delete data.hashedPassword;
						callback(200,data);
						//this is data returned by read function
					} else{
						console.log('err was :',err,' \ndata was :',data);
						callback(404) ;
					}
				});
			} else {
				callback(403,{'error':'missing or invalid token in header'});
			}
		});

	} else{
		callback(400, {"error":"missing phone number"})
	}
};

//_users put 
//compulsory is phone where to update
//optional is firstName lastName password ( at least one ) which to update
// ONLY LET USERS UPDATE THEIR OWN DATA
handlers._users.put = function(data,callback){
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length <= 10 ?data.payload.phone.trim():false;
	//optional fields
	var firstName = typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length>0 ? data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length>0 ? data.payload.lastName.trim() : false;
	var password = typeof(data.payload.password)=='string' && data.payload.password.trim().length>0 ?data.payload.password.trim():false;
	//phone compulsory valid
	if(phone){
		if(firstName || lastName|| password){

			//get token
			var token = typeof(data.headers.token)=='string' ? data.headers.token: false;

			//verify the token

			handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
				if(tokenIsValid){
					//lookup if user exists
					_data.read('users',phone,function(err,userData){
						if(!err && userData){

							if(firstName){
								userData.firstName = firstName;
							}
							if(lastName){
								userData.lastName = lastName;
							}
							if(password){
								userData.hashedPassword = helpers.hash(password);
							}
							//make storage persistent
							_data.update('users',phone,userData,function(err){
								if(!err){
									callback(200);
								} else {
									console.log(err);
									callback(500,{'errror':'server cannot update user'})
								}
							});

						} else{
							callback(400, {"error":"user does not exist"});
						}	
					});

				} else {
					callback(403,{'error':'missing or invalid token in header'});
				}
			});

		} else{
			callback(400, {"error":"missing field to update"});

		}
	} else {
		callback(400, {"error":"missing phone number"})

	}
};


//_users delete
//only delete own account
//cleanup all users files
handlers._users.delete = function(data,callback){
  // bite that phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length <= 10 ? data.queryStringObject.phone.trim() : false;
  console.log('inside _users delte where phone  = ',phone);
  if(phone){

	//get token
	var token = typeof(data.headers.token)=='string' ? data.headers.token: false;

	//verify the token
	console.log('time to verify the token ',token);
	handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
		if(tokenIsValid){
			console.log('time to read for user (this should return no data and error)')
			// Lookup the user
		    _data.read('users',phone,function(err,userData){
		    	console.log('\n\nerr when reading for delete ',err,'\n\ndata of deleting ',userData);
		      if(!err && userData){
		        _data.delete('users',phone,function(err){
		        	console.log('delte function callback with err = ',err);
		          if(!err){
		          	//delete all related bites
		          	var userbites = typeof(userData.bites) == 'object' && userData.bites instanceof Array ? userData.bites : [];
		          	var bitesToDelete = userbites.length;

		          	if(bitesToDelete>0){
		          		var bitesDeleted = 0;
		          		var deletionErrors = false;

		          		//loop all bites
		          		userbites.forEach(function(biteId){
		          			_data.delete('bites',biteId,function(err){
		          				if(err){
		          					deletionErrors = true;
		          				} 
		          				bitesDeleted++;
		          				if(bitesDeleted == bitesToDelete){
		          					if(!deletionErrors){
		          						callback(200);
		          					} else {
		          						callback(500,{'error':'problem attempting to delete bites'});
		          					}

		          				}
		          			});
		          		});
		          	} else{
		          		callback(200);
		          	}
		          } else {
		            callback(500,{'Error' : 'Could not delete the specified user'});
		          }
		        });
		      } else {
		        callback(400,{'Error' : 'Could not find the specified user.'});
		      }
		    });

		} else {
			callback(403,{'error':'missing or invalid token in header'});
		}
	});
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};


//define tokens
handlers.tokens = function(data,callback){
	//we don't accept any other methods in this route
	var acceptableMethods = ['','get','post','put','delete'];
	if(acceptableMethods.indexOf(data.method)){
		handlers._tokens[data.method](data,callback);
	} else{
		callback(405);
	}
};

//container for private tokens
handlers._tokens = {};

//post tokens
//compulsory data phone and password
handlers._tokens.get = function (data , callback){
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length <= 10 ?data.queryStringObject.phone.trim():false;
	var password = typeof(data.queryStringObject.password)=='string' && data.queryStringObject.password.trim().length>0 ?data.queryStringObject.password.trim():false;
	if(phone && password){
		//find that user
		_data.read('users',phone,function(err,userData){
			console.log(" to post token i am first reading so \n we get err :",err,"userData returned:",userData);
			if(!err && userData){
				//hash and compare
				var hashedPassword = helpers.hash(password);
				if(hashedPassword == userData.hashedPassword){
					//make a tokens which expires in 1hr
					var tokenId = helpers.createRandomString(20);
					var expires = Date.now() + 1000*60*60;

					var tokenObject = {
						'phone' : phone,
						'tokenId' : tokenId,
						'expires' : expires
					};

					//store the tokens
					_data.create('tokens',tokenId,tokenObject,function(err){
						if(!err){
							callback(200,tokenObject);
						} else {
							callback(500,{'error':'cannot create the tokens'})
						}
					});
				} else{
					callback(400,{'error':'password did not match'});
				}
			} else {
				callback(400,{'error':'cannot find the phone'});
			}
		});
	} else {
		callback(400, {'error':'missing phone or password'});
	}
};

//get tokens
//compulsory is id
// handlers._tokens.get = function (data , callback){
//   var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 19 ?data.queryStringObject.id.trim():false;
// 	if(id){
// 		//bite if user exists
// 		_data.read('tokens',id,function(err,tokenData){
// 			if(!err && tokenData){
// 				callback(200,tokenData);
// 			} else{
// 				callback(404) ;
// 			}
// 		})
// 	} else{
// 		callback(400, {"error":"missing id"})
// 	}
// };

//put tokens
//compulsory id and extend keep a boolean to increase time by fixed amount
handlers._tokens.put = function (data , callback){
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 19 ?data.payload.id.trim():false;
	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true :false;
	
	if(id && extend){
		_data.read('tokens',id,function(err,tokenData){
			if(!err && tokenData){
				//bite tokens not expires
				if(tokenData.expires > Date.now()){ 
					//set one hour more 
					tokenData.expires = Date.now() + 1000*60*60;
					
					_data.update('tokens',id,tokenData,function(err){
						if(!err){
							callback(200);
						} else{
							callback(500,{'error':'could not update the expires'})
						}
					});
				} else {
					callback(400,{'error':'tokens has already expires'});
				}
			} else {
				callback(400,{'error':'tokens not found'});
			}
		});
	} else {
		callback(400,{'error':'wrong id or extend'});
	}
};

//delete tokens
// compulsory is id
handlers._tokens.delete = function (data , callback){
	// bite that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 19 ?data.queryStringObject.id.trim():false;
    if(id){
	    // Lookup the tokens
	    _data.read('tokens',id,function(err,data){
	      if(!err && data){
	        _data.delete('tokens',id,function(err){
	          if(!err){
	            callback(200);
	          } else {
	            callback(500,{'Error' : 'Could not delete the specified tokens'});
	          }
	        });
	      } else {
	        callback(400,{'Error' : 'Could not find the specified tokens.'});
	      }
	    });
    } else {
        callback(400,{'Error' : 'Missing required parameter'})
  }
};

//verify if tokenId is valid for a user
handlers._tokens.verifyToken= function(id,phone,callback){
	//lookup
	console.log('inside verify function now\n ',)
	_data.readToken('tokens',id,function(err,tokenData){
		console.log('reading token',err,tokenData);
		if(!err && tokenData){
			if(tokenData.phone == phone && tokenData.expires>Date.now()){
				callback(true);
			} else {
				callback(false);
			}
		} else {
			callback(false)
		}
	});
};


//define bites
handlers.bites = function(data,callback){
	//we don't accept any other methods in this route
	var acceptableMethods = ['','get','post','put','delete'];
	if(acceptableMethods.indexOf(data.method)){
		handlers._bites[data.method](data,callback);
	} else{
		callback(405);
	}
};

//container for all bites methods
handlers._bites = {};

//bites post
//compulsory protocol, url, method, successCodes, timeoutSeconds

handlers._bites.post = function(data,callback){
	//validate inputs
	var text = typeof(data.payload.text) == 'string' && data.payload.text.length > 0 ? data.payload.text : false;
	//var date = new Date();
	

	if(text){
		//get token and verify it
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		//bite the user from the token
		_data.readToken('tokens',token,function(err,tokenData){
			console.log("inside tokens post err is ",err,"tokenData is ",tokenData);
			if(!err && tokenData){
				var userPhone = tokenData.phone;
				//lookup user
				_data.read('users',userPhone,function(err,userData){
					if(!err && userData){
						var userbites = typeof(userData.bites) == 'object' && userData.bites instanceof Array ? userData.bites : [];
						
						//if(userbites.length<config.maxbites){
							//make a random id for the bites
							var biteId = helpers.createRandomString(20);

							//bite object with phone
							var biteObject = {
								'id' : biteId,
								'userPhone' : userPhone,
								'text' : text,
								'author' : userData.firstName
							};

							//save this object
							_data.create('bites',biteId,biteObject,function(err){
								if(!err){
									//add biteId to userData
									userData.bites = userbites;
									userData.bites.push(biteId);

									//save the new userData
									_data.update('users',userPhone,userData,function(err){
										if(!err){
											//return new bite data to requester
											callback(200,biteObject);
										} else {
											callback(500,{'error':'cannot update user with new bite'});
										}
									});
								} else {
									callback(500,{'error':'cannot create the new bite'})
								}
							});
						// } else {
						// 	callback(400,{'error':'maxbites is '+ config.maxbites + ' per user'});
						// }
					} else {
						callback(403);
					}
				});
			} else {
				callback(403)
			}
		});
	} else {
		callback(400,{'error':'missing or invalid bite inputs'});
	}

};


//get bites
//compulsory id in queryStringObject
handlers._bites.get = function(data,callback){
	//get has no payload
	//var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 19 ?data.queryStringObject.id.trim():false;
	//if(id){
		//lookup who made the bites and whose is it
		_data.readAll('bites',"o959kub33ll9moaoz28",function(err,biteData){
			if(!err && biteData){
				//get the token from the header
				//var token = typeof(data.headers.token)=='string' ? data.headers.token: false;

				//verify the token is valid and belongs to user who made the bite
				//handlers._tokens.verifyToken(token,biteData.userPhone,function(tokenIsValid){
					//if(tokenIsValid){
						//give user the bite data
						callback(200,biteData);
					//} else {
					//	callback(403,{'error':'missing or invalid token in header'});
					//}
				//});

			} else {
				callback(404)
			}
		});
	// } else{
	// 	callback(400, {"error":"missing id for bites"});
	// }
};


//bite put
//id is compulsory and any other one they have to send which they want to change
handlers._bites.put= function(data, callback){
	//compulsory field
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 19 ?data.payload.id.trim():false;
	
	var text = typeof(data.payload.text) == 'string'  ? data.payload.text : false;

	//id is valid
	if(id){
		//one of the optional fields
		if(text){
			//lookup the bite
			_data.read('bites',id,function(err , biteData){
				if(!err &&biteData){
					//get the token from the header
					var token = typeof(data.headers.token)=='string' ? data.headers.token: false;

					//verify the token is valid and belongs to user who made the bite
					handlers._tokens.verifyToken(token,biteData.userPhone,function(tokenIsValid){
						if(tokenIsValid){
							//update bite
							biteData.text = text;

							//store the updates
							_data.update('bites',id,biteData,function(err){
								if(!err){
									callback(200);
								} else {
									callback(500,{'error':'cannot update the bite'})
								}
							});
						} else {
							callback(403,{'error':'missing or invalid token in header'});
						}
					});
				} else {
					callback(400,{'error':'biteId not found'});
				}
			});
		} else {
			callback(400, {"error":"missing fields for update bites"});
		}
	} else{
		callback(400, {"error":"missing id for bites"});
	}

};

// handlers.allBites = function(callback){

// 	var totalBites = [];
// 	_data.list('bites',function(err,listOfAllBites){
// 		if(!err && listOfAllBites){
// 			for (var k = 0 ; k < listOfAllBites.length ; k++){
// 				_data.read('bites',listOfAllBites[k],function(err, biteData){
// 					if(!err && biteData){
// 						totalBites[k] = biteData;
// 						console.log(biteData);
// 						console.log(totalBites[k]);
// 					} else{
// 						callback('irrelevant biteId');
// 					}
// 				});
// 			}
// 			callback(totalBites);
			
// 		} else{
// 			callback('No list could be made :(');
// 		}
// 	});
// 	return totalBites;
// };

// handlers.listAllBites = function(ata,callback){

//   var data = {};
//   var base =path.join(__dirname,'/../.data/');
//   _data.readBiteFiles(base+'bites'+'/', function(filename, content) {
//     data[filename] = content;
//     // console.log(content);
//     // console.log(data[filename])
//     callback(200,data);
//   }, function(err) {
//     callback(404);
//     // throw err;
//   });

  
// };

//bites delete with id
handlers._bites.delete = function(data,callback){
  // bite that phone number is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 19 ? data.queryStringObject.id.trim() : false;
  if(id){

  	//lookup the bite
  	_data.read('bites',id,function(err , biteData){
		if(!err &&biteData){

			//get token
			var token = typeof(data.headers.token)=='string' ? data.headers.token: false;

			//verify the token

			handlers._tokens.verifyToken(token,biteData.userPhone,function(tokenIsValid){
				if(tokenIsValid){
					//delete that bite
					_data.delete('bites',id,function(err){
						if(!err){
							// Lookup the user
						    _data.read('users',biteData.userPhone,function(err,userData){
						        if(!err && userData){
						        	//what are his bites
									var userbites = typeof(userData.bites) == 'object' && userData.bites instanceof Array ? userData.bites : [];

									//remove the deleted bite from their list of bites
									var bitePosition  = userbites.indexOf(id);
									if(bitePosition>-1){
										userbites.splice(bitePosition,1);
										//save the update
										_data.update('users',biteData.userPhone,userData,function(err){
									        if(!err){
									            callback(200);
									        } else {
									            callback(500,{'Error' : 'Could not update the user'});
									        }
									    });
									} else {
										callback(500,{'Error' : 'Could not find bite on user so could not remove it'});
									}
							        
						        } else {
						        	callback(500,{'Error' : 'Could not find user who made the bite'});
						        }
						    });
						} else {
							callback(500,{'error':'cannot delete the bite'});
						}
					});
				} else {
					callback(403,{'error':'missing or invalid token in header'});
				}
			});



		}else{
			callback(400,{'error':'biteId not found'})
		}
	});


  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};


//ping service
handlers.ping = function(data, callback){
	callback(200);
};

//not found handlers
handlers.notFound = function(data, callback){
	//callback has a http code and payload
	callback(404);
};

module.exports = handlers;
