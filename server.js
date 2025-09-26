const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connectionDB = require('./config/db');
const userRoute = require('./route/userRoute');
const candidateRoute = require('./route/candidateRoute');

// Load environment variables
dotenv.config({ path: './.env.local' });

// Connect to the database
connectionDB();

// Middleware to parse JSON requests
app.use(express.json());

app.get('/healthcheck', (req, res) => {
    res.send("hello welcome to the project of voting application");
});

// Use routes
app.use('/api/authUser', userRoute);
app.use('/api/authCandidate', candidateRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
    console.log(`Server is listening properly on port ${PORT}. Check the browser.`));
