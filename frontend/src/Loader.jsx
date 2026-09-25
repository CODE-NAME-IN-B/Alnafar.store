export default function Loader({ size = 'md', variant = 'dots' }) {
  if (variant === 'bar') return <div className="loader-bar" role="status" aria-label="جاري التحميل" />

  const dotPx = size === 'sm' ? '8px' : size === 'lg' ? '16px' : '12px'
  return (
    <div className="loader-dots" style={{ '--dot': dotPx }} role="status" aria-live="polite" aria-label="جاري التحميل">
      <span></span>
      <span></span>
      <span></span>
    </div>
  )
}
