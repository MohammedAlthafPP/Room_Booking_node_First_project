const mongoose = require("mongoose"),
Schema = mongoose.Schema

const async = require("hbs/lib/async");

const bookingSchema=new mongoose.Schema({
    timeAndDate:{
        type:Date,
        default:Date.now,
        
    },
    User_id: [{ type: Schema.Types.ObjectId, ref: 'Register'}],
       

    Room_id:[{ type: Schema.Types.ObjectId, ref: 'Room' }],
    // hotel_name:{
    //     type:String,
    //     required:true


    // },
    room:{
        type:Object,
       
       
    },
    paymentMethod:{
        type:String,
    },
    total_Price:{
        type:Number,
    },
    number_of_Rooms:{
        type:Number,
    },
    total_Days:Number,
    adult:Number,

    children:{
        type:Number,
        
    },
    checkin:{
        type:Date,
        required:true
    },
    checkout:{
        type:Date,
        required:true
    },
    destination:{
        type:String,
    },
    Status:String,
    isStatus:{
        type:Boolean,
        default:true,
    },
    stayingStatus:{
            type:String,
            default:"Not arrived yet"
    },
    isStayingStatusChanged:{
        type:Boolean,
        default:false
    },
    isStatusBooked:Boolean,
    
},

{timestamps:true}   

);



 
module.exports =new mongoose.model("Booking",bookingSchema);

