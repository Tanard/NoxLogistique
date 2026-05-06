import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useArticles({ festivalId } = {}) {
  const [articles, setArticles] = useState([])

  const fetchArticles = useCallback(async () => {
    if (!festivalId) { setArticles([]); return }
    const { data } = await supabase
      .from('articles')
      .select('id, nom, commentaire')
      .eq('festival_id', festivalId)
      .order('nom', { ascending: true })
    if (data) setArticles(data)
  }, [festivalId])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  const addArticle = useCallback(async (nom, commentaire = '') => {
    if (!festivalId || !nom?.trim()) return { error: new Error('Nom requis') }
    const { error } = await supabase.from('articles').insert({
      festival_id: festivalId,
      nom: nom.trim(),
      commentaire: commentaire?.trim() || null,
    })
    if (!error) fetchArticles()
    return { error }
  }, [festivalId, fetchArticles])

  const updateArticle = useCallback(async (id, nom, commentaire = '') => {
    if (!nom?.trim()) return { error: new Error('Nom requis') }
    const { error } = await supabase.from('articles').update({
      nom: nom.trim(),
      commentaire: commentaire?.trim() || null,
    }).eq('id', id)
    if (!error) fetchArticles()
    return { error }
  }, [fetchArticles])

  return { articles, addArticle, updateArticle }
}
