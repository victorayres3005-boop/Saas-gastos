'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CATEGORIES, EXPENSE_CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { upsertBudget } from '@/app/actions/budgets'
import { addTransaction } from '@/app/actions/transactions'
import { createAccount } from '@/app/actions/accounts'
import { setBankStorage } from '@/lib/hooks/useAccounts'
import { useProfile } from '@/lib/hooks/useProfile'
import { getFirstName } from '@/lib/utils/formatters'
import { BankLogo } from '@/components/ui/BankLogo'
import { getBankById } from '@/lib/utils/banks'

const STEPS = ['Boas-vindas', 'Sua conta', 'Orçamentos', 'Primeira transação', 'Pronto!']

const QUICK_BANKS = ['itau', 'bradesco', 'nubank', 'inter', 'bb', 'caixa', 'santander', 'neon', 'c6bank', 'picpay']

export default function OnboardingPage() {
  const router = useRouter()
  const { profile } = useProfile()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1 — Conta
  const [accountName, setAccountName] = useState('')
  const [accountBank, setAccountBank] = useState('')
  const [accountBalance, setAccountBalance] = useState('')
  const [skipAccount, setSkipAccount] = useState(false)

  // Step 2 — Orçamentos
  const [budgets, setBudgets] = useState<Record<string, string>>({})

  // Step 3 — Primeira transação
  const [tx, setTx] = useState({ description: '', value: '', category: 'food' as CategoryKey })
  const [skipTx, setSkipTx] = useState(false)

  const handleAccountSave = async () => {
    if (!skipAccount && accountBalance) {
      setSaving(true)
      const bank = getBankById(accountBank)
      const result = await createAccount({
        name: accountName || (bank ? bank.name : 'Minha Conta'),
        type: 'checking',
        color: bank ? bank.bg : '#FF6B35',
        balance: parseFloat(accountBalance || '0'),
        bank: accountBank || null,
      })
      if (result.id) setBankStorage(result.id, accountBank || null)
      setSaving(false)
    }
    setStep(2)
  }

  const handleBudgetSave = async () => {
    setSaving(true)
    for (const [cat, val] of Object.entries(budgets)) {
      const v = parseFloat(val)
      if (v > 0) await upsertBudget(cat, v)
    }
    setSaving(false)
    setStep(3)
  }

  const handleTxSave = async () => {
    if (!skipTx && tx.value) {
      setSaving(true)
      await addTransaction({ ...tx, value: parseFloat(tx.value), date: new Date().toISOString().split('T')[0] })
      setSaving(false)
    }
    setStep(4)
  }

  const quickBanks = QUICK_BANKS.map(id => getBankById(id)).filter(Boolean)

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i <= step ? 'bg-accent text-white' : 'bg-border text-text-tertiary'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-accent' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-border p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

          {/* Step 0 — Boas-vindas */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl">👋</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Olá, {profile ? getFirstName(profile.full_name) : ''}!
              </h1>
              <p className="text-sm text-text-secondary mb-8">
                Vamos configurar sua conta em poucos passos para você começar a controlar seus gastos.
              </p>
              <Button onClick={() => setStep(1)} className="w-full">
                Começar <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {/* Step 1 — Conta bancária */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold text-text-primary mb-1">Adicione sua conta principal</h1>
              <p className="text-sm text-text-secondary mb-5">Qual banco você usa no dia a dia? (opcional)</p>

              {!skipAccount && (
                <>
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Selecione seu banco</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setAccountBank('')}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${!accountBank ? 'border-accent bg-accent-light text-accent' : 'border-border text-text-tertiary hover:border-accent'}`}
                    >
                      <Wallet size={20} />
                      Outro
                    </button>
                    {quickBanks.map(bank => bank && (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => { setAccountBank(bank.id); if (!accountName) setAccountName(bank.name) }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${accountBank === bank.id ? 'border-accent bg-accent-light' : 'border-border hover:border-accent'}`}
                      >
                        <BankLogo bankId={bank.id} size={28} />
                        <span className="text-[10px] text-text-tertiary">{bank.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 mb-5">
                    <Input
                      label="Nome da conta"
                      placeholder="Ex: Itaú Conta Corrente"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                    />
                    <Input
                      label="Saldo atual (R$)"
                      type="number" step="0.01" min="0" placeholder="0,00"
                      value={accountBalance}
                      onChange={e => setAccountBalance(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { setSkipAccount(true); setStep(2) }} className="flex-1">Pular</Button>
                <Button onClick={handleAccountSave} loading={saving} loadingText="Salvando..." className="flex-1">
                  Continuar <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Orçamentos */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-bold text-text-primary mb-1">Defina seus orçamentos</h1>
              <p className="text-sm text-text-secondary mb-5">Quanto você quer gastar por mês em cada categoria? (opcional)</p>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1">
                {EXPENSE_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-28 flex-shrink-0">
                      <span className="text-sm font-medium" style={{ color: CATEGORIES[cat].text }}>{CATEGORIES[cat].label}</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number" step="0.01" min="0" placeholder="R$ 0,00"
                        value={budgets[cat] || ''}
                        onChange={e => setBudgets(b => ({ ...b, [cat]: e.target.value }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(3)} className="flex-1">Pular</Button>
                <Button onClick={handleBudgetSave} loading={saving} loadingText="Salvando..." className="flex-1">
                  Salvar <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Primeira transação */}
          {step === 3 && (
            <div>
              <h1 className="text-xl font-bold text-text-primary mb-1">Adicione sua primeira transação</h1>
              <p className="text-sm text-text-secondary mb-5">Registre um gasto recente para começar.</p>
              {!skipTx && (
                <div className="space-y-3 mb-5">
                  <Input label="Descrição" placeholder="Ex: Almoço, Uber..." value={tx.description} onChange={e => setTx(t => ({ ...t, description: e.target.value }))} />
                  <Input label="Valor (R$)" type="number" step="0.01" min="0" placeholder="0,00" value={tx.value} onChange={e => setTx(t => ({ ...t, value: e.target.value }))} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-primary">Categoria</label>
                    <div className="flex flex-wrap gap-2">
                      {EXPENSE_CATEGORIES.map(key => {
                        const cat = CATEGORIES[key]
                        return (
                          <button key={key} type="button" onClick={() => setTx(t => ({ ...t, category: key }))}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                            style={tx.category === key
                              ? { backgroundColor: cat.bg, color: cat.text, borderColor: 'transparent' }
                              : { borderColor: '#E5E5E5', backgroundColor: 'white', color: '#6B6B6B' }}>
                            {cat.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { setSkipTx(true); setStep(4) }} className="flex-1">Pular</Button>
                <Button onClick={handleTxSave} loading={saving} loadingText="Salvando..." className="flex-1">
                  Salvar <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Pronto */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-positive-light flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={24} className="text-positive" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Tudo pronto!</h1>
              <p className="text-sm text-text-secondary mb-8">Sua conta está configurada. Comece a controlar seus gastos agora.</p>
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Ir para o dashboard <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
