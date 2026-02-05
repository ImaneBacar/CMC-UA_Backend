# 🏥 API Clinique Al-Kamar - Backend

> Système de gestion complète pour clinique médicale avec gestion des patients, consultations, analyses, opérations et paiements.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Modèles de Données](#modèles-de-données)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Contribuer](#contribuer)

---

## 🎯 Vue d'ensemble

API RESTful complète pour la gestion d'une clinique médicale, développée avec Node.js, Express et MongoDB. Le système permet la gestion complète des opérations cliniques incluant :

- 👥 Gestion des patients et dossiers médicaux
- 🏥 Gestion des visites et consultations
- 💊 Prescriptions médicales
- 🔬 Analyses de laboratoire et imagerie
- ⚕️ Opérations chirurgicales
- 💰 Gestion des paiements et dettes
- 👨‍⚕️ Gestion multi-rôles (Admin, Médecin, Secrétaire, Laborantin, Comptable)

---

## ✨ Fonctionnalités

### 🔐 Authentification & Autorisation

- Authentification JWT
- Gestion des rôles et permissions
- Changement de mot de passe sécurisé
- Sessions persistantes

### 👥 Gestion des Patients

- Création et mise à jour des dossiers patients
- Numérotation automatique (PAT-2025-XXXX)
- Dossier médical complet (allergies, antécédents, traitements)
- Recherche et filtrage avancés
- Historique complet des consultations

### 🏥 Consultations & Visites

- Création de visites avec paiement obligatoire
- Gestion du statut (en attente, en consultation, terminé)
- Suivi des signes vitaux
- Prise en charge des urgences
- Dashboard médecin (visites du jour)

### 💊 Prescriptions

- Création et gestion des ordonnances
- Détails des médicaments (posologie, durée, instructions)
- Liaison automatique au dossier médical
- Validation par médecin

### 🔬 Analyses Médicales

- Prescription d'analyses (laboratoire & imagerie)
- Workflow complet : Prescription → En cours → Terminé → Validé
- **Upload de fichiers PDF/Word** (résultats d'analyses)
- Gestion des résultats et interprétations
- Dashboard laborantin
- Téléchargement sécurisé des résultats

### ⚕️ Opérations Chirurgicales

- Programmation d'opérations
- Gestion du statut (en attente paiement → programmée → en cours → terminée)
- Rapports pré/post-opératoires
- Annulation avec remboursement automatique
- Dashboard chirurgien

### 💰 Gestion Financière

- Paiements avec réductions
- Gestion des dettes et versements
- Historique des paiements
- Statistiques financières
- Support paiement espèces et mobile money

### 🏪 Spécialités Médicales

- Gestion des spécialités
- Attribution aux médecins
- Activation/Désactivation

---

## 🏗️ Architecture

```
backend/
├── controllers/
│   ├── Auth.js              # Authentification
│   ├── user.controller.js   # Gestion utilisateurs
│   ├── patient.controller.js
│   ├── visit.controller.js
│   ├── prescription.controller.js
│   ├── analysis.controller.js
│   ├── operation.controller.js
│   ├── payment.controller.js
│   ├── medicalRecord.controller.js
│   └── speciality.controller.js
├── models/
│   ├── user.model.js
│   ├── patient.model.js
│   ├── visit.model.js
│   ├── prescription.model.js
│   ├── analysis.model.js
│   ├── operation.model.js
│   ├── payment.model.js
│   ├── medicalRecord.model.js
│   └── speciality.model.js
├── middlewares/
│   ├── Authorization.js     # Middleware permissions
├── routes/
│   └── routes.js              # Routes principales
├── utils/
│   └── generateNumero.js   # Génération numéros uniques
├── uploads/
│   └── analyses/           # Fichiers uploadés
├── .env                    # Variables d'environnement
├── app.js                  # Configuration Express
├── server.js               # Point d'entrée
└── package.json
```

---

## 🚀 Installation

### Prérequis

- **Node.js** >= 18.x
- **MongoDB** >= 6.x
- **npm** ou **yarn**

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/ImaneBacar/CMC-UA_Backend
cd clinique-backend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env

# 4. Configurer les variables d'environnement
nano .env

# 5. Créer les dossiers nécessaires
mkdir -p uploads/analyses

# 6. Démarrer le serveur
npm run dev
```

---

## ⚙️ Configuration

### Variables d'Environnement (`.env`)

```env
# Serveur
NODE_ENV=development
PORT=5000

# Base de données
MONGODB_URI=mongodb://localhost:27017/clinique_al_kamar

# JWT
JWT_SECRET=votre_secret_super_securise_a_changer_en_production

# Logs
LOG_LEVEL=info
```

### Connexion MongoDB

```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connecté");
  } catch (error) {
    console.error("❌ Erreur MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## 📖 Utilisation

### Démarrer le Serveur

```bash
# Mode développement (avec nodemon)
npm run devStart

# Mode production
npm start

# Avec logs détaillés
DEBUG=* npm run dev
```

### Créer un Admin Initial

```bash
# Via API
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Admin Principal",
    "email": "admin@clinique.com",
    "password": "Admin@2025",
    "role": ["admin"],
    "phone": "+269 123 4567"
  }'
```

### Test de Santé

```bash
curl http://localhost:5000/api/health
```

**Réponse :**

```json
{
  "status": "OK",
  "message": "API Clinique fonctionnelle",
  "timestamp": "2025-02-04T10:30:00.000Z"
}
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentification

Toutes les routes (sauf `/login` et `/health`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

---

### 🔐 Auth

#### Connexion

```http
POST /login
Content-Type: application/json

{
  "email": "medecin@clinique.com",
  "password": "motdepasse"
}
```

**Réponse :**

```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65abc123...",
    "fullname": "Dr. Ahmed Hassan",
    "role": ["medecin"]
  }
}
```

#### Changer le Mot de Passe

```http
POST /change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "ancien_mdp",
  "newPassword": "nouveau_mdp"
}
```

---

### 👥 Patients

#### Créer un Patient

```http
POST /patient
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullname": "Mohamed Ali",
  "dateOfBirth": "1985-05-15",
  "gender": "M",
  "phone": "+269 333 4444",
  "address": "Moroni, Grande Comore",
  "bloodGroup": "O+",
  "allergies": ["Pénicilline"],
  "chronicDiseases": ["Diabète Type 2"]
}
```

**Réponse :**

```json
{
  "message": "Patient créé avec succès",
  "patient": {
    "_id": "65abc123...",
    "patientNumber": "PAT-2025-0001",
    "fullname": "Mohamed Ali",
    "age": 39
  },
  "medicalRecord": {
    "_id": "65abc456...",
    "patient": "65abc123..."
  }
}
```

#### Lister les Patients

```http
GET /patients
Authorization: Bearer <token>
```

#### Rechercher des Patients

```http
GET /patients/search?query=Mohamed
Authorization: Bearer <token>
```

---

### 🏥 Visites

#### Créer une Visite

```http
POST /visit
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient": "65abc123...",
  "speciality": "65def456...",
  "doctor": "65ghi789...",
  "visitReason": "Consultation générale",
  "visitType": "consultation",
  "totalAmount": 5000,
  "discountPercentage": 10,
  "paidAmount": 4500,
  "paymentMethod": "especes"
}
```

**⚠️ Important :** Le paiement doit être complet (`paidAmount >= montantFinal`), sinon erreur 400.

#### Mes Visites du Jour (Médecin)

```http
GET /visits/today/mine
Authorization: Bearer <token>
```

#### Terminer une Visite

```http
PATCH /visits/:id/finish
Authorization: Bearer <token>
```

---

### 💊 Prescriptions

#### Créer une Prescription

```http
POST /prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "visit": "65abc123...",
  "patient": "65def456...",
  "medications": [
    {
      "name": "Paracétamol 500mg",
      "dosage": "500mg",
      "form": "Comprimé",
      "frequency": "3 fois par jour",
      "duration": "7 jours",
      "quantity": 21,
      "instructions": "Après les repas"
    }
  ],
  "notes": "Revoir dans 1 semaine"
}
```

---

### 🔬 Analyses

#### Créer une Analyse

```http
POST /analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient": "65abc123...",
  "visit": "65def456...",
  "doctor": "65ghi789...",
  "category": "laboratoire",
  "priority": "Normal",
  "items": [
    {
      "name": "Hémoglobine",
      "code": "HEM001",
      "price": 1500,
      "unit": "g/dL",
      "referenceRange": "12-16"
    },
    {
      "name": "Glycémie",
      "code": "GLY001",
      "price": 1000,
      "unit": "g/L",
      "referenceRange": "0.7-1.1"
    }
  ],
  "totalAmount": 2500,
  "discountPercentage": 0,
  "paidAmount": 2500
}
```

#### Démarrer une Analyse (Laborantin)

```http
PATCH /analyses/:id/start
Authorization: Bearer <token>
```

#### Saisir les Résultats (Laborantin)

```http
PATCH /analyses/:id/results
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "name": "Hémoglobine",
      "value": "14.2",
      "interpretation": "Normal",
      "notes": "Valeur dans les normes"
    },
    {
      "name": "Glycémie",
      "value": "1.25",
      "interpretation": "Élevé"
    }
  ],
  "technicianComment": "Prélèvement effectué à jeun"
}
```

#### Upload du Fichier PDF/Word (Laborantin)

```http
POST /analyses/:id/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [FICHIER .pdf ou .docx, max 5 MB]
```

**Réponse :**

```json
{
  "message": "Fichier uploadé avec succès",
  "data": {
    "pdfResult": {
      "filename": "ANA-2025-0042.pdf",
      "originalName": "resultats_labo.pdf",
      "size": 1234567,
      "uploadedAt": "2025-02-04T11:15:00.000Z"
    }
  }
}
```

#### Télécharger le Fichier

```http
GET /analyses/:id/download
Authorization: Bearer <token>
```

Le fichier sera téléchargé avec son nom original.

#### Valider une Analyse (Médecin)

```http
PATCH /analyses/:id/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorComment": "Glycémie légèrement élevée. Prévoir suivi dans 3 mois."
}
```

---

### ⚕️ Opérations

#### Programmer une Opération

```http
POST /operations
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient": "65abc123...",
  "visit": "65def456...",
  "surgeon": "65ghi789...",
  "title": "Appendicectomie",
  "type": "mineure",
  "description": "Ablation de l'appendice",
  "scheduledDate": "2025-02-10",
  "scheduledStartTime": "08:00",
  "scheduledDuration": 90,
  "anesthesiaType": "generale",
  "cost": 150000
}
```

**Note :** Un paiement en dette est créé automatiquement.

#### Mettre à Jour le Paiement

```http
PATCH /operations/payment/:paymentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "paidAmount": 150000,
  "paymentMethod": "especes"
}
```

#### Démarrer une Opération (Chirurgien)

```http
PATCH /operations/:id/start
Authorization: Bearer <token>
```

#### Terminer une Opération (Chirurgien)

```http
PATCH /operations/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "operativeReport": "Opération réussie sans complications",
  "postOperativeReport": "Patient stable, surveillance 24h",
  "complications": "Aucune",
  "recommendations": "Repos 7 jours, antibiotiques"
}
```

---

### 📊 Dashboards

#### Dashboard Laborantin

```http
GET /analyses/lab/dashboard
Authorization: Bearer <token>
```

**Réponse :**

```json
{
  "pending": {
    "count": 5,
    "data": [...]
  },
  "inProgress": {
    "count": 2,
    "data": [...]
  },
  "completedToday": {
    "count": 8,
    "data": [...]
  }
}
```

#### Dashboard Médecin (Opérations)

```http
GET /operations/doctor-dashboard
Authorization: Bearer <token>
```

---

## 🗄️ Modèles de Données

### User

```javascript
{
  fullname: String,
  email: String (unique),
  password: String (hashed),
  role: [String], // ['admin', 'medecin', 'secretaire', 'laborantin', 'comptable']
  phone: String,
  speciality: [ObjectId], // Ref: Speciality (pour médecins)
  isActive: Boolean
}
```

### Patient

```javascript
{
  patientNumber: String (unique), // PAT-2025-XXXX
  fullname: String,
  dateOfBirth: Date,
  gender: String, // 'M' ou 'F'
  phone: String,
  email: String,
  address: String,
  bloodGroup: String,
  allergies: [String],
  chronicDiseases: [String],
  status: String, // 'actif', 'inactif', 'décédé'
  origin: String // 'local', 'diaspora'
}
```

### Visit

```javascript
{
  visitNumber: String (unique), // VIS-2025-XXXX
  patient: ObjectId,
  speciality: ObjectId,
  doctor: ObjectId,
  visitReason: String,
  visitType: String, // 'consultation', 'urgence', 'suivi'
  visitDate: Date,
  status: String,
  vitalSigns: {
    temperature: Number,
    bloodPressure: String,
    pulse: Number,
    weight: Number,
    height: Number
  },
  prescriptions: [ObjectId],
  analyses: [ObjectId],
  payment: ObjectId,
  isPaid: Boolean
}
```

### Analysis

```javascript
{
  analysisNumber: String (unique), // ANA-2025-XXXX
  patient: ObjectId,
  visit: ObjectId,
  doctor: ObjectId,
  category: String, // 'laboratoire', 'imagerie'
  status: String, // 'en attente', 'en cours', 'terminé', 'validé'
  priority: String, // 'Normal', 'Urgent'
  items: [{
    name: String,
    code: String,
    price: Number,
    unit: String,
    referenceRange: String,
    value: String,
    interpretation: String, // 'Normal', 'Élevé', 'Bas'
    notes: String
  }],
  pdfResult: {
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    uploadedAt: Date,
    uploadedBy: ObjectId
  },
  technician: ObjectId,
  payment: ObjectId
}
```

### Payment

```javascript
{
  paymentNumber: String (unique), // PAY-2025-XXXX
  visit: ObjectId,
  patient: ObjectId,
  totalAmount: Number,
  discountPercentage: Number,
  discountAmount: Number,
  finalAmount: Number,
  paidAmount: Number,
  remainingAmount: Number,
  hasDebt: Boolean,
  debtStatus: String, // 'aucune', 'active', 'soldee'
  status: String, // 'paye', 'partiel', 'impaye'
  paymentMethod: String, // 'especes', 'mobile_money'
  repayments: [{
    amount: Number,
    date: Date,
    paymentMethod: String
  }]
}
```

---

## 🔐 Sécurité

### Authentification JWT

- Tokens expirés après 10 heures
- Refresh token non implémenté (à venir)
- Mots de passe hashés avec bcrypt (salt rounds: 10)

### Permissions par Rôle

| Rôle           | Permissions                                                   |
| -------------- | ------------------------------------------------------------- |
| **Admin**      | Accès complet à toutes les fonctionnalités                    |
| **Médecin**    | Consultations, prescriptions, validation analyses, opérations |
| **Secrétaire** | Patients, visites, paiements, programmation opérations        |
| **Laborantin** | Analyses (démarrer, saisir résultats, upload fichiers)        |
| **Comptable**  | Paiements, statistiques financières                           |

### Upload de Fichiers

- **Types autorisés :** PDF, DOC, DOCX
- **Taille max :** 5 MB
- **Validation MIME type**
- **Nom sécurisé :** Utilise le numéro d'analyse (ANA-2025-XXXX.pdf)
- **Stockage :** `/uploads/analyses/`

### Variables d'Environnement

- **Ne JAMAIS commit le fichier `.env`**
- Utiliser des secrets forts en production
- Changer le `JWT_SECRET` par défaut

---

## 🧪 Tests

### Tests Manuels avec cURL

#### Test de Connexion

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinique.com",
    "password": "Admin@2025"
  }'
```

