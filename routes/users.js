var express = require("express");
const async = require("hbs/lib/async");
var router = express.Router();
const Room = require("../models/rooms_schema");
const UserModel = require("../models/user_schema");
const Booking = require("../models/booking_schema");
const Wishlist_model = require("../models/whishlist_schema");
const Coupon_Model = require("../models/coupon_schema");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");

const verifyUser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/user-login");
  }
};
const verifyUserToHomepage = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/users/hompage");
  }
};

//=========================== MULTER ===============
//define multer storege
const Storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/User-profile/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    req.session.imgmessage = "Only JPEG OR PNG images";
  }
};

const upload = multer({
  storage: Storage,
  limits: {
    fieldSize: 1024 * 1024 * 10,
  },
  fileFilter: fileFilter,
});

// ======================== Homepage ===============
router.get("/homepage", async function (req, res, next) {
  const user = req.session.user;
  console.log(req.session.user);
  const date = req.session.searchResult;

  if (req.session.searchDetails) {
    const usreRequirements = req.session.searchDetails;

    const Place = usreRequirements.destination;
    if (Place != "") {
      const rooms = await Room.find({ place: Place }).lean();

      res.render("user/homepage", {
        rooms,
        usreRequirements,
        user,
        date,
        message: req.flash("msg"),
        daysZeroErr: req.flash("daysZeroErr"),
        
      });
    } else {
      const rooms = await Room.find({}).lean();

      res.render("user/homepage", {
        rooms,
        usreRequirements,
        user,
        date,
        message: req.flash("msg"),
        daysZeroErr: req.flash("daysZeroErr"),
        
      });
    }
  } else if (req.session.user) {
    const rooms = await Room.find({}).lean();
    res.render("user/homepage", {
      rooms,
      user,
      date,
      message: req.flash("msg"),
      daysZeroErr: req.flash("daysZeroErr"),
    });
  } else {
    req.session.SearchDeatilasError = "Please Fill the Fields";
  }
});

// ======================== GUEST Homepage ===============
router.get("/guest-homepage", function (req, res) {
  req.flash("msg", "Hi Every one god bless you");
  res.render("user/guest-homepage", { admin: true });
});

// ==================== single product page ================?
router.get("/single-room-page", async function (req, res) {
  const id = req.query.id;
  const user = req.session.user;
  console.log(id);
  isReadOnly = true;

  try {
    const rooms = await Room.findById({ _id: id }).lean();
    console.log(rooms);

    if (req.session.searchDetails) {
      usreRequirements = req.session.searchDetails;
      res.render("user/single-room-page", {
        rooms,
        user,
        usreRequirements,
        isReadOnly,
      });
    } else if (req.session.searchResult) {
      date = req.session.searchResult;
      res.render("user/single-room-page", { rooms, user, date, isReadOnly });
    } else {
      res.render("user/single-room-page", { rooms, user, isReadOnly });
    }
  } catch (err) {
    console.log(err);
  }
});
// ================ filtter ============================

router.get("/filters", (req, res) => {
  price_range = req.query.priceRange;
  bed = req.query.bed;
  bathroom = req.query.bathroom;
  console.log(price_range, bed, bathroom, "Filter");
});

