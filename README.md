
    # La Roue Du Gras

    Une application front (React + TypeScript + Vite) pour choisir un restaurant au hasard grâce à une roulette animée.

## modification ajouté par moi
- j ai rajouter une supression de compte par l'admin avec validation par une popup
- l'admin puisse faire tourné plusieurs fois la roue mais la roue peut etre lance une seule fois par jour pour tout les utilisateur (soit un utilisateur la lance pour tout le monde)




    ## Aperçu

    La Roue Du Gras propose une interface simple pour gérer un pool de restaurants et lancer une roulette visuelle qui sélectionne aléatoirement un établissement.

    Ajoutez une capture ou un GIF demo dans `public/demo.gif` pour illustrer ici :

    ![Demo](public/demo.gif)

    ---

    ## Principales fonctionnalités

    - Lancer une roulette animée pour choisir un restaurant
    - Gérer un pool de restaurants (ajout / suppression / édition)
    - Interface responsive et légère
    - Possibilité d'ajouter persistance via `localStorage` ou un backend

    ---

    ## Stack technique

    - React + TypeScript
    - Vite (dev server & build)
    - ESLint (qualité de code)

    ---

    ## Prérequis

    - Node.js (LTS recommandé, ex. 18+)
    - npm ou yarn

    ---

    ## Installation rapide

    ```bash
    # Cloner le dépôt
    git clone https://github.com/gcadran/LaRoueDuGras.git
    cd LaRoueDuGras

    # Installer les dépendances
    npm install
    # ou
    # yarn install
    ```

    ### Lancer en développement

    ```powershell
    npm run dev
    # ou
    # yarn dev
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

    ## Personnaliser la liste de restaurants

    La liste initiale se trouve dans `src/Components/RestaurantPool.tsx` ou dans un fichier de données associé. Options :

    - Modifier la liste initiale directement dans le code
    - Ajouter un formulaire d'import (CSV/JSON)
    - Implémenter la persistance via `localStorage` ou une API REST

    Exemple simple pour persister via `localStorage` :

    ```ts
    useEffect(() => {
      const saved = localStorage.getItem('restaurants');
      if (saved) setRestaurants(JSON.parse(saved));
    }, []);

    useEffect(() => {
      localStorage.setItem('restaurants', JSON.stringify(restaurants));
    }, [restaurants]);
    ```

  

    

    