#### Test Upload Fichier

```bash
curl -X POST http://localhost:5000/api/analyses/ANALYSIS_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@results.pdf"
```

### Tests avec Postman

1. Importer la collection Postman (à créer)
2. Configurer la variable `{{baseUrl}}` = `http://localhost:5000/api`
3. Obtenir un token via `/login`
4. Ajouter le token dans les Headers : `Authorization: Bearer {{token}}`

### Tests Unitaires

```bash
npm test
```

---

## 🚀 Déploiement

### Prérequis Production

- Serveur Ubuntu/Debian
- Node.js 18+
- MongoDB Atlas ou instance MongoDB
- Reverse proxy (Nginx)
- SSL/TLS (Let's Encrypt)

### Déploiement Manuel

```bash
# 1. Cloner sur le serveur
git clone https://github.com/ImaneBacar/CMC-UA_Backend
cd clinique-backend

# 2. Installer dépendances
npm install --production

# 3. Configurer .env
nano .env
# NODE_ENV=production
# MONGODB_URI=mongodb+srv://...

# 4. Démarrer avec PM2
npm install -g pm2
pm2 start server.js --name clinique-api
pm2 save
pm2 startup
```

### Configuration Nginx

```nginx
server {
    listen 80;
    server_name api.clinique-alkamar.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

```bash
docker build -t clinique-api .
docker run -p 5000:5000 --env-file .env clinique-api
```

---

## 📊 Statistiques du Projet

- **Lignes de code :** ~8,000+
- **Modèles :** 9
- **Controllers :** 9
- **Routes :** 60+
- **Dépendances :** 15+

---

## 🛠️ Technologies Utilisées

- **Runtime :** Node.js 18+
- **Framework :** Express 4.x
- **Base de données :** MongoDB 6.x avec Mongoose
- **Authentification :** JWT (jsonwebtoken)
- **Sécurité :** bcrypt, helmet, cors
- **Upload fichiers :** Multer
- **Validation :** express-validator (recommandé)
- **Logs :** Winston (recommandé)

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créer une branche** (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir une Pull Request**

### Guidelines

- Suivre les conventions de code existantes
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation
- Tester localement avant de soumettre

---

## 📝 Roadmap

### Version 1.1 (À venir)

- [ ] Tests unitaires et d'intégration
- [ ] Documentation Swagger/OpenAPI
- [ ] Logs avancés avec Winston
- [ ] Rate limiting par IP
- [ ] Système de notifications (email/SMS)
- [ ] Export PDF des dossiers médicaux
- [ ] Statistiques avancées (dashboards)

### Version 1.2

- [ ] Intégration paiement mobile (M-Pesa, Orange Money)
- [ ] Système de rendez-vous en ligne
- [ ] Application mobile (React Native)
- [ ] Téléconsultation (WebRTC)
- [ ] Gestion des stocks (médicaments, matériel)

---

## 📄 License

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Équipe

- **Chef de Projet :** [Votre Nom]
- **Développeur Backend :** [Votre Nom]
- **Contact :** contact@clinique-alkamar.com

---

## 🙏 Remerciements

- Équipe médicale de la Clinique Al-Kamar
- Communauté Node.js et MongoDB
- Tous les contributeurs open-source

---

## 📞 Support

Pour toute question ou problème :

- **Email :** imanebacar@outlook.fr
- **Issues :** [GitHub Issues](https://github.com/ImaneBacar/CMC-UA_Backend)
- **Discord :** [Rejoindre le serveur](https://discord.gg/...)

---

<div align="center">

**Fait avec ❤️ pour la Clinique Al-Kamar**

[⬆ Retour en haut](#-api-clinique-al-kamar---backend)

</div>
