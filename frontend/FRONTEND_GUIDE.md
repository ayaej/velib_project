# Frontend Vélib' Analytics - Guide d'utilisation

## 🎨 Architecture du Frontend

Le frontend est une application React moderne avec une architecture multi-pages utilisant React Router.

### Structure des pages

```
frontend/
├── src/
│   ├── App.jsx                    # Point d'entrée principal avec routing
│   ├── App.css                    # Styles globaux et design system
│   ├── components/
│   │   ├── Layout.jsx             # Layout avec sidebar navigation
│   │   └── Layout.css
│   ├── pages/
│   │   ├── Dashboard.jsx          # 📊 Tableau de bord principal
│   │   ├── Dashboard.css
│   │   ├── MapView.jsx            # 🗺️ Carte interactive Leaflet
│   │   ├── MapView.css
│   │   ├── Analytics.jsx          # 📈 Analyses batch et tendances
│   │   ├── Analytics.css
│   │   ├── Incidents.jsx          # ⚠️ Gestion des incidents
│   │   └── Incidents.css
│   └── services/
│       └── api.js                 # Service d'appel API backend
```

## 📱 Pages disponibles

### 1. Tableau de bord (`/`)
- **Vue d'ensemble en temps réel** du réseau Vélib'
- **4 statistiques principales** :
  - Nombre total de stations
  - Vélos disponibles
  - Places disponibles
  - Stations critiques (vides ou pleines)
- **Statistiques moyennes** par station
- **Alertes actives** pour les stations problématiques
- **Rafraîchissement automatique** toutes les 30 secondes

### 2. Carte interactive (`/map`)
- **Carte Leaflet** centrée sur Lyon
- **Marqueurs colorés** selon l'état de la station :
  - 🟢 Vert : Bien fournie (>5 vélos)
  - 🔵 Bleu : Disponible (1-5 vélos)
  - 🔴 Rouge : Vide (0 vélo)
  - 🟠 Orange : Pleine (0 place)
  - ⚫ Gris : Hors service
- **Filtres dynamiques** :
  - Toutes les stations
  - Stations disponibles
  - Stations vides
  - Stations pleines
- **Popup détaillé** sur chaque station avec :
  - Nombre de vélos disponibles
  - Nombre de places disponibles
  - Capacité totale
  - État de service

### 3. Analyses (`/analytics`)
- **Données agrégées** du traitement batch Spark
- **3 onglets d'analyse** :
  
  #### Vue d'ensemble
  - Top 10 stations avec meilleure disponibilité
  - Top 10 stations avec plus faible disponibilité
  
  #### Stations souvent vides
  - Liste des stations vides >30% du temps
  - Pourcentage de temps vide
  - Nombre d'observations
  - Taux d'occupation moyen
  
  #### Stations souvent pleines
  - Liste des stations pleines >30% du temps
  - Pourcentage de temps pleine
  - Statistiques détaillées

### 4. Incidents (`/incidents`)
- **Détection automatique** par le batch processing
- **3 types d'incidents** :
  - 🔴 **Hors service** : Stations déconnectées
  - ⚠️ **Capacité anormale** : Capacité = 0 ou > 100
  - 📊 **Changement brutal** : Variations >20 vélos
- **Filtres par type** d'incident
- **Cartes détaillées** pour chaque incident

## 🎨 Design System

### Variables CSS disponibles
```css
--primary-color: #2563eb      /* Bleu principal */
--primary-dark: #1e40af       /* Bleu foncé */
--secondary-color: #10b981    /* Vert */
--danger-color: #ef4444       /* Rouge */
--warning-color: #f59e0b      /* Orange */
--background: #f8fafc         /* Fond gris clair */
--surface: #ffffff            /* Blanc */
--text-primary: #1e293b       /* Texte principal */
--text-secondary: #64748b     /* Texte secondaire */
```

### Classes utilitaires

#### Cards
```jsx
<div className="card">
  <div className="card-header">
    <h2 className="card-title">Titre</h2>
  </div>
  {/* Contenu */}
</div>
```

#### Grid System
```jsx
<div className="grid grid-2">  {/* 2 colonnes */}
<div className="grid grid-3">  {/* 3 colonnes */}
<div className="grid grid-4">  {/* 4 colonnes */}
```

#### Badges
```jsx
<span className="badge badge-success">Succès</span>
<span className="badge badge-warning">Attention</span>
<span className="badge badge-danger">Erreur</span>
<span className="badge badge-info">Info</span>
```

