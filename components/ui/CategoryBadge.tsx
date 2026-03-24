import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'

interface CategoryBadgeProps {
  category: CategoryKey
  size?: 'sm' | 'md'
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const cat = CATEGORIES[category]
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'}`}
      style={{ backgroundColor: cat.bg, color: cat.text }}
    >
      {cat.label}
    </span>
  )
}
