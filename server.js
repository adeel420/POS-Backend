const express = require("express");
const app = express();
require("dotenv").config();
const db = require("./db");
const userRoutes = require("./routes/UserRoutes");
const cors = require("cors");

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.use("/user", userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
