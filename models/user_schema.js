const mongoose = require("mongoose");
const bcrypt =require("bcrypt");
const async = require("hbs/lib/async");

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
       
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true


    },
    status:{
        type:Boolean,
        default:true,
    },
    address:{
        type:String,
       
    },
    
    location:{
        type:String,
       
    },
    
    phone:{
        type:Number,
       
    },
    birthday:{
        type:Date,
       
       
    },
    user_img:{
        type:String,
        default:"avathar.jpg"
       
       
    },
    joined_On:Date,
    editedOn:Date,
    
   
});


//hashoing password

// userSchema.pre("save",async function(next){
//     if(this.isModified("password")){
//         this.password=await bcrypt.hash(this.password,10)
//         this.confirmpassword=await bcrypt.hash(this.password,10)
//     }
//     next();
// })


 
module.exports = mongoose.model("Register",userSchema);