// ================== user checkout page ===========
router.get("/checkout-page",verifyUser, async (req, res) => {
  const id = req.query.id;
  console.log(id, "============checkout-page");
  const user = req.session.user;

  try {
    if (req.session.searchDetails) {
      if (req.session.searchDetails.days <= 0) {
        req.flash('daysZeroErr',"You Selected Same date ,Please Choose valid one")
        res.redirect("/users/homepage");
      } else {
        const searchDetails = req.session.searchDetails;
        const usreRequirements = req.session.searchDetails;
        const rooms = await Room.findById({ _id: id }).lean();
        console.log(rooms);

        if (parseInt(searchDetails.adult) >= 2) {
          let room = parseFloat(searchDetails.adult) / 2;
          let Roomscount = Math.round(parseFloat(room));
          let RoomPrice =
            parseInt(searchDetails.days) *
            parseInt(rooms.total) *
            parseInt(Roomscount);

          req.session.roomCalc = {
            Roomscount: Roomscount,
            RoomPrice: RoomPrice,
          };
          console.log(
            req.session.roomCalc,
            "<<<<<<<<<<<<<<<<<< Roomcalc >>>>>>>>>>>>>>>>>>>>>>>>>>>"
          );
        } else {
          let Roomscount = parseInt(searchDetails.room);
          let RoomPrice = parseInt(searchDetails.days) * parseInt(rooms.total);
          req.session.roomCalc = {
            Roomscount: Roomscount,
            RoomPrice: RoomPrice,
          };
        }

        //res.render("users/ghjkl");
        res.render("user/checkout-page", {
          user,
          rooms,
          processdata: req.session.roomCalc,
          searchDetails: req.session.searchDetails,
          MobileOTPErr: req.session.MobileOTPErr,
          usreRequirements,
          isReadOnly: true,
         
        });
        req.session.MobileOTPErr = false;
      }
    } else if (req.session.searchResult) {
      const searchDetails = req.session.searchResult;
      const date = req.session.searchResult;
      const rooms = await Room.findById({ _id: id }).lean();

      if (parseInt(searchDetails.adult) >= 2) {
        let room = parseFloat(searchDetails.adult) / 2;
        let Roomscount = Math.round(parseFloat(room));
        let RoomPricewithout =
          parseInt(searchDetails.days) *
          parseInt(rooms.price_withOut_security_deposit) *
          parseInt(Roomscount);
        let RoomPrice =
          parseInt(RoomPricewithout) + parseInt(rooms.security_deposit);
        console.log(
          Roomscount,
          RoomPrice,
          rooms,
          "==Roomscount, RoomPrice, rooms"
        );

        req.session.roomCalc = {
          Roomscount: Roomscount,
          RoomPrice: RoomPrice,
        };
        console.log(
          req.session.roomCalc,
          "<<<<<<<<<<<<<<<<<< Roomcalc >>>>>>>>>>>>>>>>>>>>>>>>>>>"
        );
      } else if (parseInt(searchDetails.adult) == 1) {
        let Roomscount = parseInt(searchDetails.room);
        let RoomPrice = parseInt(searchDetails.days) * parseInt(rooms.total);
        req.session.roomCalc = {
          Roomscount: Roomscount,
          RoomPrice: RoomPrice,
        };
      }

      res.render("user/checkout-page", {
        user,
        rooms,
        processdata: req.session.roomCalc,
        searchDetails: req.session.searchResult,
        MobileOTPErr: req.session.MobileOTPErr,
        date,
        isReadOnly: true,
       
      });
      req.session.MobileOTPErr = false;
    } else {
      console.log("AAAAAAAAAAAAAAAAAAAAAAAAAA");
      req.flash("msg", "Choose Destination and Date");
      res.redirect("/users/homepage");
    }
  } catch (err) {
    console.log(err);
    console.log("BBBBBBBBBBBBBBBBBBBBB");
    res.redirect("/users/homepage");
  }
});

// ========================== payment page =============================
router.get("/payment-page", (req, res) => {
  res.render("user/payment-page", { user: true });
});

// =========================== LANDING PAGE SEARCH FORM ===========================

router.post("/landingSearch", async (req, res) => {
  console.log(req.body, "+++++++++++++++++++ req.body");
  req.session.searchDetails = {
    destination: req.body.destination,
    room: req.body.room,
    adult: req.body.adult,
    children: req.body.children,
    checkin: req.body.checkin,
    checkout: req.body.checkout,
    total_hours: req.body.total_hours,
    days: req.body.days,
  };

  res.redirect("/users/homepage");
});

// ========================== billing ====================
router.post("/billing", verifyUser, (req, res) => {
  const Room_id = req.query.room_id;
  const User_id = req.query.user_id;
  console.log(Room_id, "Aa");
  console.log(User_id, "kkkk");

  console.log(
    req.body,
    "Billing000000000000000000000000000000000000000000000000000000"
  );
});

//  ==========================================

router.get("/autocomplete", (req, res) => {
  var regx = new RegExp(req.query["term"], "i");
  var rooms = Room.find({ place: regx }, { place: 1 })
    .sort({ updated_at: -1 })
    .sort({ created_at: -1 })
    .limit(3);
  console.log(rooms, "=============");
  rooms.exec(function (err, data) {
    console.log(data, "????????????????????????????????????????");
    var result = [];
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach((element) => {
          let obj = {
            id: element._id,
            label: element.place,
          };
          console.log(obj, "OOOOOOOOOOOOOBBBBBBBBBBBJJJJJJJJJJJ");
          result.push(obj);
        });
      }
      res.jsonp(result);
      console.log(result);
    }
  });
});

// ====================================== Order Sucess ================

router.get("/order-Success", verifyUser, (req, res) => {
  const user = req.session.user;

  res.render("user/order_Success", { layout: null, user });
});

// ==================================== view-booking ===================

