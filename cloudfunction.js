const { Datastore } = require('@google-cloud/datastore');
const path = require('path')
const datastore = new Datastore({
    keyFilename: path.join(__dirname, './sgmoid-8dcd415c2382.json'),
    projectId:'sgmoid',
});

async function quickstart() {
    const kind = 'Task';

    const name = 'sampleTask1';

    const taskKey = datastore.key([kind,name]);

    const task = {
        key: taskKey,
        data: {
            description: 'Buy Milk'
        }
    }

    await datastore.save(task).catch(Error => console.log(Error));
    console.log("It has been saved!")
}

quickstart();
