import { getInitials } from '@/lib/format'

interface AvatarProps {
  
  name?: string | null
  
  src?: string | null
  
  size?: number
  className?: string
}

export function Avatar({ name, src, size = 44, className = '' }: AvatarProps) {
  const initials = getInitials(name)
  const dimension = { width: size, height: size, fontSize: Math.round(size / 2.6) }

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary font-display font-bold text-primary-ink ${className}`}
      style={dimension}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
      <span>{initials}</span>
    </span>
  )
}
