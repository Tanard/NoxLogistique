import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Map, Settings, CalendarDays } from 'lucide-react'
import { TopBar } from '../components/ui/TopBar'
import { PageLayout } from '../components/ui/PageLayout'

const TOOLS = [
  {
    label: 'Administration',
    icon: Settings,
    route: '/admin',
    color: '#F97316',
    description: 'Gestion des utilisateurs, rôles et accès festivals',
    adminOnly: true,
  },
  {
    label: 'Liste des Besoins',
    icon: LayoutDashboard,
    route: '/dashboard',
    color: '#7C3AED',
    description: 'Gérer et suivre tous les besoins logistiques du festival',
  },
  {
    label: 'Todo',
    icon: CheckSquare,
    route: '/todo',
    color: '#10B981',
    description: 'Suivi des tâches et actions à réaliser par festival',
  },
  {
    label: 'Carte technique',
    icon: Map,
    route: '/map',
    color: '#3B82F6',
    description: 'Carte interactive du site avec marqueurs et tracés',
  },
  {
    label: 'Planning',
    icon: CalendarDays,
    route: '/planning',
    color: '#EC4899',
    description: 'Calendrier des livraisons, bénévoles et événements du festival',
  },
]

function LogoHero() {
  return (
    <div className="flex justify-center items-center mb-10">
      <span style={{ fontSize: '5.5rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1, color: '#1A1A1A' }}>
        Logisticore
      </span>
    </div>
  )
}

export default function AccueilPage({ user, isAdmin, activeFestival, onFestivalClick, signOut }) {
  const navigate = useNavigate()
  const tools = TOOLS.filter(t => !t.adminOnly || isAdmin)

  return (
    <PageLayout>
      <TopBar
        user={user}
        isAdmin={isAdmin}
        activeFestival={activeFestival}
        onFestivalClick={onFestivalClick}
        onSignOut={signOut}
      />

      <div className="flex flex-col items-center pt-6">
        <LogoHero />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl">
          {tools.map(tool => (
            <button
              key={tool.route}
              onClick={() => navigate(tool.route)}
              className="flex items-start gap-4 rounded-xl p-5 text-left cursor-pointer transition-all border"
              style={{ backgroundColor: tool.color + '0D', borderColor: tool.color + '40' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = tool.color + '1A' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = tool.color + '0D' }}
            >
              <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: tool.color + '22' }}>
                <tool.icon size={22} style={{ color: tool.color }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{tool.label}</h3>
                <p className="text-sm text-gray-500 leading-snug">{tool.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
