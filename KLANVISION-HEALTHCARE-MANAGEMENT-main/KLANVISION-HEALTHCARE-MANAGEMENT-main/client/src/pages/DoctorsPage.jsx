import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

export default function DoctorsPage() {
  const notify = useToast();
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [booking, setBooking] = useState({ date: "", timeSlot: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    api.get("/doctors", { params: searchTerm ? { q: searchTerm } : {} })
      .then(({ data }) => { if (current) { setDoctors(data); setError(""); } })
      .catch((requestError) => { if (current) setError(errorMessage(requestError)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [searchTerm]);

  function openBooking(doctor) {
    setBookingDoctor(doctor);
    setBooking({ date: "", timeSlot: "", reason: "" });
  }

  async function submitBooking(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/appointments", { doctorId: bookingDoctor._id, ...booking });
      notify("Your appointment has been booked.");
      setBookingDoctor(null);
    } catch (requestError) {
      notify(errorMessage(requestError), "error");
    } finally {
      setSaving(false);
    }
  }

  const minDate = new Date().toLocaleDateString("en-CA");
  return (
    <div className="page-container">
      <div className="page-heading"><div><span className="eyebrow">CARE THAT FITS YOU</span><h1>Find your doctor<span className="heading-period">.</span></h1><p>Browse trusted specialists and book a time that works for you.</p></div></div>
      <div className="search-bar"><span className="search-icon">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by doctor name or specialty..." aria-label="Search doctors" />{query && <button className="clear-search" onClick={() => setQuery("")}>Clear</button>}<span className="search-hint">LIVE SEARCH</span></div>
      <div className="results-meta">{loading ? "Searching..." : `${doctors.length} ${doctors.length === 1 ? "specialist" : "specialists"} found`}</div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <Loading label="Finding specialists..." /> : doctors.length ? (
        <div className="doctor-grid">
          {doctors.map((doctor, index) => <article className="doctor-card" key={doctor._id}>
            <div className={`doctor-card-top doctor-color-${index % 4}`}><div className="doctor-avatar">{doctor.user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><span className="verified-tag">✓ Verified</span></div>
            <div className="doctor-card-body"><span className="specialty-tag">{doctor.specialization}</span><h3>Dr. {doctor.user?.name}</h3><p className="doctor-experience">{doctor.experience} years of experience</p><p className="doctor-contact">☎ &nbsp;{doctor.contactInfo?.phone}</p><p className="doctor-contact">⌖ &nbsp;{doctor.contactInfo?.address || "Careflow Clinic"}</p><div className="slot-preview"><span>AVAILABLE SLOTS</span><div>{doctor.availableTimeSlots.slice(0, 4).map((slot) => <span key={slot}>{slot}</span>)}{doctor.availableTimeSlots.length > 4 && <span>+{doctor.availableTimeSlots.length - 4}</span>}</div></div><button className="button button-primary button-wide" onClick={() => openBooking(doctor)}>Book appointment <span>→</span></button></div>
          </article>)}
        </div>
      ) : <EmptyState icon="⌕" title={searchTerm ? "No doctors match your search" : "No doctors available yet"}>Try another name or specialty.</EmptyState>}

      {bookingDoctor && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingDoctor(null); }}>
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="booking-title">
          <button className="modal-close" aria-label="Close" onClick={() => setBookingDoctor(null)}>×</button>
          <span className="eyebrow">NEW APPOINTMENT</span><h2 id="booking-title">Book with Dr. {bookingDoctor.user?.name}</h2><p className="modal-subtitle">{bookingDoctor.specialization} · {bookingDoctor.experience} years experience</p>
          <form className="form-stack" onSubmit={submitBooking}>
            <label>Choose a date<input type="date" min={minDate} required value={booking.date} onChange={(event) => setBooking({ ...booking, date: event.target.value })} /></label>
            <label>Available time<select required value={booking.timeSlot} onChange={(event) => setBooking({ ...booking, timeSlot: event.target.value })}><option value="">Select a time slot</option>{bookingDoctor.availableTimeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
            <label>Reason for visit <span className="optional">(optional)</span><textarea rows="3" maxLength="1000" value={booking.reason} onChange={(event) => setBooking({ ...booking, reason: event.target.value })} placeholder="Briefly describe what you'd like help with" /></label>
            <button className="button button-primary button-wide" disabled={saving}>{saving ? "Booking..." : "Confirm appointment"} <span>→</span></button>
          </form>
        </section>
      </div>}
    </div>
  );
}
