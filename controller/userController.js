const nodemailer = require ('nodemailer') ;
const userModal = require('../models/user_schema');
const roomModal =require('../models/rooms_schema')
const Booking = require('../models/booking_schema')
const wishlist_Model =require('../models/whishlist_schema')
const bcrypt =require('bcrypt');
const async = require('hbs/lib/async');
const randomString = require('randomstring');
const Rooms_module = require('../models/rooms_schema');
const { response } = require('../routes');
const Razorpay = require('razorpay');
const { resolve } = require('node:path');
const multer = require("multer")
const path =require("path");
const dotenv = require('dotenv').config({debug:true})
const { channel } = require('node:diagnostics_channel');
const flash =require('connect-flash')

const SERVICE_SID = process.env.TWILIO_SERVICE_SID;
const Account_SID =  process.env.TWILIO_ACCOUNT_SID;
const Auth_token = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(Account_SID,Auth_token)

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });


const sendVerifyMail = async(name,email,otp)=>{
  
try {
    const mailTransporter = nodemailer.createTransport({
        host:'smtp.gmail.com',
        service: "gmail",
        port:465,
        secure:true,
        auth:{
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD
        },
        tls:{
            rejectUnauthorized:false
        }

    });

    

    
    const mailDetails = {
        from:process.env.AUTH_EMAIL,
        to:email, 
        subject:"Email Confirmation from Bluepearl Hotels and Hospitality Management",
        text:"just random texts ",
        html:'<p>hi '+name+'your otp '+otp+''
    }
    mailTransporter.sendMail(mailDetails,(err,Info)=>{
        if(err){
            console.log(err);
        }else{
            console.log("email has been sent ",Info.response);
        }
    })
} catch (error) {
   console.log(error); 
}

}


//get home page
const homePageLoad = async(req,res)=>{
    try {
        SearchDeatilasError=req.session.SearchDeatilasError
       if(req.session.user){
            res.redirect('/users/homepage');
        } else{
            res.render('index',{SearchDeatilasError,layout:false});
        }



       
    } catch (error) {
        console.log(error);
    }
}
/======================== Sign Up Page ====================/
const getSignupPage =async(req,res)=>{
    try {
        if(req.session.user){
            res.redirect('/users/homepage')
        } else{
            res.render('user/user-signup', { layout: false,SignupUsreExistMsg:req.flash('SignupUsreExistMsg') }) 
        }
        
       
    } catch (error) {
        console.log(error);
    }
}

// insert signup
const insertUser=async(req,res)=>{
  
    try {
        let Email=req.body.email
        const userData= await userModal.findOne({email:Email});

        if(userData){



        req.flash('SignupUsreExistMsg','The account already exists')
            res.redirect('/user-signup')
        }else{

        

        const spassword = await securePassword(req.body.password);

            const user= ({
            name:req.body.name,
            email:req.body.email,
            password:spassword,
            joined_On:new Date(),
            

       });
      
      req.session.userDetails = user; //req.body details storing to session as temprorary
   
       const otpGenerator = await Math.floor(1000 + Math.random() * 9000);// Generating OTP as 4 digit random number 
       req.session.otp= otpGenerator;// Gnerated OTP storing to Session 
        if(user){
            sendVerifyMail(req.body.name,req.body.email,otpGenerator)//pre defined function that using to send main to user main ,passing user's name with mail, in the mail OTp it showing with greeting
            res.redirect('/otppage');   

        }else{
            res.redirect('/user-signup');

        }
    }

}catch (error) {
        
        console.log(error.message);
    }

}


