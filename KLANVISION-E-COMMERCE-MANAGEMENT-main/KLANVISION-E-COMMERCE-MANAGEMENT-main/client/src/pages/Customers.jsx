import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import Loading from '../components/Loading';
import { customersApi } from '../services/api';

const emptyForm = { name: '', email: '', phone: '', address: '' };
export default function Customers() {
  const { customers, refreshCustomers, customerId, setCustomerId, notify } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { refreshCustomers().catch((requestError) => notify(requestError.message, 'error')).finally(() => setLoading(false)); }, []);
  function startEdit(customer) {
    setEditing(customer);
    setForm({ name: customer.name, email: customer.email, phone: customer.phone, address: customer.address });
    setShowForm(true);
    setError('');
  }
  function startCreate() { setEditing(null); setForm(emptyForm); setShowForm(true); setError(''); }
  async function save(event) {
    event.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || !/^\d{10}$/.test(form.phone) || !form.address.trim()) {
      return setError('Enter all required details, a valid email, and a 10-digit phone.');
    }
    try {
      if (editing) await customersApi.update(editing._id, form);
      else {
        const { data } = await customersApi.create(form);
        setCustomerId(data._id);
      }
      await refreshCustomers();
      notify(editing ? 'Customer details updated' : 'Customer registered');
      setShowForm(false); setEditing(null); setForm(emptyForm);
    } catch (requestError) { setError(requestError.message); }
  }
  async function remove(customer) {
    if (!window.confirm(`Delete ${customer.name}? Customer records with carts or order history are retained.`)) return;
    try {
      await customersApi.remove(customer._id);
      if (customerId === customer._id) setCustomerId('');
      await refreshCustomers(); notify('Customer deleted');
    } catch (requestError) { notify(requestError.message, 'error'); }
  }
  return <div className="page-shell standard-page"><div className="page-title-row"><div><span className="eyebrow">BACK OFFICE / DIRECTORY</span><h1>Customers</h1></div><button className="button button-dark" onClick={startCreate}>+ Add customer</button></div>
    <p className="muted-copy customer-intro">Manage delivery details and choose who is shopping from the top navigation.</p>
    {showForm && <form className="form-card customer-form" onSubmit={save}><div className="form-heading"><div><span className="eyebrow">CUSTOMER RECORD</span><h2>{editing ? 'Edit details' : 'New customer'}</h2></div><button type="button" className="icon-button" onClick={() => setShowForm(false)}>×</button></div>
      {error && <p className="form-error">{error}</p>}<div className="form-grid">{[['name','Full name','text'],['email','Email address','email'],['phone','10-digit phone','tel'],['address','Delivery address','text']].map(([name,label,type]) => <label key={name}>{label}<input name={name} type={type} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} required /></label>)}</div><div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-dark">{editing ? 'Save changes' : 'Register customer'}</button></div>
    </form>}
    <div className="admin-stats"><div><span>REGISTERED CUSTOMERS</span><strong>{customers.length.toString().padStart(2,'0')}</strong></div><div><span>SHOPPING CUSTOMER</span><strong className="selected-name">{customers.find((item) => item._id === customerId)?.name || '—'}</strong></div></div>
    {loading ? <Loading /> : !customers.length ? <div className="empty-state"><h3>Your directory is ready</h3><p>Add a customer to start shopping and placing orders.</p><button className="button button-dark" onClick={startCreate}>Add the first customer</button></div> : <div className="customer-grid">{customers.map((customer) => <article className={`customer-card ${customerId === customer._id ? 'active-customer' : ''}`} key={customer._id}><div className="customer-card-top"><span className="customer-avatar">{customer.name.split(/\s+/).map((part) => part[0]).slice(0,2).join('').toUpperCase()}</span>{customerId === customer._id && <span className="eyebrow active-label">SHOPPING NOW</span>}<button className="icon-button customer-menu" aria-label={`Edit ${customer.name}`} onClick={() => startEdit(customer)}>···</button></div><h3>{customer.name}</h3><p>{customer.email}</p><p>{customer.phone}</p><p className="customer-address">{customer.address}</p><div className="customer-card-actions"><button className="text-link" onClick={() => { setCustomerId(customer._id); notify(`${customer.name} selected`); }}>{customerId === customer._id ? 'Selected ✓' : 'Select customer ↗'}</button><button className="row-link danger-text" onClick={() => remove(customer)}>Delete</button></div></article>)}</div>}
  </div>;
}
