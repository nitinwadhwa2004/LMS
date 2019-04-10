const express = require('express');
const mongoose = require('mongoose');
//We don't want to grap anything from this file. By calling require, it will ensure that the 
//file runs and it is going to ensure that mongoose connect to the database. 
require('./db/mongoose') 
const userRouter = require('./routers/userRouter');

const app = express();
const port = process.env.PORT || 3000;

//this will automatically parse incoming JSON to object (based on body-parser) so we can access it in our request handlers.
app.use(express.json());
app.use(userRouter);

app.listen(port, () => {
    console.log(`Server started. Listening on port ${port}`);
})