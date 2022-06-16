
var express = require('express');
const async = require('hbs/lib/async');
var userRouter = express();
const User_Register = require("../models/user_schema")
const bcrypt = require("bcrypt")
const bodyParser = require('body-parser')
const userController = require('../controller/userController')
const Rooms =require('../models/rooms_schema')
const Booking_model=require('../models/booking_schema')
const multer = require("multer")
const path =require("path")


// userRouter.set('view engine','hbs');
// userRouter.set('views','./views');
const verifyUsertoLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/user-login')
  }
}

const verifyUserToLandingpage=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/')
  }
}



userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({extended:true}));


/============ GET landing page. =============/

userRouter.get('/', userController.homePageLoad); 



/============== GET user signup page =============/

userRouter.get('/user-signup', userController.getSignupPage);


userRouter.post('/user-signup', userController.insertUser);


/========================== GET user Login Page ==================/
 
userRouter.get('/user-login',userController.getLoginPage);

userRouter.post('/user-login',userController.postLoginPage);


/========================== GET user Profile Page ==================/

userRouter.get('/user-profile',userController.getUserProfile);

/============================ GET OTP Page ========================/

userRouter.get('/otppage',userController.getUserOtpPage);

/============================ POST OTP Page ========================/

userRouter.post('/otp',userController.PostUserOtp);

/============================ GET FORGOT-PASSWORD Page ========================/

userRouter.get('/forgot-password',userController.getUserForgotPage);

/============================ POST FORGOT-PASSWORD Page ========================/

userRouter.post('/forgot',userController.PostUserForgot);

/============================ GET RESET-PASSWORD Page ========================/

userRouter.get('/reset-password',userController.getUserResetPassPage);

/============================ POST RESET-PASSWORD Page ========================/

userRouter.post('/reset',userController.PostUserReset);

/===========================RE-SEND OTP  ======================================/
userRouter.get('/resentOtp',userController.resendOtp);


/============================ POST Place Order Page ========================/
userRouter.post('/place-order',async (req,res)=>{
    console.log(req.body,"//////////////////////////////////////");
   
   
    var Room_id = req.session.Proceedtopayment.Room_id
    var User_id = req.session.Proceedtopayment.user_id
      processed_data=req.session.roomCalc;
 
     var total=processed_data.RoomPrice
     if(req.session.searchDetails){
      search_Details=req.session.searchDetails;
     }else if(req.session.searchResult){
      search_Details=req.session.searchResult;
     }
    
    // let roomDetails=userController.getRoomDetails(Room_id)
    let roomDetails= await Rooms.findOne({_id:Room_id})
    userController.PlaceOrder(req.body,roomDetails,processed_data,search_Details,User_id).then(async(orderId)=>{
      const BookingDetail=await Booking_model.find({_id:orderId })
console.log( BookingDetail,processed_data,"NNNNNNNNNNNEEEEEEEEEEEEEEEEEEWWWWWWWWWWWWWWWWWWWWWww");
      let Roomcount=processed_data.Roomscount
console.log(Roomcount,"RRRRRRRRRRRRRRRRRRRRrr");
await Rooms.updateOne(
  { _id: Room_id},
  { $inc: { 
    available_roomS: -Roomcount  } }
);




      if(req.body.payment_method =='pay_at_hotel'){
        res.json({pahSuccess:true})
      } else{
        userController.generateRazorPay(orderId,total).then((response)=>{
          res.json(response)
        })
      } 
   
     
    console.log(orderId,total,"WWWWWWWWWWWWWWWWWWW");
    console.log(total,"WWWWWWWWWWWWWWWWWWW");
   
    })
});

/================================ POST Place Order Page  End=============================/



/*================================ payment verify =============================*/

