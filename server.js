
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(express.json());

// --- Schema ---
const requestDataSchema = new mongoose.Schema({
  body: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});
const RequestData = mongoose.model("RequestData", requestDataSchema);

// --- Health check ---
app.get("/try", (req, res) => res.status(200).send("active"));

/**
 * Adobe I/O Events Validation + Event Ingestion
 */

// --- GET validation (synchronous) ---
app.get("/data", (req, res) => {
  const { challenge } = req.query;
  if (challenge) {
    console.log("✅ GET validation challenge received:", challenge);
    return res.type("text/plain").status(200).send(challenge);
  }
  return res.status(400).send("Missing 'challenge' query parameter");
});

// --- POST validation (sync + async) & event delivery ---
app.post("/data", async (req, res) => {
  try {
    // Case A: synchronous POST challenge
    if (req.body && req.body.challenge) {
      console.log("✅ POST validation challenge received:", req.body.challenge);
      return res.type("text/plain").status(200).send(req.body.challenge);
    }

    // Case B: asynchronous POST validation with validationUrl
    if (req.body && req.body.validationUrl) {
      const { validationUrl } = req.body;
      console.log("🟡 POST async validation received. URL:", validationUrl);

      // Acknowledge quickly
      res.status(200).json({ status: "ok" });

      // Call validationUrl out-of-band
      (async () => {
        try {
          const r = await axios.get(validationUrl, { timeout: 4000 });
          console.log("✅ validationUrl GET success. Status:", r.status);
        } catch (err) {
          console.error("❌ validationUrl GET failed:", err.message || err);
        }
      })();

      return;
    }

    // Case C: normal event → save to DB
    const newData = new RequestData({ body: req.body });
    const savedData = await newData.save();
    console.log("📦 Event saved with _id:", savedData._id.toString());
    return res.status(201).send(savedData);

  } catch (error) {
    console.error("❌ Error in POST /data:", error);
    return res.status(500).send({ message: "Failed to process", error: error.message });
  }
});

// --- Start server ---
app.listen(PORT, () =>
  console.log(`🚀 API is running at http://localhost:${PORT}`)
);
