let userInput = document.getElementById('input');
let appIDEl = document.getElementById('appid-el');
let calcBtn = document.getElementById("calc-btn");
let itemsL = document.getElementById('itemList');
let totalP = document.getElementById('total-price');
let gameList = document.getElementById('gameList')
let profileCard = document.getElementById('profile-card')
let itemsWithPrices = [];
let itemsArray = [];
let ownedGamesArray = []
calcBtn.addEventListener('click', async function () {
  let steamIDinput = userInput.value;
  let appID = appIDEl.value;
  let steamID = extractID(steamIDinput)

  console.log("client steamid: " + steamID + " client appid: " + appID);

  if (steamID && appID) {
    try {
      // Fetch itemsArray
      const itemsData = await fetchWithRetry(`http://localhost:5000/getinventory/?steamID=${encodeURIComponent(steamID)}&appID=${encodeURIComponent(appID)}`, 3);

      // Fetch pricesArray
      const pricesData = await fetchWithRetry("http://localhost:5000/itemprice", 3);
      const profileData = await(fetchWithRetry(`http://localhost:5000/getprofile/?steamID=${encodeURIComponent(steamID)}`,3))
      const ownedGamesData = await(fetchWithRetry(`http://localhost:5000/getownedgames/?steamID=${encodeURIComponent(steamID)}`,3))
      console.log(ownedGamesData)
      // Process the fetched data
      itemsArray = processItemsData(itemsData);
      itemsWithPrices = logPricesIntoArray(pricesData);
      ownedGamesArray = processOwnedGames(ownedGamesData);

      // Combine arrays and display the result
      display(itemsArray, itemsWithPrices,profileData,ownedGamesArray,steamID);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  } else {
    console.log("SteamID and AppID cannot be empty");
  }
});

function fetchWithRetry(url, retriesLeft) {
  return new Promise((resolve, reject) => {
    function fetchData() {
      fetch(url)
        .then(response => {
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? (parseInt(retryAfter) * 1000) : 5000;
            console.log(`Received 429 response. Retrying in ${delay / 1000} seconds.`);
            setTimeout(() => {
              fetchData();
            }, delay);
          } else if (response.ok) {
            return response.json();
          } else {
            throw new Error("Request failed with status: " + response.status);
          }
        })
        .then(resolve)
        .catch(error => {
          if (retriesLeft === 0) {
            console.log("Max retries exceeded.");
            // Handle the case where too many requests have been made
            console.error("Too Many Requests");
            reject(error);
          } else {
            console.error(error);
            retriesLeft--;
            fetchData();
          }
        });
    }

    fetchData();
  });
}

function processItemsData(data) {
  const assetDescArray = [];
  const assets = data['assets'];
  const descs = data['descriptions'];

  assets.forEach(asset => {
    descs.forEach(description => {
      if (asset.instanceid === description.instanceid && asset.classid === description.classid) {
        assetDescArray.push({ asset, description });
      }
    });
  });

  
  return assetDescArray;
}

function logPricesIntoArray(prices) {
  const itemsWithPrices = [];

  for (const itemName in prices) {
    const price = prices[itemName].steam.last_24h;
    itemsWithPrices.push({
      item: itemName,
      csgoEmpirePrice: price
    });
  }

  
  return itemsWithPrices;
}
function processOwnedGames(ownedGamesData){
  let gamesArray =[]
  for (let i = 0; i < ownedGamesData.response.games.length; i++) {
    gamesArray.push(ownedGamesData.response.games[i]);
  }
  gamesArray.sort((a,b) => b.rtime_last_played - a.rtime_last_played);
  const nineGamesArray = gamesArray.slice(0,9)
  
  
  return nineGamesArray;


}

