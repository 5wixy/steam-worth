
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port = 5000
const request = require('request')
require('dotenv').config();
var apiKey = process.env.API_KEY
const axios = require('axios')
var dataItem = []



// We are using our packages here
app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true})); 
app.use(cors())
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//You can use this to check if your server is working
app.get('/', (req, res)=>{
res.send("Welcome to your server")
})



  
  // Here gets parameters from end of URL to use in api address.  These parameters will come from submit buttons 
  // on the respective sites
  app.get('/getinventory/', function (req, res) {
    const steamID = req.query.steamID;
    const appID = req.query.appID;
    console.log("server steamid: " + steamID + " appid: " + appID);

    // Initialize an array to store the data
    const dataItemArray = [];

    // Construct the URL for the inventory request
    const urlv = `https://steamcommunity.com/inventory/${steamID}/${appID}/2?l=english&count=2000&format=json`;
    const urlDeme = `http://localhost:3000/pData` //change later
    fetchDataWithRetry(urlDeme, 3, res, dataItemArray);
});
app.get('/getprofile',function(req,res){
    const dataItemArray = []
    const steamID = req.query.steamID
    const profileURL = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&format=json&steamids=${steamID}`
    fetchDataWithRetry(profileURL,3,res,dataItemArray)


})

function fetchDataWithRetry(urlDeme, retriesLeft, res, dataItemArray) {
    dataItemArray = []
    data = ""
    if (retriesLeft === 0) {
        console.log("Max retries exceeded.");
        res.status(429).json({ error: "Too Many Requests" });
        return;
    }

   fetch(urlDeme, {credentials:'include'})
        .then(handleResponse)
        .then((data) => {
            // Log the data to the array and the console
            //logDataToArray(dataItemArray, data);
            // Send the JSON response
            res.json(data);
        })
        .catch((error) => {
            console.error(error);
            if (!res.headersSent) {
                sendErrorResponse(res);
            }
        });
}

function handleResponse(response) {
    const retriesLeft = 3
    let data = ""
    if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? (parseInt(retryAfter) * 1000) : 5000;
        console.log(`Received 429 response. Retrying in ${delay / 1000} seconds.`);
        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        }).then(() => fetchDataWithRetry(response.url, retriesLeft - 1, res, dataItemArray));
    } else if (response.status < 400) {
        if (response.headers.get('content-length') === '0') {
            throw new Error("Response body is empty");
        }
        
        return response.json()
    } else {
        throw new Error("Request failed with status: " + response.status);
    }
}

function sendErrorResponse(res) {
    res.status(500).json({ error: "Request failed" });
}

  
  
  app.get('/itemprice/', (req, res) => {
    const dataItemArray = []
    console.log('Request received at /itemprice/');
    const urlItemsPrice = `https://prices.csgotrader.app/latest/prices_v6.json`
   fetch(urlItemsPrice)
   .then(handleResponse)
   .then((data) => {
       // Log the data to the array and the console
       //logDataToArray(dataItemArray, data);
       // Send the JSON response
       //console.log(data)
       res.json(data);
   })
   .catch((error) => {
       console.error(error);
       if (!res.headersSent) {
           sendErrorResponse(res);
       }
   });
    
})
app.get('/getownedgames',function(req,res){
    const dataItemArray = []
    const steamID = req.query.steamID
    const profileURL = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamID}&include_appinfo=1&include_played_free_games=1&format=json`
    console.log(profileURL)
    fetchDataWithRetry(profileURL,3,res,dataItemArray)


})
  
  app.use(function(req,res){
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
  });
  
  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.send('500 - Server Error');
  });

//Start your server on a specified port
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})
