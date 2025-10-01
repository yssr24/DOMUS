const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("./config/database");
const userRoutes = require('./router/userRoutes');
const adminRoutes = require('./router/adminRoutes')


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Firebase admin init
const serviceAccount = require("./config/dts-capstone-firebase-adminsdk-fbsvc-c7c0da1bc4.json"); // correct path
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});

// User routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes)


// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));