// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {
    var AWS = require('aws-sdk');
    var express = require('express');
    var bodyParser = require('body-parser');
	var passport = require('passport');
	var Strategy = require('passport-local').Strategy;
	var db = require('./db');

    AWS.config.region = process.env.REGION
	
	
	/*passport.use(new LocalStrategy(
	  function(username, password, done) {
		User.findOne({ username: username }, function (err, user) {
		  if (err) { return done(err); }
		  if (!user) { return done(null, false); }
		  if (!user.verifyPassword(password)) { return done(null, false); }
		  return done(null, user);
		});
	  }
	));*/

    var sns = new AWS.SNS();
    var ddb = new AWS.DynamoDB();

    var ddbTable =  process.env.STARTUP_SIGNUP_TABLE;
    var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
    var app = express();

    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(bodyParser.urlencoded({extended:false}));

	var router = express.Router();
	
	var markup = undefined;
	
	/*app.get('/',
	  function(req, res) {
		res.render('home', { user: req.user });
	  });

	app.get('/login',
	  function(req, res){
		res.render('login');
	  });
	  
	app.post('/login', 
	  passport.authenticate('local', { failureRedirect: '/login' }),
	  function(req, res) {
		res.redirect('/');
	  });*/
	  
    app.get('/', function(req, res) {
		ddb.scan({
			TableName: "movies"
		}, function(err, data){
			if(err){
				console.log("err:", JSON.stringify(err, null, 2));
				res.render('index', {
					static_path: 'static',
					movies_markup: JSON.stringify(err, null, 2),
					theme: process.env.THEME || 'slate',
					flask_debug: process.env.FLASK_DEBUG || 'false'
				});
			}else{
				res.render('index', {
					static_path: 'static',
					movies: data.Items,
					theme: process.env.THEME || 'slate',
					flask_debug: process.env.FLASK_DEBUG || 'false'
				});
			}
		});

        
    });
	
	app.get('/add', function(req, res) {
		res.render('add', {
            static_path: 'static',
            theme: process.env.THEME || 'slate',
            flask_debug: process.env.FLASK_DEBUG || 'false'
        });
	})
	app.get('/watch', function(req, res) {
		res.render('watch', {
            static_path: 'static',
            theme: process.env.THEME || 'slate',
            flask_debug: process.env.FLASK_DEBUG || 'false'
        });
	})
    app.post('/addmovie', function(req, res) {
        var item = {
            'url': {'S': req.body.url},
            'title': {'S': req.body.title},
            'year': {'S': req.body.year},
			'type': {'S': req.body.type},
            'tags': {'S': req.body.tags}
        };
	
        ddb.putItem({
            'TableName': ddbTable,
            'Item': item,
            'Expected': { email: { Exists: false } }        
        }, function(err, data) {
            if (err) {
                var returnStatus = 500;

                if (err.code === 'ConditionalCheckFailedException') {
                    returnStatus = 409;
                }

                res.status(returnStatus).end();
                console.log('DDB Error: ' + err);
            } else {
                sns.publish({
                    'Message': 'Name: ' + req.body.name + "\r\nEmail: " + req.body.email 
                                        + "\r\nPreviewAccess: " + req.body.previewAccess 
                                        + "\r\nTheme: " + req.body.theme,
                    'Subject': 'New user sign up!!!',
                    'TopicArn': snsTopic
                }, function(err, data) {
                    if (err) {
                        res.status(500).end();
                        console.log('SNS Error: ' + err);
                    } else {
                        res.status(201).end();
                    }
                });            
            }
        });
    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}