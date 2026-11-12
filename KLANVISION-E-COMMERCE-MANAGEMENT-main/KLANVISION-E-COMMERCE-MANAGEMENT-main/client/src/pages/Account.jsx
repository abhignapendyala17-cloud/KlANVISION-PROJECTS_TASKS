import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Account() {
  const { user, customers } = useApp();
  const customer = customers.find((item) => item._id === user?.customerId);
  return <div className="page-shell standard-page">
    <div className="page-title-row"><div><span className="eyebrow">YOUR MERCH ACCOUNT</span><h1>My account</h1></div><Link to="/" className="text-link">Back to the store ↗</Link></div>
    <section className="account-card">
      <span className="customer-avatar">{user?.name.split(/\s+/).map((part) => part[0]).slice(0,2).join('').toUpperCase()}</span>
      <div><span className="eyebrow">CUSTOMER PROFILE</span><h2>{user?.name}</h2><p>{user?.email}</p><p>{customer?.phone}</p><p>{customer?.address}</p></div>
    </section>
    <p className="muted-copy account-note">Your account and delivery profile are linked for a simpler checkout. Contact your store administrator if these details need to be updated.</p>
  </div>;
}
