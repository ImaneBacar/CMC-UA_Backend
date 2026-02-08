require("dotenv").config()
const cors = require("cors");
const morgan = require('morgan');
const express = require("express");
const mongoose = require('mongoose');
const path = require('path'); 
const app = express()

mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin:[ "https://cmc-ua-frontend-ma7infrov-imane-bacars-projects.vercel.app",
  "https://cmc-ua-frontend.vercel.app"],
  credentials: true
})); 



db.on('error',(error)=> console.error(error))
db.once('open',() => console.log('Connected to Database'))

app.use(express.json())

const router = require('./routes/routes')
app.use('/api',router)

const PORT = process.env.PORT || 5014;

app.listen(PORT,()=> console.log('Server Started 3000'));
