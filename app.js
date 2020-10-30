const express = require("express");
const app = express();
const monk = require("monk"); //<--ODM middleware like mongoose but lite
const cors = require('cors');
const Filter = require('bad-words'); //<-- filters badwords by adding **** to them.
const rateLimit = require("express-rate-limit"); //<-- middleware that limit user posts by an amount of time to prevent spamming. 
const faker = require('faker');
 

app.use(express.static('client')); //<-- this is a directory middleware

//The error
//---no 'Access-Control-Allow-Origin' header is present on requested source.---
//---Origin 'the server "api_url here" ' is therefore not allowed access.---------
//Basically, the browser is protecting us. It doesn't want the client.js to talk to any servers out there 
//unless those servers would allow it
//The solution would be to allow the our server to accept request from any other origin.
//using cors (Cross-origin resource sharing) as a middleware
//it will automatically add this cors header: Access-Control-Allow-Origin to any request passed here in the server.
app.use(cors()); //<-- this is a middleware

//parse incoming any data that has an application type JSON
//this is the same as body-parser, latest express versions includes body parser as a exports.module.
app.use(express.json({extended : true})); //<-- this is a middleware


const db = monk('localhost:27017/meower');//<--create/search a database at localhost named meower
db.then(()=>{
	console.log('Connected to database!');
})
.catch(err=>{
 console.log(err, 'There is something wrong! Check your database path!');	
});

const mews = db.get('mews');//<-- create collection with named mews
const filter = new Filter();


app.get('/', (req, res)=>{
	res.json({
		message : 'OH MY GAH 🙀'
	});
});


app.get('/meow', (req, res, next)=>{ //<--when the server received a get request from '/meow'
	mews	//<-- go to the collection
	.find()	//<--grab all of the documents as an array
	.then(mews=>{ //then respond with an array mews jsons back to the client
		res.json(mews);
	})
	.catch(next);
});

//This is just the gist of how poeple make a back-end API
//this gives back an json API data
app.get('/v2/meow', (req, res, next)=>{ 
	//you can get access to an object that has all the query params that the client sent to the server, the query was passed in using this endpoint
	//the endpoint with query like /v2/meow?skip=1&limit=10
	console.log(req.query);
	//result: console.logs this in the server: { skip: '1', limit: '10' }
	
	//if the client specifies a number in skip/limit parameter, use it else use the default value 0/5;
	//Destructuring and default parameters where used here.
	let {skip = 0 , limit = 5, sort = 'desc'} = req.query;
	//If you notice the skip/limit value is a string instead of a number, Change it to a number.
	//if they passed a string use the default number instead
	skip = parseInt(Math.abs(Number(skip)))|| 0;	// turn it into a Number type 
	limit = parseInt(Math.abs(Number(limit))) || 5;	// this would suffice for now?
	limit = Math.min(50, Math.max(1,limit)); //to prevent people to specify it like 10000000 or higher than the limit
	
	

Promise.all([ //<--when the Promise.all is entirely resolved take all the value and put it in the array
	mews			
		.count(),	//request the total number of meows in the database
	mews			
		.find({}, { //<-- find all the meows but obey the specified limit and skips in the query parameter
			skip, //<-- skip the 10(limit) occurences 
			limit, //<-- limit the number of displayed documents
			sort: {	 //<--sort by descending order.. in this case the newest meows are on the top.
			created: sort === 'desc'? -1 : 1
			}
		})
])	
	//used destructuring on the resolved Promise.all value here
	.then(([countTotalMeows, listOfRequestedMeows])=>{ 
		res.json({ // response with the API mews jsons back to the client
			countTotalMeows,//<-- this value returns the total number of documents in the 'mews' collection
			listOfRequestedMeows,		//<-- array of object meows that corresponds to limit and skip
			meta: {	//<--some info you can call it anything
				skip,
				limit,
				isLeftMeows: countTotalMeows - (skip + limit) > 0
			},
		});
	}).catch(next);
});

//VALIDATOR
function isValidMew(mew){
	//return true or false based on this validation.
	//evaluates whether the req.body is empty or not
	//and that string is not empty
	//and name <=50
	//and content <= 140
return	(mew.name && mew.name.toString().trim() !== "" && mew.name.toString().trim().length <= 50 ) && 
		(mew.content && mew.content.toString().trim() !== "" && mew.content.toString().trim().length <= 140)
};

//RATE-LIMITER
//moved in this position to only apply on post requests.
//middleware has the ability to use this strategy.
app.use(rateLimit({
  windowMs: 10 * 2000, // every 20 seconds
  max: 1	// limit each IP to 1 requests per windowMs
}));



app.post('/v2/meow', (req, res)=>{
	
	//validate users to prevent sending empty requests
	if(isValidMew(req.body)){
		
		//we put .toString() to prevent injections
		const mew = {
			name: filter.clean(req.body.name.toString()),
			content: filter.clean(req.body.content.toString()),
			created: new Date()
		}
		
		mews
			.insert(mew) //<-- insert the mew object into the database //a promise
			.then(createdMew =>{ //<--then if resolved and inserted, it will pass here in createdMew parameter the document.
			res.json(createdMew);	//respond the document in json to the waiting fetch API promise in client.js
		});
		
		// for(let i = 0; i <=20;i++){
		
		// 	const mewPopulate = {
		// 	name: filter.clean(faker.internet.userName().toString()),
		// 	content: filter.clean(faker.random.words().toString()),
		// 	created: new Date()
		// }
		// 	mews.insert(mewPopulate);
		// }
		
	}else{
		res.status(422);
		res.json({
			message: 'Ey! Who are u? y u sendin empty meows!'
		});
	}
});

//ERROR HANDLER
app.use((error, req, res, next)=>{
	res.status(500);
	res.json({
		message: error.message
	});
});


app.listen(process.env.PORT || 3838, ()=>{
	console.log('Server has connected succesfully!');
});