
const form = document.querySelector('form');
const loadElement = document.querySelector('.loading');
const mewsElement = document.querySelector('.mews');
const loadMoreElement = document.querySelector('#loadMore');

let skip = 0;
let limit = 5;
//these two variable are declared to keep track and prevent repeated call of listAllMews() even when there is no data left.
let loading = false; //fetch data every scroll if false
let finish = false;	 //keeps track to confirm that isLeftMeows=true then it's not finish.


document.addEventListener('scroll',()=>{	//<-- scroll to load more
	const rect = loadMoreElement.getBoundingClientRect();	//<-- if the loadMoreElement is visible in browser window
	//if scrolled to the bottom and if it's not loading(false) and it's not finish(false) then run code below 
	if(rect.top < window.innerHeight && !loading && !finish){
		 skip += limit;	//<-- skips previous meows
		//every time it scrolls this function runs
		 listAllMews(false); //<-- set reset to false to stack html elements of meows.
	}

});


// Where is the server i'm making a response to.
const API_URL = 'https://twitterclone-levqn.run.goorm.io/v2/meow';

loadElement.style.display = ''; //<-- show the loading 

listAllMews();// <-- then list all mews


//FOR SUBMITTING FORM TO THE SERVER API
//catch json data here on client.js rather than in server app.js
form.addEventListener('submit', (event)=>{
	event.preventDefault();
	//get the form req.body data
	const formData = new FormData(this);
	const name = formData.get('name');
	const content = formData.get('content');
	
	
	//Make a post request on this API_URL to send this mew object on to our dynamic server.
	const mew = {	//<-- javascript object
		name,
		content
	}
	
	form.style.display = 'none'; //<--hide form
	loadElement.style.display = ''; //<-- show loading
	
	//attempt to send this data into the server
	fetch(API_URL, {
		  method: 'POST',
		  body: JSON.stringify(mew), //turn this js object into a JSON string.
		  headers:{		//what are we sending
			  'content-type': 'application/json' //<-- the body of the request is in JSON
		  }		
	})
	//the fetch API is a promise so it will wait until resolved
	// the resolved promise has the value of 'body: ReadableStream'. This is sent by the app.js post route as response
	//which we can extract the data using response.json()
	.then(response => response.json())//<-- it's asynchronous and returns a Promise object that resolves to a JavaScript object. This is why we need to convert it again to JSON.
	.then(createdMew => { //<-- the done and parsed.
		console.log(createdMew);
			setTimeout(()=>{	//<-- do this after 20 seconds. This is just to cope with the rate-limiting in the server.
				loadElement.style.display = 'none'; //<-- hide loading
				form.style.display = ''; //<-- display form again
				form.reset(); //<-- clear form input
				listAllMews(); //<-- refresh all mews by calling this again
			},20000);

	})
	.catch(err =>{
		console.log(err);
	}); //<-- end of fetch promise
	
});


//DISPLAY ALL CONTENTS FUNCTION
function listAllMews(reset = true){ //<-- default parameter is true
	
	loading = true; //<-- set variable to true to not load items every scroll 
	
	if(reset){ // <-- resets html element, default skip, and finish variable
		mewsElement.innerHTML = ''; //<-- clear all div items in HTML to prevent stacking of divs.
		skip = 0; //<-- reset skipping to 0. To show the latest meows.
		finish = false;	//<--reset variable to indicate the isLeftMeows.
	} 
	
	fetch(`${API_URL}?skip=${skip}&limit=${limit}`)  //<-- make get request to '/v2/meow'. it's optional to specify any options coz it's a get request
	.then(response => response.json())//<-- parsed the json response
	.then(results => {	//<-- resolved parsed array of objects data being passed here //we could destructure this results...nah
		console.log(results);
		
		results.listOfRequestedMeows.forEach(meow =>{ //<--create element for each meow
			//createElement doesn't pop up on the page it just creates them. you need to append it to show.
			
			const smallDiv = document.createElement('div'); //create a div element
			
			const header = document.createElement('h3'); //create a h3 for name
			header.textContent = meow.name;
			
			const contents = document.createElement('p');// create a p for contents
			contents.textContent = meow.content;
			
			const dateCreated = document.createElement('small');
			dateCreated.textContent = new Date(meow.created);
			
			smallDiv.appendChild(header);  //<-- put the header inside the smallDiv
			smallDiv.appendChild(contents);//<-- also put the paragraph inside the smallDiv
			smallDiv.appendChild(dateCreated)
			mewsElement.appendChild(smallDiv);//<-- put the smallDiv on the newsElement div
			smallDiv.classList.add('mew-style');
		});//<--foreach ends
		
		loadElement.style.display = 'none';//<-- hide after the page loads
		if(!results.meta.isLeftMeows){ //<-- if there no meows(boolean) left
			loadMoreElement.style.visibility = 'hidden';
			finish = true; //<--set global variable finish to true to disable scroll event that fetch data every scroll
		}else{
			loadMoreElement.style.visibility = 'visible';
		}
		loading = false; //<-- to fetch everytime it scrolls 
	});//<--end of Promise
}