userRouter.post('/verify-payment',(req,res)=>{
//'payment[razorpay_payment_id]'
  console.log(req.body,"@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

  userController.verifyPayment(req.body).then(()=>{
        userController.changePaymentStatus(req.body['order[receipt]']).then(()=>{
          console.log("payment Sucessful");
          res.json({status:true})
        })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
   } )
})


//================================ POST Place Order Page  End=============================/
userRouter.post('/otp-modal',userController.bookingOTPverification);

//============================= Mobile OTP =============================/

//userRouter.post('/mobileOTP',userController.mobileOTPVerification);

// ================================== booking-confirm-method ===========
userRouter.get('/booking-confirm-method',userController.bookingConfirmMethod)


//=============================== MOBILE OTP PAGE ==========================

userRouter.get('/booking-otp',verifyUserToLandingpage,userController.getmobileOTPpage)



//==========================  MOBILE OTP POST =======================
userRouter.post('/Mobilenumber',userController.postmobileOTPpage)

//=========================  /mobileotp Booking otp POST =========
userRouter.post('/mobileotp',userController.POSTmobileOTP)

//=========================================== Whish List =====================
userRouter.get('/wishList/:id',verifyUsertoLogin,async(req,res)=>{
  console.log(req.params.id,"IiiiiiiiiiiiiiiiiiiiDDDDDDDDDD");
  const user =req.session.user
  const Room_id =req.params.id
  const room=await Rooms.findOne({_id:Room_id}).lean()
  console.log(room,"NNNNNNNNNNNNNNEEEEEEEEEEWWWWWWWWWWWW");
  userController.addWhishlist(Room_id,room,user)
  .then((response)=>{
    
    if(req.session.user){
      res.json(response)
    }else{
      res.json({status:false})
    }
   console.log(req.session.user,"uuuuuuseeeeeeeeeeer");
  })


})


//===================== Wishlist DELETE SIGLE ITEM ++++++++++++++++++++++++
userRouter.get('/deleteWishlist',userController.deleteWishListItem)


//================================= View Wishlist =======================
 userRouter.get('/view-Wishlist',verifyUsertoLogin,userController.viewWishlist)




//============================ CONFIRM PAYMENT ++++++++++++++++++++++

userRouter.get('/Confirm-payment',verifyUserToLandingpage,userController.getConfirmPayment)











// var express = require('express');
// const res = require('express/lib/response');
// const async = require('hbs/lib/async');
// var router = express.Router();
// const Register=require("../models/user_schema")
// const bcrypt=require("bcrypt")
// /* GET home page. */
// router.get('/', function(req, res, next) {
 
//   res.render('index',{layout:null});
// });

// // ========================== user signup ===============
// router.get('/user-signup',function(req, res, next) {
 
//   res.render('user/user-signup',{layout:null});
// });



// router.post('/user-signup',async (req,res)=>{
//   console.log(req.body);
  
//   try{
        
//     const password=req.body.password;
//     const cpassword= req.body.confirmpassword; 
    
//     if(password=== cpassword){
//     const registerUser=new Register({
//       name:req.body. name,
//       email:req.body.email,
//        password: password,
//         confirmpassword:cpassword  

//     })

 

// const registered= await  registerUser.save(); 
// console.log(registered);

// req.session.userLoggedIn=true
// req.session.user=registerUser
// // console.log('******************************');
// // console.log(req.session.user);
//  res.status(201).render("index",{user:true})


// }else{
// res.send("password are not matching") 

// }
// }catch(error){
//     res.status(400).send(error)

//     console.log("the error part page");
// } 
// })






























// // ========================== user login ===============
// router.get('/user-login',function(req, res, next) {
//   res.render('user/user-login',{layout:null});
// });

// router.post('/user-login',async(req,res)=>{
// console.log(req.body);

// try{
//   const email=req.body.username;
//   const password=req.body.password;
   
//   const userData= await Register.findOne({email:email});

//   const isMatch =await bcrypt.compare(password,userData.password)

//   if(isMatch){
//     req.session.userLoggedIn=true
//    req.session.user=userData
//    console.log(req.session.user)
//       res.status(201).render("index",{user:true,user:req.session.user}); 

//   }else{           
//       res.send("invalid login Details") 

//   }

// }catch(error){
// res.status(400).send("invalid login Details")
// }
// })

// // =================================================== user Profile ======================
// router.get('/user-profile',function(req, res, next) {
//   res.render('user/user-profile',{user:true});
// });

// // =================================================== user Profile Billing ======================
// router.get('/user-pro-billing',function(req, res, next) {
//   res.render('user/user-pro-billing',{user:true});
// });

// /========================== GET user logout ==================/
// userRouter.get('/logout',userController.userLogOut)

// router.get('/logout',(req,res)=>{
// req.session.destroy()
// res.redirect('/user-login')
// })

 module.exports = userRouter;
