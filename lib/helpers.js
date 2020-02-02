//various tasks

//dependencies
const crypto = require('crypto');
const config = require('./config');
//to send a request to an https api endpoint
const https = require('https');
const querystring = require('querystring');

//container
var helpers = {};

//SHA256 function
helpers.hash = function(str){
	if(typeof(str) == 'string' && str.length>0){
		var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
		return hash;
	} else {
		return false;
	}
};

//json of a string default function trhows error not false
helpers.parseJsonToObject = function(str){
	try{
		var obj = JSON.parse(str);
		return obj;
	} catch(e){
		return {};
	}
};

helpers.createRandomString = function(strLength){
	strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength: false;
	if(strLength){
		var possibleCharacters ='qwertyuiopasdfghjklmnbvcxz0987654321';

		var str = '';

		for( i = 1 ; i<strLength;i++){
			randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length ));
			str+=randomCharacter;
		}

		return str;
	} else {
		return false;
	}
};


helpers.sendTwilioSms = function(phone,msg,callback){
	//validate
	phone = typeof(phone) == 'string' && phone.trim().length <= 10 ? phone.trim() : false;
	msg =  typeof(msg) == 'string' && msg.trim().length >0 && msg.trim().length < 1600 ? msg.trim() : false;

	if(phone && msg){
		//configure a req payload to send to twilio
		var payload = {
			'From' : config.twilio.fromPhone,
			'To' : '+91'+phone,
			'Body' : msg
		};

		//stringify payload and configure requestDetails
		var stringPayload = querystring.stringify(payload);

		var requestDetails = {
			'protocol' : 'https:',
			'hostname' : 'api.twilio.com',
			'method' : 'POST',
			'path' : '2010-01-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
			'auth' : config.twilio.accountSid +':'+config.twilio.authToken,
			'headers' : {
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Content-Length' : Buffer.byteLength(stringPayload)
			}
		};

		//instantiate a req object
		var req = https.request(requestDetails,function(res){
			//get the status of req
			var status = res.statusCode;
			//callback to original caller if req went through
			if(status == 200 || status == 201){
				callback(false);
			} else {
				callback('statusCode returned was : '+status);
			}
		});

		//bind to error event so it does not get thrown and kill the thread
		req.on('errror',function(e){
			callback(e);
		});

		//add the payload
		req.write(stringPayload);

		//end or send the req

		req.end();
	} else {
		callback('invalid parameters')
		//following the err back pattern
	}
};


module.exports = helpers;











