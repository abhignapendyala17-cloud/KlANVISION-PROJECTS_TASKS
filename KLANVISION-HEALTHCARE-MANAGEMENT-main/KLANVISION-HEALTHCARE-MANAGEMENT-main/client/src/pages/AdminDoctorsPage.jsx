import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const emptyDoctor = { name: "", email: "", password: "", specialization: "", experience: "", phone: "", address: "", slots: "09:00, 10:00, 11:00, 14:00" };

export default function AdminDoctorsPage() {
  const notify = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyDoctor);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/doctors");
      setDoctors(data);
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function editDoctor(doctor) {
    setEditingId(doctor._id);
    setForm({
      name: doctor.user?.name || "",
      email: doctor.user?.email || "",
      password: "",
      specialization: doctor.specialization,
      experience: String(doctor.experience),
      phone: doctor.contactInfo?.phone || "",
      address: doctor.contactInfo?.address || "",
      slots: doctor.availableTimeSlots.join(", "),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      email: form.email,
      specialization: form.specialization,
      experience: Number(form.experience),
      contactInfo: { phone: form.phone, address: form.address },
      availableTimeSlots: form.slots.split(",").map((slot) => slot.trim()).filter(Boolean),
    };
    if (form.password) payload.password = form.password;
    if (!editingId && !form.password) {
      notify("Set a password for the new doctor account.", "error");
      setSaving(false);
      return;
    }
    try {
      if (editingId) await api.put(`/doctors/${editingId}`, payload);
      else await api.post("/doctors", { ...payload, password: form.password });
      notify(editingId ? "Doctor details updated." : "Doctor added successfully.");
      setEditingId("");
      setForm(emptyDoctor);
      await load();
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeDoctor(doctor) {
    if (!window.confirm(`Delete Dr. ${doctor.user?.name} and their appointments?`)) return;
    try {
      await api.delete(`/doctors/${doctor._id}`);
      notify("Doctor and related appointments deleted.");
      await load();
    } catch (error) {
      notify(errorMessage(error), "error");
    }
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyDoctor);
  }

  return (
    <div className="page-container">
      <div className="page-heading"><div><span className="eyebrow">ADMINISTRATION</span><h1>Doctor directory<span className="heading-period">.</span></h1><p>Add, update, and manage your healthcare professionals.</p></div><span className="count-pill">{doctors.length} doctors</span></div>
      <section className="admin-form-card">
        <div className="section-heading"><div><span className="eyebrow">{editingId ? "UPDATE PROFILE" : "NEW PROFILE"}</span><h2>{editingId ? "Edit doctor" : "Add a doctor"}</h2></div>{editingId && <button className="text-link" onClick={resetForm}>Cancel edit</button>}</div>
        <form className="admin-doctor-form" onSubmit={submit}>
          <label>Full name<input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Doctor name" /></label>
          <label>Email address<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="doctor@clinic.com" /></label>
          <label>{editingId ? "New password (optional)" : "Temporary password"}<input type="password" minLength="8" required={!editingId} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editingId ? "Leave blank to keep current" : "At least 8 characters"} /></label>
          <label>Specialization<input required value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} placeholder="e.g. Cardiology" /></label>
          <label>Experience (years)<input type="number" min="0" max="80" required value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} placeholder="Years" /></label>
          <label>Phone number<input inputMode="numeric" pattern="[0-9]{10}" minLength="10" maxLength="10" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit number" /></label>
          <label>Clinic address<input maxLength="200" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Clinic or hospital" /></label>
          <label className="slots-field">Available slots <span className="optional">(24-hour HH:MM, comma-separated)</span><input required value={form.slots} onChange={(event) => setForm({ ...form, slots: event.target.value })} placeholder="09:00, 10:00, 14:00" /></label>
          <div className="form-actions"><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add doctor"} <span>→</span></button>{editingId && <button type="button" className="button button-outline" onClick={resetForm}>Cancel</button>}</div>
        </form>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">CARE TEAM</span><h2>All doctors</h2></div></div>
        {loading ? <Loading label="Loading doctor directory..." /> : doctors.length ? <div className="table-wrap"><table><thead><tr><th>DOCTOR</th><th>SPECIALTY</th><th>EXPERIENCE</th><th>PHONE</th><th>AVAILABLE SLOTS</th><th>ACTIONS</th></tr></thead><tbody>{doctors.map((doctor) => <tr key={doctor._id}><td><div className="table-person"><span className="table-avatar">{doctor.user?.name?.[0]}</span><span><strong>{doctor.user?.name}</strong><small>{doctor.user?.email}</small></span></div></td><td><span className="specialty-tag">{doctor.specialization}</span></td><td>{doctor.experience} years</td><td>{doctor.contactInfo?.phone}</td><td>{doctor.availableTimeSlots.length} slots</td><td><div className="table-actions"><button className="text-link" onClick={() => editDoctor(doctor)}>Edit</button><button className="text-link danger-link" onClick={() => removeDoctor(doctor)}>Delete</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No doctors added">Create a doctor profile using the form above.</EmptyState>}
      </section>
    </div>
  );
}
