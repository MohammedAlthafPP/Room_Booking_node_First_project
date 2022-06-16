const mongoose = require("mongoose");
const multer = require('multer')
const bcrypt =require("bcrypt");
const async = require("hbs/lib/async");

const roomsSchema=new mongoose.Schema({
    updated_On: { type: Date, default: Date.now },
    room_id:{
        type:String,
        required:true
    },
    room_name:{
        type:String,
        required:true
    },
    room_type:{
        type:String,
        required:true,
       
    },
    description:{
        type:String,
        required:true


    },
    available_roomS:{
        type:Number,
        required:true
    },
     room_price:{
        type:Number,
        required:true
    },
    percentage_discount:{
        type:Number,
       
    },
    max_price:{
        type:Number,
        required:true
    },
    service_charge:{
        type:Number,
        required:true
    },
    tax_percentage:{
        type:Number,
        required:true
    },
    security_deposit:{
        type:Number,
    },
    place:{
        type:String,
        required:true
    },
    district:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    how_many_km:{
        type:String,
       
    },
    address:{
        type:String,
        required:true,   
    },
    bathrooms:{
        type:Number,
        required:true,
    },
    bed:{
        type:Number,
        required:true,   
    },
    freature:{
        type:Array,
    },
    features_of_room:[String],
    activities:[String],
   
    all_images:{
        required:true,
        type:Array,
       
        
    },
    rent:Number,
    gst:Number,
    discount:Number,
    price_without_discount:Number,
    price_withOut_security_deposit:Number,
    total:Number,
    isExisting:{
        type:Boolean,
        default:true,
    }
    
    //  gst:Number,
    // image_1:{
    //     required:true,
    //     type:String,
       
        
    // },
    // image_2:{
    //     required:true,
    //     type:Array,
       
        
    // },
   
    
});






const Rooms_module = new mongoose.model("Room",roomsSchema);
module.exports=Rooms_module;