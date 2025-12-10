import { useState, useEffect } from 'react'
import './App.css'
import RealtimeDashboard from './components/RealtimeDashboard'
import StationTable from './components/StationTable'
import StationIncidents from './components/StationIncidents'
import BatchDashboard from './components/BatchDashboard'
import { fetchStations, fetchStats, fetchCriticalStations, getIncidents, getDailyStats, getAggregatedData, getEmptyFullStations } from './services/api'

function App() {
  const [stations, setStations] = useState([])
  const [stats, setStats] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [dailyStats, setDailyStats] = useState(null)
  const [aggregatedData, setAggregatedData] = useState([])
  const [emptyFullStations, setEmptyFullStations] = useState([])
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
      
      // Charger les données temps réel
      const stationsResponse = await fetchStations()
      const statsResponse = await fetchStats()
      
      // Extraire les données du format {success: true, data: [...]}
      setStations(stationsResponse?.data || [])
      setStats(statsResponse?.data || null)
      
      // Charger les données batch (agrégations)
      try {
        const incidentsData = await getIncidents()
        const dailyStatsData = await getDailyStats()
        const aggregatedDataRes = await getAggregatedData()
        const emptyFullData = await getEmptyFullStations()
        
        setIncidents(incidentsData?.data || [])
        // daily_stats retourne un tableau avec 1 élément, on prend le premier
        setDailyStats(dailyStatsData?.data?.[0] || null)
        setAggregatedData(aggregatedDataRes?.data || [])
        setEmptyFullStations(emptyFullData?.data || [])
      } catch (batchError) {
        console.warn('Batch data not available yet:', batchError)
        // Pas grave si les données batch ne sont pas encore disponibles
      }
      
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
            <RealtimeDashboard stats={stats} dailyStats={dailyStats} />
            
            <BatchDashboard 
              dailyStats={dailyStats}
              emptyFullStations={emptyFullStations}
              aggregatedData={aggregatedData}
            />
            
            {incidents && incidents.length > 0 && (
              <StationIncidents incidents={incidents} />
            )}
            
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
