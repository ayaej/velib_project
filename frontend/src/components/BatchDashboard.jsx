import { useState, useEffect } from 'react'
import './BatchDashboard.css'

/**
 * Dashboard pour afficher toutes les agrégations du traitement Batch
 * - Statistiques globales journalières
 * - Stations vides/pleines
 * - Top stations (meilleure/pire performance)
 * - Tendances
 */
function BatchDashboard({ dailyStats, emptyFullStations, aggregatedData }) {
  const [activeTab, setActiveTab] = useState('overview')

  // Si aucune donnée batch disponible
  if (!dailyStats && !emptyFullStations && !aggregatedData) {
    return (
      <div className="batch-dashboard-empty">
        <div className="empty-icon">📊</div>
        <h3>Traitement Batch en cours...</h3>
        <p>Les agrégations seront disponibles après le premier traitement batch.</p>
        <p className="empty-hint">💡 Les données historiques sont analysées périodiquement pour détecter les tendances.</p>
      </div>
    )
  }

  return (
    <div className="batch-dashboard">
      <div className="dashboard-header">
        <h2>📊 Analyse Batch - Données Historiques</h2>
        <div className="dashboard-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            📈 Vue d'ensemble
          </button>
          <button 
            className={activeTab === 'empty-full' ? 'active' : ''} 
            onClick={() => setActiveTab('empty-full')}
          >
            🚨 Stations Critiques
          </button>
          <button 
            className={activeTab === 'top-stations' ? 'active' : ''} 
            onClick={() => setActiveTab('top-stations')}
          >
            🏆 Top Stations
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <DailyStatsView dailyStats={dailyStats} />
        )}
        
        {activeTab === 'empty-full' && (
          <EmptyFullView stations={emptyFullStations} />
        )}
        
        {activeTab === 'top-stations' && (
          <TopStationsView aggregatedData={aggregatedData} />
        )}
      </div>
    </div>
  )
}

/**
 * Vue des statistiques quotidiennes globales
 */
function DailyStatsView({ dailyStats }) {
  if (!dailyStats) {
    return <div className="no-data">Aucune statistique journalière disponible</div>
  }

  return (
    <div className="daily-stats-view">
      <h3>📅 Statistiques du Jour</h3>
      
      <div className="stats-grid-large">
        <div className="stat-card-large primary">
          <div className="stat-header">
            <span className="stat-icon">📊</span>
            <span className="stat-title">Vélos Disponibles (Moyenne)</span>
          </div>
          <div className="stat-value">{dailyStats.avgBikesPerStation?.toFixed(1) || 'N/A'}</div>
          <div className="stat-footer">
            <span className="stat-detail">Total: {dailyStats.totalBikes?.toLocaleString() || 0}</span>
            <span className="stat-detail">Stations: {dailyStats.totalStations || 0}</span>
          </div>
        </div>

        <div className="stat-card-large success">
          <div className="stat-header">
            <span className="stat-icon">🅿️</span>
            <span className="stat-title">Places Disponibles (Moyenne)</span>
          </div>
          <div className="stat-value">{dailyStats.avgDocksPerStation?.toFixed(1) || 'N/A'}</div>
          <div className="stat-footer">
            <span className="stat-detail">Total: {dailyStats.totalDocks?.toLocaleString() || 0}</span>
            <span className="stat-detail">Stations: {dailyStats.totalStations || 0}</span>
          </div>
        </div>

        <div className="stat-card-large warning">
          <div className="stat-header">
            <span className="stat-icon">📈</span>
            <span className="stat-title">Taux d'Occupation Moyen</span>
          </div>
          <div className="stat-value">
            {dailyStats.totalBikes && dailyStats.totalDocks 
              ? ((dailyStats.totalBikes / (dailyStats.totalBikes + dailyStats.totalDocks)) * 100).toFixed(1)
              : 'N/A'}%
          </div>
          <div className="stat-footer">
            <span className="stat-detail">Vélos / Total</span>
          </div>
        </div>

        <div className="stat-card-large info">
          <div className="stat-header">
            <span className="stat-icon">🚉</span>
            <span className="stat-title">Stations Totales</span>
          </div>
          <div className="stat-value">{dailyStats.totalStations?.toLocaleString() || 'N/A'}</div>
          <div className="stat-footer">
            <span className="stat-detail">🚲 {dailyStats.totalBikes?.toLocaleString() || 0} vélos</span>
            <span className="stat-detail">🅿️ {dailyStats.totalDocks?.toLocaleString() || 0} places</span>
          </div>
        </div>
      </div>

      {dailyStats.date && (
        <div className="stats-metadata">
          <p>📅 Date d'analyse: <strong>{dailyStats.date}</strong></p>
          <p>⏰ Dernière mise à jour: <strong>{new Date(dailyStats.lastUpdate || Date.now()).toLocaleString('fr-FR')}</strong></p>
        </div>
      )}
    </div>
  )
}

