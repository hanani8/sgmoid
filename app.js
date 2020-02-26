//Handle service account bullshit
//Give key file to the storage
const {format} = require('util');
const Multer = require('multer');
var express = require('express');
var app = express();
var path = require('path');
var request = require('request');
var bodyParser = require('body-parser');
const fs = require('fs');

//Imports Google Cloud Node.js client library
const {Storage} = require('@google-cloud/storage');
const {Datastore} = require('@google-cloud/datastore');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended:true }))

//Creates a Client
const bucketName = 'sgmoid-images';
const gc = new Storage(
      {
   keyFilename: path.join(__dirname,'./sgmoid-caf583f7b717.json'),
   projectId: 'sgmoid'
      }
                     );
const gcbucket = gc.bucket(bucketName);

const multer = new Multer({
   storage:Multer.memoryStorage(),
   limits: {
      fileSize: 5 * 1024 * 1024
           },
   preservePath: true
                          })

let Files = [];
let FilesfromFolder = [];

const datastore = new Datastore({
   keyFilename: path.join(__dirname,'./sgmoid-3ebacff9963e.json'),
   projectId:'sgmoid',
                                });

const insertVisit = visit => {
   return datastore.save({
     key: datastore.key('user'),
     data: visit,
                         });
                             };

app.get('/',function(req,res){
   res.render('form');
})

app.post('/upload',multer.single('file'), (req,res,next) => {
   if(!req.file) {
      res.status(400).send('No file uploaded')
      return;
   }
   var options = {
      'method': 'POST',
      'url': 'https://us-central1-amar-250808.cloudfunctions.net/Dummy_form',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      formData: {
        'file': {
          'value': fs.createReadStream('/home/hanani8/'+req.file.originalname),
          'options': {
            'filename': req.file.originalname,
            'contentType': null
          }
        }
      }
    };
     request(options, async function (error, response) { 
      if (error) throw new Error(error);
      const prediction = {
         data: response.body
      }
      try{
         await insertVisit(prediction);
         console.log(response.body);
         console.log(prediction);
      } catch(error) {
         next(error);
      }
      
    });

   Files.push(req.file.filename);
   
   //create a new blob in the bucket and upload the file data
   const blob = gcbucket.file(req.file.originalname);
   const blobStream = blob.createWriteStream({
      resumable: false,
      metadata:{
         contentType: "image/jpeg"
      }
   });

   blobStream.on('error', err => {
      console.log(err);
   })

   blobStream.on('finish', () => {
      const publicUrl = format(
         `https://storage.googleapis.com/${bucketName}/${blob.name}`
      );
      console.log(publicUrl);
      console.log(Files);
      res.status(200).send(publicUrl);
   });

   blobStream.end(req.file.buffer);
})

app.post('/uploaddir', multer.array('files'), (req,res) => {
   if(!req.files){
      res.status(400).send("No folder uploaded")
      return;
   }
   var array = req.files;
   var length = array.length;
   var urls = []
   array.forEach((a) => {
      FilesfromFolder.push(a.originalname);

      var options = {
         'method': 'POST',
         'url': 'https://us-central1-amar-250808.cloudfunctions.net/Dummy_form',
         'headers': {
           'Content-Type': 'application/x-www-form-urlencoded'
         },
         formData: {
           'file': {
             'value': fs.createReadStream('/home/hanani8/'+a.originalname),
             'options': {
               'filename': a.originalname,
               'contentType': null
             }
           }
         }
       };
       request(options, async function (error, response) { 
         if (error) throw new Error(error);
         const prediction = {
            data : response.body
         }
         try{
             await insertVisit(prediction);
             console.log(prediction);
             console.log(response.body);
         } catch(error) {
            next(error);
         }     
         });
   

      const blob = gcbucket.file(a.originalname);
      const blobStream = blob.createWriteStream({
         resumable:false,
         metadata:{
            contentType: "image/jpeg"
         }
      });

      blobStream.on('error', err => {
         console.log(err);
      })
      blobStream.on('finish', () => {
         const publicUrl = format(
            `https://storage.googleapis.com/${bucketName}/${blob.name}`
         );
         urls.push(publicUrl);
         res.status(200);
      })
      blobStream.end(a.buffer);
   })
   console.log(FilesfromFolder);
})

app.get('/getpredictions', async function(req,res){
   const query = datastore.createQuery('user');
   try{
      let predictions = await datastore.runQuery(query);
      res.send(predictions);
   }
   catch(error){
      next(error);
   }
});



//Listen to app-engine specified port or 8800;
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
   console.log(`Server is listening on ${PORT}`);
})


//If the browser is not chrome

//   var directoryPath = req.files.path;
  
//   const fileList = [];
  
//   let dirCtr = 1;
//   let itemCtr = 0;
//   const pathDirName = path.dirname(directoryPath);

//   getFiles(directoryPath);

//   function getFiles(directory) {
//      fs.readdir(directory, (err, items) => {
//         dirCtr--;
//         itemCtr += items.length;
//         items.forEach(item => {
//            const fullPath = path.join(directory, item);
//            fs.stat(fullPath, (err, stat) => {
//               itemCtr--;
//               if(stat.isFile()){
//                  fileList.push(fullPath);
//               }
//               else if(stat.isDirectory()) {
//                  dirCtr++;
//                  getFiles(fullPath);
//               }
//               if (dirCtr === 0 && itemCtr == 0){
//                  onComplete();
//               }
//            })
//         })
//      } )
//   }
//   console.log(fileList);
//   function onComplete(){
//      fileList.map(filePath => {
//         let destination = path.relative(pathDirName,filePath);
//         return gcbucket.upload(filePath, {destination} ).then(
//            uploadResp => ({fileName: destination, status: uploadResp[0]}),
//            err => ({fileName: destination, response: err})
//         )
//      })
//   }
// var options = {
//   'method': 'POST',
//   'url': 'https://us-central1-amar-250808.cloudfunctions.net/Dummy_form',
//   'headers': {
//     'Content-Type': 'application/x-www-form-urlencoded'
//   },
//   formData: {
//     'file': {
//       'value': fs.createReadStream('/home/hanani8/Pictures/Webcam/2020-02-17-192230.jpg'),
//       'options': {
//         'filename': '2020-02-17-192230.jpg',
//         'contentType': null
//       }
//     }
//   }
// };
// request(options, function (error, response) { 
//   if (error) throw new Error(error);
//   console.log(response.body);
// });