import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    hospital: "",
    specialty: "",
    experience: "",
    fees: "",
    profilePicture: ""
  });

  const API = "http://YOUR-EC2-IP:5000";

  // 📥 Fetch doctors
  const loadDoctors = async () => {
    const res = await axios.get(`${API}/doctors`);
    setDoctors(res.data);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  // ➕ Add doctor
  const addDoctor = async () => {
    await axios.post(`${API}/add-doctor`, form);
    loadDoctors();
  };

  // ❌ Delete
  const deleteDoctor = async (id) => {
    await axios.delete(`${API}/doctor/${id}`);
    loadDoctors();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Panel</h2>

      <input placeholder="Name" onChange={e => setForm({...form, name: e.target.value})}/>
      <input placeholder="Hospital" onChange={e => setForm({...form, hospital: e.target.value})}/>
      <input placeholder="Specialty" onChange={e => setForm({...form, specialty: e.target.value})}/>
      <input placeholder="Experience" onChange={e => setForm({...form, experience: e.target.value})}/>
      <input placeholder="Fees" onChange={e => setForm({...form, fees: e.target.value})}/>
      <input placeholder="Image URL" onChange={e => setForm({...form, profilePicture: e.target.value})}/>

      <button onClick={addDoctor}>Add Doctor</button>

      <hr/>

      {doctors.map(doc => (
        <div key={doc.id}>
          <h4>{doc.name}</h4>
          <p>{doc.hospital} - {doc.specialty}</p>
          <button onClick={() => deleteDoctor(doc.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default App;