// Create and Export configuration 	variables

//container for all environments
var environments = {};

//staging object default
environments.staging = {
	'httpPort' : 3000,
	'httpsPort' : 3001,
	'envName' : 'staging',
	'hashingSecret' : 'aSecretKey'


};

//production object
environments.production = {
	'httpPort' : 5000,
	'httpsPort' : 5001,
	'envName' : 'production',
	'hashingSecret' : 'aSecretKey'

};

//determine which to export from cmdline
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//check that the env is one of the environments keys
var environmentToExport = typeof(environments[currentEnvironment])=='object'? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;