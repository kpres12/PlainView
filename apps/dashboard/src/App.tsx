import { Navbar } from './components/layout/Navbar'
import { CommandCenter } from './views/CommandCenter'
import { Missions } from './views/Missions'
import { Analytics } from './views/Analytics'
import { Alerts } from './views/Alerts'
import { Settings } from './views/Settings'
import { CommandPalette } from './components/ui/CommandPalette'
import { AlertNotifications } from './components/ui/AlertNotifications'
import { AIAssistant } from './components/ui/AIAssistant'
import { useAppStore } from './store'
import { AssetDetail } from './views/AssetDetail'
import './index.css'

export default function App() {
  const { activeView, setActiveView } = useAppStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#0C0C0E', color: '#E4E4E4' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
        {activeView === 'command-center' && <CommandCenter />}
        {activeView === 'missions' && <Missions />}
        {activeView === 'asset' && <AssetDetail />}
        {activeView === 'analytics' && <Analytics />}
        {activeView === 'alerts' && <Alerts />}
        {activeView === 'settings' && <Settings />}
      </main>
      <CommandPalette onNavigate={(view) => {
        const viewMap: Record<string, any> = {
          'valves': 'command-center',
          'missions': 'missions',
          'analytics': 'analytics',
          'alerts': 'alerts',
          'asset': 'asset',
          'replay': 'missions',
        };
        setActiveView(viewMap[view] || 'command-center');
      }} />
      <AlertNotifications />
      <AIAssistant />
    </div>
  )
}
