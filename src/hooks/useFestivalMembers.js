import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useFestivalMembers(festivalId) {
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!festivalId) { setMembers([]); return }

    const load = async () => {
      const { data: memberRows } = await supabase
        .from('festival_members')
        .select('user_id')
        .eq('festival_id', festivalId)

      if (!memberRows?.length) return

      const { data: profiles } = await supabase
        .from('profiles')
        .select('full_name')
        .in('id', memberRows.map(m => m.user_id))

      if (!profiles) return
      const names = profiles
        .map(p => p.full_name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'fr'))
      setMembers(names)
    }

    load()
  }, [festivalId])

  return members
}
