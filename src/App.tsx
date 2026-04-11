import { useGameStore } from './store/gameStore'
import LobbyView from './views/LobbyView'
import GameView from './views/GameView'
import SettlementView from './views/SettlementView'

export default function App() {
  const view = useGameStore((s) => s.view)

  return (
    <>
      {view === 'lobby' && <LobbyView />}
      {view === 'game' && <GameView />}
      {view === 'settlement' && <SettlementView />}
    </>
  )
}
