# Contributing to Vélib Big Data Pipeline

Merci de votre intérêt pour contribuer à ce projet ! 🎉

## 🚀 Comment contribuer

### 1. Fork le projet
```bash
git clone https://github.com/YOUR_USERNAME/velib-bigdata-pipeline.git
cd velib-bigdata-pipeline
```

### 2. Créer une branche
```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug
```

### 3. Faire vos modifications

#### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

#### Backend (Node.js)
```bash
cd backend
npm install
npm start
```

#### Streaming/Batch (Python/Spark)
- Modifier les fichiers dans `streaming/` ou `batch/`
- Tester avec Docker : `docker exec velib_spark_master python3 /opt/spark-apps/streaming-velib.py`

### 4. Standards de code

#### JavaScript/React
- Utiliser ESLint (déjà configuré)
- Format : Prettier avec `npm run format` (si configuré)
- Convention : camelCase pour variables, PascalCase pour composants

#### Python
- PEP 8 pour le style
- Max 120 caractères par ligne
- Docstrings pour toutes les fonctions

#### Git Commits
Format des messages de commit :
```
type(scope): description courte

[optional] Description plus détaillée

Exemples:
feat(frontend): ajout de la recherche de stations
fix(streaming): correction du parsing des données
docs(readme): mise à jour des instructions d'installation
```

Types acceptés : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 5. Tests

Avant de soumettre une PR :
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm test  # (si tests configurés)

# Docker
cd docker
docker-compose config  # Valider la configuration
```

### 6. Soumettre une Pull Request

1. Poussez votre branche : `git push origin feature/ma-nouvelle-fonctionnalite`
2. Ouvrez une PR sur GitHub
3. Décrivez clairement vos changements
4. Attendez la review

## 📋 Checklist PR

- [ ] Le code compile sans erreurs
- [ ] Les tests passent (si applicable)
- [ ] La documentation est mise à jour
- [ ] Le fichier .env.example est à jour (si nouvelles variables)
- [ ] Pas de secrets/clés API dans le code
- [ ] Les changements sont décrits dans la PR

## 🐛 Signaler un bug

Ouvrez une issue avec :
- Description du problème
- Étapes pour reproduire
- Comportement attendu vs obtenu
- Logs/screenshots si possible
- Version de Docker/Node/Python

## 💡 Proposer une fonctionnalité

Ouvrez une issue avec :
- Description de la fonctionnalité
- Cas d'usage
- Exemples/mockups si applicable

## 📧 Contact

Pour toute question : ouvrez une issue ou contactez le mainteneur.

Merci de contribuer ! 🙏
