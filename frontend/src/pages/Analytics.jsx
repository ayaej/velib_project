import { useState, useEffect } from 'react'
import { getAggregatedData, getEmptyFullStations, getDailyStats } from '../services/api'
import './Analytics.css'

function Analytics() {
  const [aggregatedData, setAggregatedData] = useState([])
  const [emptyFullStations, setEmptyFullStations] = useState([])
  const [dailyStats, setDailyStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview, empty, full

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const [aggregated, emptyFull, daily] = await Promise.all([
        getAggregatedData(),
        getEmptyFullStations(),
        getDailyStats()
      ])
      
      setAggregatedData(aggregated?.data || [])
      setEmptyFullStations(emptyFull?.data || [])
      setDailyStats(daily?.data?.[0] || null)
    } catch (error) {
      console.error('Error loading analytics:', error)
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

  const emptyStations = emptyFullStations
    .filter(s => s.emptyPercentage > 30)
    .sort((a, b) => b.emptyPercentage - a.emptyPercentage)
    .slice(0, 20)

  const fullStations = emptyFullStations
    .filter(s => s.fullPercentage > 30)
    .sort((a, b) => b.fullPercentage - a.fullPercentage)
    .slice(0, 20)

  const topAvailability = aggregatedData
    .sort((a, b) => b.avgBikesAvailable - a.avgBikesAvailable)
    .slice(0, 10)

  const lowAvailability = aggregatedData
    .sort((a, b) => a.avgBikesAvailable - b.avgBikesAvailable)
    .slice(0, 10)

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analyses et tendances</h1>
        <p className="page-subtitle">Données agrégées par le traitement batch</p>
      </div>

      {dailyStats && (
        <div className="stats-overview grid grid-4">
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="#2563eb" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="#2563eb" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="#2563eb" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="#2563eb" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Stations analysées</p>
              <p className="stat-value">{dailyStats.totalStations || 0}</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/>
                <path d="M8 12L11 15L16 9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Moy. vélos/station</p>
              <p className="stat-value">{dailyStats.avgBikesPerStation?.toFixed(1) || 0}</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="#f59e0b" strokeWidth="2"/>
                <path d="M3 9H21" stroke="#f59e0b" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Moy. places/station</p>
              <p className="stat-value">{dailyStats.avgDocksPerStation?.toFixed(1) || 0}</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ background: '#e0e7ff' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2"/>
                <circle cx="12" cy="12" r="6" fill="#6366f1" opacity="0.3"/>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Taux occupation</p>
              <p className="stat-value">
                {((dailyStats.totalBikes / (dailyStats.totalBikes + dailyStats.totalDocks)) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="tabs-container card" style={{ marginTop: '32px' }}>
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button 
            className={`tab-btn ${activeTab === 'empty' ? 'active' : ''}`}
            onClick={() => setActiveTab('empty')}
          >
            Stations souvent vides
          </button>
          <button 
            className={`tab-btn ${activeTab === 'full' ? 'active' : ''}`}
            onClick={() => setActiveTab('full')}
          >
            Stations souvent pleines
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'overview' && (
            <div className="grid grid-2">
              <div>
                <h3 className="section-title">🏆 Top 10 - Meilleure disponibilité</h3>
                <div className="ranking-list">
                  {topAvailability.map((station, index) => (
                    <div key={station.stationCode} className="ranking-item">
                      <div className="ranking-number">{index + 1}</div>
                      <div className="ranking-info">
                        <p className="ranking-name">{station.name}</p>
                        <p className="ranking-stats">
                          Moy: {station.avgBikesAvailable?.toFixed(1)} vélos
                        </p>
                      </div>
                      <div className="ranking-value success">
                        {station.avgBikesAvailable?.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="section-title">⚠️ Top 10 - Plus faible disponibilité</h3>
                <div className="ranking-list">
                  {lowAvailability.map((station, index) => (
                    <div key={station.stationCode} className="ranking-item">
                      <div className="ranking-number">{index + 1}</div>
                      <div className="ranking-info">
                        <p className="ranking-name">{station.name}</p>
                        <p className="ranking-stats">
                          Moy: {station.avgBikesAvailable?.toFixed(1)} vélos
                        </p>
                      </div>
                      <div className="ranking-value danger">
                        {station.avgBikesAvailable?.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'empty' && (
            <div>
              <h3 className="section-title">📊 Stations fréquemment vides (&gt;30% du temps)</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Station</th>
                      <th>% Vide</th>
                      <th>Observations</th>
                      <th>Occupation moy.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emptyStations.map(station => (
                      <tr key={station.stationCode}>
                        <td>{station.name}</td>
                        <td>
                          <span className="badge badge-danger">
                            {station.emptyPercentage?.toFixed(1)}%
                          </span>
                        </td>
                        <td>{station.totalObservations}</td>
                        <td>{station.avgOccupancyRate?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'full' && (
            <div>
              <h3 className="section-title">📊 Stations fréquemment pleines (&gt;30% du temps)</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Station</th>
                      <th>% Pleine</th>
                      <th>Observations</th>
                      <th>Occupation moy.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullStations.map(station => (
                      <tr key={station.stationCode}>
                        <td>{station.name}</td>
                        <td>
                          <span className="badge badge-warning">
                            {station.fullPercentage?.toFixed(1)}%
                          </span>
                        </td>
                        <td>{station.totalObservations}</td>
                        <td>{station.avgOccupancyRate?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
