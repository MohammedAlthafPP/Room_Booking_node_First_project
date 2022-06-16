const mongoose=require("mongoose")
require('dotenv').config({debug:true})

mongoose.connect(process.env.MONGODB_URL,{useNewUrlparser:true})
.then(()=>{
    console.log("Connection successful");
}).catch((e)=>{
    console.log("Connection Filed");
})