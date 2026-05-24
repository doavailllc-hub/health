const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 AWS MySQL Connection
const db = mysql.createConnection({
  host: "dovailhealth.cw3wmk8yolf4.us-east-1.rds.amazonaws.com",
  user: "dovailadmin",
  password: "Keep1t#simple",
  database: "dovailhealth"
});

db.connect(err => {
  if (err) {
    console.error("DB Connection Failed:", err);
  } else {
    console.log("Connected to AWS MySQL ✅");
  }
});


// ➕ ADD DOCTOR
app.post("/add-doctor", (req, res) => {
  const { name, hospital, specialty, experience, fees, profilePicture } = req.body;

  const sql = `
    INSERT INTO doctors (name, hospital, specialty, experience, fees, profilePicture)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, hospital, specialty, experience, fees, profilePicture],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Doctor added successfully" });
    });
});


// 📥 GET DOCTORS
app.get("/doctors", (req, res) => {
  db.query("SELECT * FROM doctors", (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});


// ❌ DELETE DOCTOR
app.delete("/doctor/:id", (req, res) => {
  db.query("DELETE FROM doctors WHERE id = ?", [req.params.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Deleted successfully" });
    });
});

app.listen(5000, () => console.log("Server running on port 5000 🚀"));