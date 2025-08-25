const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- 1. Database Connection ---
const connectionString = process.env.MONGO_URI;

mongoose
    .connect(connectionString)
    .then(() => console.log("MongoDB Atlas connected successfully!"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());

// --- Schema ---
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

// --- Routes ---
app.get("/try", (req, res) => {
    res.status(200).send("active");
});

// Handle Adobe I/O validation + events
app.post("/data", async (req, res) => {
    try {
        // 1. Adobe sends validation request with "x-adobe-eventcode"
        const validationCode = req.headers["x-adobe-eventcode"];
        if (validationCode) {
            console.log("Received Adobe validation request:", validationCode);
            // Respond with validation code as plain text
            return res.status(200).send(validationCode);
        }

        // 2. Otherwise, it’s a normal event → save to DB
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

// --- Start server ---
app.listen(PORT, () =>
    console.log(`API is on and running at http://localhost:${PORT}`)
);

