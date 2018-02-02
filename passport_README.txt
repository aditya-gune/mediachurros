passport_README



To run:
	- Terminal 1: node app.js
		|-> Starts server http://127.0.0.1:3000/

	- Terminall 2: curl -v -H "Authorization: Bearer 123456789" http://127.0.0.1:3000/
		|-> Returns something. This should test the passport 'installation'



Log:
	2/1/18 - Just installed passport. Instantiated it in app.js. 
			 Invoked the Bearer strategy for fun.
			 After running the curl command, I get an 'unauthorized' reply.
			 Cool cool cool.



References:
	1. Passport.js - http://www.passportjs.org/
	2. Bearer Strategy - https://github.com/jaredhanson/passport-http-bearer
	3. Bearer Strategy Example - https://github.com/passport/express-4.x-http-bearer-example