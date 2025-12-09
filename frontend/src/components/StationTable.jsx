import { useState } from 'react'
import './StationTable.css'

/**
 * Composant tableau affichant toutes les stations
 * TODO: Ajouter pagination, filtres, tri
 */
function StationTable({ stations }) {
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')

  if (!stations || stations.length === 0) {
    return <div className="table-empty">Aucune station disponible</div>
  }

  // TODO: Implémenter le filtrage
  const filteredStations = stations.filter(station => 
    station.name?.toLowerCase().includes(filter.toLowerCase())
  )

  // TODO: Implémenter le tri
  const sortedStations = [...filteredStations].sort((a, b) => {
    if (sortBy === 'name') return a.name?.localeCompare(b.name)
    if (sortBy === 'bikes') return b.numBikesAvailable - a.numBikesAvailable
    if (sortBy === 'docks') return b.numDocksAvailable - a.numDocksAvailable
    return 0
  })

  const getStatusClass = (station) => {
    if (!station.isInstalled) return 'status-offline'
    if (station.numBikesAvailable <= 2) return 'status-critical'
    if (station.numBikesAvailable <= 5) return 'status-warning'
    return 'status-ok'
  }

  return (
    <div className="station-table-container">
      <div className="table-header">
        <h2>🚲 Liste des Stations</h2>
        <div className="table-controls">
          <input
            type="text"
            placeholder="Rechercher une station..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Trier par Nom</option>
            <option value="bikes">Trier par Vélos</option>
            <option value="docks">Trier par Places</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="stations-table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Capacité</th>
              <th>🚴 Vélos</th>
              <th>🅿️ Places</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {sortedStations.map((station, index) => (
              <tr key={station.stationCode || index} className={getStatusClass(station)}>
                <td className="station-name">
                  <strong>{station.name}</strong>
                  <small>{station.stationCode}</small>
                </td>
                <td>{station.capacity || 0}</td>
                <td className="bikes-count">{station.numBikesAvailable || 0}</td>
                <td className="docks-count">{station.numDocksAvailable || 0}</td>
                <td>
                  {station.isInstalled ? (
                    <span className="status-badge">✅ Active</span>
                  ) : (
                    <span className="status-badge">❌ Hors service</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p>Affichage de {sortedStations.length} station(s)</p>
      </div>
    </div>
  )
}

export default StationTable
