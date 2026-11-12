import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

export default function AppointmentsPage({ history = false }) {
  const { user } = useAuth();
  const notify = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rescheduling, setRescheduling] = useState("");
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", timeSlot: "" });
  const [busyId, setBusyId] = useState("");

  async function loadAppointments() {
    setLoading(true);
    try {
      const { data } = await api.get(history ? "/appointments/history" : "/appointments", {
        params: history ? {} : { period: "upcoming" },
      });
      setAppointments(data);
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAppointments(); }, [history]);

  async function performAction(id, action, body) {
    setBusyId(id);
    try {
      await api.patch(`/appointments/${id}/${action}`, body);
      notify(action === "cancel" ? "Appointment cancelled." : action === "status" ? "Appointment marked complete." : "Appointment rescheduled.");
      setRescheduling("");
      await loadAppointments();
    } catch (requestError) {
      notify(errorMessage(requestError), "error");
    } finally {
      setBusyId("");
    }
  }

  const minDate = new Date().toLocaleDateString("en-CA");
  return (
    <div className="page-container">
      <div className="page-heading"><div><span className="eyebrow">{history ? "YOUR CARE RECORD" : "KEEP YOUR CARE ON TRACK"}</span><h1>{history ? "Appointment history" : "Your appointments"}<span className="heading-period">.</span></h1><p>{history ? "A record of your completed and cancelled visits." : "Manage your upcoming visits and appointment schedule."}</p></div></div>
      <div className="appointment-summary-strip"><span className="summary-dot"></span>{history ? "COMPLETED & CANCELLED" : "UPCOMING APPOINTMENTS"}<span className="summary-count">{appointments.length}</span></div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <Loading label="Loading your appointments..." /> : appointments.length ? (
        <div className="appointment-cards">
          {appointments.map((item) => {
            const otherPerson = user.role === "doctor" ? item.patient?.user?.name : item.doctor?.user?.name;
            const doctor = item.doctor;
            const canPatientManage = user.role === "patient" && ["Scheduled", "Rescheduled"].includes(item.status);
            const canDoctorComplete = user.role === "doctor" && ["Scheduled", "Rescheduled"].includes(item.status);
            return <article className="appointment-card" key={item._id}>
              <div className="appointment-card-date"><span>{new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(item.date))}</span><strong>{new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(item.date))}</strong><small>{item.timeSlot}</small></div>
              <div className="appointment-card-info"><div className="appointment-card-title"><h3>{user.role === "doctor" ? otherPerson : `Dr. ${otherPerson}`}</h3><StatusBadge status={item.status} /></div><p>{user.role === "doctor" ? `Patient · ${item.patient?.phone || ""}` : doctor?.specialization}</p>{item.reason && <p className="appointment-reason">“{item.reason}”</p>}</div>
              <div className="appointment-card-actions">
                {canPatientManage && <><button className="button button-outline button-small" onClick={() => { setRescheduling(rescheduling === item._id ? "" : item._id); setRescheduleForm({ date: new Date(item.date).toISOString().slice(0, 10), timeSlot: item.timeSlot }); }}>Reschedule</button><button className="button button-danger-quiet button-small" disabled={busyId === item._id} onClick={() => performAction(item._id, "cancel")}>Cancel</button></>}
                {canDoctorComplete && <button className="button button-primary button-small" disabled={busyId === item._id} onClick={() => performAction(item._id, "status", { status: "Completed" })}>{busyId === item._id ? "Saving..." : "Mark completed"}</button>}
              </div>
              {rescheduling === item._id && <form className="reschedule-form" onSubmit={(event) => { event.preventDefault(); performAction(item._id, "reschedule", rescheduleForm); }}><label>New date<input type="date" min={minDate} required value={rescheduleForm.date} onChange={(event) => setRescheduleForm({ ...rescheduleForm, date: event.target.value })} /></label><label>New time<select required value={rescheduleForm.timeSlot} onChange={(event) => setRescheduleForm({ ...rescheduleForm, timeSlot: event.target.value })}>{doctor?.availableTimeSlots?.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label><button className="button button-primary button-small" disabled={busyId === item._id}>{busyId === item._id ? "Saving..." : "Save new time"}</button></form>}
            </article>;
          })}
        </div>
      ) : <EmptyState title={history ? "No appointment history yet" : "You're all caught up"}>{history ? "Completed and cancelled appointments will be listed here." : user.role === "patient" ? "Find a doctor to book your first visit." : "New appointments will appear here."}</EmptyState>}
    </div>
  );
}
