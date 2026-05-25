const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Dovail Health API is running 🚀");
});
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
// ===============================
// ✅ SPECIALISATIONS APIs
// ===============================

// ➕ ADD SPECIALISATION
app.post("/add-specialisation", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send("Name is required");
  }

  const sql = "INSERT INTO specialisations (name) VALUES (?)";

  db.query(sql, [name], (err, result) => {
    if (err) {
      console.log("DB ERROR ❌", err);
      return res.status(500).send(err);
    }

    res.send({ message: "Specialisation added ✅" });
  });
});
// 📥 GET ALL SPECIALISATIONS
app.get("/specialisations", (req, res) => {
  const sql = "SELECT * FROM specialisations ORDER BY id ASC";;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }
    res.send(result);
  });
});


// ❌ DELETE SPECIALISATION
app.delete("/specialisation/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM specialisations WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }
    res.send({ message: "Deleted successfully" });
  });
});





// ===============================
// ✅ HOSPITAL APIs
// ===============================

// ➕ ADD HOSPITAL
app.post("/add-hospital", (req, res) => {
  const { name, location, image, description } = req.body;

  const sql = `
    INSERT INTO hospitals (name, location, image, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, location, image, description], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    res.send({
      message: "Hospital added successfully"
    });
  });
});


// 📥 GET HOSPITALS
app.get("/hospitals", (req, res) => {

  const sql = "SELECT * FROM hospitals ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    res.send(result);
  });
});


// ❌ DELETE HOSPITAL
app.delete("/hospital/:id", (req, res) => {

  const sql = "DELETE FROM hospitals WHERE id = ?";

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    res.send({
      message: "Hospital deleted successfully"
    });
  });
});


// =====================
// DOCTORS
// =====================
app.get("/doctors", (req, res) => {
  db.query("SELECT * FROM doctors", (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});


// =====================
// APPOINTMENTS (JOIN)
// =====================
app.get("/appointments", (req, res) => {
  const sql = `
    SELECT 
      a.id,
      a.patient_name,
      a.age,
      a.phone_number,
      a.place,
      a.booking_date,
      a.booking_time,
      a.token_number,
      a.status,
      d.name AS doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.booking_date DESC, a.token_number ASC
  `;

  db.query(sql, (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});


// =====================
// GET NEXT PATIENT (QUEUE SYSTEM)
// =====================
app.get("/doctor/:id/next", (req, res) => {
  const doctorId = req.params.id;

  const sql = `
    SELECT *
    FROM appointments
    WHERE doctor_id = ?
    AND status = 'Pending'
    ORDER BY token_number ASC
    LIMIT 1
  `;

  db.query(sql, [doctorId], (err, result) => {
    if (err) return res.json(err);
    res.json(result[0] || null);
  });
});


// =====================
// ADD APPOINTMENT (AUTO TOKEN SYSTEM)
// =====================
app.post("/add-appointment", (req, res) => {
  const {
    patient_name,
    age,
    phone_number,
    place,
    booking_date,
    booking_time,
    doctor_id,
    status
  } = req.body;

  // STEP 1: AUTO TOKEN PER DOCTOR + DATE
  const tokenSql = `
    SELECT IFNULL(MAX(token_number), 0) + 1 AS next_token
    FROM appointments
    WHERE doctor_id = ? AND booking_date = ?
  `;

  db.query(tokenSql, [doctor_id, booking_date], (err, result) => {
    if (err) return res.json(err);

    const token_number = result[0].next_token;

    // STEP 2: INSERT APPOINTMENT
    const sql = `
      INSERT INTO appointments 
      (patient_name, age, phone_number, place, booking_date, booking_time, token_number, doctor_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        patient_name,
        age,
        phone_number,
        place,
        booking_date,
        booking_time,
        token_number,
        doctor_id,
        status
      ],
      (err, data) => {
        if (err) return res.json(err);

        res.json({
          message: "Appointment added successfully",
          token_number
        });
      }
    );
  });
});


// =====================
// MARK DONE
// =====================
app.post("/appointment/:id/done", (req, res) => {
  const id = req.params.id;

  db.query(
    "UPDATE appointments SET status='Done' WHERE id=?",
    [id],
    (err) => {
      if (err) return res.json(err);
      res.json({ message: "Marked Done" });
    }
  );
});


// =====================
// MARK SKIP
// =====================
app.post("/appointment/:id/skip", (req, res) => {
  const id = req.params.id;

  db.query(
    "UPDATE appointments SET status='Skipped' WHERE id=?",
    [id],
    (err) => {
      if (err) return res.json(err);
      res.json({ message: "Skipped" });
    }
  );
});


// =====================
// DELETE APPOINTMENT
// =====================
app.delete("/appointment/:id", (req, res) => {
  db.query(
    "DELETE FROM appointments WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.json(err);
      res.json({ message: "Deleted" });
    }
  );
});


// =====================
// START SERVER (ONLY ONCE)
// =====================
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});