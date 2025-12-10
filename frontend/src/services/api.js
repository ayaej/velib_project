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
export const fetchStations = async (page = 1, limit = 50) => {
  try {
    const response = await api.get('/stations', {
      params: { page, limit }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching stations:', error);
    throw error;
  }
};

/**
 * Récupérer les stations avec le plus de vélos disponibles
 * @param {number} limit - Nombre de stations à récupérer
 */
export const fetchTopStations = async (limit = 10) => {
  try {
    const response = await api.get('/stations/top', {
      params: { limit }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching top stations:', error);
    throw error;
  }
};

/**
 * Récupérer les stations critiques (peu de vélos ou places)
 * @param {number} threshold - Seuil critique
 */
export const fetchCriticalStations = async (threshold = 3) => {
  try {
    const response = await api.get('/stations/critical', {
      params: { threshold }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching critical stations:', error);
    throw error;
  }
};

/**
 * Récupérer une station spécifique par son ID
 * @param {string} stationId - ID de la station
 */
export const fetchStationById = async (stationId) => {
  try {
    const response = await api.get(`/stations/${stationId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching station:', error);
    throw error;
  }
};

/**
 * Récupérer les statistiques globales
 */
export const fetchStats = async () => {
  try {
    const response = await api.get('/stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

// TODO: Ajouter d'autres fonctions API si nécessaire

export default api;
