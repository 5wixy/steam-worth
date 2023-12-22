import { createFilterSortTab } from './filterSortTab.js';
import { generateGraph } from './graph.js';


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
const filterSortTab = createFilterSortTab();
let totalWorth = 0;
  let totalWorthWeek = 0;
  let totalWorthMonth = 0;
  let totalWorth3Month = 0;
const labels = ["90d", "30d", "7d", "24h"];
const ctx = document.getElementById("priceChart").getContext("2d");

calcBtn.addEventListener('click', async function () {
  itemsL.innerHTML = "";
  totalP.textContent = "";
  profileCard.style.display = "none";
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
      updateUI(itemsArray, itemsWithPrices, profileData, ownedGamesArray, steamID);
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
    const price_last_day = prices[itemName].steam.last_24h;
    const price_last_week = prices[itemName].steam.last_7d;
    const price_last_month = prices[itemName].steam.last_30d;
    const price_last_3M = prices[itemName].steam.last_90d;
    itemsWithPrices.push({
      item: itemName,
      lastDayPrice: price_last_day,
      lastWeekPrice: price_last_week,
      lastMonthPrice: price_last_month,
      last3mPrice: price_last_3M,
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

function updateUI(itemsArray, itemsWithPrices, profileData, ownedGamesArray, steamID) {
  const combinedArray = createCombinedArray(itemsArray, itemsWithPrices);
  const filterOptions = ['Pistol', 'Rifle', 'SMG', 'Knife','Gloves','Cases','Graffiti'];
const sortOptions = ['Price', 'Collection', 'Rarity','Type'];

const filterSortTab = createFilterSortTab(filterOptions, sortOptions);
const container = document.querySelector('.FSdiv'); // Adjust the selector if needed
container.insertBefore(filterSortTab, container.firstChild);
  
  combinedArray.sort((a, b) => b.price - a.price);
  updateProfileCard(profileData, ownedGamesArray);
  updateItemList(combinedArray, steamID);
  if (combinedArray.length > 0) {
    // Show the filter and sort tab
    container.style.display = 'block';
    console.log("AAAAAA")
  } else {
    // Hide the filter and sort tab
    console.log("NO AAAAAA")
    container.style.display = 'none';
  }
}

function createCombinedArray(AssDescArray, itemsWithPrices) {
  return AssDescArray.map(item => {
    const matchingPrice = itemsWithPrices.find(priceItem => priceItem.item === item.description.market_name);

    if (matchingPrice) {
      return {
        asset: item.asset,
        description: item.description,
        price: matchingPrice.lastDayPrice,
        priceW: matchingPrice.lastWeekPrice,
        priceM: matchingPrice.lastMonthPrice,
        price3M:matchingPrice.last3mPrice,
      };
    }

    console.log("MATCHING COMPLETE");
    return null;
  }).filter(Boolean);
}

function updateProfileCard(profileData, ownedGamesArray) {
  profileCard.innerHTML = " ";
  profileCard.innerHTML += constructProfileCard(profileData, ownedGamesArray);
}

function updateItemList(combinedArray, steamID) {
  itemsL.innerHTML = "";

  // Create a tooltip element
  var tooltip = createTooltip();

  for (let item of combinedArray) {
    var li = createListItem(item, steamID, tooltip);
    itemsL.appendChild(li);
  }
  
  

  // Calculate total worth
  let totalWorth = combinedArray.reduce((total, item) => total + item.price, 0);
  let totalWorthWeek = combinedArray.reduce((total, item) => total + item.priceW, 0);
  let totalWorthMonth = combinedArray.reduce((total, item) => total + item.priceM, 0);
  let totalWorth3Month = combinedArray.reduce((total, item) => total + item.price3M, 0);
  console.log("24h: " +totalWorth +" 7d: " + totalWorthWeek +" 30d: "+ totalWorthMonth + " 90d: " + totalWorth3Month)
  generateGraph(totalWorth,totalWorthWeek,totalWorthMonth,totalWorth3Month,labels)
  totalP.textContent = "Total Inventory Worth: " + (Math.round(totalWorth * 100) / 100).toFixed(2) + "$";
}
//Creating the tooltip box that shows basic item info
function createTooltip() {
  var tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);
  return tooltip;
}

function createListItem(item, steamID, tooltip) {
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

  img.addEventListener('mouseenter', function (event) {
    handleMouseOver(event, item, steamID, tooltip);
  });

  img.addEventListener('mouseleave', function () {
    tooltip.style.display = 'none';
  });
  tooltip.addEventListener('mouseenter', function () {
    tooltip.style.display = 'block';
  });

  // Hide the tooltip when the cursor leaves it
  tooltip.addEventListener('mouseleave', function () {
    tooltip.style.display = 'none';
  });

  itemsL.appendChild(li);

  return li;
}

function handleMouseOver(event, item, steamID, tooltip) {
  adjustTooltipPosition(event, tooltip);

  // Update tooltip content and position
  let itemDescArray = item.description.descriptions;
  let itemAssId = item.asset.assetid
  let inspectObj = item.description.actions;
  let inspectLink = "";
  let listOfSkinsInCase = "";

  if (itemDescArray.length > 7) { //cases
    itemDescArray.forEach(obj => {
      if (obj.value != null && obj.value != " " && obj.value != "") {
        listOfSkinsInCase += `<span style="color: #${obj.color || 'default'}">${obj.value}</span><br>`;
      }
    })
  } else { //skins
    itemDescArray.forEach(obj => {
      if (obj.value != null && obj.value != " " && obj.value != "") {
        listOfSkinsInCase += `<span style="color: #${obj.color || 'default'}">${obj.value}</span><br><br>`;
      }
    })
    inspectLink = inspectObj[0].link.replace('%owner_steamid%', steamID).replace('%assetid%', itemAssId)
  }

  if (inspectLink != "") {
    let itemColor = item.description.tags[4].color;
    tooltip.innerHTML = `<strong><span style="color: #${itemColor}">${item.description.market_name}</span></strong><br><br>${listOfSkinsInCase}<br><a href=${inspectLink}><button>Inspect in Game...</button></a><br><br><b>Price: ${item.price}$</b>`;
  } else {
    tooltip.innerHTML = `<strong>${item.description.market_name}</strong><br><br>${listOfSkinsInCase}<br><br><b>Price: ${item.price}$</b>`;
  }

  tooltip.style.display = 'block';
  tooltip.style.top = (event.clientY + window.scrollY + 3) + 'px';
  tooltip.style.left = (event.clientX + window.scrollX + 220> window.innerWidth)
  ? (event.clientX + window.scrollX - 300) + 'px'
  : (event.clientX + window.scrollX + 3) + 'px';
}

function adjustTooltipPosition(event, tooltip) {
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const pageWidth = window.innerWidth;
  const pageHeight = window.innerHeight;

  let topPosition = event.pageY + 10;
  let leftPosition = event.pageX + 10;

  
  if (leftPosition + tooltipWidth > pageWidth) {
    leftPosition = pageWidth - tooltipWidth;
  }

  
  if (topPosition + tooltipHeight > pageHeight) {
    topPosition = pageHeight - tooltipHeight;
  }

  
  if (leftPosition < 0) {
    leftPosition = 0;
  }

  
  if (topPosition < 0) {
    topPosition = 0;
  }

  tooltip.style.display = 'block';
  tooltip.style.top = topPosition + 'px';
  tooltip.style.left = leftPosition + 'px';
  tooltip.removeAttribute('style');
  tooltip.offsetHeight;

  // Add fade-in effect by applying the fade-in class
  tooltip.style.opacity = '1';
  tooltip.addEventListener('mouseleave', function () {
    tooltip.style.opacity = '0';
  });
  
}

//Function that is used to extract the SteamID out of the profile URL format
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

function constructProfileCard(profileData, ownedGamesArray){
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

