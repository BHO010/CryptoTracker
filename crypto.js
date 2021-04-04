//get current crypto price using external api
const axios = require('axios')


async function checkSymbol(symbol, type = null) {
    try {
        let rv = await axios.get('https://api.coingecko.com/api/v3/coins/list?include_platform=false')

        let index = rv.data.findIndex(p => p.symbol == symbol)


        if (index < 0) {
            return null
        } else {
            return rv.data[index]
        }

    }catch(e) {
        console.log(e.toString())
        return 'Error'
    }
    


}

async function getPrice(data) {

    try {
        let rv = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: data.id,
                vs_currencies: 'usd'
            }
        })

        return rv.data[data.id].usd
    } catch (e) {
        return null
    }

}


module.exports = {
    checkSymbol,
    getPrice
}