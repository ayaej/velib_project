import { useState, useEffect } from 'react'
import { getIncidents } from '../services/api'
import './Incidents.css'

function Incidents() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, offline, capacity, change

  useEffect(() => {
    loadIncidents()
  }, [])

  const loadIncidents = async () => {
    try {
      const response = await getIncidents()
      setIncidents(response?.data || [])
    } catch (error) {
      console.error('Error loading incidents:', error)
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

  const incidentsByType = {
    OFFLINE: incidents.filter(i => i.incidentType === 'OFFLINE'),
    CAPACITY_ANOMALY: incidents.filter(i => i.incidentType === 'CAPACITY_ANOMALY'),
    BRUTAL_CHANGE: incidents.filter(i => i.incidentType === 'BRUTAL_CHANGE')
  }

  const filteredIncidents = filter === 'all' 
    ? incidents 
    : filter === 'offline'
    ? incidentsByType.OFFLINE
    : filter === 'capacity'
    ? incidentsByType.CAPACITY_ANOMALY
    : incidentsByType.BRUTAL_CHANGE

  const getIncidentIcon = (type) => {
    switch(type) {
      case 'OFFLINE':
        return '🔴'
      case 'CAPACITY_ANOMALY':
        return '⚠️'
      case 'BRUTAL_CHANGE':
        return '📊'
      default:
        return '❓'
    }
  }

  const getIncidentLabel = (type) => {
    switch(type) {
      case 'OFFLINE':
        return 'Hors service'
      case 'CAPACITY_ANOMALY':
        return 'Capacité anormale'
      case 'BRUTAL_CHANGE':
        return 'Changement brutal'
      default:
        return type
    }
  }

  const getIncidentBadgeClass = (type) => {
    switch(type) {
      case 'OFFLINE':
        return 'badge-danger'
      case 'CAPACITY_ANOMALY':
        return 'badge-warning'
      case 'BRUTAL_CHANGE':
        return 'badge-info'
      default:
        return 'badge-info'
    }
  }

  return (
    <div className="incidents-page">
      <div className="page-header">
        <div>
          <h1>Incidents et anomalies</h1>
          <p className="page-subtitle">Détection automatique par le traitement batch</p>
        </div>
      </div>

      <div className="incidents-summary grid grid-3">
        <div className="summary-card card" onClick={() => setFilter('offline')}>
          <div className="summary-icon" style={{ background: '#fee2e2', color: '#991b1b' }}>
            🔴
          </div>
          <div className="summary-content">
            <p className="summary-label">Stations hors service</p>
            <p className="summary-value">{incidentsByType.OFFLINE.length}</p>
          </div>
        </div>

        <div className="summary-card card" onClick={() => setFilter('capacity')}>
          <div className="summary-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
            ⚠️
          </div>
          <div className="summary-content">
            <p className="summary-label">Capacités anormales</p>
            <p className="summary-value">{incidentsByType.CAPACITY_ANOMALY.length}</p>
          </div>
        </div>

        <div className="summary-card card" onClick={() => setFilter('change')}>
          <div className="summary-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            📊
          </div>
          <div className="summary-content">
            <p className="summary-label">Changements brutaux</p>
            <p className="summary-value">{incidentsByType.BRUTAL_CHANGE.length}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '32px' }}>
        <div className="card-header">
          <h2 className="card-title">
            {filter === 'all' ? 'Tous les incidents' : `Incidents: ${getIncidentLabel(filter.toUpperCase())}`}
          </h2>
          <div className="filter-actions">
            <button 
              className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tous ({incidents.length})
            </button>
            <button 
              className={`filter-chip ${filter === 'offline' ? 'active' : ''}`}
              onClick={() => setFilter('offline')}
            >
              Hors service ({incidentsByType.OFFLINE.length})
            </button>
            <button 
              className={`filter-chip ${filter === 'capacity' ? 'active' : ''}`}
              onClick={() => setFilter('capacity')}
            >
              Capacité ({incidentsByType.CAPACITY_ANOMALY.length})
            </button>
            <button 
              className={`filter-chip ${filter === 'change' ? 'active' : ''}`}
              onClick={() => setFilter('change')}
            >
              Changements ({incidentsByType.BRUTAL_CHANGE.length})
            </button>
          </div>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="no-incidents">
            <div className="no-incidents-icon">✅</div>
            <h3>Aucun incident détecté</h3>
            <p>Toutes les stations fonctionnent normalement</p>
          </div>
        ) : (
          <div className="incidents-list">
            {filteredIncidents.map((incident, index) => (
              <div key={`${incident.stationCode}-${index}`} className="incident-card">
                <div className="incident-header">
                  <div className="incident-icon">
                    {getIncidentIcon(incident.incidentType)}
                  </div>
                  <div className="incident-title-section">
                    <h3 className="incident-station-name">{incident.name}</h3>
                    <span className={`badge ${getIncidentBadgeClass(incident.incidentType)}`}>
                      {getIncidentLabel(incident.incidentType)}
                    </span>
                  </div>
                  <div className="incident-count">
                    {incident.incidentCount} occurrence{incident.incidentCount > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="incident-details">
                  <div className="incident-detail-item">
                    <span className="detail-label">Code station:</span>
                    <span className="detail-value">{incident.stationCode}</span>
                  </div>
                  <div className="incident-detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{incident.date || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Incidents
