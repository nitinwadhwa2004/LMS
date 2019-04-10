const mongoose = require('mongoose');

//To run mongodb server - c:/mongodb/bin/mongod.exe --dbpath=c:/mongodb-data
//Database Configuration
const connectionURL = "mongodb://127.0.0.1:27017";
const databaseName = 'LMS';

mongoose.connect(connectionURL + '/' + databaseName, {
    useNewUrlParser: true, 
    useCreateIndex: true
}) 

//We have a pending connection to the database running on localhost. We now need to get notified if we connect successfully or if a connection error occurs
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Database connection successful!");
});