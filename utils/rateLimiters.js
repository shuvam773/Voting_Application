const rateLimit = require('express-rate-limit');

//forget password "abuse rokne k leeye"
const forgetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minute ,time window kitni der hogyi
    max: 5, //5 tries per 15 minutes mtln har ek user uss window time pe 5 bar request kar sakta hai gar 6th barega to ban/deny
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many reset attempt .Please try again later" },

});
module.exports = { forgetLimiter };

//const rateLimit = require('express-rate-limit'); package ko load kar rahe hai ye middleware banane ka tool hai
/**
 What is this “rate limiting” aur kyu jarurat hai?

Rate limiting means “ek hi user / IP / source ko bahut zyada baar request na karne do” — ek limit lagana ki har kuch der me maximum requests allowed ho.

Specially “forgot password” jaise route bahut sensitive hain — agar koi repeatedly (bahut baar) us route ko hit kare (brute force, abuse), to system ya mail server overload ho sakta hai, ya security risk ban sakta hai.

Rate limiter us abuse ko rokta hai: agar user bahut frequent requests kare, to kuch der ke liye usko rok diya jaayega (error 429).

Ye server ko bachata hai (overload, spam mail sends, resource drain) aur application ko safer banata hai.

Ye express-rate-limit ka use ek common security / performance best practice hai.
 */