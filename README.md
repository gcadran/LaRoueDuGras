
# La Roue Du Gras

Application front (React + TypeScript + Vite) pour choisir un restaurant au hasard à l'aide d'une roulette animée.

## Résumé des mes modifications
- Ajout de la suppression de compte par l'admin (avec confirmation).
- L'admin peut relancer la roue autant de fois qu'il le souhaite ; pour les utilisateurs normaux la roue ne peut être lancée qu'une fois par jour (une rotation bloque tous les utilisateurs pour la journée).
- L'admin peut modifier les choix de la roulette et leurs probabilités depuis l'interface (sauvegarde en `localStorage`).

## Pouvoirs de l'administrateur
L'application contient un compte administrateur par défaut :

- **Identifiant** : `admin`
- **Mot de passe** : `admin`

Périmètre des actions réservées à l'admin :

- Supprimer des comptes utilisateurs.
- Modifier les choix (noms) présents dans la roulette.
- Modifier les probabilités (pourcentage) assignées à chaque choix.
- Lancer la roulette sans la limite "une fois par jour" qui s'applique aux utilisateurs normaux.
- Accéder au panneau d'administration pour gérer la roulette et ses réglages.

Note : ces pouvoirs sont gérés côté client (stockés dans `localStorage`) pour cette version pédagogique. Pour un usage multi‑utilisateur réel, migrez l'authentification et la persistance vers un backend sécurisé.

## Utilisateurs
- Les comptes utilisateur peuvent s'inscrire et se connecter via l'interface.
- Les utilisateurs peuvent lancer la roulette, voir l'historique, et consulter les options disponibles.
- Pour éviter des usages abusifs, la roulette est limitée à une rotation par jour pour tous les utilisateurs (sauf admin).

## Problèmes connus
- Le bouton `SPIN` et le bouton `Admin` pouvaient présenter un léger décalage visuel selon la plateforme (emoji / rendu). Le style a été ajusté pour améliorer l'alignement, mais selon le système le rendu des emojis peut différer.
- Après modification des probabilités par l'admin, un rafraîchissement peut parfois être nécessaire pour que certaines vues se mettent à jour immédiatement.

## Aperçu

La Roue Du Gras propose une interface simple pour gérer un pool de restaurants et lancer une roulette visuelle qui sélectionne aléatoirement un établissement.

![Aperçu de la roulette](public/roulette.gif)


---

## Principales fonctionnalités

- Lancer une roulette animée pour choisir un restaurant.
- Gérer un pool de restaurants (ajout / suppression / édition).
- Interface responsive et légère.
- Stockage local (`localStorage`) pour persistance simple côté client.

---

## Stack technique

- React + TypeScript
- Vite (dev server & build)
- ESLint (qualité de code)

---

## Prérequis

- Node.js
- npm

---

## Installation rapide

```bash
# Cloner le dépôt
git clone https://github.com/gcadran/LaRoueDuGras.git
cd LaRoueDuGras

# Installer les dépendances
npm install
```

### Lancer en développement

```powershell
npm run dev

```

### Build production

```powershell
npm run build
npm run preview
```

Les fichiers optimisés seront dans `dist/`.

---

## Structure du projet (extrait)

- `public/` — fichiers statiques (images, demo GIF)
- `src/` — code source
  - `main.tsx` — point d'entrée
  - `index.css` — styles globaux
  - `assets/` — images et données statiques
  - `Components/` — composants React
    - `Roulette.tsx` — animation & sélection aléatoire
    - `RestaurantPool.tsx` — gestion du pool de restaurants
    - `AccountManager.ts` / `AccountList.tsx` / `AccountButton.tsx` — gestion des comptes

---










