const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./router/userRoutes");
const adminRoutes = require("./router/adminRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const admin = require("./config/database");

admin.checkStorage?.();



// User routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
