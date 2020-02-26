const {Datastore} = require('@google-cloud/datastore');
const path = require('path');
const datastore = new Datastore({
    keyFilename: path.join(__dirname,'./sgmoid-3ebacff9963e.json'),
    projectId:'sgmoid',
 });
async function Hanani (){
 const query = datastore.createQuery('user');
 try{
 let [predictions] = await datastore.runQuery(query);
console.log(predictions);
} catch(error){
    console.log(error);
}
}
Hanani();