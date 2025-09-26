
const jwt = require('jsonwebtoken');

//jwt middleware authentication function 

const jwtAuthMiddle = (req, res, next) => {

    //first check the request heaader has authorized or not
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).json({ error: "invalid token" });
    }

    //extract the jwt token from the request headers
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'unauthorized token' });
    }
    try {
        //verify the jwt token
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        //attach user information to the request object
        req.user = decoded;
        next();
    } catch (error) {
        res.status(500).json({ error: "invalid token recieved cant authenticate" });
        console.log("invalid token", error);
    }
};

//token ko generate ko 
const generateToken = (userData) => {
    //generate a new token taking user data ,secret key and expire time
    return jwt.sign(userData, process.env.SECRET_KEY, { expiresIn: "1h" });
}

module.exports = { jwtAuthMiddle, generateToken };