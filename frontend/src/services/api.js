import axios from 'axios';

// Configuration de l'URL de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Instance axios configurée
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Récupérer toutes les stations
 * @param {number} page - Numéro de page
 * @param {number} limit - Nombre de résultats par page
 */
export const getStations = async (page = 1, limit = 50) => {
  const response = await api.get('/stations', { params: { page, limit } })
  return response.data
}

/**
 * Récupérer les stations avec le plus de vélos disponibles
 * @param {number} limit - Nombre de stations à récupérer
 */
export const getTopStations = async (limit = 10) => {
  const response = await api.get('/stations/top', { params: { limit } })
  return response.data
}

/**
 * Récupérer les stations critiques (peu de vélos ou places)
 * @param {number} threshold - Seuil critique
 */
export const getCriticalStations = async (threshold = 3) => {
  const response = await api.get('/stations/critical', { params: { threshold } })
  return response.data
}

/**
 * Récupérer une station spécifique par son ID
 * @param {string} stationId - ID de la station
 */
export const getStation = async (id) => {
  const response = await api.get(`/stations/${id}`)
  return response.data
}

/**
 * Récupérer les statistiques globales
 */
export const getStats = async () => {
  const response = await api.get('/stats')
  return response.data
}

// Nouvelles API pour les données batch
export const getIncidents = async () => {
  const response = await api.get('/batch/incidents')
  return response.data
}

export const getEmptyFullStations = async () => {
  const response = await api.get('/batch/empty-full')
  return response.data
}

export const getDailyStats = async (date = null) => {
  const params = date ? { date } : {}
  const response = await api.get('/batch/daily-stats', { params })
  return response.data
}

export const getAggregatedData = async (stationCode = null, limit = 50) => {
  const params = { limit }
  if (stationCode) params.stationCode = stationCode
  const response = await api.get('/batch/aggregated', { params })
  return response.data
}

// Aliases for backward compatibility
export const fetchStations = getStations;
export const fetchStats = getStats;
export const fetchCriticalStations = getCriticalStations;

export default api;
