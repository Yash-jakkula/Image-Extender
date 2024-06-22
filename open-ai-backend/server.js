const express = require('express');
const cors = require('cors');
const App = express();
const dalle = require('./routes/dalle');
const bodyParser = require('body-parser');
App.listen(5000,()=>{
    console.log("server listnening on port 500");
})

App.use(cors());
App.use(express.json({limit:'10mb'}));
App.use("/",dalle);







