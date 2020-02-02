// Primary file for API

//dependencies
var server = require('./lib/server');
// var http = require('http');
// var fs = require("fs");

//declare the app
var app = {};

app.init=function(){
	//start the server and workers
	server.init();
	
};

app.init();

module.exports = app;


// //this will serve the initial html static page 
// http.createServer(function(request, response) {
// 	fs.readFile("./frontend/index.html", function(err, data){
// 	  response.writeHead(200, {'Content-Type': '*/*'});
// 	  response.write(data);
// 	  response.end();
// 	});
// }).listen(3002);
