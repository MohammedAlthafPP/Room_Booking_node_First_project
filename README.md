# Bluepearl

A hotel booking application using Node.js, Express.js, MongoDB



## Screenshot

![bluepearl-readmeImg](https://res.cloudinary.com/althaf-ecommerce/image/upload/v1663659508/samples/blue-pearl-screenshot-imge_tnt4xt.png)


## Demo


[bluepearl.ml](https://bluepearl.ml/)
## Tech Stack

 Node, Express, Bootstrap, JQuery, Ajax

**Payment Integration:** Razorpay

**Email Service:** Nodemailer

**SMS Service:** Twilio

**Deploy:** AWS (EC2)




## Features
**Users can do following:**
- Create an account, login or logout
- Browse available rooms added by the admin
- Users can book a room based on their needs and favorable places
- The Check-in and Checkout dates, as well as the number of rooms and number of guests, are customizable by the users.
- Wishlist functionality.
- Can redeem coupons for discounts and offers.
- Checkout information is processed with razorpay and the payment is send to the admin.
- After booking, the user can check the booking history and can also cancel the booking.
- The profile contains all the orders a user has made.
- Update their profile

**Admin can do following:**
- Login or logout to the admin panel
- Manage Rooms.
- Manage users.
- Manage bookings.
- Manage payments.
- Manage coupons.   


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`AUTH_EMAIL` (nodemailer auth email)

`AUTH_PASSWORD` (nodemailer auth email password)

`RAZORPAY_KEY_ID `

`RAZORPAY_KEY_SECRET `

`SESSION_SECRET_KEY `

`TWILIO_SERVICE_SID ` 

`TWILIO_ACCOUNT_SID ` 

`TWILIO_AUTH_TOKEN ` 

`MONGODB_URL ` 

## Run Locally

Clone the project

```bash
  git clone https://github.com/MohammedAlthafPP/Room_Booking_node_First_project.git
```

Go to the project directory

```bash
  cd Room_Booking_node_First_project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm start
```


## Author

- [@MohammedAlthaf](https://github.com/MohammedAlthafPP)


## License

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
