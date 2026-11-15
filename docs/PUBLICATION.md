# Publier GarageDrop sur l'App Store et Google Play

Le code, la configuration, les visuels et les textes sont prêts. Il reste des étapes que seul le
titulaire des comptes peut faire. Tout est faisable depuis un iPhone (Safari).

## 0. Tester sur iPhone (gratuit)

1. expo.dev > réglages du compte > Access tokens : créer un jeton.
2. GitHub > dépôt > Settings > Secrets and variables > Actions : secret `EXPO_TOKEN` avec ce jeton.
3. GitHub > Actions > « Publier pour Expo Go » > Run workflow.
4. Ouvrir Expo Go, connecté au même compte : le projet GarageDrop apparaît.

## 1. Activer la page de confidentialité

GitHub > dépôt > Settings > Pages > Source : « Deploy from a branch », branche `main`, dossier `/docs`.
(Le dossier `docs/` doit être sur `main` : fusionner d'abord la branche de travail.)
Vérifier que https://casou-coder.github.io/Garage-drop/privacy.html s'affiche. Le dépôt doit être public,
ou le compte GitHub payant, pour que Pages fonctionne.

## 2. Android

1. Créer un compte Google Play Console (25 $, une fois). Un compte personnel récent doit faire tester
   l'app par 12 personnes pendant 14 jours (test fermé) avant la mise en production.
2. GitHub > Actions > « Build pour les stores » > plateforme `android`, profil `production`.
   EAS crée la clé de signature et la conserve.
3. expo.dev > projet > Builds : télécharger le fichier `.aab`.
4. Play Console : créer l'app, remplir la fiche avec `docs/store/fiche-store.md`, envoyer le `.aab`
   dans un test interne, puis suivre les étapes demandées jusqu'à la production.

Pour un simple fichier à installer sur un Android : même workflow avec le profil `preview` (APK).

## 3. iOS

1. S'inscrire à l'Apple Developer Program (99 $ par an).
2. App Store Connect > Utilisateurs et accès > Intégrations : créer une clé API (rôle App Manager)
   et l'ajouter sur expo.dev (Account settings > Credentials / Apple). Cela permet à EAS de signer
   l'app sans ordinateur.
3. GitHub > Actions > « Build pour les stores » > plateforme `ios`, profil `production`.
4. Envoyer le build : depuis la page du build sur expo.dev (Submit), ou `eas submit -p ios`.
5. App Store Connect : créer la fiche avec `docs/store/fiche-store.md`, tester via TestFlight, puis
   soumettre à la revue.

Si le premier build iOS échoue en mode non interactif (identifiants manquants), lancer une fois
`npx eas-cli build -p ios` depuis un terminal où l'on peut se connecter à Apple.

## Points à vérifier avant la soumission

- Le nom « GarageDrop » est-il libre sur les deux stores ? Sinon, changer `name` dans `app.json`.
- L'identifiant `com.casoucoder.garagedrop` est définitif une fois l'app publiée.
- Remplacer les captures de `docs/store/screenshots/` par de vraies captures d'iPhone.
- Jouer une partie complète sur un vrai iPhone et un vrai Android (sons, vibrations, sauvegarde,
  retour après mise en arrière-plan).
