import { useState, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Lock, Unlock, Trash2, X, MapPin } from 'lucide-react'
import { useFestivalMap } from '../hooks/useFestivalMap'
import { MAP_ELEMENTS, MAP_PATH_TYPES } from '../constants'

// ─── Fly to location after geocoding ─────────────────────────────────────────
function MapController({ flyTo }) {
  const map = useMap()
  const prevRef = useRef(null)
  useEffect(() => {
    if (flyTo && flyTo !== prevRef.current) {
      prevRef.current = flyTo
      map.flyTo([flyTo.lat, flyTo.lng], 17, { duration: 1.5 })
    }
  }, [flyTo, map])
  return null
}

// ─── Track map view (center + zoom) for save-on-lock ─────────────────────────
function ViewTracker({ onViewChange }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter()
      onViewChange(c.lat, c.lng, e.target.getZoom())
    },
    zoomend(e) {
      const c = e.target.getCenter()
      onViewChange(c.lat, c.lng, e.target.getZoom())
    },
  })
  return null
}

// ─── Map click / dblclick / mousemove handler ─────────────────────────────────
// Single click is debounced (220ms) to distinguish it from double-click.
function MapEvents({ locked, onSingleClick, onDoubleClick, onMouseMove }) {
  const timerRef = useRef(null)
  const pendingRef = useRef(null)

  useMapEvents({
    click(e) {
      if (!locked) return
      if (timerRef.current) clearTimeout(timerRef.current)
      pendingRef.current = e.latlng
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          onSingleClick(pendingRef.current)
          pendingRef.current = null
        }
      }, 220)
    },
    dblclick(e) {
      if (!locked) return
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      pendingRef.current = null
      onDoubleClick(e.latlng)
    },
    mousemove(e) {
      if (locked) onMouseMove(e.latlng)
    },
  })
  return null
}

