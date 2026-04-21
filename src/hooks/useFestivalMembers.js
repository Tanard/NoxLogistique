import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useFestivalMembers(festivalId) {
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!festivalId) { setMembers([]); return }
    supabase
      .from('festival_members')
      .select('profiles(full_name)')
      .eq('festival_id', festivalId)
      .then(({ data }) => {
        if (!data) return
        const names = data
          .map(m => m.profiles?.full_name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'fr'))
        setMembers(names)
      })
  }, [festivalId])

  return members
}
