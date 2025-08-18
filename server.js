const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); // 1. Load variables from .env file

const app = express();
const PORT = process.env.PORT || 8080;

// --- 1. Database Connection ---
// 2. Use the environment variable for the connection string
const connectionString = process.env.MONGO_URI;

mongoose
  .connect(connectionString)
  .then(() => console.log("MongoDB Atlas connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ... The rest of your code (Schema, Model, Middleware, Routes) remains the same
app.use(express.json());

const requestDataSchema = new mongoose.Schema({
  body: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RequestData = mongoose.model("RequestData", requestDataSchema);

app.listen(PORT, () =>
  console.log(`API is on and running at http://localhost:${PORT}`)
);

app.get("/try", (req, res) => {
  res.status(200).send("active");
});

app.post("/data", async (req, res) => {
  try {
    const newData = new RequestData({ body: req.body });
    const savedData = await newData.save();
    res.status(201).send(savedData);
  } catch (error) {
    console.error("Error saving data:", error);
    res
      .status(500)
      .send({ message: "Failed to save data", error: error.message });
  }
});
