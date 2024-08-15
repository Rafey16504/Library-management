const express = require('express');
const bodyParser = require('body-parser');
import { bookRouter } from './library_management';
const cors = require('cors');
const app = express();
const port = 8100;
export const client = require('./db.ts')

app.use(bodyParser.json());
app.use(cors());
app.use(express.json({limit:"25mb"}));
app.use(express.urlencoded({limit:"25mb"}))
app.use((req:any,res:any,next:any)=>{
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
})
app.use('/',  bookRouter);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

client.connect();