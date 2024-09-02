const mongoose = require("mongoose");

function ConnectDB(url) {
  mongoose.connect(url);
  const db = mongoose.connection;
  db.on("connected", () => {
    console.log("CONNECTED TO MONGODB SERVER");
  });
  db.on("error", (err) => {
    console.error("Moongodb connecion error:", err);
  });
  db.on("disconnected", () => {
    console.log("MongoDB disconnected");
  });
  return db;
}

module.exports = ConnectDB;
