const axios = require("axios");
const readXlsxFile = require('read-excel-file/node');
const ObjectsToCsv = require('objects-to-csv');

var googleConfig = require('./config').googleSearch;

async function getProduct(query, price) {
    const q = encodeURI(query)
    const url = `${googleConfig.url}?q=${q}&key=${googleConfig.credentials.apiKey}&siteSearch=cosmos.bluesoft.com.br&cx=${googleConfig.credentials.cx}&fields=items`
    const { data } = await axios.get(url);
    try {
        return {
            ean: query,
            title: data.items[0].pagemap.metatags[0]['og:title'],
            description: data.items[0].pagemap.metatags[0]['og:description'],
            image: data.items[0].pagemap.metatags[0]['og:image'],
            price
        }
    } catch (err) {
        return {
            ean: query,
            title: '',
            description: '',
            image: '',
            price
        }
    }
}

function readXlsx(path) {
    return readXlsxFile(path).then(rows => rows)
}
function awaitRequest(time, callback) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(callback())
      }, time)
    })
  }

(async() => {
    const rows = await readXlsx('./input/coleta1.xlsx')

    const products = await Promise.all(rows.map(async ([EAN, price], index) => {
    return await awaitRequest(index * 600, async () => {
        console.log(`Got product! ${rows.length}/${index+1}`)
        return await getProduct(EAN, price)
      })}))
   console.log(products)
    const csv = new ObjectsToCsv(products);
    await csv.toDisk(`./output/scrapping.csv`);
})()