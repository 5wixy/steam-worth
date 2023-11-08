
let userInput= document.getElementById('input')
let appIDEl = document.getElementById('appid-el')
let calcBtn = document.getElementById("calc-btn")
let itemsL = document.getElementById('itemList')
let dataItemArray = []
var req = new XMLHttpRequest();
req.addEventListener('load', function(){
    if(req.status >= 200 && req.status<400){
        const response = JSON.parse(req.responseText);
        console.log(JSON.parse(req.responseText));
    }

    else {
        console.log("Error in network request: " + request.statusText);
        }

req.send(null);
})

calcBtn.addEventListener('click', function() {
  let steamID = userInput.value;
  let appID = appIDEl.value;
  console.log("client steamid: " + steamID + " client appid: " + appID);
  if (steamID && appID) {
    // Construct the URL with the SteamID as part of the path
    let newURL = `http://localhost:5000/getinventory/?steamID=${encodeURIComponent(steamID)}&appID=${encodeURIComponent(appID)}`;

    // Create a function for fetching data with retries
    function fetchDataWithRetry(url, retriesLeft) {
      if (retriesLeft === 0) {
        console.log("Max retries exceeded.");
        // Handle the case where too many requests have been made
        console.error("Too Many Requests");
        return;
      }

      fetch(url)
        .then((response) => {
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? (parseInt(retryAfter) * 1000) : 5000; // Convert to milliseconds
            console.log(`Received 429 response. Retrying in ${delay / 1000} seconds.`);
            setTimeout(() => {
              fetchDataWithRetry(url, retriesLeft - 1);
            }, delay);
          } else if (response.ok) {
            return response.json(); // Parse JSON data
          } else {
            throw new Error("Request failed with status: " + response.status);
          }
        })
        .then((data) => {
          // Handle the JSON data
          //console.log(data);
          logDataToArray(dataItemArray,data)
        })
        .catch((error) => {
          console.error(error);
          // Handle the error here
        });
    }

    // Call the function to fetch data with retry
    fetchDataWithRetry(newURL, 3); // Specify the number of retry attempts you want
  } else {
    console.log("SteamID cannot be empty");
  }
});
function logDataToArray(dataItemArray, data) {
  dataItemArray = []  
  // Log the JSON data to the array
  dataItemArray.push(data);
  // Log the JSON data to the console
  //console.log(data);
  const assetDescArray = [];
 const assets = data['assets']
 const descs = data['descriptions']
 insertAssDescArray(assets,descs)

}
function insertAssDescArray(assets,descs){
  const AssDescArray = []
  assets.forEach((asset) => {
      descs.forEach((description) => {
          if (asset.instanceid === description.instanceid && asset.classid === description.classid) {
              AssDescArray.push({ asset, description });
          }
      });
  });
  console.log(AssDescArray)
  itemsL.innerHTML = ""
  for (var item of AssDescArray){
    itemsL.innerHTML += `<li><img src=http://cdn.steamcommunity.com/economy/image/${item.description.icon_url}>` + item.description.market_name+ '</li>'
  
  }
  
  return AssDescArray;

      }




