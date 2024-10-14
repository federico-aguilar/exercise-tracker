const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const mongodbUri = "mongodb+srv://federico:donutsAndCo44ee@ricocode.em5x0.mongodb.net/?retryWrites=true&w=majority&appName=Ricocode";
const parser = require('body-parser');

mongoose.connect(mongodbUri);
app.use(cors())
app.use(express.static('public'))
app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Initialize User schema and model
const userSchema = new mongoose.Schema({
  username: String
})
const UserModel = mongoose.model(
  'User', userSchema
)

//Initialize Exercise schema and model
const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
})
const ExerciseModel = mongoose.model(
  'Exercise', exerciseSchema
)

//Initialize Log schema and model
const logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: Array
})
const Log = mongoose.model(
  'Log', logSchema
)

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

app.post('/api/users', function (req, res) {
  const username = req.body.username;
  UserModel.create({
    username
  }).then(doc => {
    res.json({
      username: doc.username,
      _id: doc._id
    })
  })
});

app.get('/api/users', function (req, res) {
  UserModel.find({}).then(users => {
    //will have to map to only fields: username, _id
    let modifiedUsers = users.map(user => {return { "_id": user._id, "username": user.username }})
    res.send(modifiedUsers);
  });
});

app.post('/api/users/:_id/exercises', async function (req, res) {
  let _id = req.params._id;
  let date = req.body.date;
  //if (date == null || date == "") date = new Date().toISOString().replace('-', '/').split('T')[0].replace('-', '/');
  if (date == "") {
     date = new Date().toDateString()
  } else {
    date = new Date(date).toDateString();
  };

  let user = await UserModel.findById(_id).exec();
  
  ExerciseModel.create({
    username: user.username,
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date
  }).then(doc => {
    res.json({
      _id: doc._id,
      username: doc.username,
      description: doc.description,
      duration: doc.duration,
      date: doc.date
    })
  });
})

app.get('/api/users/:_id/logs', async (req, res) => {
  let _id = req.params._id;
  let user = await UserModel.findById(_id).exec();
  let username = user.username;
  
  //query parms
  let limit = req.query.limit;
  let from = req.query.from != "" || req.query.from != undefined ? new Date(req.query.from) : null;
  let to = req.query.to != "" || req.query.from != undefined ? new Date(req.query.to) : null;
  //const { from, to, limit} = req.query;
  
  let logQuery = ExerciseModel.find({ username });
  
  //Applying filters
  if (limit != null && limit > 0) {
    console.log("in limit")
    logQuery.limit(limit);
  }
  if (from) {
    console.log("in from");
    logQuery = logQuery.where('date').gte(from);
  }
  if (to != "Invalid Date") {
    console.log("in to");
    logQuery = logQuery.where('date').lte(to);
  }

  let logs = await logQuery.exec();
  console.log("logs: ");
  console.log(logs);
  /*--
  let log = await ExerciseModel
  .find({ username })
  .then(exercises => {
    return exercises.map(ex => {
      return {
        "description": ex.description,
        "duration": ex.duration, 
        "date": ex.date
      }
    })
  });
  --*/

  res.json({
    "_id": user._id,
    "username": username,
    "count": logs.length,
    logs
  })
})
