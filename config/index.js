


module.exports = {
    //Mongo
    MONGO_URL: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/teleBot',
    MONGO_DB: process.env.MONGO_DB || 'teleBot'

}


/* What io want to keep track of

{
    symbol: "",
    totalBought: "",   // amount invested
    totalSold: "",  // amount withdrawn == sold 
    totalCoins: "",           // amount of coins
    avgOpn: ""           //avg opening of coin =>  total coin / total invested

}

*/