function display(AssDescArray, itemsWithPrices, profileData, ownedGamesArray,steamID) {
  let totalWorth = 0;
  const combinedArray = AssDescArray.map(item => {
    const matchingPrice = itemsWithPrices.find(priceItem => priceItem.item === item.description.market_name);

    if (matchingPrice) {
      return {
        asset: item.asset,
        description: item.description,
        price: matchingPrice.csgoEmpirePrice,
      };
    }

    console.log("MATCHING COMPLETE");

    return null;
  }).filter(Boolean);

  combinedArray.sort((a, b) => b.price - a.price);
  profileCard.innerHTML = " ";
  profileCard.innerHTML += constructProfileCard(profileData, ownedGamesArray);
  itemsL.innerHTML = "";

  // Create a tooltip element
  var tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  for (let item of combinedArray) {
    var li = document.createElement('li');
    var img = document.createElement('img');
    var itemName = document.createElement('p');
    var itemPrice = document.createElement('p');

    img.src = `http://cdn.steamcommunity.com/economy/image/${item.description.icon_url}`;
    li.appendChild(img);

    itemName.textContent = item.description.market_name;
    li.appendChild(itemName);

    itemPrice.textContent = item.price + "$";
    li.appendChild(itemPrice);

    li.addEventListener('mouseover', function (event) {
      adjustTooltipPosition(event, tooltip);
      // Update tooltip content and position
      let itemDescArray = item.description.descriptions;
      let itemAssId = item.asset.assetid
      let inspectObj = item.description.actions;
      let itemMarketActionsArray = item.description.market_actions
      let tagsArray = item.description.tags
      let inspectLink = ""
      let listOfSkinsInCase = ""
      if(itemDescArray.length > 7){//cases
      itemDescArray.forEach(obj => {
        if(obj.value != null && obj.value != " " && obj.value != ""){
        listOfSkinsInCase += `<span style="color: #${obj.color || 'default'}">${obj.value}</span><br>`;
      }

      })
    }
    else{//skins
      itemDescArray.forEach(obj => {
        
        if(obj.value != null && obj.value != " " && obj.value != ""){
          listOfSkinsInCase += `<span style="color: #${obj.color || 'default'}">${obj.value}</span><br><br>`;
        }
       

      })
      
      inspectLink = inspectObj[0].link.replace('%owner_steamid%',steamID).replace('%assetid%',itemAssId)


    }
      
      if(inspectLink != ""){
      let itemColor = item.description.tags[4].color;
      tooltip.innerHTML = `<strong><span style="color: #${itemColor}">${item.description.market_name}</span></strong><br><br>${listOfSkinsInCase}<br><a href=${inspectLink}><button>Inspect in Game...</button></a><br><br><b>Price: ${item.price}$</b>`;
      }
      else{
        tooltip.innerHTML = `<strong>${item.description.market_name}</strong><br><br>${listOfSkinsInCase}<br><br><b>Price: ${item.price}$</b>`;
      }
      tooltip.style.display = 'block';

      // Position the tooltip relative to the mouse position
      tooltip.style.top = (event.pageY + 10) + 'px';
      tooltip.style.left = (event.pageX + 10) + 'px';
    });

    li.addEventListener('mouseout', function () {
      // Hide tooltip on mouseout
      tooltip.style.display = 'none';
    });

    // Prevent the tooltip from hiding when the mouse is over it
    tooltip.addEventListener('mouseover', function () {
      tooltip.style.display = 'block';
    });

    // Hide the tooltip when the mouse leaves it
    tooltip.addEventListener('mouseout', function () {
      tooltip.style.display = 'none';
    });

    itemsL.appendChild(li);

    totalWorth += item.price;
  }

  totalP.textContent = "Total Inventory Worth: " + (Math.round(totalWorth * 100) / 100).toFixed(2) + "$";
  return AssDescArray;
}
function extractID(input){
  if (/^\d+$/.test(input)) {
    return input;
  }
  const regex = /(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/([a-zA-Z0-9]+)/;
  
  // Use the regular expression to extract the user ID
  const match = input.match(regex);

  // If there is a match, return the user ID, otherwise return null
  return match ? match[1] : null;
}

function constructProfileCard(profileData,ownedGamesArray){
  profileCard.style.display = "flex";
    const avatarFullUrl = profileData.response.players[0].avatarfull;
    const playerName = profileData.response.players[0].personaname;
    const playerState = profileData.response.players[0].personastate;
    const steamProfileUrl = profileData.response.players[0].profileurl;
    let borderColor = "";
    switch (playerState) {
      case 0: // Offline
        borderColor = "rgba(104,104,104,255)";
        break;
      case 1: // Online
        borderColor = "rgba(84,165,197,255)";
        break;
      case 2: // In-Game
        borderColor = "rgba(143,185,59,255)";
        break;
      default:
        borderColor = "rgba(104,104,104,255)"; // Default color or handle other states
    }
    
    const cardHtml = `<div class="profile-card" >
                          <a href='${steamProfileUrl}'>
                          <img src='${avatarFullUrl}' style="border: 2px solid ${borderColor}">
                          </a>
                          <h1>${playerName}</h1>
                          <ul>${generateListItems(ownedGamesArray)}</ul>
                        </div>`;


  
    return cardHtml;
}
function generateListItems(array) {
  let listItems = '';
  for (const item of array) {
    listItems += `<li><a href='https://store.steampowered.com/app/${item.appid}'><img src='https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${item.appid}/${item.img_icon_url}.jpg'></a></li>`;
  
  }
  return listItems;
}
function adjustTooltipPosition(event, tooltip) {
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const pageWidth = window.innerWidth;
  const pageHeight = window.innerHeight;

  let topPosition = event.pageY + 10;
  let leftPosition = event.pageX + 10;

  // Check if the tooltip exceeds the right page border
  if (leftPosition + tooltipWidth > pageWidth) {
    leftPosition = pageWidth - tooltipWidth;
  }

  // Check if the tooltip exceeds the bottom page border
  if (topPosition + tooltipHeight > pageHeight) {
    topPosition = pageHeight - tooltipHeight;
  }

  tooltip.style.display = 'block';
  tooltip.style.top = topPosition + 'px';
  tooltip.style.left = leftPosition + 'px';
}