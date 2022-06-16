var express = require("express");
var bodyParser = require("body-parser");
const res = require("express/lib/response");
var router = express.Router();
const Admin_Register = require("../models/admin_schema");
const User = require("../models/user_schema");
const Rooms_module = require("../models/rooms_schema");
const Booking_Model = require("../models/booking_schema");
const Coupon_Model = require("../models/coupon_schema");
const bcrypt = require("bcrypt");
const multer = require("multer");
const moment =require('moment')
const path = require("path");
const async = require("hbs/lib/async");
const { response } = require("express");
// const { path } = require('../app');

//middleware to check verify Admin login or not
const verifyAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect("/");
  }
};

//define multer storege
const Storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/rooms-img/");
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

/* GET All products. */
router.get("/", async function (req, res, next) {
  const viewBookingTotalCount = await Booking_Model.find({}).count();
  const RoomsTotalCount = await Rooms_module.find({}).count();
  const UsersTotalCount = await User.find({}).count();

  const profit = await Booking_Model.aggregate([
    { $group: { _id: null, Total: { $sum: "$total_Price" } } },
  ]);

  const TotalEarned = profit[0].Total;

  // const TotalConfirmedCount= await Booking_Model.find({}).count({Status: 'Booked'})
  // const TotalPendingCount= await Booking_Model.find({}).count({Status: "Pending"})
  // const TotalCancelledCount= await Booking_Model.find({}).count({Status: "Cancelled"})

  const BookingDetailsComp = await Booking_Model.find({})
    .populate("User_id")
    .sort({ timeAndDate: -1 })
    .limit(10)
    .lean();
  console.log(
    BookingDetailsComp,
    "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
  );
  console.log(
    BookingDetailsComp[0].User_id,
    "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"
  );
  console.log(
    BookingDetailsComp[0].User_id[0].name,
    "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"
  );

  console.log(
    viewBookingTotalCount,
    RoomsTotalCount,
    UsersTotalCount,
    TotalEarned
  );


  BookingDetailsComp.forEach(element=>{
    element.checkin=moment(element.checkin).format('llll');

  })
  BookingDetailsComp.forEach(element=>{
    element.checkout=moment(element.checkout).format('llll');

  })







  res.render("admin/dashboard", {
    admin: true,
    BookingDetailsComp,
    viewBookingTotalCount,
    RoomsTotalCount,
    UsersTotalCount,
    TotalEarned,
  });
});

router.get("/view-rooms", async function (req, res, next) {
  try {
    let TotalRooms = await Rooms_module.aggregate([
      { $group: { _id: null, Total: { $sum: "$available_roomS" } } },
    ]);
    TotalRooms = TotalRooms[0].Total;
    let TotalCheckinRooms = await Booking_Model.aggregate([
      { $match: { stayingStatus: "Check-in" } },
      { $group: { _id: null, Total: { $sum: "$number_of_Rooms" } } },
    ]);
    TotalCheckinRooms = TotalCheckinRooms[0].Total;
    let test = await Booking_Model.aggregate([
      { $match: { stayingStatus: "Check-in" } },
    ]);
    let TotalBookedRooms = await Booking_Model.aggregate([
      { $match: { Status: "Booked" } },
      { $group: { _id: null, Total: { $sum: "$number_of_Rooms" } } },
    ]);
    let BookedRooms = TotalBookedRooms[0].Total;
    TotalBookedRooms = BookedRooms - TotalCheckinRooms;
    let AvailableRooms = TotalRooms - BookedRooms;
    console.log(
      TotalRooms,
      TotalCheckinRooms,
      TotalBookedRooms,
      BookedRooms,
      AvailableRooms,
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    );

    let rooms = await Rooms_module.find({}).lean();
    res.render("admin/view-rooms", {
      roomsData: rooms,
      admin: true,
      TotalRooms,
      TotalCheckinRooms,
      TotalBookedRooms,
      AvailableRooms,
      isViewRooms: true,
    });
  } catch (err) {
    console.log(err, "====View-Booking Catch Err");
  }
});

//=============================== DELETE ROOMS ==================================
router.get("/delete-room/:id", async (req, res, next) => {
  let id = req.params.id;
  console.log(id);

  try {
    const room = await Rooms_module.deleteOne({ _id: id });
    console.log(room);
    res.redirect("/admin/view-rooms");
  } catch (error) {
    next(error);
  }
});

router.get("/edit-rooms", (req, res) => {
  res.render("admin/edit-rooms");
});

