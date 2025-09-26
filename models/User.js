
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


//definig the user schenam for the database
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    adharCardNo: { type: String, required: true },
    address: { type: String, required: true },
    role: {
        type: String,
        enum: ["voter", "admin"],
        default: "voter",
    },
    isVoted: { type: Boolean, default: false },

    passwordResetToken: String,  //store as SHA-256 hash
    passwordResetExpires: Date, //expiry timeStamp
    passwordChangedAt: Date, //token invalidate karne k leeye
});

//change password function
userSchema.pre('save', async function (next) {
    const person = this; //person=user
    if (!person.isModified('password'))
        return next();

    try {
        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(person.password, saltRound);
        person.password = hashedPassword;
        next();
    } catch (error) {
        console.log(" Unsuccesfully")
        return next(error);
    }
});

//comaprePassword function writen here used in the userRoute change paswrd section
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    } catch (error) {
        return error;
    }
}

//genarate reset token(plain) + store hansed+ expire on user
userSchema.methods.setPasswordResetToken = function (minutes = 15) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetToken = tokenHash;
    this.passwordResetExpires = new Date(Date.now() + minutes * 60 * 1000);

    return resetToken;
}

const User = mongoose.model("User", userSchema);
module.exports = User;