/**
 * Vue des stations vides/pleines
 */
function EmptyFullView({ stations }) {
  if (!stations || stations.length === 0) {
    return <div className="no-data">Aucune station critique détectée 🎉</div>
  }

  const emptyStations = stations.filter(s => s.status === 'EMPTY')
  const fullStations = stations.filter(s => s.status === 'FULL')

  return (
    <div className="empty-full-view">
      <div className="critical-stats">
        <div className="critical-badge empty">
          <span className="badge-icon">🚫</span>
          <div className="badge-content">
            <div className="badge-number">{emptyStations.length}</div>
            <div className="badge-label">Stations Vides</div>
          </div>
        </div>
        <div className="critical-badge full">
          <span className="badge-icon">🚫</span>
          <div className="badge-content">
            <div className="badge-number">{fullStations.length}</div>
            <div className="badge-label">Stations Pleines</div>
          </div>
        </div>
      </div>

      <div className="critical-lists">
        {emptyStations.length > 0 && (
          <div className="critical-section empty">
            <h4>🚫 Stations Sans Vélos</h4>
            <div className="critical-items">
              {emptyStations.map((station, idx) => (
                <div key={idx} className="critical-item">
                  <div className="item-name">{station.name}</div>
                  <div className="item-details">
                    <span className="item-code">{station.stationCode}</span>
                    <span className="item-duration">Vide depuis: {station.duration || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {fullStations.length > 0 && (
          <div className="critical-section full">
            <h4>🔴 Stations Pleines</h4>
            <div className="critical-items">
              {fullStations.map((station, idx) => (
                <div key={idx} className="critical-item">
                  <div className="item-name">{station.name}</div>
                  <div className="item-details">
                    <span className="item-code">{station.stationCode}</span>
                    <span className="item-duration">Pleine depuis: {station.duration || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Vue du Top des stations
 */
function TopStationsView({ aggregatedData }) {
  if (!aggregatedData || aggregatedData.length === 0) {
    return <div className="no-data">Aucune donnée d'agrégation disponible</div>
  }

  // Trier pour obtenir les tops
  const topMostUsed = [...aggregatedData]
    .sort((a, b) => (b.avgBikesAvailable || 0) - (a.avgBikesAvailable || 0))
    .slice(0, 10)

  const topLeastUsed = [...aggregatedData]
    .sort((a, b) => (a.avgBikesAvailable || 0) - (b.avgBikesAvailable || 0))
    .slice(0, 10)

  return (
    <div className="top-stations-view">
      <div className="top-section">
        <h4>🏆 Stations les Plus Populaires</h4>
        <p className="section-description">Stations avec le plus de vélos disponibles en moyenne</p>
        <div className="top-list">
          {topMostUsed.map((station, idx) => (
            <div key={idx} className="top-item best">
              <div className="top-rank">#{idx + 1}</div>
              <div className="top-details">
                <div className="top-name">{station.name}</div>
                <div className="top-stats">
                  <span>🚲 {station.avgBikesAvailable?.toFixed(1) || 0} vélos (moy)</span>
                  <span>📊 {station.recordCount || 0} mesures</span>
                </div>
              </div>
              <div className="top-capacity">
                {station.capacity || 0} places
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="top-section">
        <h4>⚠️ Stations Sous-Utilisées</h4>
        <p className="section-description">Stations avec le moins de vélos disponibles (forte demande)</p>
        <div className="top-list">
          {topLeastUsed.map((station, idx) => (
            <div key={idx} className="top-item worst">
              <div className="top-rank">#{idx + 1}</div>
              <div className="top-details">
                <div className="top-name">{station.name}</div>
                <div className="top-stats">
                  <span>🚲 {station.avgBikesAvailable?.toFixed(1) || 0} vélos (moy)</span>
                  <span>📊 {station.recordCount || 0} mesures</span>
                </div>
              </div>
              <div className="top-capacity">
                {station.capacity || 0} places
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BatchDashboard
