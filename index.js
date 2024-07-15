import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import userRouter from './Routers/userRouter.js';
import { config } from 'dotenv';

config();
// http://localhost:3000
const app= express();

app.use(cors({
  origin: 'https://www.maitilabs.org',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Authorization,Content-Type', // Include 'Authorization'
  credentials: true,
}));
  

app.use(express.json({ limit: '10mb' })); 

//================ database connection =============================
mongoose.connect(process.env.MONGODB_URL_LOCAL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(()=>{
    console.log("connected to Mongoose");
  }).catch(err=>{
    console.log(err);
  });
  
//==============================


app.use('/', userRouter);

//================ 
app.listen(process.env.PORT || 3001,()=>{
    console.log("listening on port 3001");
});




