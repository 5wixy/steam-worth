let userInput = document.getElementById('input');
let appIDEl = document.getElementById('appid-el');
let calcBtn = document.getElementById("calc-btn");
let itemsL = document.getElementById('itemList');
let totalP = document.getElementById('total-price');
let itemsWithPrices = [];
let itemsArray = [];

calcBtn.addEventListener('click', async function () {
  let steamID = userInput.value;
  let appID = appIDEl.value;

  console.log("client steamid: " + steamID + " client appid: " + appID);

  if (steamID && appID) {
    try {
      // Fetch itemsArray
      const itemsData = await fetchWithRetry(`http://localhost:5000/getinventory/?steamID=${encodeURIComponent(steamID)}&appID=${encodeURIComponent(appID)}`, 3);

      // Fetch pricesArray
      const pricesData = await fetchWithRetry("http://localhost:5000/itemprice", 3);

      // Process the fetched data
      itemsArray = processItemsData(itemsData);
      itemsWithPrices = logPricesIntoArray(pricesData);

      // Combine arrays and display the result
      display(itemsArray, itemsWithPrices);
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

  console.log(assetDescArray);
  return assetDescArray;
}

function logPricesIntoArray(prices) {
  const itemsWithPrices = [];

  for (const itemName in prices) {
    const price = prices[itemName].csgoempire;
    itemsWithPrices.push({
      item: itemName,
      csgoEmpirePrice: price
    });
  }

  console.log(itemsWithPrices);
  return itemsWithPrices;
}

function display(AssDescArray, itemsWithPrices) {
  let totalWorth = 0
  console.log(itemsWithPrices);
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

  console.log(combinedArray[0]);
  combinedArray.sort((a,b)=>b.price - a.price)

  itemsL.innerHTML = "";

  for (var item of combinedArray) {
    itemsL.innerHTML += `<li><img src=http://cdn.steamcommunity.com/economy/image/${item.description.icon_url}>` + item.description.market_name + '<br>'+item.price+ "$"+'</li>';
    totalWorth+= item.price;
  }
  totalP.textContent = "Total Inventory Worth: " + (Math.round(totalWorth * 100) / 100).toFixed(2) + "$"
  return AssDescArray;
}