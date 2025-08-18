const express = require("express"); // 1. Import the Express module (which is a function)
const app = express(); // 2. Execute the function to create your app
const PORT = process.env.PORT || 8080;
app.use(express.json());
app.listen(PORT, () => console.log("api is on"));
app.get("/try", (req, res) => {
  res.status(200).send("active");
});
app.post("/data", (req, res) => {
  console.log(req.body);
  res.send(req.body);
});
