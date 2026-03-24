'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../supabase/client'
import type { Database } from '../supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data as Profile | null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  return { profile, loading, refetch: fetchProfile }
}
