import { useState, useCallback, useRef, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { COLOR_SIDEBAR } from '../constants'
import { TopBar } from '../components/ui/TopBar'
import { ModalNouvelEvent } from '../modals/ModalNouvelEvent'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { fr },
})

const MESSAGES = {
  today: "Aujourd'hui",
  previous: '←',
  next: '→',
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun événement sur cette période.',
  showMore: n => `+ ${n} de plus`,
}

const VIEWS = ['month', 'week', 'day']
const VIEW_LABELS = { month: 'Mois', week: 'Semaine', day: 'Jour' }

export default function PlanningPage({
  user,
  isAdmin,
  isEditor,
  signOut,
  activeFestival,
  events,
  addPlanningEvent,
  updatePlanningEvent,
  deletePlanningEvent,
  setShowFestivalSelect,
}) {
  const [view, setView] = useState('month')
  const [date, setDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [slotInfo, setSlotInfo] = useState(null)
  const calendarRef = useRef(null)

  const openNewEvent = useCallback((start, end) => {
    if (!isEditor) return
    setSlotInfo({ start, end })
    setSelectedEvent(null)
    setShowModal(true)
  }, [isEditor])

  // Double-click sur zone vide → nouveau événement
  useEffect(() => {
    const el = calendarRef.current
    if (!el || !isEditor) return
    const handler = (e) => {
      if (e.target.closest('.rbc-event') || e.target.closest('.rbc-show-more')) return
      openNewEvent(new Date(), new Date(Date.now() + 3600000))
    }
    el.addEventListener('dblclick', handler)
    return () => el.removeEventListener('dblclick', handler)
  }, [isEditor, openNewEvent])

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event)
    setSlotInfo(null)
    setShowModal(true)
  }, [])

  const handleClose = () => {
    setShowModal(false)
    setSelectedEvent(null)
    setSlotInfo(null)
  }

  const defaultEvent = slotInfo ? { title: '', notes: '', start: slotInfo.start, end: slotInfo.end } : null

  const navigate = (dir) => {
    const d = new Date(date)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir)
    else d.setDate(d.getDate() + dir)
    setDate(d)
  }

  return (
    /* Layout full-height sans scroll de page */
    <main className="flex-1 overflow-hidden flex flex-col bg-app-bg">
      {/* TopBar + toolbar dans un conteneur fixe */}
      <div className="flex-shrink-0 px-4 md:px-8 pt-16 md:pt-0">
        <TopBar
          user={user}
          isAdmin={isAdmin}
          activeFestival={activeFestival}
          onFestivalClick={() => setShowFestivalSelect(true)}
          onSignOut={signOut}
        />
        <div className="flex items-center justify-between py-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setDate(new Date())} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:border-gray-300 transition-colors">
              Aujourd'hui
            </button>
            <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:border-gray-300 transition-colors">←</button>
            <button onClick={() => navigate(1)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:border-gray-300 transition-colors">→</button>
            <span className="text-sm font-semibold text-app-text ml-1 capitalize">
              {format(date, view === 'month' ? 'MMMM yyyy' : view === 'week' ? "'Semaine du' d MMMM yyyy" : 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
              {VIEWS.map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: view === v ? COLOR_SIDEBAR : '', color: view === v ? '#fff' : '#374151' }}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>
            {isEditor && (
              <button
                onClick={() => openNewEvent(new Date(), new Date(Date.now() + 3600000))}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-sm font-bold hover:opacity-80 transition-opacity"
                style={{ backgroundColor: COLOR_SIDEBAR }}
              >
                <Plus size={16} /> Nouvel événement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendrier — remplit le reste de l'espace, scroll interne uniquement */}
      <div className="flex-1 min-h-0 px-4 md:px-8 pb-4">
        <div ref={calendarRef} className="h-full rounded-xl border border-gray-200 overflow-hidden planning-calendar">
          <Calendar
            localizer={localizer}
            events={events}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            selectable={false}
            messages={MESSAGES}
            culture="fr"
            style={{ height: '100%' }}
            eventPropGetter={() => ({
              style: {
                backgroundColor: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '0.72rem',
                border: 'none',
              },
            })}
            toolbar={false}
          />
        </div>
      </div>

      <ModalNouvelEvent
        open={showModal}
        onClose={handleClose}
        onSave={addPlanningEvent}
        onUpdate={updatePlanningEvent}
        onDelete={deletePlanningEvent}
        event={selectedEvent ?? defaultEvent}
        isEditor={isEditor}
      />
    </main>
  )
}
