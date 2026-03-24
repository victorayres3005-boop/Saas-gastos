interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' }

  return (
    <div className={`${sizes[size]} rounded-full bg-accent-light text-accent-text font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  )
}