router.get("/view-booking", async (req, res) => {
  const user = req.session.user;

  id = req.query.id;

  const bookingDetails = await Booking.find({ User_id: id })
    .sort({ timeAndDate: "desc" })
    .lean()
    .exec();
  
  if (req.session.searchDetails) {
    usreRequirements = req.session.searchDetails;
    res.render("user/view-booking", {
      user,
      bookingDetails: bookingDetails,
      usreRequirements,
      isReadOnly: true,
    });
  } else if (req.session.searchResult) {
    date = req.session.searchResult;
    res.render("user/view-booking", {
      user,
      bookingDetails: bookingDetails,
      date,
      isReadOnly: true,
    });
  } else {
    res.render("user/view-booking", {
      user,
      bookingDetails: bookingDetails,
      isReadOnly: true,
    });
  }
});

// ========================== cancle Order ======================

router.get("/cancle-booking", async (req, res) => {
  const user = req.session.user;
  let room_id = req.query.room_id;
  let R_id = req.query.R_id;
  let RoomCount = req.query.rc;
  let user_id = user._id;

  console.log(room_id, "ROOM");
  console.log(user_id, "USER");
  console.log(R_id, "R_id");
  console.log(RoomCount, "RoomCount");
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

  await Booking.findOneAndUpdate(
    { _id: room_id },
    { $set: { Status: "Cancelled", isStatus: false } }
  );

  await Room.updateOne(
    { _id: R_id },
    {
      $inc: {
        available_roomS: +RoomCount,
      },
    }
  );

  const bookingDetails = await Booking.find({ User_id: user_id })
    .sort({ timeAndDate: "desc" })
    .lean()
    .exec();
  res.render("user/view-booking", { user, bookingDetails });
});

// ============================= /destination FILTER ========================

router.post("/destination", async (req, res) => {
  const Place = req.body.place;
  console.log(Place, "===Place");
  const rooms = await Room.find({ place: Place });

  res.json({ rooms });
});

//======================================== EDIT USER PROFILE ========================
router.post(
  "/Edit_user_profile",
  upload.single("user_img"),
  async (req, res) => {
    id = req.query.id;

    if (req.file) {
      const userDeti = await UserModel.updateOne(
        { _id: id },
        {
          $set: {
            name: req.body.name,
            lastname: req.body.lastname,
            address: req.body.address,
            location: req.body.location,
            phone: req.body.phone,
            birthday: req.body.birthday,
            user_img: req.file.filename,
            editedOn: new Date(),
          },
        }
      );
    } else {
      const userDeti = await UserModel.updateOne(
        { _id: id },
        {
          $set: {
            name: req.body.name,
            lastname: req.body.lastname,
            address: req.body.address,
            location: req.body.location,
            phone: req.body.phone,
            birthday: req.body.birthday,
            editedOn: new Date(),
          },
        }
      );
    }

    const userDet = await UserModel.findOne({ _id: id }).lean();

    if (req.session.searchDetails) {
      usreRequirements = req.session.searchDetails;
      res.render("user/user-profile", {
        userDet,
        user: req.session.user,
        usreRequirements,
        isReadOnly: true,
      });
    } else if (req.session.searchResult) {
      date = req.session.searchResult;
      res.render("user/user-profile", {
        userDet,
        user: req.session.user,
        date,
        isReadOnly: true,
      });
    } else {
      res.render("user/user-profile", {
        userDet,
        user: req.session.user,
        isReadOnly: true,
      });
    }
  }
);

// =================================================== user Profile Billing ======================
router.get("/user-pro-billing", async function (req, res, next) {
  const id = req.query.id;

  const bookingDetails = await Booking.find({ User_id: id })
    .sort({ timeAndDate: "desc" })
    .lean()
    .exec();

  const bookingCount = await Booking.find({ User_id: id }).count();
  const bookingBookedCount = await Booking.find({ User_id: id }).count({
    Status: "Booked",
  });
  const bookingCancelledCount = await Booking.find({ User_id: id }).count({
    Status: "Cancelled",
  });
  const Booked = await Booking.find({
    $and: [{ User_id: id }, { Status: "Booked" }],
  });
  const Cancelled = await Booking.find({
    $and: [{ User_id: id }, { Status: "Cancelled" }],
  });

  if (req.session.searchDetails) {
    usreRequirements = req.session.searchDetails;
    res.render("user/user-pro-billing", {
      bookingDetails,
      bookingCount,
      bookingBookedCount,
      bookingCancelledCount,
      user: req.session.user,
      usreRequirements,
      isReadOnly: true,
    });
  } else if (req.session.searchResult) {
    date = req.session.searchResult;
    res.render("user/user-pro-billing", {
      bookingDetails,
      bookingCount,
      bookingBookedCount,
      bookingCancelledCount,
      user: req.session.user,
      date,
      isReadOnly: true,
    });
  } else {
    res.render("user/user-pro-billing", {
      bookingDetails,
      bookingCount,
      bookingBookedCount,
      bookingCancelledCount,
      user: req.session.user,

      isReadOnly: true,
    });
  }
});

