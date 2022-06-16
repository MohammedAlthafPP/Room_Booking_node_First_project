var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser')
const Flash =require('connect-flash') 
const dotenv = require('dotenv').config({debug:true})

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin')

var hbs=require('express-handlebars');
var app = express();
// var fileUpload = require('express-fileupload')
const config = require("./config/config")
const Register = require('./models/user_schema')
const Admin_Register = require('./models/admin_schema')
const Rooms_module = require('./models/rooms_schema')
const Booking= require('./models/booking_schema')
const wish_List = require('./models/whishlist_schema')
const asdf=require('./models/coupon_schema')
 var session =require('express-session')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',//layout folder route setting
  partialsDir: __dirname + '/views/partials' //partials folder route setting
}))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
app.use(session({
  secret:process.env.SESSION_SECRET_KEY,
  cookie:{maxAge:60000000},
  saveUninitialized:true,
  resave: true,
}))
app.use(Flash())

app.use((req,res,next)=>{
  res.set('Cache-Control','no-store')
  next()
})


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin',adminRouter);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));

// });

app.get("*",(req,res) => {
  res.render("404-page",{layout:false})
})
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
