const mongoose = require("mongoose"),
Schema = mongoose.Schema
const bcrypt =require("bcrypt");
const async = require("hbs/lib/async");

const wishlistSchema=new mongoose.Schema({
    timeAndDate:{
        type:Date,
        default:Date.now,
        
    },
    User_email:String,
       

    Room_id:[{ 
        room: {type: Schema.Types.ObjectId, ref: 'Room' }}]
   
   
    
   
});


 
module.exports = mongoose.model("Wish_List",wishlistSchema);
