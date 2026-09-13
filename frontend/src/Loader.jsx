export default function Loader({ size = 'md', variant = 'dots' }) {
  if (variant === 'bar') return <div className="loader-bar" />

  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
  return (
    <div className="loader-dots">
      <span className={dotSize}></span>
      <span className={dotSize}></span>
      <span className={dotSize}></span>
    </div>
  )
}
