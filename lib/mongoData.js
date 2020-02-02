// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');
var mongoClient = require('mongodb').MongoClient;
//TO start on terminal a mongoDB port "mongod -dbpath C:\MyNodeJSConsoleApp\MyMongoDB"

// Container for module (to be exported)
var lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../mongo/data/');


// Write data to a file
lib.create = function(dir,phone,data,callmeback){
 
 	// Connect to the db
	mongoClient.connect("mongodb://localhost:27017/mongo", function (err, db) {
		var database = db.db('mydb');
   		// if(!err){
   			database.collection(dir,function(err, collection){
				collection.insertOne(data);
				console.log('insert successful by');

				callmeback(false);
				console.log("inserted by create");
			});
   		// } else {
   		// 	callmeback('error connecting to db');
   		// }                
	});

};


lib.update = function(dir,phone,data,callmeback){

	// Connect to the db
	mongoClient.connect("mongodb://localhost:27017/mongo", function (err, db) {
		var database = db.db('mydb');

		if(!err){
   			database.collection(dir,function(err, collection){
				collection.updateOne({phone:phone},{ $set : data },{w:1},function(err,result){
					if(!err){
						console.log('update successful');
						callmeback(false);
					} else {
						callmeback('error in updating db');
					}
				});
				//callmeback(false);
			});
   		} else {
   			callmeback('error connecting to db');
   		}           
	});
}

lib.delete = function(dir,phone,callmeback){
	// Connect to the db
	mongoClient.connect("mongodb://localhost:27017/mongo", function (err, db) {
		var database = db.db('mydb');
		if(!err){
   			database.collection(dir,function(err, collection){
				collection.removeOne({phone:phone},{w:1},function(err,result){
					if(!err){
						console.log('delete successful');
						callmeback(false);
					} else {
						callmeback('error in deleting from db');
					}
				});
				//callmeback(false);
			});
   		} else {
   			callmeback('error connecting to db');
   		}           
	});
}

lib.read = function(dir,phone,callmeback){

	// Connect to the db
	mongoClient.connect("mongodb://localhost:27017/mongo", function (err, db) {
	    var database = db.db('mydb');
	    var i = 0;

	    database.collection(dir, function (err, collection) {
	         
	         collection.find({ 'phone' : phone }).forEach(function(x){
	         	//console.log("found it ",x);
	         	// found = true;
	         	if(i===0){
	         		console.log("\n\ny u not working\n\nlet me callmeback");
	         		callmeback(false,x);
	         		console.log("\n\nfinished callmeback\n\n");
	         		
	         	}
	         	i++;
	         }).then(function(){
		         	if(i == 0){
		         		callmeback('no user found',{});
		        	}
	        	}
	         ); 
	    });
	                
	});
};

lib.readToken = function(dir,id,callmeback){

	// Connect to the db
	mongoClient.connect("mongodb://localhost:27017/mongo", function (err, db) {
	    var database = db.db('mydb');
	    var i = 0;
	    database.collection(dir, function (err, collection) {
	         console.log('reading tokenId');
	         collection.find({ 'tokenId' : id }).forEach(function(x){
	         	console.log('tokenId of '+id+' found!');
	         	//console.log("found it ",x);
	         	// found = true;
	         	if(i===0){
	         		console.log("\n\ny u not working\n\nlet me callmeback");
	         		callmeback(false,x);
	         		console.log("\n\nfinished callmeback\n\n");
	         	}
	         	i++;
	         }).then(function(){
	         	if( i == 0){
	         	callmeback('tokenId not found by readToken function');
	         } 
	         });
	             
	    });
	                
	});
};

lib.readAll = function(dir,phone,callmeback){

	// Connect to the db
	mongoClient.connect("mongodb://localhost:27017/mongo", function (err, db) {
	    var database = db.db('mydb');

	    database.collection(dir, function (err, collection) {
	        
	         collection.find().toArray(function(err, items) {
	         	if(!err){
	         		callmeback(false,items);
	         	}
	         	else{
		            callmeback('cannot find data in readAll',{});
	         	}	            
	        });
	        
	    });
	                
	});
};

module.exports = lib;

