const nodemailer=require('nodemailer');

//transport ka configuration (kaisey mail bhejna hai)
const transporter=nodemailer.createTransport({
    host:process.env.SMTP_HOST,//server ka address
    port:Number(process.env.SMTP_PORT || 587),
    secure:Number(process.env.SMTP_PORT)=== 465,
    auth:{
        user:process.env.SMTP_USER, //SMTP USERNAME
        pass:process.env.SMTP_PASS,// USER KA PASSWORD
    }
});

async function sendPasswordResetEmail(to, resetUrl) {

    //bas ek simple email bhejna wala function link bhjega
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Reset your password',
    text: `Click here: ${resetUrl}`,
  });
}
module.exports = { sendPasswordResetEmail };

/*
Reset URL ka flow

Jab user “Forgot Password” karega (i.e. usne “I forgot my password” click kiya), to backend me ye steps chalenge:

User submit karega email
Frontend se POST /auth/forgot ya similar route hit hoga, body me { email }.

Backend user dhundhega
User.findOne({ email }) se check karega ki aisa user exist karta hai ya nahi.

Reset token generate karega

Ek random token banega, jaise using crypto.randomBytes(32).toString('hex').

Phir us token ka hash banakar database me store karega, saath me expiry time bhi set karega (jaise 15 min).

Plain token (jo user ko bhejna hai) us hashed token ka sth linkage hai.

Reset URL banega
Plain token + user id ya kuch parameter include karega URL banega

explame : https://yourfrontend.com/reset-password?token=PLAIN_TOKEN&userId=USER_ID

Email bheja jayega
sendPasswordResetEmail(user.email, resetUrl) call hogi, jisme resetUrl wahi built URL hogi.

User link pe click karega
Frontend pe route hoga, jaise /reset-password ya /reset-password/:userId/:token. Us page me user new password dalenge.

Frontend POST karega new password + token
Form submit ke saath backend route hit hoga, jaise POST /auth/reset with { token, newPassword, userId }.

Backend token verify karega, match karega, expiry check karega

Plain token ko hash karke DB me stored hash se compare karega.

Expiry check karega (agar time khatam ho gaya hai to invalid).

Agar sab thik, user.password = newPassword; user.save() karega aur token fields clear karega.

*/