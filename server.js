const express = require("express");
const app = express();
require("dotenv").config();
const db = require("./db");
const userRoutes = require("./routes/UserRoutes");
const tableRoutes = require("./routes/TableRoutes");
const menuRoutes = require("./routes/MenuRoutes");
const orderRoutes = require("./routes/OrderRoutes");
const settingsRoutes = require("./routes/SettingsRoutes");
const cors = require("cors");

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.use("/user", userRoutes);
app.use("/tables", tableRoutes);
app.use("/menu", menuRoutes);
app.use("/orders", orderRoutes);
app.use("/settings", settingsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
