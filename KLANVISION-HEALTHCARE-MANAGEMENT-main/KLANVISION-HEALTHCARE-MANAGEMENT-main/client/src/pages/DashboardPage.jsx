import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

export default function DashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ doctors: 0, patients: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const requests = [api.get("/appointments?period=upcoming")];
        if (user.role === "admin") requests.push(api.get("/doctors"), api.get("/patients"));
        const results = await Promise.all(requests);
        setAppointments(results[0].data.slice(0, 5));
        if (user.role === "admin") setStats({ doctors: results[1].data.length, patients: results[2].data.length });
      } catch (requestError) {
        setError(errorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.role]);

  const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <div className="page-container">
      <div className="page-heading dashboard-heading">
        <div><span className="eyebrow">{today.toUpperCase()}</span><h1>Hello, {user.name.split(" ")[0]}<span className="heading-period">.</span></h1><p>Here’s what’s happening with your care today.</p></div>
        {user.role === "patient" && <Link className="button button-primary" to="/doctors">Find a doctor <span>→</span></Link>}
        {user.role === "admin" && <Link className="button button-primary" to="/admin/doctors">Add a doctor <span>+</span></Link>}
      </div>

      {user.role === "admin" && (
        <div className="stat-grid">
          <div className="stat-card"><span className="stat-icon violet">✳</span><span className="stat-label">Registered doctors</span><strong>{stats.doctors}</strong><Link to="/admin/doctors">Manage doctors →</Link></div>
          <div className="stat-card"><span className="stat-icon mint">♧</span><span className="stat-label">Patients</span><strong>{stats.patients}</strong><Link to="/admin/patients">View directory →</Link></div>
          <div className="stat-card"><span className="stat-icon peach">◷</span><span className="stat-label">Upcoming appointments</span><strong>{appointments.length}</strong><Link to="/appointments">View appointments →</Link></div>
        </div>
      )}

      {user.role === "patient" && (
        <div className="welcome-panel">
          <div><span className="eyebrow">YOUR WELLNESS, ONE STEP AT A TIME</span><h2>Taking care of yourself<br />just got a little easier.</h2><p>Find the right specialist and book a time that works for you.</p><Link to="/doctors" className="button button-white">Explore doctors <span>→</span></Link></div>
          <div className="welcome-art"><span className="art-circle"></span><span className="art-cross">+</span><span className="art-heart">♡</span></div>
        </div>
      )}

      {user.role === "doctor" && (
        <div className="doctor-banner"><div className="doctor-symbol">✚</div><div><span className="eyebrow">DOCTOR WORKSPACE</span><h2>Your patients are counting on you.</h2><p>Review your schedule and update appointment outcomes.</p></div><Link className="button button-white" to="/appointments">Open schedule <span>→</span></Link></div>
      )}

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">YOUR SCHEDULE</span><h2>Upcoming appointments</h2></div><Link className="text-link" to="/appointments">View all <span>→</span></Link></div>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? <Loading label="Loading appointments..." /> : appointments.length ? (
          <div className="appointment-list">
            {appointments.map((item) => <DashboardAppointment key={item._id} item={item} role={user.role} />)}
          </div>
        ) : <EmptyState title="Nothing on the calendar yet">Your upcoming appointments will appear here.</EmptyState>}
      </section>
    </div>
  );
}

function DashboardAppointment({ item, role }) {
  const patientName = item.patient?.user?.name || "Patient";
  const doctorName = item.doctor?.user?.name || "Doctor";
  return (
    <div className="appointment-row">
      <div className="date-tile"><strong>{new Date(item.date).getUTCDate()}</strong><span>{new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(item.date))}</span></div>
      <div className="appointment-person"><strong>{role === "doctor" ? patientName : doctorName}</strong><span>{role === "doctor" ? "Patient appointment" : item.doctor?.specialization}</span></div>
      <div className="appointment-time"><strong>{item.timeSlot}</strong><span>{role === "admin" ? patientName : "Appointment time"}</span></div>
      <StatusBadge status={item.status} />
    </div>
  );
}
