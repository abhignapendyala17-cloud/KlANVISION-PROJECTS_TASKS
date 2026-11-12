import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

export default function AdminPatientsPage() {
  const notify = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/patients")
      .then(({ data }) => setPatients(data))
      .catch((error) => notify(errorMessage(error), "error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-heading"><div><span className="eyebrow">ADMINISTRATION</span><h1>Patient directory<span className="heading-period">.</span></h1><p>All registered patients and their contact details.</p></div><span className="count-pill">{patients.length} patients</span></div>
      <section className="section-block">
        {loading ? <Loading label="Loading patient directory..." /> : patients.length ? <div className="table-wrap"><table><thead><tr><th>PATIENT</th><th>PHONE</th><th>AGE</th><th>GENDER</th><th>REGISTERED</th></tr></thead><tbody>{patients.map((patient) => <tr key={patient._id}><td><div className="table-person"><span className="table-avatar table-avatar-patient">{patient.user?.name?.[0]}</span><span><strong>{patient.user?.name}</strong><small>{patient.user?.email}</small></span></div></td><td>{patient.phone}</td><td>{patient.age}</td><td>{patient.gender}</td><td>{new Date(patient.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <EmptyState title="No patients registered">Patient registrations will appear here.</EmptyState>}
      </section>
    </div>
  );
}
