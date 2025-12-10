import { useState, useEffect } from 'react'
import './StationIncidents.css'

/**
 * Composant pour afficher les incidents détectés en station
 * - Stations hors service
 * - Anomalies de capacité
 * - Changements brutaux
 */
function StationIncidents({ incidents }) {
  const [filter, setFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('incidentCount')

  if (!incidents || incidents.length === 0) {
    return (
      <div className="incidents-empty">
        <p>🎉 Aucun incident détecté</p>
      </div>
    )
  }

  // Filtrer par type d'incident
  const filteredIncidents = filter === 'ALL' 
    ? incidents 
    : incidents.filter(i => i.incidentType === filter)

  // Trier
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    if (sortBy === 'incidentCount') return b.incidentCount - a.incidentCount
    if (sortBy === 'name') return a.name?.localeCompare(b.name)
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date)
    return 0
  })

  // Compter les incidents par type
  const incidentCounts = {
    OFFLINE: incidents.filter(i => i.incidentType === 'OFFLINE').length,
    CAPACITY_ANOMALY: incidents.filter(i => i.incidentType === 'CAPACITY_ANOMALY').length,
    BRUTAL_CHANGE: incidents.filter(i => i.incidentType === 'BRUTAL_CHANGE').length
  }

  const getIncidentIcon = (type) => {
    switch(type) {
      case 'OFFLINE': return '❌'
      case 'CAPACITY_ANOMALY': return '⚠️'
      case 'BRUTAL_CHANGE': return '⚡'
      default: return '🔍'
    }
  }

  const getIncidentLabel = (type) => {
    switch(type) {
      case 'OFFLINE': return 'Hors Service'
      case 'CAPACITY_ANOMALY': return 'Capacité Anormale'
      case 'BRUTAL_CHANGE': return 'Changement Brutal'
      default: return type
    }
  }

  return (
    <div className="incidents-container">
      <div className="incidents-header">
        <h2>🚨 Incidents en Station</h2>
        
        <div className="incidents-summary">
          <div className="incident-badge offline">
            <span className="badge-icon">❌</span>
            <span className="badge-count">{incidentCounts.OFFLINE}</span>
            <span className="badge-label">Hors service</span>
          </div>
          <div className="incident-badge capacity">
            <span className="badge-icon">⚠️</span>
            <span className="badge-count">{incidentCounts.CAPACITY_ANOMALY}</span>
            <span className="badge-label">Capacité anormale</span>
          </div>
          <div className="incident-badge brutal">
            <span className="badge-icon">⚡</span>
            <span className="badge-count">{incidentCounts.BRUTAL_CHANGE}</span>
            <span className="badge-label">Changements brutaux</span>
          </div>
        </div>
      </div>

      <div className="incidents-controls">
        <div className="filter-buttons">
          <button 
            className={filter === 'ALL' ? 'active' : ''} 
            onClick={() => setFilter('ALL')}
          >
            Tous ({incidents.length})
          </button>
          <button 
            className={filter === 'OFFLINE' ? 'active' : ''} 
            onClick={() => setFilter('OFFLINE')}
          >
            ❌ Hors service ({incidentCounts.OFFLINE})
          </button>
          <button 
            className={filter === 'CAPACITY_ANOMALY' ? 'active' : ''} 
            onClick={() => setFilter('CAPACITY_ANOMALY')}
          >
            ⚠️ Capacité ({incidentCounts.CAPACITY_ANOMALY})
          </button>
          <button 
            className={filter === 'BRUTAL_CHANGE' ? 'active' : ''} 
            onClick={() => setFilter('BRUTAL_CHANGE')}
          >
            ⚡ Changements ({incidentCounts.BRUTAL_CHANGE})
          </button>
        </div>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
          <option value="incidentCount">Trier par Fréquence</option>
          <option value="name">Trier par Nom</option>
          <option value="date">Trier par Date</option>
        </select>
      </div>

      <div className="incidents-list">
        {sortedIncidents.map((incident, index) => (
          <div key={index} className={`incident-card ${incident.incidentType.toLowerCase()}`}>
            <div className="incident-icon">
              {getIncidentIcon(incident.incidentType)}
            </div>
            <div className="incident-details">
              <h3>{incident.name}</h3>
              <p className="station-code">{incident.stationCode}</p>
              <div className="incident-meta">
                <span className="incident-type">{getIncidentLabel(incident.incidentType)}</span>
                <span className="incident-date">📅 {incident.date}</span>
                <span className="incident-count">🔢 {incident.incidentCount} occurrence(s)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="incidents-footer">
        <p>Affichage de {sortedIncidents.length} incident(s)</p>
      </div>
    </div>
  )
}

export default StationIncidents
