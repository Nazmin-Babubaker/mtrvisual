import express from 'express';
import { configDotenv } from 'dotenv';
import {runMtr} from './utils/mtr.js';
configDotenv();


const app = express();
app.use('/trace', trace);

const PORT = process.env.PORT
app.listen(PORT,()=>{
    console.log(`server listeninting on port ${PORT}`)
})