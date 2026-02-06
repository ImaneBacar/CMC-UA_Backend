require("dotenv").config()
const cors = require("cors");
const morgan = require('morgan');
const express = require("express");
const mongoose = require('mongoose');

const app = express()

mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));


app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
})); 



db.on('error',(error)=> console.error(error))
db.once('open',() => console.log('Connected to Database'))

app.use(express.json())

const router = require('./routes/routes')
app.use('/api',router)

app.listen(5014,()=> console.log('Server Started 3000'));
