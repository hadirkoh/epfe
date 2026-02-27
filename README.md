# EPFE - Plateforme Immobilière

Une application web moderne de gestion et de recherche de biens immobiliers, construite avec **Next.js**, **TypeScript**, et **PostgreSQL**.

## 🚀 Fonctionnalités

- **Tableau de Bord Agent** : Gestion complète des annonces avec localisation (Français, Anglais, Arabe).
- **Interface Utilisateur Premium** : Design moderne avec support RTL pour l'arabe.
- **Système d'Authentification** : Gestion des rôles (Admin, Agent, Utilisateur).
- **Recherche Avancée** : Filtres par type de bien, prix et localisation.
- **Multilingue** : Support complet FR/EN/AR.

## 🛠️ Stack Technique

- **Frontend** : Next.js 15, React, Tailwind CSS.
- **Backend** : API Routes Next.js.
- **Base de données** : PostgreSQL (Prisma/Direct SQL).
- **Langues** : Context API pour la gestion de l'i18n.

## 📦 Installation

1. Clonez le projet :
   ```bash
   git clone https://github.com/hadirkoh/epfe.git
   cd epfe
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez les variables d'environnement dans un fichier `.env.local` :
   ```env
   DATABASE_URL="votre_url_postgresql"
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   ```

4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## 📝 Auteur

Développé par **Hadir Koh**.
