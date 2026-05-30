# 🎓 EduManage — Frontend

Interface web de gestion d'établissement scolaire, développée avec Vue 3 et CoreUI.

## 🛠️ Stack technique

- **Vue 3** (Composition API)
- **Vite**
- **CoreUI Vue** (Template admin)
- **Pinia** (State management)
- **Axios** (Appels API)
- **Vue Router**

## ⚙️ Installation

### 1. Cloner le projet
```bash
git clone https://github.com/tonuser/school_management_front.git
cd school_management_front
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer le serveur de développement
```bash
npm run dev
```

L'application tourne sur **http://localhost:3000**

Le backend Django doit tourner sur **http://127.0.0.1:8000** pour que l'app fonctionne.

## Configuration API

L'URL du backend est configurée dans `src/services/api.js` :
```js
baseURL: 'http://127.0.0.1:8000/api/'
```

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@school.com | admin123 |
| Professeur | teacher@school.com | teacher123 |
| Étudiant | student@school.com | student123 |
| Parent | parent@school.com | parent123 |

## Structure du projet

```
src/
├── assets/          # Images et icônes
├── components/      # Composants réutilisables (Header, Sidebar, Footer)
├── layouts/         # DefaultLayout (avec sidebar)
├── router/          # Configuration des routes
├── services/        # Configuration Axios
├── stores/          # Pinia stores (auth)
├── styles/          # SCSS personnalisé
└── views/           # Pages de l'application
    ├── auth/        # Login
    ├── pages/       # 404, 500
    ├── students/    # Liste et profil étudiants
    └── ...          # Autres pages
```

## Authentification

L'app utilise JWT. Le token est stocké dans le **localStorage** via Pinia Persisted State.

## Build production

```bash
npm run build
```