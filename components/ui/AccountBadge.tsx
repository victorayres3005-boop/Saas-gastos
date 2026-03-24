import { getBankById } from '@/lib/utils/banks'
import type { Account } from '@/lib/hooks/useAccounts'

interface AccountBadgeProps {
  account: Account
  size?: 'sm' | 'md'
}

export function AccountBadge({ account, size = 'md' }: AccountBadgeProps) {
  const bank = getBankById(account.bank)
  const dotColor = bank ? bank.bg : account.color
  const bgColor = bank ? bank.bg + '20' : account.color + '20'
  const textColor = bank ? bank.bg : account.color

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {bank ? (
        <span
          className="rounded flex-shrink-0 flex items-center justify-center"
          style={{
            width: size === 'sm' ? 10 : 12,
            height: size === 'sm' ? 10 : 12,
            backgroundColor: bank.bg,
            fontSize: size === 'sm' ? 6 : 7,
            fontWeight: 800,
            color: bank.text,
            lineHeight: 1,
          }}
        >
          {bank.abbr[0]}
        </span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
      )}
      {account.name}
    </span>
  )
}