// Password Hashing using Bcrypt
const securePassword = async(password)=>{
    try {
      const passwordHash=await bcrypt.hash(password,10)
      return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

//OTP page Rendering
/====================== OTP Page =======================/
const getUserOtpPage = async(req,res)=>{
    try {
        userDetails=req.session.userDetails;
        otpErr=req.session.otpErr;
        otpResendMsg=req.session.otpResendmessage
       res.render('user/otppage',{layout:false,userDetails,otpErr,otpResendMsg});
       req.session.otpErr=null;
       req.session.otpResendmessage=null;


       
    } catch (error) {
        console.log(error);
    }
}

//OTP Verification
const PostUserOtp = async(req,res)=>{
   
    try {
console.log(req.body.otp);
      const  userOTP= req.body.otp;//user endering OTP storing to a variable
     const  userDetails=req.session.userDetails;//session stored user details storing to a variable
    
     
        if (userOTP == req.session.otp){  //checking that both otp is same or not ,if same  details storing to database 
            const user=new userModal({
                name:userDetails.name,
                email:userDetails.email,
                password:userDetails.password,
              
                //is_admin:0
    
           });
           const userData=await user.save();// storing details to database
            res.redirect('/user-login')
        } else{
            req.session.otpErr="Invalid OTP";
            res.redirect('/otppage');
          
        }
      
    } catch (error) {
        console.log(error);
    }
}


/======================== Login Page ====================/

const getLoginPage =async(req,res)=>{
    try {
        loginErr=req.session.loginErr;

        //if(req.session.user){
        //    res.redirect('/users/homepage')
       // } else{
            res.render('user/user-login2', { layout: false ,blockErr:req.session.blockMsg,loginErr})
            req.session.blockMsg = false;
            req.session.loginErr=false;
       // }
    } catch (error) {
        console.log(error);
    }

}

const postLoginPage =async(req,res)=>{
  
    try{

  const email=req.body.username;
  const password=req.body.password;
   
  const userData= await userModal.findOne({email:email});


if(userData.status){
    const isMatch =await bcrypt.compare(password,userData.password)

    if(isMatch){
      req.session.userLoggedIn=true
     req.session.user=userData
     const user =req.session.user
     console.log(req.session.user)
      const uName=user.name
      
  //    res.status(201).render("user/homepage",{user,uName}); 
  res.redirect("/users/homepage");
}else{           
    // res.send("invalid login Details") 
    req.session.loginErr="Invalid login Details"
    res.redirect("/user-login")
} 

}else {
    req.session.blockMsg  = "You are Blocked"
    res.redirect("/user-login")
}
  
  

}catch(error){
    req.session.loginErr="Invalid login Details"
    res.redirect("/user-login")
// res.status(400).send("invalid login Detailsggggggggggggggggggggggg")
}
}







/======================== User FORGOT-PASSWORD Page ====================/

const getUserForgotPage = async(req,res)=>{
    try {

     ForgotPassMsg =req.session.ForgotPassMsg;
     ForgotErrorMsg= req.session.ForgotErrorMsg
       res.render('user/forgot-password',{ForgotPassMsg,ForgotErrorMsg,layout:false});// user Forgot password page rendering  
       req.session.ForgotPassMsg=null;
       req.session.ForgotErrorMsg=null;
    } catch (error) {
        console.log(error);
    }
}


//user forgot password Post method
const PostUserForgot = async(req,res)=>{
    try {

        const email=req.body.email; //user Entered email taking to a variable called email
        const userResetPassData= await userModal.findOne({email:email}); //user entered email finding on database,if in db it storing to a veriable
       
        
        if(userResetPassData){ //if we can find user
            req.session.userRestPassId= userResetPassData._id; // and user data storing to session
            req.session.userResetPassDataEmail=userResetPassData.email
            const validRandomString =randomString.generate(); //generate a random_string by using npm mudule random string 
            req.session.validRandomString=validRandomString; // and  storing random_String into session
            sendResetPasswordMail(userResetPassData.name,userResetPassData.email,validRandomString); //user's name,email,random_string passing to the fuction 
            req.session.ForgotPassMsg="please check your email to Reset Password"
            res.redirect('/forgot-password') 
        }else{
            req.session.ForgotErrorMsg="Invalid Email"
            res.redirect('/forgot-password') 
           
        }
         


       
    } catch (error) {
        console.log(error);
    }
}



const sendResetPasswordMail = async(name,email,validRandomString)=>{ //function taking some parameters 
  
    try {
        const mailTransporter = nodemailer.createTransport({ //configrating nodeMailer and creating mail 
            host:'smtp.gmail.com',
            service: "gmail",
            port:465,
            secure:true,
            auth:{
                user:process.env.AUTH_EMAIL,
                pass:process.env.AUTH_PASSWORD
            },
            tls:{
                rejectUnauthorized:false
            }
    
        });
    
        
    
        
        const mailDetails = {  
            from:process.env.AUTH_EMAIL,
            to:email, 
            subject:"Reset Password ",
            text:"Bluepearl Hotels and Hospitality Management ",  //sending reset password page with token as email
            html:'<p> Hi ' + name + ' click <a href ="https://bluepearl.ml/reset-password?token=' + validRandomString + '"> here to </a> to reset your password</p>'
        }
        mailTransporter.sendMail(mailDetails,(err,Info)=>{ //sendMail is pre-defined function -send Email
            if(err){
                console.log(err);
            }else{
                console.log("email has been sent ",Info.response);
            }
        })
    } catch (error) {
       console.log(error); 
    }
    
    }


    
/======================== User RESET-PASSWORD Page ====================/
    const getUserResetPassPage = async(req,res)=>{ //rendering Reset-password page
        try {
            const token=req.query.token;  //token storing to a varial from url 
          
            const validRandomString=req.session.validRandomString; //session stored random_string storing to a variable 
            const userRestPassId=req.session.userRestPassId; //user's  _id  storing 


            if(validRandomString && userRestPassId){ //checking that both random_Strings are some or not ,if both are some rendering reset-password page  
                res.render('user/reset-password',{user_id:userRestPassId,layout:false,ErrMsg:req.session.resetSuccessMsgErr});
                req.session.resetSuccessMsgErr=null;
            } else{
                res.send("page Not found")
            }
        
          
            

        } catch (error) {
            console.log(error);
        }
    }

    const PostUserReset = async(req,res)=>{ 

        try {
            if(req.body.password === req.body.confirmpassword){ //checking the both passwords ,if both are same - hashing password and updating user data into database

            const newPassword = req.body.password
            const userRestPassId = req.session.userRestPassId
            const newSecurePassword = await securePassword(newPassword);
            const updatedUserData = await userModal.findByIdAndUpdate({ _id: userRestPassId }, { $set: { password: newSecurePassword } })
            req.session.randomString = null; //and random_string and user's id changing as null
            req.session.userResetid = null;
    
           
            req.session.resetSuccessMsg = "Your password updated successfully.."
            res.redirect("/")
    
            } else{
                req.session.resetSuccessMsgErr = "Your password is Incorrect.."
                res.redirect('/reset-password')
               
            }
            
            
        
        //    res.render('user/reset-password',{layout:false});
            
    
    
           
        } catch (error) {
            console.log(error);
        }
    }
/==================================== RE-SEND OTP =======================/

    const resendOtp=async(req,res)=>{
        console.log(req.session.userDetails,"req.session.userDetails");
        if(req.session.userDetails){

       const otpGenerator = await Math.floor(1000 + Math.random() * 9000);// Generating OTP as 4 digit random number 
       req.session.otp= otpGenerator;// Gnerated OTP storing to Session 
       sendVerifyMail(req.session.userDetails.name,req.session.userDetails.email,otpGenerator)//pre defined function that using to send main to user main ,passing user's name with mail, in the mail OTp it showing with greeting
        req.session.otpResendmessage="OTP Resend to your Registered Email"
       res.redirect('/otppage');   

        }else{
            res.redirect('/user-signup')
        }
    }



/======================== User Profile Page ====================/

const getUserProfile =async(req,res)=>{
    if(req.session.user){
        usreRequirements=req.session.searchDetails 
        id=req.query.id
        console.log(id,"IIIIIIIIIIIIIIIIIIIIIIIIIISSSSSSSSSSSSSSSSSSSSSSSSSDDDDDDDDDDDDD");
        const userDet=await userModal.findOne({_id:id}).lean()
console.log(userDet,"AAAAAAAAAASSSSSSSSSSSSSSSSssss");
 
        res.render('user/user-profile',{userDet,usreRequirements,user:req.session.user})
       
    } else{
        res.redirect('/')
    }
    
}

/================================= User Booking ============================/

const PlaceOrder =(order,room,processed_data,search_Details,user_id)=>{
        return new Promise(async (resolve,reject)=>{
            console.log(order,"11111111111111111111111");
            console.log(room,"2222222222222222222222");
            console.log(processed_data,"33333333333333333333");
            console.log(search_Details,"4444444444444444444");
            Status=order.payment_method =='pay_at_hotel' ? 'Booked':'Pending'
            isStatusBooked=Status=='Booked' ? true:false
           
            let Booking_Details= new Booking ({
                   User_id:user_id,
                   Room_id :room._id,
                   room:room,
                   paymentMethod:order.payment_method,
                   total_Price:processed_data.RoomPrice,
                   number_of_Rooms:processed_data.Roomscount,
                   total_Days:search_Details.days,
                   adult:search_Details.adult,
                   children:search_Details.children,
                   checkin:search_Details.checkin,
                   checkout:search_Details.checkout,
                   destination:search_Details.destination,
                   Status:Status,
                   isStatusBooked:isStatusBooked
                })
                await Booking_Details.save().then((response)=>{
                    console.log(response);

                    
                   
                    console.log(response._id,"XXXXXXXXXXXXXXXXXXXXXXXXXXx");
                    resolve(response._id)
                    
                }).catch((err=>{
                    console.log(err,"======================");
                }))
        })




}





/================================= RazorPay ===================/
 const generateRazorPay=(orderId,total)=>{
         
    console.log(orderId,total,"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
     return new Promise((resolve,reject)=>{
            var options ={
                amount:total*100,
                currency: "INR",
                receipt: ""+orderId,
            };
            instance.orders.create(options,function(err,order){
                if(err){
                    console.log(err,"RazorPay Error");
                }
                console.log(order,"++++++++++++++++++++++++++++++++++++++++++=");
                resolve(order)
            })

     })
 }

/==================================== verifyPayment ======================/
const verifyPayment=(details)=>{
    console.log(details,"=======details in verify payment");
    return new Promise(async(resolve,reject)=>{
        const {
            createHmac
          } = await import('node:crypto');

          let hmac = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
          
            hmac.update(details['payment[razorpay_order_id]'] + '|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            } else{
                reject()
            }

    })
}




/============================ changePaymentStatus =====================/

const changePaymentStatus=(bookingId)=>{
    console.log(bookingId,"|||||||||||||||||||||||||||||||||||||||||||||||||");
    return new Promise(async(resolve,reject)=>{
        const booking= await Booking.updateOne({_id:bookingId},{ $set:{Status:"Booked", isStatusBooked:true} 
 }).then(()=>{
     resolve()
 })
    })
}


/ ========================================== Booking OTP Verification ========================/

const bookingOTPverification=async(req,res)=>{
 console.log(req.body,"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
 const number =req.body.mobile;
 console.log(number,"TTTTTTTTTT NUmber");
req.session.mobileNumber=req.body.mobile

        if(req.body.mobile ==""){

            let status=false;
            res.send(status)
        } else{
            let status=true;
            res.send(status)
        }



        client.verify
        .services(SERVICE_SID)
        .verifications.create({
         to: `+91${number}`,
            channel: "sms",
            
        })
        .then((res)=>{
            res.status(200).json({res})
        })

console.log(req.body.mobile,"MmmmmmmmmmmmmmmmmmMMMMMMMMMMMMMM");

}



/==================================== Mobile OTP POST ======================/
const mobileOTPVerification=async(req,res)=>{
    console.log(req.body.otp,"&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
    const number=req.session.mobileNumber
    console.log(number,"NNNNNNNNNNNNNUmber");
    const {otp}=req.body
    console.log(number,req.body.otp, {otp},"NNNNNNNNNNNNNNNNNNNNNNNNNNNN");
    try {
        
       client.verify
       .services(SERVICE_SID)
       .verificationChecks.create({
             to: `+91${number}`,
             code: otp
            
       })
       .then(response =>{
           console.log("OTP RESPONSE",response);

           if(response.valid){
            res.redirect('/booking-confirm-method')
           } else{
               req.session.MobileOTPErr="Invalid OTP"
            res.redirect('/users/checkout-page')

           }




           res.redirect('/booking-confirm-method')
       }).catch(err=>{
           console.log(err,"mobile ftvgybhnuj");
           res.redirect('/')
       })
       

    } catch (error) {
        console.log(error,"Mobile OTP POST ---Error");
        
    }

    console.log(number, {otp},"NNLLLLLLLLLLLLLLLLLLLLLLLLLL");
    
}

/============================ MOBILE OTP PAGE GET ========================/
const getmobileOTPpage=async(req,res)=>{

   

    res.render('user/booking-otp',{layout:false,MobileOTPErr:req.session.MobileOTPErr})
    req.session.MobileOTPErr=false

}

/============================ MOBILE OTP PAGE POST ========================/
const postmobileOTPpage=async(req,res)=>{
    
     console.log( req.body,"BBBBBBBBBBBBBBBBB");
     req.session.Proceedtopayment=req.body
     console.log(req.session.Proceedtopayment,"SSSSSSSSSSSSSSSSssss session");
     const number =req.body.mobile;
     req.session.mobileNumber=req.body.mobile
console.log(number,"AAAAAAAAAAAAAAAAAAA");
     client.verify
     .services(SERVICE_SID)
     .verifications.create({
        to: `+91${number}`,
         channel: "sms",
         
     })
     .then((res)=>{
         res.status(200).json({res})
     })

     res.redirect('/booking-otp')
   
}

/================================ POSTmobileOTP Booking OTP Verification ==================/
const POSTmobileOTP=async(req,res)=>{

    const number=req.session.mobileNumber
    const {otp}=req.body

    try {
        
        client.verify
        .services(SERVICE_SID)
        .verificationChecks.create({
              to: `+91${number}`,
              code: otp
             
        })
        .then(response =>{
            console.log("OTP RESPONSE",response);
 
            if(response.valid){
             res.redirect('/Confirm-payment')
            } else{
                req.session.MobileOTPErr="Invalid OTP"
             res.redirect('/booking-otp')
 
            }
 
 
 
 
           
        }).catch(err=>{
            console.log(err,"mobile ftvgybhnuj");
            req.session.MobileOTPErr="Invalid OTP"
            res.redirect('/booking-otp')
        })
        
 
     
 
 
 
 
     } catch (error) {
         console.log(error,"Mobile OTP POST ---Error");
         
     }

    console.log(req.body,"OOOOOOOOOOOOOOOOTTTTPPPPPPPP");
}



/===================== User Payment CONFIRM =======================/

const bookingConfirmMethod= async(req,res)=>{

res.render('user/booking-confirm-method')


}


/=============================== Wish List ============================/

const addWhishlist=(Room_id,room,user)=>{
    return new Promise(async(resolve,reject)=>{
        let isWishlist=await wishlist_Model.findOne({User_email:user.email})
       
    //    let count=isWishlist.Room_id.length+1;
    //    console.log(count,"CCCCCCCCCCCCCCCCCCCCCCC");
console.log(Room_id,">>>>>>>>>>>>>");
        if(isWishlist){
            // let isUserExist= await wishlist_Model.findOne({User_email:user.email})
            
            let isRoomExist= await wishlist_Model.findOne({User_email:user.email,'Room_id.room':Room_id})
            console.log(isRoomExist,"===============isRoomExist=");

            // let obj = {};
            // isRoomExist.Room_id.forEach((r)=>{
            //     if(String(r.Room_id)=== String(Room_id)){
            //         obj = r;
            //     }
            // })
            


console.log(isRoomExist,"tttttttttttttttttt");
if(isRoomExist){
    resolve({roomExist:true})
}else{
            await wishlist_Model.findOneAndUpdate({User_email:user.email},{
                $push:{
                    Room_id:{
                        room:Room_id,
                    },
                   
                }
            })
        
            resolve({RoomUpdate:true})
        }
        }else{
            let Newwish=await new wishlist_Model({
                Room_id:{
                    room:Room_id,
                },
               
                User_email:user.email,

            })
            await Newwish.save((err,result)=>{
                if(err){
                    reject({msg:"Something wend wrong"})
                }
                resolve()
            })
        }
    })
    console.log(Room_id,room,user,"ZZZZZZZZZZZZZZZZZzzzzzzzzzzz");
}









/================================== View Wish List ======================/

const viewWishlist=async(req,res)=>{
    const userd =req.session.user

    const Wishlist = await wishlist_Model
    .findOne({ User_email: userd.email })
    .populate("Room_id.room")
    .lean();





if(req.session.searchDetails){
    usreRequirements=req.session.searchDetails;
    res.render('user/wish-list',{Wishlist,isReadOnly:true,user:req.session.user,usreRequirements})
   }else if(req.session.searchResult){
    date=req.session.searchResult;
    res.render('user/wish-list',{Wishlist,isReadOnly:true,user:req.session.user,date})
   }else{
    res.render('user/wish-list',{Wishlist,isReadOnly:true,user:req.session.user})
   }

 
}








/============================= DELETE WISH LIST item ==================/

const deleteWishListItem=async(req,res)=>{
    const user =req.session.user

    console.log(req.query.id,"IDDDDDDDDDDDDDDSSSSSSSAAAAAAA");
    let id=req.query.id
    try {
      
        await wishlist_Model.findOneAndUpdate({User_email:user.email},
            { $pull:{ Room_id:{ room:id } } })
            console.log("scvbnbxzxcvbnbc");
        res.redirect('/view-Wishlist')

    } catch (error) {
        console.log(error,"DELETE WISH LIST item Error");
       

    }
}









/============================== confirm Payment method ================/

const getConfirmPayment=async(req,res)=>{


    res.render('user/Confirm-payment',{layout:false})
}
//  const getRoomDetails= (user_id)=>{
//      return new Promise (async (resolve,reject)=>{
//          let roomdet=await roomModal.findOne({_id:user_id})
//          resolve(roomdet)
         
//      })
//  }





// /======================== User Logout ====================/

// const userLogOut =async(req,res)=>{
//     try {
//         req.session.destroy();
//     } catch (error) {
//         console.log(error);
//     }
// }

module.exports={
    homePageLoad,
    getSignupPage,
    insertUser,
    getLoginPage,
    postLoginPage,
    getUserProfile,
    getUserOtpPage,
    PostUserOtp,
    getUserForgotPage,
    PostUserForgot,
    sendResetPasswordMail,
    getUserResetPassPage,
    PostUserReset,
    PlaceOrder,
    generateRazorPay,
    verifyPayment,
    changePaymentStatus,
    resendOtp,
    bookingOTPverification,
    mobileOTPVerification,
    bookingConfirmMethod,
    addWhishlist,
    viewWishlist,
    getmobileOTPpage,
    postmobileOTPpage,
    getConfirmPayment,
    POSTmobileOTP,
    deleteWishListItem,
   
   
    
    
}