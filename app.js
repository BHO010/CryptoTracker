require('dotenv').config()
const axios = require('axios')
const { Telegraf } = require('telegraf')
const config = require('./config')
const bot = new Telegraf(process.env.BOT_TOKEN)
require('./mongodb').open(config)
const mongo = require('./mongodb')
const { checkSymbol, getPrice } = require('./crypto')
const { getHelpMsg, getTrackerTemplate, getOutputTemplate } = require('./template')

bot.start(async (ctx) => {
    const { message, from, chat, ...rest } = ctx
    let rv0 = null
    try {
        let rv = await mongo.db.collection('users').findOne({ userID: from.id })
        if (rv == null) {
            //Transaction
            const { defaultTransactionOptions, client } = mongo
            const session = client.startSession({ defaultTransactionOptions }) // for transactions
            session.startTransaction()
            try {
                rv0 = await mongo.db.collection('users').insertOne({
                    userID: from.id,
                    username: from.username,
                    createdOn: new Date(message.date * 1000).toISOString()
                }, { session })

                rv1 = await mongo.db.collection('trackers').insertOne({
                    userID: from.id,
                    tracker: []
                }, { session })

                await session.commitTransaction()

            } catch (e) {
                await session.abortTransaction()
                console.log(e.toString())
                ctx.reply('Error, please try again or contact support.')
                return
            }
            session.endSession()
        }
        let msg = getHelpMsg(from.username)
        
        if (rv0 || rv) {
            ctx.reply(msg)
        }

    } catch (e) {
        console.log(e.toString())
        ctx.reply('Error, please try again or contact support.')
        return
    }
})

bot.help((ctx) => {
    let {from} = ctx
    let msg = getHelpMsg(from.username)

    ctx.reply(msg)
})

bot.command('buy', async (ctx) => {
    let { message, from, ...rest } = ctx
    let rv = null
    let outputMsg = null

    let msgArray = message.text.split(' ')
    let userTracker = await mongo.db.collection('trackers').findOne({userID: from.id})
    if (msgArray.length != 4) {
        ctx.reply('Input is required. Please check that the command is correct. \n - /help to see available commands')
        return
    }
    try {
        msgArray[1] = msgArray[1].toLowerCase()

        //Reply Loading
        ctx.reply('Please wait....Calculating...')

        //check if symbol is valid
        let result = await checkSymbol( msgArray[1])

        if(!result) {
            return ctx.reply("Symbol is not valid")
        }
        if(result == 'Error') {
            return ctx.reply("Error")
        }


        let index = userTracker.tracker.findIndex(p => p.symbol == msgArray[1])
        if(index == -1) {
            let obj = getTrackerTemplate(msgArray)

            rv = await mongo.db.collection('trackers').findOneAndUpdate({userID: from.id}, {
                $push: {
                    "tracker": obj
                }
            },
            { returnOriginal: false })

            let currentPrice = await getPrice(result)
            outputMsg = getOutputTemplate(obj, currentPrice)

        }else {
            let totalAmt = Number(msgArray[2]) + userTracker.tracker[index].totalBought
            let price = Number(msgArray[3])
            let totalCoins = Number(msgArray[2])/price + userTracker.tracker[index].totalCoins
            let avgOpn = totalAmt/totalCoins
            

            rv = await mongo.db.collection('trackers').findOneAndUpdate({userID: from.id, "tracker.symbol": msgArray[1]}, {
                $set: {
                    "tracker.$.totalBought": totalAmt,
                    "tracker.$.totalCoins": totalCoins,
                    "tracker.$.avgOpn": avgOpn
                }
            },
            { returnOriginal: false }) 

            let currentPrice = await getPrice(result)
            outputMsg =  getOutputTemplate(rv.value.tracker[index], currentPrice)
        }

        return ctx.reply(outputMsg)

    } catch (e) {
        return ctx.reply('Error, please try again or contact support.')
    }
})

bot.command('sell', async (ctx) => {
    let { message, from, ...rest } = ctx
    let rv = null
    let outputMsg = null

    let msgArray = message.text.split(' ')
    let userTracker = await mongo.db.collection('trackers').findOne({userID: from.id})
    if (msgArray.length != 4) {
        ctx.reply('Input is required. Please check that the command is correct. \n - /help to see available commands')
        return
    }

    try{
        msgArray[1] = msgArray[1].toLowerCase()

        //Reply Loading
        ctx.reply('Please wait....Calculating...')

         //check if symbol is valid
         let result = await checkSymbol( msgArray[1], "check")

         if(!result) {
             return ctx.reply("Symbol is not valid")
         }


        let index = userTracker.tracker.findIndex(p => p.symbol == msgArray[1])
        if(index == -1) {
            ctx.reply('There is no buy data related to this coin. Please input a buy data first.')
            return
        }else {
            let totalAmt = userTracker.tracker[index].totalBought
            let totalSold = Number(msgArray[2]) + userTracker.tracker[index].totalSold
            let price = Number(msgArray[3])
            let totalCoins = userTracker.tracker[index].totalCoins - Number(msgArray[2])/price
            let avgOpn = totalAmt/totalCoins

            rv = await mongo.db.collection('trackers').findOneAndUpdate({userID: from.id, "tracker.symbol": msgArray[1]}, {
                $set: {
                    "tracker.$.totalSold": totalSold,
                    "tracker.$.totalCoins": totalCoins,
                    "tracker.$.avgOpn": avgOpn
                }
            },
            { returnOriginal: false }) 

            let currentPrice = await getPrice(result)
            outputMsg = getOutputTemplate(rv.value.tracker[index], currentPrice)
        }

        
        return ctx.reply(outputMsg)

    }catch(e) {
        ctx.reply('Error, please try again or contact support.')
        return
    }


})

bot.command('apiStatus', async (ctx) => {
    let rv = await axios.get('https://api.coingecko.com/api/v3/ping')
    if(rv.status == 200) {
        return ctx.reply('Api Status Ok')
    }else {
        return ctx.reply('Api Status Down')
    }
    
})

bot.command('get', async (ctx) => {
    let {message, from, ...rest} = ctx
    let msgArray = message.text.split(' ')
    msgArray[1] = msgArray[1].toLowerCase()

    //Reply Loading
    ctx.reply('Please wait....Calculating...')


    let obj = await checkSymbol(msgArray[1])

    if(!obj) {return ctx.reply('Symbol is not valid')}

    let price = await getPrice(obj)

    let userTracker = await mongo.db.collection('trackers').findOne({userID: from.id})
    let index = userTracker.tracker.findIndex(p => p.symbol == msgArray[1])

    if(index<0) {return ctx.reply('You do not have this coin in your tracker')}

    let msg = getOutputTemplate(userTracker.tracker[index],price)

    return ctx.reply(msg)
})

bot.command('list', async (ctx) => {
    let {message, from, ...rest} = ctx
    let msg =''
    try {
        let rv = await mongo.db.collection('trackers').findOne({userID: from.id})

        //Reply Loading
        ctx.reply('Please wait....Calculating...')

        if(rv.tracker.length == 0) {
            return ctx.reply('You do not have any coin in your tracker.')
        }

        for(var data of rv.tracker) {
            let obj = await checkSymbol(data.symbol)
            let price = await getPrice(obj)
            msg += getOutputTemplate(data, price)

            msg += '\n\n'
        }

        return ctx.reply(msg)
    }catch(e) {
        return ctx.reply(e.toString())
    }
})


bot.launch()