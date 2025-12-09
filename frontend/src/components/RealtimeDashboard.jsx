import { useState, useEffect } from 'react'
import './RealtimeDashboard.css'

/**
 * Dashboard temps réel affichant les statistiques globales
 * TODO: Ajouter des graphiques avec Recharts
 */
function RealtimeDashboard({ stats }) {
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    setLastUpdate(new Date())
  }, [stats])

  if (!stats) {
    return <div className="dashboard-loading">Chargement des statistiques...</div>
  }

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">📊 Statistiques en Temps Réel</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚉</div>
          <div className="stat-value">{stats.totalStations || 0}</div>
          <div className="stat-label">Stations Actives</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚴</div>
          <div className="stat-value">{stats.totalBikes || 0}</div>
          <div className="stat-label">Vélos Disponibles</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🅿️</div>
          <div className="stat-value">{stats.totalDocks || 0}</div>
          <div className="stat-label">Places Disponibles</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats.avgOccupancy ? `${stats.avgOccupancy.toFixed(1)}%` : 'N/A'}</div>
          <div className="stat-label">Taux d'Occupation</div>
        </div>
      </div>

      <div className="dashboard-footer">
        <p>⏱️ Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</p>
      </div>

      {/* TODO: Ajouter des graphiques en temps réel */}
      {/* TODO: Ajouter une carte interactive avec Leaflet */}
    </div>
  )
}

export default RealtimeDashboard
