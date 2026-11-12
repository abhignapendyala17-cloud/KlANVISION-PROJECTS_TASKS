const fallbackImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#eef2ff"/><circle cx="320" cy="205" r="76" fill="#c7d2fe"/><path d="M170 395c20-80 80-120 150-120s130 40 150 120" fill="#a5b4fc"/><text x="320" y="445" text-anchor="middle" fill="#4f46e5" font-family="Arial,sans-serif" font-size="24">ShopEase</text></svg>'
)}`;

export default function ProductImage({ src, alt, className = '' }) {
  return (
    <img
      className={className}
      src={src || fallbackImage}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallbackImage;
      }}
    />
  );
}
