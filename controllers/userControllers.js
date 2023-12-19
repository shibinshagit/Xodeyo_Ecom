const User = require('../models/userModels')
const auth = require('../middlewares/auth')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const twilio = require('twilio')
const nodeMailer = require('nodemailer')
require('dotenv').config(); 
 
// encrypting password-----------------------------------------------------------------------------------------------------------
const bcryptPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error(error.message);
    throw error;
  }    
};

// sendOtp----------------------------------------------------------------------------------------------------------------------
const sendOtp = async (name, email, user_id,phone) => {
  try {
   // Twilio credentials
const accountSid = 'ACecda62c279b9576ad7957cf209bfe32e';
const authToken = process.env.TWILIO_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_NUMBER;

// Twilio client
const client = new twilio(accountSid, authToken);

// Function to generate a four-digit OTP
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Function to send OTP via SMS
async function sendOTP(phoneNumber, otp) {
    try {
        const message = await client.messages.create({
            body: `Your OTP code is: ${otp}`,
            from: twilioPhoneNumber,
            to: phoneNumber,
        });

        console.log(`SMS sent with SID: ${message.sid}`);
    } catch (error) {
        console.error(`Error sending SMS: ${error.message}`);
    }
}

// Example usage
const userPhoneNumber = '+91'+phone;
const otpCode = generateOTP();


    await sendOTP(userPhoneNumber, otpCode);
console.log(`OTP sent to ${userPhoneNumber}.`);

return otpCode;
  } catch (error) {
    console.error(`Error in sendOtp: ${error.message}`);
  }
 
};

// ======verifyOtp========================================================================================================
const verifyOtp = async (req, res) => {
  try {
    const { otp, userData } = req.session;

    // Check if userData exists before destructuring
    if (!userData) {
      return res.render('index', { message: 'User data not available. Verification failed.' });
    }

    const enteredOtp = req.body.enteredotp;
    const { name, email, phone, password } = userData;
    const passwordHash = await bcryptPassword(password);

    const user = new User({
      name,
      email,
      phone,
      password: passwordHash,
      is_admin: 0,
      is_verified: 1
    });


    const users =await user.save()

    if (otp === enteredOtp) {
      const updateInfo = await User.findOneAndUpdate({ email }, { $set: { is_verified: 1 } });

      if (updateInfo) {
        return res.render('index', { message: 'Registered Successfully!!!!' });
      } else {
        return res.render('index', { message: 'Verification failed. Email not found.' });
      }
    } else {
      return res.render('index', { message: 'Verification failed. Incorrect OTP.' });
    }
  } catch (error) {
    console.error(`Error in verifyOtp: ${error.message}`);
    return res.render('index', { message: 'An error occurred during verification.' });
  }
};


// loadLogin----------------------------------------------------------------------------------------------------------------------------
const loadLogin = async (req, res) => res.render('index')

 
// insertUser--------------------------------------------------------------------------------------------------------------------------------
const insertUser = async (req, res) => {
  try {
    req.session.userData = req.body;
    const { name, email, phone, password } = req.body;
   
    const existingMail = await User.findOne({ email: email});
    
    if(existingMail){
      console.log('existinguser')
      res.render('index', { message:'you are an existing user please login' });
    }else{
     

  //  const userData = await user.save();
     


    if (req.session.userData) {
    // const otp = await sendOtp(name, email, userData._id,phone);
    const otp = '1234'
    if(otp){
      req.session.otp = otp;
      // req.session.email = email;
      res.render('otpPage')
    }
    console.log('Generated OTP:', otp);
    } else {
      console.error("User data not available. Registration failed.");
    }
    }



 

  } catch (error) {
    console.error(`Error in insertUser: ${error.message}`);
  }
};
// verifyLogin----------------------------------------------------------------------------------------------------------------
const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await User.findOne({ email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_verified === 0) {
          return res.render('index', { message: "Please verify your email." });
        } else {
          if (userData.isBlocked) {
            return res.render('index', { message: "Your account is blocked." });
          } else {
            if (userData.is_Admin === 1) {
              console.log("User is an admin");
              req.session.admin_id = userData._id;
              return res.redirect('/admin/dashboard');
            } else {
              req.session.user_id = userData._id;
              return res.render('index');
            }
          }
        }
      } else {
        return res.render('index', { message: "Password is incorrect." });
      }
    } else {
      return res.render('index', { message: "Email is incorrect." });
    }
  } catch (error) {
    console.error(`Error in verifyLogin: ${error.message}`);
  }
};

module.exports = {loadLogin,insertUser,verifyOtp,verifyLogin };