//=========================change Password =======================
router.get("/user-change-password", (req, res) => {
  const user = req.session.user;

  res.render("user/user-change-password", {
    user,
    passwordSuccess: req.session.passwordSuccess,
    passwordError: req.session.passwordError,
    ConfirmPssErr: req.session.ConfirmPssErr,
    isReadOnly: true,
  });
  req.session.passwordSuccess = false;
  req.session.passwordError = false;
  req.session.ConfirmPssErr = false;
});

//===================  CHANGE USER PASSWORD   =======================
router.post("/editpassword", async (req, res) => {
  try {
    let userId = req.query.id;
    let oldpassword = req.body.oldpassword;
    let newpassword = req.body.newpassword;
    let confirmpassword = req.body.confirmpassword;

    let changePasswordData = await UserModel.findById(userId);

    const isPasswordMatch = await bcrypt.compare(
      oldpassword,
      changePasswordData.password
    );

    if (isPasswordMatch) {
      if (newpassword === confirmpassword) {
        if (oldpassword != newpassword) {
          const hashpassword = await securePassword(newpassword);

          await UserModel.updateOne(
            { _id: userId },
            {
              $set: {
                password: hashpassword,
              },
            }
          );
          console.log("Password updated successfully");
          req.session.passwordSuccess = "Password updated successfully";
        } else {
          console.log("Use new password!!!!!");
          req.session.passwordError = "Use new password!!!!!";
        }
      } else {
        req.session.ConfirmPssErr = "Confirm Password Not Match";
        res.redirect("/users/user-change-password");
      }
    } else {
      console.log("password not matched ");
      req.session.passwordError = "Invalid Password";
    }

    res.redirect("/users/user-change-password");
  } catch (error) {
    console.log(error);
  }
});

// Password Hashing using Bcrypt
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
//================================= HomePage SEARCH =================

router.post("/datesubmit", async (req, res) => {
  req.session.searchDetails = req.body;

  let date = req.session.searchDetails;

  const user = req.session.user;
  if (req.body.destination) {
    const Place = req.session.searchDetails.destination;
    // const Place=req.session.searchResult.place
    const rooms = await Room.find({ place: Place }).lean();
    

    res.render("user/homepage", { rooms, user, date });


    
  } else  {
    const rooms = await Room.find({}).lean();

    res.render("user/homepage", { rooms, user, date });
  }
});

//===================== Apply code ==================
router.post("/applyCoupon", async (req, res) => {
  console.log(req.body, "-----coupon.body");
  console.log(req.session.roomCalc, "111111111112222222223333333333333");

  //verify coupon code

  try {
    let user = req.session.user;
    let coupon = req.body.couponCode;
    let bookingRoomId = req.body.room_id;

    isCouponActive = await Coupon_Model.findOne({ couponCode: coupon });

    if (isCouponActive) {
      if (isCouponActive.limit <= 0) {
        console.log("Coupon is Expired....");
        await Coupon_Model.findOneAndDelete({ couponCode: coupon });
      } else {
        isCouponUsed = await Coupon_Model.findOne({
          couponCode: coupon,
          usedUsers: { $in: [user._id] },
        });

        if (isCouponUsed) {
          console.log("you are already used the coupon...");
          req.flash("msgg", "you are already used the coupon...");
          res.json({Exist:true})
        } else {
          if (
            new Date().getTime() >=
            new Date(isCouponActive.expirationTime).getTime()
          ) {
            await Coupon_Model.findOneAndDelete({ couponCode: coupon });
            console.log("The coupon in expired......");
            res.json({expired:true})
          } else {
            req.session.roomCalc.RoomPrice =
              parseInt(req.session.roomCalc.RoomPrice) -
              parseInt(isCouponActive.discount);
            console.log(
              req.session.roomCalc.RoomPrice,
              "========final req.session.roomCalc.RoomPrice"
            );

            await Coupon_Model.updateOne(
              { couponCode: coupon },
              { $push: { usedUsers: user._id } }
            );

            await Coupon_Model.findOneAndUpdate(
              { couponCode: coupon },
              { $inc: { limit: -1 } }
            );
            await Room.findOneAndUpdate(
              { _id: bookingRoomId },
              { $set: { couponDiscount: isCouponActive.discount } }
            );
          }
        }
      }
      finalRent = req.session.roomCalc.RoomPrice;
      discount = isCouponActive.discount;

      console.log(finalRent, "finalRent", "===", discount);

      console.log("Active");

      res.json({ finalRent, discount });
    } else {
      let status = false;
      res.send(status);
      console.log("No coupon");
    }
  } catch (error) {
    console.log(error, "Coupon catch error");
  }
});

