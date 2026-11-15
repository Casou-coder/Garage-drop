# Consignes pour Claude Code

Contexte : ce dépôt contient App.js, un prototype de jeu mobile Expo (React Native) en un seul fichier. C'est "GarageDrop", un jeu de collection de voitures inspiré de WatchBox : on gagne de l'argent en tapant, on ouvre des boîtes à raretés, on garde ou revend les voitures, on complète un carnet de collection. Interface en français. Je travaille uniquement depuis mon iPhone et je teste avec Expo Go.

Objectif de cette session : transformer ce prototype en vrai projet maintenable, sans changer le gameplay.

1. Initialise un projet Expo (SDK récent compatible Expo Go, template blank, pas d'expo-router) autour du code existant. Dépendances : @react-native-async-storage/async-storage et expo-haptics, installées avec "npx expo install".

2. Découpe App.js en modules clairs, par exemple :
   - src/data/ : catalogue (marques, segments, époques, variantes, raretés), génération, boîtes, thèmes
   - src/economy/ : formules (tap, revenus passifs, cote du marché, récompenses)
   - src/components/ : CarArt, BoxArt, chips, tags
   - src/screens/ : Showroom, Boîtes, Garage, Carnet, Atelier
   - src/modals/ : ouverture de boîtes, fiche voiture
   - src/state/ : état du jeu et sauvegarde

3. Contraintes à respecter absolument :
   - Le catalogue est généré de façon déterministe (hash + rng seedé). Les identifiants de voitures (format marque-gamme-époque-variante) ne doivent pas changer, sinon les sauvegardes cassent.
   - Garde la clé de sauvegarde "garagedrop-save-v2".
   - Ne modifie ni les probabilités des boîtes, ni les prix, ni les formules d'économie.
   - Marques et modèles fictifs uniquement, aucune vraie marque.

4. Ajoute un script de vérification (node) qui affiche : nombre de marques, modèles, versions, répartition par rareté, et le rendement moyen de chaque boîte (valeur moyenne obtenue / prix). Valeurs attendues : 25 marques, 237 modèles, 1185 versions, Box Garage ≈ 1,09, toutes les autres ≈ 0,92. Lance-le et confirme que tout correspond après le découpage.

5. Crée un CLAUDE.md qui documente : le concept du jeu, l'architecture, les règles du catalogue (calcul de rareté = tier du segment + prestige de la marque + bonus d'époque, puis bonus de variante), l'économie et ses invariants, la règle qui désactive une boîte thématique si le thème ne contient pas sa rareté la plus basse, et la façon d'ajouter des marques ou gammes.

6. Trouve la meilleure façon pour moi de tester sur iPhone avec Expo Go alors que tu tournes dans le cloud (par exemple "npx expo start --tunnel"), essaie-la et donne-moi des instructions simples. Si ce n'est pas possible depuis ton environnement, dis-le clairement et propose l'alternative la plus simple.

7. Commit avec des messages clairs à chaque étape importante.

À la fin, fais-moi un résumé court : ce qui a été fait, comment tester, et ce que tu proposes comme prochaines étapes (leaderboard, marketplace entre joueurs, backend).
