const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs')
// Middleware for authentication and rate limiting
app.use((req, res, next) => {
 
  next();
});
app.get('/', (req, res) => {
    res.send("Welcome to the API");
  });
// Private JSON endpoint
app.get('/pData', (req, res) => {
try{
  const jsonData = JSON.parse(fs.readFileSync('pData.json','utf8'))
  res.json(jsonData);
  console.log(jsonData)
}
catch(error){
    console.error("Error: ", error)
    res.status(500).json({error: "Internal Error"});

}
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});