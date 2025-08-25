
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

// --- Health check ---
app.get("/try", (req, res) => {
    res.status(200).send("active");
});

// --- Adobe I/O Events Validation (GET request) ---
app.get("/data", (req, res) => {
    const validationCode = req.headers["x-adobe-eventcode"];
    if (validationCode) {
        console.log("✅ GET validation request received:", validationCode);
        return res.status(200).send(validationCode);
    }
    return res.status(400).send("Missing x-adobe-eventcode header");
});

// --- Event ingestion + Fallback Validation (POST request) ---
app.post("/data", async (req, res) => {
    try {
        // 1. Check if it's a validation POST (Adobe fallback)
        const validationCode = req.headers["x-adobe-eventcode"];
        const adobeEventType = req.headers["x-adobe-eventtype"];

        // Case A: Validation via header
        if (validationCode) {
            console.log("✅ POST validation request via header:", validationCode);
            return res.status(200).send(validationCode);
        }

        // Case B: Validation via body payload
        if (adobeEventType === "validation:request" && req.body && req.body.challenge) {
            console.log("✅ POST validation request via body:", req.body.challenge);
            return res.status(200).send(req.body.challenge);
        }

        // 2. Otherwise, it’s a real event → save to DB
        const newData = new RequestData({ body: req.body });
        const savedData = await newData.save();
        res.status(201).send(savedData);
    } catch (error) {
        console.error("❌ Error handling POST /data:", error);
        res
            .status(500)
            .send({ message: "Failed to process request", error: error.message });
    }
});

// --- Start server ---
app.listen(PORT, () =>
    console.log(`🚀 API is running at http://localhost:${PORT}`)
);
