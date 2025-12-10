import { useState, useEffect } from 'react'
import './App.css'
import RealtimeDashboard from './components/RealtimeDashboard'
import StationTable from './components/StationTable'
import { fetchStations, fetchStats, fetchCriticalStations } from './services/api'

function App() {
  const [stations, setStations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // TODO: Implémenter le rafraîchissement automatique des données
  useEffect(() => {
    loadData()
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      loadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // TODO: Charger les données depuis l'API
      const stationsData = await fetchStations()
      const statsData = await fetchStats()
      
      setStations(stationsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🚴 Vélib Dashboard - Temps Réel</h1>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading">Chargement des données...</div>
        ) : (
          <>
            <RealtimeDashboard stats={stats} />
            <StationTable stations={stations} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Données mises à jour en temps réel depuis l'API Vélib Paris</p>
      </footer>
    </div>
  )
}

export default App