#### Boutons
```jsx
<button className="btn btn-primary">Action</button>
```

## 🚀 Lancement

### Développement
```bash
cd frontend
npm install
npm run dev
```
Le frontend sera accessible sur `http://localhost:5173` (ou 5174 si 5173 est occupé)

### Production
```bash
npm run build
npm run preview
```

## 🔌 Configuration API

Le frontend se connecte au backend Node.js sur le port **3001**.

Configuration dans `src/services/api.js` :
```javascript
const API_BASE_URL = 'http://localhost:3001/api'
```

### Endpoints utilisés
- `GET /api/stations` - Liste de toutes les stations temps réel
- `GET /api/stats` - Statistiques globales
- `GET /api/stats/aggregated` - Données agrégées batch
- `GET /api/stats/empty-full` - Suivi stations vides/pleines
- `GET /api/stats/daily` - Statistiques quotidiennes
- `GET /api/incidents` - Liste des incidents détectés

## 📦 Dépendances principales

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x",    // Navigation multi-pages
  "react-leaflet": "^4.2.1",     // Carte interactive
  "leaflet": "^1.9.4",           // Bibliothèque de cartes
  "axios": "^1.6.2",             // Appels HTTP
  "recharts": "^2.10.3"          // Graphiques (futur)
}
```

## 🎯 Fonctionnalités clés

### Rafraîchissement automatique
- Dashboard : **30 secondes**
- Carte : **30 secondes**
- Analytics : **Manuel** (données batch)
- Incidents : **Manuel** (données batch)

### Responsive Design
- ✅ Desktop (>1024px)
- ✅ Tablet (768px-1024px)
- ✅ Mobile (<768px)

### Accessibilité
- Navigation au clavier
- Contraste des couleurs respecté
- États de chargement visuels
- Messages d'erreur clairs

## 🐛 Résolution de problèmes

### La carte n'affiche pas les stations
**Problème** : Les coordonnées MongoDB sont inversées (longitude, latitude) vs Leaflet (latitude, longitude)

**Solution** : Le code inverse automatiquement les coordonnées :
```javascript
const leafletCoords = [station.coordinates[1], station.coordinates[0]]
```

### Port 5173 déjà utilisé
**Solution** : Vite choisit automatiquement le port suivant (5174, 5175, etc.)

### Données non rafraîchies
**Solution** : 
1. Vérifier que le backend est démarré : `docker ps | findstr backend`
2. Tester l'API : `curl http://localhost:3001/api/stations`
3. Vider le cache du navigateur : Ctrl+Shift+R

### Erreur CORS
**Solution** : Le backend doit avoir les CORS activés (déjà configuré dans `server.js`)

## 🎨 Personnalisation

### Changer les couleurs
Modifier les variables dans `src/App.css` :
```css
:root {
  --primary-color: #votre-couleur;
}
```

### Ajouter une nouvelle page
1. Créer `src/pages/NouvelePage.jsx`
2. Créer `src/pages/NouvelePage.css`
3. Ajouter la route dans `src/App.jsx` :
```jsx
<Route path="/nouvelle" element={<NouvelePage />} />
```
4. Ajouter le lien dans `src/components/Layout.jsx`

### Modifier l'intervalle de rafraîchissement
Dans chaque page, modifier la valeur (en millisecondes) :
```javascript
const interval = setInterval(loadData, 60000) // 60 secondes
```

## 📊 Métriques affichées

### Temps réel (streaming)
- Nombre de vélos disponibles
- Nombre de places disponibles
- État de service des stations
- Capacité totale

### Batch (agrégations)
- Moyennes journalières
- Pourcentages d'occupation
- Fréquence de stations vides/pleines
- Détection d'incidents
- Changements brutaux

## 🔐 Sécurité

- ✅ Pas de données sensibles côté client
- ✅ Validation des données API
- ✅ Gestion d'erreurs robuste
- ✅ Protection XSS via React

## 📝 TODO / Améliorations futures

- [ ] Ajouter des graphiques avec Recharts
- [ ] Implémenter des notifications push
- [ ] Ajouter un mode sombre
- [ ] Historique des données
- [ ] Export CSV/PDF
- [ ] Recherche de stations
- [ ] Favoris utilisateur
- [ ] Prédictions ML

---

**Version** : 2.0.0  
**Dernière mise à jour** : Décembre 2025  
**Auteur** : Projet Vélib' Analytics