// ─── Custom emoji DivIcon ─────────────────────────────────────────────────────
function makeIcon(emoji, selected) {
  const ring = selected ? 'outline:2.5px solid white;border-radius:6px;padding:1px;' : ''
  return L.divIcon({
    html: `<div style="font-size:22px;line-height:1;${ring}filter:drop-shadow(0 1px 3px rgba(0,0,0,0.7))">${emoji}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

// ─── Panel label style ────────────────────────────────────────────────────────
const sectionLabel = {
  color: 'rgba(255,255,255,0.35)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 5,
}

// ─── MapPage ──────────────────────────────────────────────────────────────────
export default function MapPage({ festivalId, isEditor }) {
  const {
    mapData, markers, paths, loading,
    updateMapView, lockMap, unlockMap,
    addMarker, deleteMarker,
    addPath, deletePath,
  } = useFestivalMap({ enabled: !!festivalId, festivalId })

  const [searchQuery, setSearchQuery]     = useState('')
  const [flyTo, setFlyTo]                 = useState(null)
  const [activeMarker, setActiveMarker]   = useState(null)  // element id
  const [activePath, setActivePath]       = useState(null)  // path type id
  const [drawPts, setDrawPts]             = useState([])    // in-progress polyline waypoints
  const [mousePt, setMousePt]             = useState(null)
  const [selected, setSelected]           = useState(null)  // { type, id }
  const [saving, setSaving]               = useState(false)
  const viewRef = useRef({ lat: 46.603354, lng: 1.888334, zoom: 13 })

  // Escape: cancel active tool or deselect
  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Escape') return
      if (activeMarker || activePath) {
        setActiveMarker(null)
        setActivePath(null)
        setDrawPts([])
        setMousePt(null)
      } else {
        setSelected(null)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [activeMarker, activePath])

  const geocode = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      const data = await res.json()
      if (data[0]) setFlyTo({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
    } catch (err) {
      console.error('[MapPage] geocode:', err)
    }
  }

  const handleLock = async () => {
    setSaving(true)
    const { lat, lng, zoom } = viewRef.current
    await updateMapView(lat, lng, zoom)
    await lockMap()
    setSaving(false)
  }

  const handleUnlock = async () => {
    setSaving(true)
    await unlockMap()
    setActiveMarker(null)
    setActivePath(null)
    setDrawPts([])
    setSelected(null)
    setSaving(false)
  }

  const handleMapClick = useCallback((latlng) => {
    if (activeMarker) {
      addMarker({ type: activeMarker, lat: latlng.lat, lng: latlng.lng })
      return
    }
    if (activePath) {
      setDrawPts(prev => [...prev, latlng])
      return
    }
    setSelected(null)
  }, [activeMarker, activePath, addMarker])

  const handleMapDblClick = useCallback((latlng) => {
    if (!activePath) return
    const pts = drawPts.length >= 2 ? drawPts : [...drawPts, latlng]
    if (pts.length < 2) { setDrawPts([]); setActivePath(null); return }
    const pathType = MAP_PATH_TYPES.find(p => p.id === activePath)
    addPath({ type: activePath, points: pts, color: pathType.color })
    setDrawPts([])
    setActivePath(null)
    setMousePt(null)
  }, [activePath, drawPts, addPath])

  const selectTool = (kind, id) => {
    if (kind === 'marker') {
      setActivePath(null); setDrawPts([])
      setActiveMarker(prev => prev === id ? null : id)
    } else {
      setActiveMarker(null)
      setActivePath(prev => prev === id ? null : id)
      setDrawPts([])
    }
    setSelected(null)
  }

  const handleDelete = async () => {
    if (!selected) return
    if (selected.type === 'marker') await deleteMarker(selected.id)
    if (selected.type === 'path')   await deletePath(selected.id)
    setSelected(null)
  }

  const isLocked = mapData?.locked ?? false
  const center   = [mapData?.center_lat ?? 46.603354, mapData?.center_lng ?? 1.888334]
  const zoom     = mapData?.zoom ?? 13

  // Ghost line: last waypoint → current mouse position
  const ghostPts = drawPts.length > 0 && mousePt
    ? [drawPts[drawPts.length - 1], mousePt]
    : null

  const activePathColor = MAP_PATH_TYPES.find(p => p.id === activePath)?.color ?? '#fff'

  if (!festivalId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-app-bg">
        <MapPin size={40} className="text-accent opacity-40" />
        <p className="text-gray-400 text-sm">Sélectionne un festival pour accéder à la carte.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app-bg">
        <p className="text-gray-400 text-sm">Chargement de la carte…</p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* ── Leaflet map ── */}
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        doubleClickZoom={false}
        scrollWheelZoom={!isLocked}
        dragging={!isLocked}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
          maxZoom={20}
          maxNativeZoom={18}
        />

        <MapController flyTo={flyTo} />
        <ViewTracker onViewChange={(lat, lng, z) => { viewRef.current = { lat, lng, zoom: z } }} />
        <MapEvents
          locked={isLocked}
          onSingleClick={handleMapClick}
          onDoubleClick={handleMapDblClick}
          onMouseMove={setMousePt}
        />

        {/* Saved markers */}
        {markers.map(m => {
          const el = MAP_ELEMENTS.find(e => e.id === m.type)
          if (!el) return null
          const isSel = selected?.type === 'marker' && selected.id === m.id
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={makeIcon(el.emoji, isSel)}
              eventHandlers={{
                click(e) {
                  if (activeMarker || activePath) return
                  L.DomEvent.stopPropagation(e)
                  setSelected(isSel ? null : { type: 'marker', id: m.id })
                },
              }}
            />
          )
        })}

        {/* Saved paths */}
        {paths.map(p => {
          const isSel = selected?.type === 'path' && selected.id === p.id
          const pts = Array.isArray(p.points) ? p.points.map(pt => [pt.lat, pt.lng]) : []
          if (pts.length < 2) return null
          return (
            <Polyline
              key={p.id}
              positions={pts}
              color={p.color}
              weight={isSel ? 5 : 3}
              opacity={isSel ? 1 : 0.85}
              eventHandlers={{
                click(e) {
                  if (activeMarker || activePath) return
                  L.DomEvent.stopPropagation(e)
                  setSelected(isSel ? null : { type: 'path', id: p.id })
                },
              }}
            />
          )
        })}

        {/* In-progress polyline */}
        {drawPts.length >= 2 && (
          <Polyline
            positions={drawPts.map(p => [p.lat, p.lng])}
            color={activePathColor}
            weight={3}
            opacity={0.9}
          />
        )}

        {/* Ghost line: last point → mouse */}
        {ghostPts && (
          <Polyline
            positions={ghostPts.map(p => [p.lat, p.lng])}
            color={activePathColor}
            weight={2}
            opacity={0.5}
            dashArray="8 5"
          />
        )}
      </MapContainer>

      {/* ── Floating tool panel ── */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        width: 228,
        background: 'rgba(22, 19, 36, 0.96)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 4px 28px rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column', gap: 8,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Search — only when unlocked */}
        {!isLocked && (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && geocode()}
              placeholder="Rechercher un lieu…"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 7,
                padding: '6px 9px',
                color: '#fff',
                fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              onClick={geocode}
              style={{
                background: 'var(--color-accent)',
                border: 'none', borderRadius: 7,
                padding: '6px 9px', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Search size={14} />
            </button>
          </div>
        )}

        {/* Lock / Unlock */}
        {isEditor && (
          <button
            onClick={isLocked ? handleUnlock : handleLock}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 10px', borderRadius: 8, border: 'none',
              background: isLocked ? 'rgba(239,68,68,0.12)' : 'color-mix(in srgb, var(--color-accent) 13%, transparent)',
              color: isLocked ? '#FCA5A5' : '#C4B5FD',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600, width: '100%',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
            {isLocked ? 'Débloquer la carte' : 'Figer la carte'}
          </button>
        )}

        {isLocked && (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

            {/* Markers */}
            <div>
              <p style={sectionLabel}>Marqueurs</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {MAP_ELEMENTS.map(el => (
                  <button
                    key={el.id}
                    onClick={() => isEditor && selectTool('marker', el.id)}
                    title={el.label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 7px', borderRadius: 7, border: 'none',
                      background: activeMarker === el.id ? `${el.color}28` : 'rgba(255,255,255,0.05)',
                      outline: activeMarker === el.id ? `1.5px solid ${el.color}` : 'none',
                      color: '#d1d5db',
                      cursor: isEditor ? 'pointer' : 'default',
                      fontSize: 11,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{el.emoji}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{el.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paths */}
            <div>
              <p style={sectionLabel}>Tracés</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {MAP_PATH_TYPES.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => isEditor && selectTool('path', pt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 8px', borderRadius: 7, border: 'none',
                      background: activePath === pt.id ? `${pt.color}22` : 'rgba(255,255,255,0.05)',
                      outline: activePath === pt.id ? `1.5px solid ${pt.color}` : 'none',
                      color: '#d1d5db',
                      cursor: isEditor ? 'pointer' : 'default',
                      fontSize: 11,
                    }}
                  >
                    <div style={{
                      width: 20, height: 3,
                      background: pt.color,
                      borderRadius: 2, flexShrink: 0,
                    }} />
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete selected element */}
            {selected && isEditor && (
              <>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                <button
                  onClick={handleDelete}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 10px', borderRadius: 8, border: 'none',
                    background: 'rgba(239,68,68,0.13)',
                    color: '#FCA5A5',
                    cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, width: '100%',
                  }}
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Bottom instruction bar ── */}
      {(activePath || activeMarker) && (
        <div style={{
          position: 'absolute', bottom: 20,
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(22,19,36,0.94)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#d1d5db',
          padding: '7px 14px',
          borderRadius: 8,
          fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          whiteSpace: 'nowrap',
        }}>
          {activePath
            ? <span>Cliquez pour ajouter des points &mdash; double-clic pour terminer &mdash; Échap pour annuler</span>
            : <span>Cliquez sur la carte pour placer le marqueur &mdash; Échap pour annuler</span>
          }
          <button
            onClick={() => { setActivePath(null); setActiveMarker(null); setDrawPts([]) }}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
