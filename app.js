require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const config = require('config');
// const dbgr = require("debug");
const port = 8080;

app.use(express.json());

//Routers
const usersRouter = require('./routes/user-route');

app.use('/users', usersRouter);

mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connected'))
    .catch(err => console.error('DB connection error:', err));


app.listen(port, () =>{
    console.log(`port ${port} is active`);
})