//=============================== EDIT-ROOM ==================================

router.get("/room-edit/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const rooms = await Rooms_module.findById(id).lean();
    console.log(rooms);
    res.render("admin/edit-rooms", { rooms, admin: true });
  } catch (err) {
    next(err);
  }
});

// router.post("/room-edit/:id",upload.single('images'),async (req,res,next) => {
router.post(
  "/room-edit/:id",
  upload.fields([
    { name: "images", maxCount: 1 },
    { name: "image_1", maxCount: 1 },
    { name: "image_2", maxCount: 1 },
  ]),
  async (req, res) => {
    const { id } = req.params;
    const newRoom = req.body;
    const roomImg = req.file;
    console.log(newRoom, "BBBBBBBBBBBBBBBBBBBBBB");
    let free_wifi = req.body.free_wifi;
    let free_parking = req.body.free_parking;
    let breakfast = req.body.breakfast;
    let Hour_24 = req.body.Hour_24;
    let bar = req.body.bar;
    let business_facilities = req.body.business_facilities;
    console.log(
      req.url,
      "uuuuuuuuuuuuuuuuuuuuuuuuuurrrrrrrrrrrrrrrrrllllllllllllll"
    );
    console.log(free_wifi, free_parking, "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

    try {
      let roomsData = await Rooms_module.findById(id).lean();

      console.log(req.files, "files");
      var main_img = req.files.images
        ? req.files.images[0].filename
        : roomsData.all_images[0].main_img;
      var aux_img_1 = req.files.image_1
        ? req.files.image_1[0].filename
        : roomsData.all_images[0].aux_img_1;
      var aux_img_2 = req.files.image_2
        ? req.files.image_2[0].filename
        : roomsData.all_images[0].aux_img_2;
      //       console.log(roomsData.all_images[0].main_img,"wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww");
      console.log(main_img, aux_img_1, aux_img_2);

      const rooms = await Rooms_module.updateOne(
        { _id: id },
        {
          $set: {
            room_id: req.body.room_id,
            room_name: req.body.room_name,
            room_type: req.body.room_type,
            description: req.body.description,
            available_roomS: req.body.available_roomS,
            room_price: req.body.room_price,
            percentage_discount: req.body.percentage_discount,
            max_price: req.body.max_price,
            service_charge: req.body.service_charge,
            tax_percentage: req.body.tax_percentage,
            security_deposit: req.body.security_deposit,
            place: req.body.place,
            district: req.body.district,
            state: req.body.state,
            address: req.body.address,
            bathrooms: req.body.bathrooms,
            bed: req.body.bed,
            freature: {
              free_wifi,
              free_parking,
              breakfast,
              Hour_24,
              bar,
              business_facilities,
            },
            features_of_room: req.body.features_of_room,
            activities: req.body.activities,
            all_images: { main_img, aux_img_1, aux_img_2 },
            rent:
              parseInt(req.body.room_price) + parseInt(req.body.service_charge),
            gst:
              ((parseInt(req.body.room_price) +
                parseInt(req.body.service_charge)) *
                parseInt(req.body.tax_percentage)) /
              100,
            discount:
              ((parseInt(req.body.room_price) +
                parseInt(req.body.service_charge)) *
                parseInt(req.body.percentage_discount)) /
              100,
            price_without_discount:
              parseInt(req.body.room_price) +
              parseInt(req.body.service_charge) +
              parseInt(req.body.security_deposit) +
              ((parseInt(req.body.room_price) +
                parseInt(req.body.service_charge)) *
                parseInt(req.body.tax_percentage)) /
                100,
            price_withOut_security_deposit:
              parseInt(req.body.room_price) +
              parseInt(req.body.service_charge) +
              ((parseInt(req.body.room_price) +
                parseInt(req.body.service_charge)) *
                parseInt(req.body.tax_percentage)) /
                100 -
              ((parseInt(req.body.room_price) +
                parseInt(req.body.service_charge)) *
                parseInt(req.body.percentage_discount)) /
                100,
            total:
              parseInt(req.body.room_price) +
              parseInt(req.body.service_charge) +
              parseInt(req.body.security_deposit) +
              ((parseInt(req.body.room_price) +
                parseInt(req.body.service_charge)) *
                parseInt(req.body.tax_percentage)) /
                100 -
              ((parseInt(req.body.room_price) +
                parseInt(req.body.service_charge)) *
                parseInt(req.body.percentage_discount)) /
                100,
          },
        }
      );
      console.log(rooms, "NEW ROOM ADDED");
      res.redirect("/admin/view-rooms");
    } catch (err) {
      console.log(err);
    }
  }
);

//=============================== GETTING ALL USERS ==================================
router.get("/view-users", async function (req, res, next) {
  try {
    let users = await User.find({}).lean();
    const TotalUsersCount = await User.find({}).count();
    const TotalActiveUsersCount = await User.find({ status: true }).count();
    const TotalBlockedUsersCount = await User.find({ status: false }).count();


    res.render("admin/view-users", {
      UserData: users,
      admin: true,
      TotalUsersCount,
      TotalActiveUsersCount,
      TotalBlockedUsersCount,
    });
  } catch (err) {
    next(err);
  }
});

// ================================== Add Rooms page rendering =====================
router.get("/add-rooms", function (req, res, next) {
  res.render("admin/add-rooms", {
    admin: true,
    message: req.session.roomAdded,
    messageerr: req.session.roomAddederr,
    imgmessage: req.session.imgmessage,
  });
  req.session.roomAdded = null;
  req.session.roomAddederr = null;
  req.session.imgmessage = null;
});

// ================================== Add Rooms =====================

// router.post('/add-rooms',upload.array('images',7),async (req,res)=>{
// router.post('/add-rooms',upload.single('images'),async (req,res)=>{
router.post(
  "/add-rooms",
  upload.fields([
    { name: "images", maxCount: 1 },
    { name: "image_1", maxCount: 1 },
    { name: "image_2", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log(
      req.body,
      "body&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
    );
    console.log(req.files, "---------------------");
    var main_img = req.files.images[0].filename;
    var aux_img_1 = req.files.image_1[0].filename;
    var aux_img_2 = req.files.image_2[0].filename;
    var free_wifi = req.body.free_wifi;
    var free_parking = req.body.free_parking;
    var breakfast = req.body.breakfast;
    var Hour_24 = req.body.Hour_24;
    var bar = req.body.bar;
    var business_facilities = req.body.business_facilities;
    console.log(free_wifi);
    console.log(main_img, aux_img_1, "##########################");
    // let arr = [];
    // req.files.forEach(f => {
    //   arr.push(f.filename);
    // })
    // console.log(arr);

    try {
      const addRooms = new Rooms_module({
        updated_On: req.body.updated_On,
        room_id: req.body.room_id,
        room_name: req.body.room_name,
        room_type: req.body.room_type,
        description: req.body.description,
        available_roomS: req.body.available_roomS,
        room_price: req.body.room_price,
        percentage_discount: req.body.percentage_discount,
        max_price: req.body.max_price,
        service_charge: req.body.service_charge,
        tax_percentage: req.body.tax_percentage,
        security_deposit: req.body.security_deposit,
        place: req.body.place,
        district: req.body.district,
        state: req.body.state,
        address: req.body.address,
        bathrooms: req.body.bathrooms,
        bed: req.body.bed,
        freature: {
          free_wifi,
          free_parking,
          breakfast,
          Hour_24,
          bar,
          business_facilities,
        },
        features_of_room: req.body.features_of_room,
        activities: req.body.activities,
        all_images: { main_img, aux_img_1, aux_img_2 },
        rent:
          parseInt(req.body.room_price) +
          parseInt(req.body.service_charge) +
          ((parseInt(req.body.room_price) + parseInt(req.body.service_charge)) *
            parseInt(req.body.tax_percentage)) /
            100,
        gst:
          ((parseInt(req.body.room_price) + parseInt(req.body.service_charge)) *
            parseInt(req.body.tax_percentage)) /
          100,
        discount:
          ((parseInt(req.body.room_price) + parseInt(req.body.service_charge)) *
            parseInt(req.body.percentage_discount)) /
          100,
        price_without_discount:
          parseInt(req.body.room_price) +
          parseInt(req.body.service_charge) +
          parseInt(req.body.security_deposit) +
          ((parseInt(req.body.room_price) + parseInt(req.body.service_charge)) *
            parseInt(req.body.tax_percentage)) /
            100,
        price_withOut_security_deposit:
          parseInt(req.body.room_price) +
          parseInt(req.body.service_charge) +
          ((parseInt(req.body.room_price) + parseInt(req.body.service_charge)) *
            parseInt(req.body.tax_percentage)) /
            100 -
          ((parseInt(req.body.room_price) + parseInt(req.body.service_charge)) *
            parseInt(req.body.percentage_discount)) /
            100,
        total:
          parseInt(req.body.room_price) +
          parseInt(req.body.service_charge) +
          parseInt(req.body.security_deposit) +
          ((parseInt(req.body.room_price) + parseInt(req.body.service_charge)) *
            parseInt(req.body.tax_percentage)) /
            100 -
          ((parseInt(req.body.room_price) + parseInt(req.body.service_charge)) *
            parseInt(req.body.percentage_discount)) /
            100,

        // images:arr,
        // images

        // images:req.file.filename,
        // images:req.files,
      });

      const roomData = await addRooms.save();
      console.log(roomData);

      if (roomData) {
        req.session.roomAdded = "Added Successfully";
        res.redirect("/admin/add-rooms");
      } else {
        req.session.roomAddederr = "something went wrong Room not added";
        res.redirect("/admin/add-rooms");
      }
    } catch (error) {
      res.status(400).send(error);

      console.log("the error part page");
    }
  }
);

// ============================== Add admin =========================
router.get("/add-admin", verifyAdmin, function (req, res, next) {
  res.render("admin/add-admin", { layout: null });
});

router.post("/add-admin", async (req, res) => {
  console.log(req.body);

  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;

    if (password === cpassword) {
      const registerAdmin = new Admin_Register({
        name: req.body.name,
        email: req.body.email,
        password: password,
        confirmpassword: cpassword,
      });

      const registered = await registerAdmin.save();
      console.log(registered);

      req.session.adminLoggedIn = true;
      req.session.admin = registerAdmin;
      // console.log('******************************');
      // console.log(req.session.user);
      res.status(201).redirect("/admin");
    } else {
      res.send("password are not matching");
    }
  } catch (error) {
    res.status(400).send(error);

    console.log("the error part page");
  }
});

// =======================admin login ============================
router.get("/admin-login", function (req, res, next) {
  if (req.session.adminLoggedIn) {
    res.redirect("/admin");
  } else {
    res.render("admin/admin-login", { layout: null });
  }
});

router.post("/admin-login", async (req, res) => {
  console.log(req.body);

  try {
    const email = req.body.username;
    const password = req.body.password;

    const adminData = await Admin_Register.findOne({ email: email });

    const isMatch = await bcrypt.compare(password, adminData.password);

    if (isMatch) {
      req.session.adminLoggedIn = true;
      req.session.admin = adminData;
      console.log(req.session.admin);
      res.status(201).redirect("/admin");
    } else {
      res.send("invalid login Details");
    }
  } catch (error) {
    res.status(400).send("invalid login Details");
  }
});

//DELETE USERS
router.get("/delete-user/:id", async (req, res, next) => {
  let id = req.params.id;
  console.log(id);

  try {
    const user = await User.deleteOne({ _id: id });
    console.log(user);
    res.redirect("/admin/view-users");
  } catch (error) {
    next(error);
  }
});

// /================================== /admin/add-room test ======================/
router.post("/add-room", (req, res) => {
  console.log(req.body, "new Add_rooms");
  console.log(req.file, "new Add_rooms images");
});

//============================= BLOCK USER ===========================

router.get("/block-user/:id", async (req, res) => {
  let id = req.params.id;

  await User.findOneAndUpdate({ _id: id }, { $set: { status: false } });
  res.redirect("/admin/view-users");
});

//============================= ACTIVE USER ===========================

router.get("/active-user/:id", async (req, res) => {
  let id = req.params.id;

  await User.findOneAndUpdate({ _id: id }, { $set: { status: true } });
  res.redirect("/admin/view-users");
});

// ====================== VIEW BOOKING =========================
router.get("/view-booking", async (req, res) => {
  const viewBooking = await Booking_Model.find({})
    .sort({ timeAndDate: -1 })
    .lean();
  const viewBookingTotalCount = await Booking_Model.find({}).count();
  const TotalConfirmedCount = await Booking_Model.find({}).count({
    Status: "Booked",
  });
  const TotalPendingCount = await Booking_Model.find({}).count({
    Status: "Pending",
  });
  const TotalCancelledCount = await Booking_Model.find({}).count({
    Status: "Cancelled",
  });

  console.log(
    viewBooking,
    viewBookingTotalCount,
    TotalConfirmedCount,
    TotalPendingCount,
    TotalCancelledCount,
    "NNNNNNNNNNNNNNNNNNNNNNNNEEEEEEEEEEEEEEEEEEEEWWWWWWWWWWWWWWWWWW"
  );
  res.render("admin/view-booking", {
    viewBooking,
    viewBookingTotalCount,
    TotalConfirmedCount,
    TotalPendingCount,
    TotalCancelledCount,
    admin: true,
  });
});

// ==================== ADD COUPON CODE ==================================
router.get("/add-coupon", (req, res) => {
  res.render("admin/add-coupon");
});

// ========================= ADD COUPON POST ================================
router.post("/newcoupon", async (req, res) => {
  console.log(req.body, "((((((((((((((((((((((((( coupon body");

  try {
    const newCoupon = new Coupon_Model({
      couponName: req.body.couponname,
      couponCode: req.body.couponcode,
      limit: req.body.limit,
      expirationTime: req.body.expiredate,
      discount: req.body.discount,
    });
    await newCoupon.save();
    res.redirect("/admin/add-coupon");
  } catch (error) {
    console.log(error);
  }
});

//========================== View COUPONS ================
router.get("/View-coupons", async (req, res) => {
  const copounsDetails = await Coupon_Model.find({}).lean();
      
  console.log(copounsDetails, "ccccccccccccccccccccccccccccccccccccccccccc");
 

  res.render("admin/View-coupons", { copounsDetails ,admin:true});
 
});

//====================== Edit COUPONS ====================
router.get("/edit-coupon", async (req, res) => {
  console.log(
    req.query.id,
    "IIIIIIIIIIIIIIIIIIIIIIIIIBBBBBBBBBBBMMMMMMMMMMMMM"
  );
  const id = req.query.id;
  const editCouponData = await Coupon_Model.find({ _id: id }).lean()
  console.log(editCouponData,"CCCCCOOOOUUUP");

  res.render("admin/edit-coupon", { editCouponData,admin:true });
});

router.post("/editcoupon", (req, res) => {
  console.log(req.body, "AAAAAAAA");
});

//========================= Booking-single-details =================

// router.get('/Booking-single-details',async(req,res)=>{
// console.log(req.query.id,"iiiiiiiiiiiiifsfdvhagbzsnjxm  =====id");
// const id =req.query.id;
// const viewBookingDetails= await Booking_Model.find({_id:id}).lean()
// console.log(viewBookingDetails,id ,"GGGGGGGGGGGGGGGGGGGGGGGGGGG");

//   res.render('admin/Booking-single-details',{admin:true,viewBookingDetails})
// })

//============================= single-booking =================
router.get("/single-booking", async (req, res) => {
  console.log(req.query.id, "iiiiiiiiiiiiifsfdvhagbzsnjxm  =====id");
  const id = req.query.id;
  const viewBookingDetails = await Booking_Model.find({ _id: id }).lean();
  console.log(viewBookingDetails, id, "GGGGGGGGGGGGGGGGGGGGGGGGGGG");

  console.log(viewBookingDetails[0].room.room_type, ">>>>>>>>>>>>>>>>>>>>");
  res.render("admin/Booking-single-details", {
    admin: true,
    viewBookingDetails,
  });
});

//=========================== stayingStatuschanging ====================
router.post("/stayingStatuschanging", async (req, res) => {
  console.log(req.body, "BBBBBBBBBBBBBBBBBBBBBBB");
  let booking_id = req.body.Booking_id;
  let Room_id = req.body.Room_id;
  
  let stayingStatus = req.body.stayingStatus;
  const result = await Booking_Model.updateOne(
    { _id: booking_id },
    {
      $set: { stayingStatus: stayingStatus, isStayingStatusChanged: true },
    }
  ).lean();
  
  let StayingStatus= await Booking_Model.find({_id:booking_id}).lean()
  let Roomcount = StayingStatus[0].number_of_Rooms
  let RoomDet= await Booking_Model.find({_id:booking_id}).lean()

  console.log(StayingStatus,StayingStatus[0].stayingStatus,"===StayingStatus====Room_id",Room_id,Roomcount);

  if(StayingStatus[0].stayingStatus =='Checkout'){

    await Rooms_module.updateOne(
      { _id: Room_id},
      { $inc: { 
        available_roomS: - Roomcount  } }
    );
    console.log(booking_id, stayingStatus, result,Roomcount, "==== if ====");
    res.json({ status: true });



  }else{
    console.log(booking_id, stayingStatus, result,Roomcount, "===== else ======");
    res.json({ status: true });


  }

});

//========================= Occupied Rooms =============
router.get("/occupiedRooms", async (req, res) => {
  let OccupiedRooms = await Booking_Model.aggregate([
    { $match: { stayingStatus: "Check-in" } },
  ]);
  let TotalRooms = await Rooms_module.aggregate([
    { $group: { _id: null, Total: { $sum: "$available_roomS" } } },
  ]);
  TotalRooms = TotalRooms[0].Total;
  let TotalCheckinRooms = await Booking_Model.aggregate([
    { $match: { stayingStatus: "Check-in" } },
    { $group: { _id: null, Total: { $sum: "$number_of_Rooms" } } },
  ]);
  TotalCheckinRooms = TotalCheckinRooms[0].Total;
  let test = await Booking_Model.aggregate([
    { $match: { stayingStatus: "Check-in" } },
  ]);
  let TotalBookedRooms = await Booking_Model.aggregate([
    { $match: { Status: "Booked" } },
    { $group: { _id: null, Total: { $sum: "$number_of_Rooms" } } },
  ]);
  let BookedRooms = TotalBookedRooms[0].Total;
  TotalBookedRooms = BookedRooms - TotalCheckinRooms;
  let AvailableRooms = TotalRooms - BookedRooms;
  console.log(OccupiedRooms, "QQQQQQQQQQQQQQQQQQQQQQQQQQQQ");
  // console.log(tset,"TTTTTTTTTTTTTTTTTTTTTTTTT");

  res.render("admin/occupiedRooms", {
    admin: true,
    OccupiedRooms,
    TotalRooms,
    TotalCheckinRooms,
    TotalBookedRooms,
    AvailableRooms,
  });
});

//======================== BOOKED ROOMS ==============

router.get("/bookedRooms",async (req, res) => {

  let OccupiedRooms = await Booking_Model.aggregate([
    { $match: { Status: "Booked" } },
  ]);
  let TotalRooms = await Rooms_module.aggregate([
    { $group: { _id: null, Total: { $sum: "$available_roomS" } } },
  ]);
  TotalRooms = TotalRooms[0].Total;
  let TotalCheckinRooms = await Booking_Model.aggregate([
    { $match: { stayingStatus: "Check-in" } },
    { $group: { _id: null, Total: { $sum: "$number_of_Rooms" } } },
  ]);
  TotalCheckinRooms = TotalCheckinRooms[0].Total;
  let test = await Booking_Model.aggregate([
    { $match: { stayingStatus: "Check-in" } },
  ]);
  let TotalBookedRooms = await Booking_Model.aggregate([
    { $match: { Status: "Booked" } },
    { $group: { _id: null, Total: { $sum: "$number_of_Rooms" } } },
  ]);
  let BookedRooms = TotalBookedRooms[0].Total;
  TotalBookedRooms = BookedRooms - TotalCheckinRooms;
  let AvailableRooms = TotalRooms - BookedRooms;
  console.log(OccupiedRooms, "QQQQQQQQQQQQQQQQQQQQQQQQQQQQ");
  // console.log(tset,"TTTTTTTTTTTTTTTTTTTTTTTTT");

  res.render("admin/Booked-rooms", {
    admin: true,
    OccupiedRooms,
    TotalRooms,
    TotalCheckinRooms,
    TotalBookedRooms,
    AvailableRooms,
  });





  // res.render("admin/bookedRooms");
});

//=================== /room-view =================
router.get("/room-view/:id", async (req, res) => {
  const id = req.params.id;
  const singleRoom = await Rooms_module.findOne({ _id: id }).lean();

  console.log(
    req.params.id,
    singleRoom,
    "}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}"
  );
  res.render("admin/room-view", { admin: true, rooms: singleRoom });
});

//============================ SINGLE_USER =======================
router.get("/user-view/:id", async (req, res) => {
  const id = req.params.id;
  const Singleuser = await User.findById(id).lean();
  const userBookings = await Booking_Model.find({ User_id: id }).lean();


  userBookings.forEach(element=>{
    element.timeAndDate=moment(element.timeAndDate).format('LL');

  })

  let birthday=userBookings.birthday=moment(userBookings.birthday).format('LL');
  let editedOn= userBookings.editedOn=moment(userBookings.editedOn).format('LL');



  console.log(id, Singleuser, userBookings, "iiiiiiidmccccccccccccc");

  res.render("admin/single-user", { admin: true, Singleuser, userBookings ,birthday,editedOn});
});

//admin log out
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin-login");
});
module.exports = router;
