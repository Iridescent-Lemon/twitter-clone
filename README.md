# Twitter Clone for Animals 🐱‍👤
This app lets you post simple messages and display all of the current posts. Currently in development.


## Behind the Scene

* **Client-Side:** `client.js`
	* For fetching and posting data asynchronously.
	* To understand the front-end logic of the app on:
		* `FormData`
		* `Fetch` API
		* `scroll` event

* **Server-Side:** `app.js`
	* Provide the server logic and middlewares.
	* Help you to understand how to create your own *API* logic which sends data to the client-side in `json` format.
	* This [link](https://twitterclone-levqn.run.goorm.io/v2/meow) provides all the `json` data.(Currently not running.) 
	* Uses **mongoDB** as database and **monk** as a simple *ODM*.