export default function Loading({ label = "Loading..." }) {
  return <div className="loading-inline"><span className="spinner" />{label}</div>;
}
