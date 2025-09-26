const mongoose = require('mongoose');

//databse connection 
const connectionDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDb connected Successfully");
    } catch (error) {
        console.log("MongoDB not connected successfully");
        process.exit(1);
    }
}
module.exports = connectionDB;