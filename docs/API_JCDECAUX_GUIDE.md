# 🚴 Guide de Démarrage - API JCDecaux

## 🔑 Obtenir votre clé API JCDecaux (Gratuit)

### Étape 1 : Créer un compte

1. Visitez : **https://developer.jcdecaux.com/#/opendata/vls?page=getstarted**
2. Cliquez sur **"Sign up"** pour créer un compte
3. Remplissez le formulaire d'inscription
4. Validez votre email

### Étape 2 : Obtenir la clé API

1. Connectez-vous à votre compte
2. Allez dans **"My API Keys"**
3. Cliquez sur **"Create new API key"**
4. Donnez un nom à votre clé (ex: "Velib Project")
5. Copiez votre clé API (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Étape 3 : Configurer le projet

#### Option 1 : Variable d'environnement (Recommandé)

**Windows PowerShell :**
```powershell
$env:JCDECAUX_API_KEY="votre_cle_api_ici"
```

**Linux/Mac :**
```bash
export JCDECAUX_API_KEY="votre_cle_api_ici"
```

**Docker Compose :**
Créez un fichier `.env` à la racine du projet :
```env
JCDECAUX_API_KEY=votre_cle_api_ici
```

#### Option 2 : Modifier directement le code

Dans `streaming/streaming-velib.py`, ligne 16 :
```python
JCDECAUX_API_KEY = "votre_cle_api_ici"
```

---

## 📡 API JCDecaux - Endpoints Disponibles

### 1. Toutes les stations (tous les contrats)
```
GET https://api.jcdecaux.com/vls/v3/stations?apiKey={API_KEY}
```

### 2. Stations d'une ville spécifique
```
GET https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey={API_KEY}
```

Autres villes disponibles :
- `paris` - Paris (Vélib)
- `lyon` - Lyon
- `marseille` - Marseille
- `toulouse` - Toulouse
- `bruxelles` - Bruxelles
- `dublin` - Dublin
- etc.

### 3. Liste des contrats disponibles
```
GET https://api.jcdecaux.com/vls/v3/contracts?apiKey={API_KEY}
```

---

## 🧪 Tester votre clé API

### Avec curl (Windows PowerShell)
```powershell
curl "https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey=VOTRE_CLE" | ConvertFrom-Json | Select-Object -First 1
```

### Avec curl (Linux/Mac)
```bash
curl "https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey=VOTRE_CLE" | jq '.[0]'
```

### Avec Python
```python
import requests

API_KEY = "votre_cle_api"
url = f"https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey={API_KEY}"

response = requests.get(url)
print(response.status_code)  # Doit afficher 200
print(f"Nombre de stations: {len(response.json())}")
```

---

## 📊 Structure des données JCDecaux

```json
{
  "number": 16107,
  "contractName": "Paris",
  "name": "16107 - BENJAMIN GODARD - VICTOR HUGO",
  "address": "2 RUE BENJAMIN GODARD - 75016 PARIS",
  "position": {
    "latitude": 48.865983,
    "longitude": 2.275725
  },
  "banking": true,
  "bonus": false,
  "status": "OPEN",
  "lastUpdate": "2024-01-15T14:29:45.000Z",
  "connected": true,
  "overflow": false,
  "totalStands": {
    "availabilities": {
      "bikes": 12,
      "stands": 23,
      "mechanicalBikes": 8,
      "electricalBikes": 4
    },
    "capacity": 35
  }
}
```

### Champs principaux :
- **number** : Numéro unique de la station
- **contractName** : Ville (ex: "Paris")
- **name** : Nom de la station
- **status** : Statut (OPEN, CLOSED)
- **totalStands.availabilities.bikes** : Vélos disponibles
- **totalStands.availabilities.stands** : Places disponibles
- **totalStands.availabilities.mechanicalBikes** : Vélos mécaniques
- **totalStands.availabilities.electricalBikes** : Vélos électriques
- **position** : Coordonnées GPS

---

## 🚀 Lancer le pipeline avec votre clé API

### 1. Avec Docker (Recommandé)

```bash
# 1. Créer le fichier .env
echo "JCDECAUX_API_KEY=votre_cle_api" > .env

# 2. Démarrer les services
cd docker
docker-compose up -d

# 3. Lancer le streaming Spark
docker exec -it velib_spark_master spark-submit \
  --master local[*] \
  /opt/spark-apps/streaming/streaming-velib.py
```

### 2. En local (développement)

```bash
# 1. Définir la variable d'environnement
export JCDECAUX_API_KEY="votre_cle_api"

# 2. Installer les dépendances
cd streaming
pip install -r requirements.txt

# 3. Lancer le pipeline
python streaming-velib.py
```

---

## ⚠️ Limites de l'API

- **Gratuit** : Illimité pour un usage non-commercial
- **Rate Limit** : Pas de limite stricte, mais utilisation raisonnable demandée
- **Fréquence recommandée** : 30 secondes minimum entre les requêtes
- **Timeout** : 15 secondes par requête

---

## 🐛 Résolution des problèmes

### Erreur 401 - Unauthorized
```
❌ API Key invalide ou manquante!
```
**Solution** : Vérifiez que votre clé API est correcte

### Erreur 403 - Forbidden
```
❌ Accès refusé
```
**Solution** : Votre clé API a peut-être été révoquée. Créez-en une nouvelle.

### Erreur 429 - Too Many Requests
```
❌ Trop de requêtes
```
**Solution** : Attendez quelques minutes avant de relancer

### Pas de données retournées
```python
# Vérifier si l'API fonctionne
curl "https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey=VOTRE_CLE"
```

---

## 📝 Exemples d'utilisation

### Filtrer uniquement Paris
Dans `streaming-velib.py`, ligne 17, décommentez :
```python
JCDECAUX_API_URL = f"https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey={JCDECAUX_API_KEY}"
```

### Récupérer plusieurs villes
```python
contracts = ['paris', 'lyon', 'marseille']
for contract in contracts:
    url = f"https://api.jcdecaux.com/vls/v3/stations?contract={contract}&apiKey={API_KEY}"
    data = requests.get(url).json()
    # Traiter les données...
```

---

## 📚 Ressources

- **Documentation officielle** : https://developer.jcdecaux.com/#/opendata/vls?page=dynamic
- **Liste des villes** : https://developer.jcdecaux.com/#/opendata/vls?page=getstarted
- **Support** : https://developer.jcdecaux.com/#/support

---

## ✅ Vérification finale

Avant de lancer le projet, assurez-vous que :

- [ ] Vous avez créé un compte JCDecaux
- [ ] Vous avez obtenu une clé API valide
- [ ] La clé API est configurée (variable d'environnement ou fichier .env)
- [ ] Vous avez testé la clé API avec curl ou Python
- [ ] Docker est démarré (si utilisation Docker)
- [ ] MongoDB est accessible

**Vous êtes prêt ! 🚀**

```bash
cd docker
docker-compose up -d
# Attendez 30 secondes que les services démarrent
docker logs velib_spark_master -f
```
