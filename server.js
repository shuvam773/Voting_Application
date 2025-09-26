const express = require('express');
const app = express();
require('dotenv').config()
const mongoose = require('mongoose')
// const userRoute = require('./route/userRoute');
// const candidateRoute = require('./route/candidateRoute');



// Connect to the database


// Middleware to parse JSON requests
app.use(express.json());

app.get('/healthcheck', (req, res) => {
    res.send("hello welcome to the project of voting application");
});

// Use routes
// app.use('/api/authUser', userRoute);
// app.use('/api/authCandidate', candidateRoute);

const PORT = process.env.PORT || 3000;

const connectDB = async () => {
    try{
        const connectionString= process.env.MONGO_URI ||"mongodb+srv://sanket2001:Sanket@2001@cluster0.oovwcnf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        await mongoose.connect(connectionString, {
            
            family: 4,
        });
        console.log("MongoDB connected successfully");
    } catch(error) {
        console.log("MongoDB connection failed", { 
            name: error.name,
            message: error.message,
            code: error.code,
        });
        process.exit(1);
    }
}



// start server only when DB is connected
const startServer = async () => {
    try {
        
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.log('Error starting server:', error);
        process.exit(1);
    }
};

startServer(); 
