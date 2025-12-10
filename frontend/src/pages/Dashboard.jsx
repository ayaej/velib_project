import { useState, useEffect } from 'react'
import { fetchStations, fetchStats } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [stationsRes, statsRes] = await Promise.all([
        fetchStations(1, 1000), // Récupérer toutes les stations (max 1000)
        fetchStats()
      ])
      setStations(stationsRes?.data || [])
      setStats(statsRes?.data || null)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  const criticalStations = stations.filter(s => 
    s.numBikesAvailable === 0 || s.numDocksAvailable === 0
  )

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Tableau de bord en temps réel</h1>
        <p className="page-subtitle">Vue d'ensemble du réseau Vélib'</p>
      </div>

      <div className="stats-grid grid grid-4">
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #E0E7FF, #C7D2FE)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Stations totales</p>
            <p className="stat-value">{stats?.totalStations || 0}</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#059669" strokeWidth="2"/>
              <path d="M8 12L11 15L16 9" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Vélos disponibles</p>
            <p className="stat-value">{stats?.totalBikes || 0}</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#D97706" strokeWidth="2"/>
              <path d="M3 9H21" stroke="#D97706" strokeWidth="2"/>
              <path d="M9 3V21" stroke="#D97706" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Places disponibles</p>
            <p className="stat-value">{stats?.totalDocks || 0}</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FEE2E2, #FECACA)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18C1.64532 18.3024 1.55515 18.6453 1.55862 18.9945C1.56209 19.3437 1.65905 19.6849 1.83923 19.9841C2.01941 20.2832 2.27625 20.5304 2.58333 20.7004C2.89041 20.8704 3.23607 20.9576 3.58704 20.9536H20.413C20.764 20.9576 21.1096 20.8704 21.4167 20.7004C21.7238 20.5304 21.9806 20.2832 22.1608 19.9841C22.341 19.6849 22.4379 19.3437 22.4414 18.9945C22.4449 18.6453 22.3547 18.3024 22.18 18L13.71 3.86C13.5318 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89707 12 2.89707C11.6563 2.89707 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4682 3.56611 10.29 3.86V3.86Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9V13" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="17" r="1" fill="#DC2626"/>
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Stations critiques</p>
            <p className="stat-value">{criticalStations.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: '32px' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Types de vélos</h2>
          </div>
          <div className="bike-types-stats">
            {(() => {
              const totalMechanical = stations.reduce((sum, s) => sum + (s.numMechanicalBikes || 0), 0)
              const totalElectric = stations.reduce((sum, s) => sum + (s.numElectricBikes || 0), 0)
              const total = totalMechanical + totalElectric
              
              return (
                <>
                  <div className="bike-type-item">
                    <div className="bike-type-icon mechanical">🚲</div>
                    <div className="bike-type-info">
                      <p className="bike-type-label">Mécaniques</p>
                      <p className="bike-type-value">{totalMechanical}</p>
                      {total > 0 && (
                        <p className="bike-type-percent">{((totalMechanical / total) * 100).toFixed(0)}%</p>
                      )}
                    </div>
                  </div>
                  <div className="bike-type-item">
                    <div className="bike-type-icon electric">⚡</div>
                    <div className="bike-type-info">
                      <p className="bike-type-label">Électriques</p>
                      <p className="bike-type-value">{totalElectric}</p>
                      {total > 0 && (
                        <p className="bike-type-percent">{((totalElectric / total) * 100).toFixed(0)}%</p>
                      )}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Statistiques moyennes</h2>
          </div>
          <div className="average-stats">
            <div className="avg-stat-item">
              <span className="avg-stat-label">Vélos par station</span>
              <span className="avg-stat-value">{stats?.avgBikesPerStation?.toFixed(1) || '0'}</span>
            </div>
            <div className="avg-stat-item">
              <span className="avg-stat-label">Places par station</span>
              <span className="avg-stat-value">{stats?.avgDocksPerStation?.toFixed(1) || '0'}</span>
            </div>
            <div className="avg-stat-item">
              <span className="avg-stat-label">Taux d'occupation</span>
              <span className="avg-stat-value">
                {stats?.totalBikes && stats?.totalStations 
                  ? ((stats.totalBikes / (stats.totalBikes + stats.totalDocks)) * 100).toFixed(1) + '%'
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Alertes</h2>
          </div>
          <div className="alerts-list">
            {criticalStations.length === 0 ? (
              <p className="no-alerts">✅ Aucune station critique</p>
            ) : (
              <div className="alert-items">
                {criticalStations.slice(0, 5).map(station => (
                  <div key={station.stationCode} className="alert-item">
                    <span className="badge badge-danger">
                      {station.numBikesAvailable === 0 ? 'Vide' : 'Pleine'}
                    </span>
                    <span className="alert-station-name">{station.name}</span>
                  </div>
                ))}
                {criticalStations.length > 5 && (
                  <p className="more-alerts">+{criticalStations.length - 5} autres stations</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '32px' }}>
        <div className="card-header">
          <h2 className="card-title">Dernière mise à jour</h2>
        </div>
        <p className="update-time">
          {new Date().toLocaleString('fr-FR', {
            dateStyle: 'full',
            timeStyle: 'medium'
          })}
        </p>
      </div>
    </div>
  )
}

export default Dashboard
