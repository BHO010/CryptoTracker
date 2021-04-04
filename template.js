function getHelpMsg(username) {
    let msg = `Welcome to crypto-tracker bot, ${username} \n\n`
    msg += `You can input and keep track of your crypto transaction. \n`
    msg += `This bot will keep track of the amount you invested, average openings and amount of coins. It will not keep a record of individual transactions.  \n\n`
    msg += `Available Commands\n`
    msg += `- /help to see available commands\n`
    msg += `- /clear to clear data \n`
    msg += `- /sell to input sell data Eg: /sell < symbol > < Amt invested > < Price per coin > \n`
    msg += `- /buy to input buy data Eg: /buy < symbol > < Amt invested > <Price per coin>\n`
    msg += `- /get to get your coin tracker Eg: /get < symbol > \n`
    msg += `- /list to list your coin tracker Eg: /list\n\n`

    msg += `Created by Jase\n`
    msg += `Crypto API from https://www.coingecko.com/\n`

    return msg
}

//Only for buy
function getTrackerTemplate(data) {

    let coins = Number(data[2])/Number(data[3])
    let amt = Number(data[2])

    let template = {
        symbol: data[1],
        totalBought: amt,
        totalSold: 0,
        totalCoins: coins,
        avgOpn: amt/coins
    }

    return template
}


function getOutputTemplate(data, price) {

    let value = data.totalCoins * Number(price)

    let msg = `Symbol:  ${data.symbol}\n`
    msg += `Invested: ${data.totalBought}\n`
    msg += `Withdrawn: ${data.totalSold}\n`
    msg += `Coins:  ${data.totalCoins}\n`
    msg += `Current Value:  ${value}\n`

    return msg
}




module.exports = {
    getHelpMsg, getTrackerTemplate, getOutputTemplate

}
