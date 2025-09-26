const express = require('express');
const User = require('../models/User');
const { generateToken, jwtAuthMiddle } = require('../middlewareJWTAuth/jwtMiddleAuth');
const router = express.Router();
const bcrypt = require('bcrypt');
const { forgetLimiter } = require('../utils/rateLimiters');
const { sendPasswordResetEmail } = require('../utils/mailer');
const crypto = require('crypto');


router.post('/signup', async (req, res) => {
    try {
        //take the user data from the body
        const data = req.body;
        const { email, password } = data;

        //user ka data lo aur check karo ye pahele se hai ki nhi
        const existing = await User.findOne({ email: email });
        //agar user pahelese hai to bolo usko ki login kare 409-conflict resource is already exist
        if (existing) {
            return res.status(409).json({ message: "Already exist in the data please login" });
        }

        //pass word ko hash karo
        // const saltRound = 10;
        // const hashedPassword = await bcrypt.hash(password, saltRound);
        // data.password = hashedPassword;

        //create a new user object in the user collections
        const newUser = new User(data);

        //save the new user to the database
        const response = await newUser.save();
        console.log("new user data saved succesfully in side the databse in the user collections");

        //take the user id in the payload and id se token ko generate karo
        const payload = {
            id: response.id,
        }
        //generate the token
        const token = generateToken(payload);
        console.log("Token is :", token);
        return res.status(200).json({ success: true, user: response, token: token });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//login route
router.post('/login', async (req, res) => {
    try {
        //extract adharchard ,password ,and email
        const { adharCardNo, email, password } = req.body;
        //find the user by adharCard
        const user = await User.findOne({ adharCardNo });
        console.log('User found:', user);
        if (!user) {
            return res.status(401).json({ message: "Invalid user " });
        }
        const match = await bcrypt.compare(password, user.password);
        console.log('Password match result:', match);
        if (!match) {
            return res.status(401).json({ message: "user not matched with the id" });
        }

        //generate the token
        const payload = {
            id: user.id,
        }
        const token = generateToken(payload);
        return res.status(200).json({ message: "Successfully loged in" });
    } catch (error) {
        return res.status(500).json({ message: "login failed retry again" });
    }
})

//profile route
router.get('/profile', jwtAuthMiddle, async (req, res) => {
    try {
        const userData = req.user;
        console.log("user data ", userData);
        const userId = userData.id;
        const user = await User.findById(userId);
        return res.status(200).json({ message: "welcome to your profile page", user });
    }
    catch (error) {
        console.log("profile access denied login please");
        return res.status(502).json({ error });
    }
});

//profile password change
router.put('/profile/password', jwtAuthMiddle, async (req, res) => {
    try {
        const userDate = req.user;
        const { currentPassword, newPassword } = req.body;

        // Basic validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both current and new passwords are required" });
        }
        const user = await User.findById(userDate.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid current password" });
        }
        //update the new password
        user.password = newPassword;
        await user.save(); //save k time tumhara pre('save') middleware chahelaga
        console.log("password updated");
        return res.status(200).json({ message: "updated succesfully " });
    } catch (error) {
        console.log("password not changed");
        return res.status(500).json({ message: "Password not changed" });
    }
});

//forget password : send the reset link
router.post('/forgot', forgetLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const msg = { message: "if an account exists , reset link is sent" }
        if (!email) {
            return res.status(200).json(msg);
        }
        //find the user by the email inside the database
        const user = await User.findOne({ email });
        //agar user nhi miila to phir bhi msg ko bhej do reaveal mat karo exixtenace ko
        if (!user) {
            return res.status(200).json(msg);
        }

        // Generate token + store hash + expiry on user document
        /*yaha hum model me defined method setPasswordResetToken ko call kar rahe hai
           ye method generate karega plain token ,uska hash BD me stoe karega, expire bhi set karega 
           aur plain token return karega
            */
        //reset tokenYe token sirf ek time use ke liye hai, password reset ke liye.
        // save hashed token in DB + expiry
        const plainToken = user.setPasswordResetToken(15);  // 15 minutes default

        // Save user — skip validation for other required fields if they aren’t changing
        await user.save({ validateBeforeSave: false });

        //buid basic reset url
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${plainToken}&id=${user.id}`;

        //Email send karne ka function call kar rahe hain. User ke email me reset link jaayega.
        await sendPasswordResetEmail(user.email, resetUrl);

        return res.status(200).json(msg);
    }
    catch (error) {
        console.error("Forgot password route error:", error);
        return res.status(500).json({ message: "Server error" });
    }
});


//reset password logic
router.post('/reset', async (req, res) => {
    try {

        //Request body se teen cheezen nikaal rahe hain: token (plain reset token user ki request ka), id (user ki ID), aur newPassword.
        //yaha  pe token ek temporary token hai jo sirf password reset k liye generate hoga
        const { token, id, newPassword } = req.body;
        if (!token || !id || !newPassword) {
            return res.status(400).json({ message: "token, id and newPassword are required" });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            _id: id,
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        user.password = newPassword;

        //Reset token aur expiry fields clear kar rahe hain, kyunki unko reuse nahi karna chahiye.
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        return res.status(200).json({ message: "Password reset successful. Please login." });
    } catch (err) {
        console.error("Reset password route error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
