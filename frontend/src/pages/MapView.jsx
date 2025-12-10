import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import { fetchStations } from '../services/api'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

// Fix for default markers in React-Leaflet
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

function MapView() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, available, empty, full
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStation, setSelectedStation] = useState(null)
  const [mapCenter, setMapCenter] = useState([45.764043, 4.835659])
  const [mapZoom, setMapZoom] = useState(13)

  useEffect(() => {
    loadStations()
    const interval = setInterval(loadStations, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadStations = async () => {
    try {
      const response = await fetchStations(1, 1000) // Récupérer toutes les stations (max 1000)
      const stationsData = response?.data || []
      console.log('🗺️ Stations loaded for map:', stationsData.length)
      setStations(stationsData)
    } catch (error) {
      console.error('❌ Error loading stations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStationColor = (station) => {
    if (!station.isInstalled) return '#6b7280' // Gris
    if (station.numBikesAvailable === 0) return '#ef4444' // Rouge
    if (station.numDocksAvailable === 0) return '#f59e0b' // Orange
    if (station.numBikesAvailable > 5) return '#10b981' // Vert
    return '#3b82f6' // Bleu
  }

  const getStationRadius = (station) => {
    const capacity = station.capacity || 20
    return Math.max(8, Math.min(15, capacity / 2))
  }

  const filteredStations = stations.filter(station => {
    if (filter === 'empty') return station.numBikesAvailable === 0
    if (filter === 'full') return station.numDocksAvailable === 0
    if (filter === 'available') return station.numBikesAvailable > 0 && station.numDocksAvailable > 0
    return true
  })

  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : stations.filter(station => 
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.stationCode.toString().includes(searchQuery)
      ).slice(0, 10) // Limiter à 10 résultats

  const handleSearchSelect = (station) => {
    setSelectedStation(station)
    const coords = [station.coordinates[1], station.coordinates[0]]
    setMapCenter(coords)
    setMapZoom(17)
    setSearchQuery('')
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  // Centre de Lyon
  const centerPosition = [45.764043, 4.835659]

  return (
    <div className="map-page">
      <div className="page-header">
        <div>
          <h1>Carte interactive</h1>
          <p className="page-subtitle">{filteredStations.length} stations affichées</p>
        </div>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes ({stations.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            Disponibles ({stations.filter(s => s.numBikesAvailable > 0 && s.numDocksAvailable > 0).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'empty' ? 'active' : ''}`}
            onClick={() => setFilter('empty')}
          >
            Vides ({stations.filter(s => s.numBikesAvailable === 0).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'full' ? 'active' : ''}`}
            onClick={() => setFilter('full')}
          >
            Pleines ({stations.filter(s => s.numDocksAvailable === 0).length})
          </button>
        </div>
      </div>

      <div className="map-container-wrapper">
        {/* Search Panel */}
        <div className="search-panel card">
          <div className="search-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input 
              type="text" 
              placeholder="Rechercher une station..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery && (
            <div className="search-results">
              {searchResults.length > 0 ? (
                <>
                  <p className="results-count">{searchResults.length} résultat(s)</p>
                  {searchResults.map(station => (
                    <div 
                      key={station.stationCode}
                      className="search-result-item"
                      onClick={() => handleSearchSelect(station)}
                    >
                      <div className="result-info">
                        <p className="result-name">{station.name}</p>
                        <p className="result-code">Code: {station.stationCode}</p>
                      </div>
                      <div className="result-stats">
                        <span className="result-bikes">🚲 {station.numBikesAvailable}</span>
                        <span className="result-docks">🅿️ {station.numDocksAvailable}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="no-results">Aucune station trouvée</p>
              )}
            </div>
          )}

          {/* Station Info Panel */}
          {selectedStation && (
            <div className="selected-station-info">
              <div className="info-header">
                <h3>{selectedStation.name}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedStation(null)}
                >
                  ✕
                </button>
              </div>
              <div className="info-stats">
                <div className="info-stat">
                  <span className="info-label">Vélos disponibles</span>
                  <span className="info-value">{selectedStation.numBikesAvailable}</span>
                </div>
                <div className="info-stat">
                  <span className="info-label">Places disponibles</span>
                  <span className="info-value">{selectedStation.numDocksAvailable}</span>
                </div>
                <div className="info-stat">
                  <span className="info-label">Capacité totale</span>
                  <span className="info-value">{selectedStation.capacity}</span>
                </div>
                {selectedStation.numMechanicalBikes !== undefined && (
                  <>
                    <div className="info-stat">
                      <span className="info-label">🚲 Mécaniques</span>
                      <span className="info-value">{selectedStation.numMechanicalBikes}</span>
                    </div>
                    <div className="info-stat">
                      <span className="info-label">⚡ Électriques</span>
                      <span className="info-value">{selectedStation.numElectricBikes}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="map-container card">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
            key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {filteredStations.map((station) => {
              const leafletCoords = [station.coordinates[1], station.coordinates[0]]
              
              return (
                <CircleMarker
                  key={station.stationCode}
                  center={leafletCoords}
                  radius={getStationRadius(station)}
                  fillColor={getStationColor(station)}
                  fillOpacity={selectedStation?.stationCode === station.stationCode ? 1 : 0.7}
                  color={selectedStation?.stationCode === station.stationCode ? '#000' : '#fff'}
                  weight={selectedStation?.stationCode === station.stationCode ? 3 : 2}
                  eventHandlers={{
                    click: () => handleSearchSelect(station)
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h3 className="popup-title">{station.name}</h3>
                      <p className="popup-code">Code: {station.stationCode}</p>
                      
                      <div className="popup-stats">
                        <div className="popup-stat">
                          <span>🚲 Vélos:</span>
                          <span>{station.numBikesAvailable}</span>
                        </div>
                        <div className="popup-stat">
                          <span>🅿️ Places:</span>
                          <span>{station.numDocksAvailable}</span>
                        </div>
                        <div className="popup-stat">
                          <span>📊 Capacité:</span>
                          <span>{station.capacity}</span>
                        </div>
                        {station.numMechanicalBikes !== undefined && (
                          <>
                            <div className="popup-stat bike-type">
                              <span>🚲 Mécaniques:</span>
                              <span>{station.numMechanicalBikes || 0}</span>
                            </div>
                            <div className="popup-stat bike-type">
                              <span>⚡ Électriques:</span>
                              <span>{station.numElectricBikes || 0}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="popup-status">
                        {station.isInstalled ? (
                          <span className="badge badge-success">En service</span>
                        ) : (
                          <span className="badge badge-danger">Hors service</span>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="map-legend card">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#10b981' }}></div>
            <span>Bien fournie (&gt;5 vélos)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#3b82f6' }}></div>
            <span>Disponible (1-5 vélos)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ef4444' }}></div>
            <span>Vide (0 vélo)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
            <span>Pleine (0 place)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#6b7280' }}></div>
            <span>Hors service</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapView
