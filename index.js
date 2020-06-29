const axios = require("axios");
const readXlsxFile = require('read-excel-file/node');
const ObjectsToCsv = require('objects-to-csv');

var googleConfig = require('./config').googleSearch;

async function getProduct(query, price) {
    const q = encodeURI(query)
    const url = `${googleConfig.url}?q=${q}&key=${googleConfig.credentials.apiKey}&siteSearch=cosmos.bluesoft.com.br&cx=${googleConfig.credentials.cx}&fields=items`
    try{
      const { data } = await axios.get(url);
      if (data.items[0].pagemap.metatags[0]['og:description'].includes("NCM")){
        return {
          ean: query,
          title: data.items[0].pagemap.metatags[0]['og:title'],
          description: data.items[0].pagemap.metatags[0]['og:description'],
          NCM:data.items[0].pagemap.metatags[0]['og:description'].split("-")[1].split("NCM:")[1],
          image: data.items[0].pagemap.metatags[0]['og:image'],
          price
      }
      }else{
      return {
        ean: query,
        title: data.items[0].pagemap.metatags[0]['og:title'],
        description: data.items[0].pagemap.metatags[0]['og:description'],
        NCM: "",
        image: data.items[0].pagemap.metatags[0]['og:image'],
        price
    }}
    }catch(err){
      console.log("dei erro na requisição")
      return {
        ean: query,
        title: '',
        description: '',
        NCM: "",
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
    const rows = await readXlsx('./input/coteta2.xlsx')

    const products = await Promise.all(rows.map(async ([ean, price], index) => {
    return await awaitRequest(index * 600, async () => {
        console.log(`Got product! ${rows.length}/${index+1}`)
        return await getProduct(ean, price)
      })}))
   console.log(products)
    const csv = new ObjectsToCsv(products);
    await csv.toDisk(`./output/scrapping.csv`);
})()