//============================ CHECK_OUT PAGE DATE SUBMISSION =================

router.post("/checkoutDatesubmition", async (req, res) => {
  const id = req.body.Room_id;
  console.log(req.body,"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  req.session.searchDetails = req.body;

  console.log(
    req.session.searchDetails,
    "ID",
    id,
    "======== new  session updatede"
  );

  try {
    console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
    if (req.session.searchDetails) {
      const searchDetails = req.session.searchDetails;
      const usreRequirements = req.session.searchDetails;
      const rooms = await Room.findById({ _id: id }).lean();

      if (searchDetails.room && searchDetails.adult && searchDetails.days) {
        console.log(searchDetails.room , searchDetails.adult ,searchDetails.days ,"searchDetails.room , searchDetails.adult ,searchDetails.daysb ============================================================================");
        let room = parseFloat(searchDetails.adult) / 2;
        let TotalRooms = Math.round(parseFloat(room));
        let UserRoomCount = parseInt(searchDetails.room);
        if (UserRoomCount >= TotalRooms) {
          let Roomscount = parseInt(searchDetails.room);
          let RoomPricewithout =
            parseInt(searchDetails.days) *
            parseInt(rooms.price_withOut_security_deposit) *
            parseInt(Roomscount);
          let RoomPrice =
            parseInt(RoomPricewithout) + parseInt(rooms.security_deposit);
          console.log(Roomscount, RoomPrice, rooms, "Roomscount");
          console.log(
            TotalRooms,
            "=TotalRooms",
            UserRoomCount,
            "==UserRoomCount"
          );

          req.session.roomCalc = {
            Roomscount: Roomscount,
            RoomPrice: RoomPrice,
          };
          console.log(
            req.session.roomCalc,
            "<<<<<<<<<<<<<<<<<< Roomcalc >>>>>>>>>>>>>>>>>>>>>>>>>>>",
            RoomPricewithout,
            "===RoomPricewithout"
          );
          const processdata = req.session.roomCalc;
          res.json(processdata);
        } else {
          if (req.session.searchDetails) {
            const searchDetails = req.session.searchDetails;
            const usreRequirements = req.session.searchDetails;
            const rooms = await Room.findById({ _id: id }).lean();

            if (searchDetails.adult >= 2) {
              let room = parseFloat(searchDetails.adult) / 2;
              let Roomscount = Math.round(parseFloat(room));
              console.log(Roomscount,"CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC");
              let RoomPricewithout =
                parseInt(searchDetails.days) *
                parseInt(rooms.price_withOut_security_deposit) *
                parseInt(Roomscount);
              let RoomPrice =
                parseInt(RoomPricewithout) + parseInt(rooms.security_deposit);

              req.session.roomCalc = {
                Roomscount: Roomscount,
                RoomPrice: RoomPrice,
              };
              console.log(
                req.session.roomCalc,
                "<<<<<<<<<<<<<<<<<< Roomcalc >>>>>>>>>>>>>>>>>>>>>>>>>>>"
              );
              const processdata = req.session.roomCalc;

              res.json({ processdata, isRoomCount: true });
            } else {
              let Roomscount = parseInt(searchDetails.room);
              let RoomPrice =
                parseInt(searchDetails.days) * parseInt(rooms.total);
              req.session.roomCalc = {
                Roomscount: Roomscount,
                RoomPrice: RoomPrice,
              };
            }

            res.render("user/checkout-page", {
            
              rooms,
              processdata: req.session.roomCalc,
              searchDetails: req.session.searchDetails,
              MobileOTPErr: req.session.MobileOTPErr,
              usreRequirements,
              isReadOnly: true,
            });
            req.session.MobileOTPErr = false;
          }
        }
      } else {
        console.log("/checkoutDatesubmition Error ======");
        res.render("user/checkout-page", {
         
          rooms,
          processdata: req.session.roomCalc,
          searchDetails: req.session.searchDetails,
          MobileOTPErr: req.session.MobileOTPErr,
          usreRequirements,
          isReadOnly: true,
        });
      }
    }
  } catch (error) {
    console.log("/checkoutDatesubmition Error ======catch",error);
    res.redirect("/users/homepage");
  }
});

// ======================== Users logot ===============
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/user-login");
});

module.exports = router;









