# GarageDrop

Jeu mobile de collection de voitures (Expo / React Native, JavaScript), interface en français.
Le développeur travaille uniquement depuis un iPhone et teste avec Expo Go.

## Concept

- **Showroom** : on tape sur le plateau pour gagner de l'argent ; récompense quotidienne avec série.
- **Boîtes** : six boîtes de prix croissants, chacune avec ses probabilités par rareté (affichées au joueur). Version thématique (pays, région, époque, catégorie) facturée 25 % de plus.
- **Garage** : chaque voiture obtenue est gardée ou revendue à la cote du jour. Échange de 5 voitures d'une rareté contre 1 de la rareté au-dessus. Vente des doublons.
- **Carnet** : collection de toutes les versions, groupées par marque, région, pays, catégorie ou époque. Une marque complète (version standard de chaque modèle) donne +5 % de revenus passifs.
- **Atelier** : améliorations du tap et des revenus passifs.
- **Compte** (bouton en haut à gauche) : pseudo, rang, statistiques, réglages (sons, vibrations, ouvertures rapides), code de sauvegarde pour changer d'appareil, tutoriel, confidentialité, remise à zéro. Le jeu se joue sans compte. Un **compte en ligne facultatif** (e-mail + mot de passe, Supabase) synchronise la partie entre appareils.

Marques et modèles **fictifs uniquement** : ne jamais introduire de vraie marque ni de vrai nom de modèle.

## Commandes

```bash
npm install            # dépendances
npm run verify         # vérifie le catalogue, le rendement des boîtes et la sauvegarde (à lancer après tout changement de données)
npx expo start         # serveur de dev (Expo Go sur le même réseau)
npx expo start --tunnel  # idem via tunnel (demande un compte Expo ; `--tunnel ngrok` sinon)
npx expo install <paquet>  # toujours utiliser ceci pour ajouter une dépendance
```

Expo SDK 58, template blank, sans expo-router. Pas de TypeScript, pas de linter configuré.
N'ajouter que des modules inclus dans Expo Go (pas de code natif personnalisé).
Publication : voir `docs/PUBLICATION.md` (étapes) et `docs/store/fiche-store.md` (textes et questionnaires).

## Architecture

```
App.js                  Coquille : zones sûres, en-tête, onglets, toast, modales. Aucune logique de jeu.
index.js                Point d'entrée Expo (registerRootComponent)
app.json / eas.json     Configuration de l'app (identifiants, icônes, plugins) et des builds EAS
assets/                 Icônes, image de lancement, sons (générés par scripts/make-icons.js et make-sounds.mjs)
src/
  theme.js              Couleurs (C) et polices (F)
  styles.js             Feuille de styles partagée (st)
  data/                 Données pures, sans React (importables depuis node)
    random.js           hash (FNV-1a) et rng seedé (mulberry32)
    rarities.js         RAR : 6 raretés, couleur et valeur de base
    taxonomy.js         REGIONS, COUNTRIES, EPOCHS, SEGMENTS, VARIANTS, PAL
    brands.js           BRANDS : les marques et leurs gammes  ← c'est ici qu'on agrandit le catalogue
    catalog.js          Génération : CARS, MODELS, CAR_MAP, BY_RARITY, MODELS_BY_BRAND
    themes.js           THEMES : filtres des boîtes thématiques
    boxes.js            BOXES, boxAvailable, boxPrice, rollRarity, pickCar
    privacy.js          Texte de la politique de confidentialité (même contenu que docs/privacy.html)
  economy/              Formules pures, sans React
    market.js           Cote du jour (marketFactor, quote)
    income.js           Tap, mécanos, showroom, bonus de marques, passiveRate
    rewards.js          Récompense quotidienne, gains hors-ligne
  config.js             Adresse et clé publique Supabase (CLOUD_ENABLED est faux sans clé : le compte en ligne est alors masqué)
  cloud/client.js       Client Supabase minimal en fetch : auth e-mail, table gd_saves (pur, testé par verify)
  state/
    initial.js          SAVE_KEY et INITIAL (pur)
    transfer.js         sanitizeSave, encodeSave, decodeSave : nettoyage et code de sauvegarde (pur)
    save.js             loadGame, saveGame (AsyncStorage)
    useCloud.js         Hook : session, connexion, synchronisation de la partie (envoi chaque minute et en arrière-plan)
    useGame.js          Hook : état du jeu et toutes les actions (ouvrir, vendre, échanger, améliorer, compte…)
  components/           CarArt, BoxArt, Chip/ChipRow, RarityTag, Trend, ErrorBoundary
  screens/              HomeScreen (Showroom), BoxesScreen, GarageScreen, CarnetScreen, UpgradesScreen (Atelier)
  modals/               RevealModal (ouverture), DetailModal (fiche voiture), AccountModal (compte), TutorialModal
  utils/                format (fmt, uid, carName…), feedback (vibrations et sons), performance, rank
scripts/verify.mjs      Contrôle des invariants
supabase/garagedrop.sql Table gd_saves et règles RLS (à exécuter une fois dans le SQL Editor de Supabase)
docs/                   Page d'assistance et confidentialité (GitHub Pages), fiche store, guide de publication
.github/workflows/      expo-update (publication Expo Go à chaque push), store-build (EAS Build manuel)
```

Règles de dépendance : `data` ne dépend de rien, `economy` dépend de `data`, l'interface dépend des deux.
Dans `src/data`, `src/economy`, `src/state/initial.js`, `src/state/transfer.js` et `src/utils/format.js`, les imports gardent l'extension `.js`
pour que `scripts/verify.mjs` puisse les charger avec node. Ne pas y importer React ni react-native.

Les voitures sont dessinées avec des `View` (pas d'images) : `CarArt` choisit une silhouette selon le
segment (ou « prewar » pour l'époque P) et un habillage selon la variante.

## Catalogue

Le catalogue est **généré au lancement, de façon déterministe**, à partir de `BRANDS`.
Une gamme s'écrit `Nom:segment:époques` (époques parmi `P C Y M A`), les gammes sont séparées par `|`.

- Un **modèle** = une gamme à une époque. Identifiant : `marque-gamme-époque`, où `gamme` est
  **l'index de la gamme dans la marque** (ex. `vel-0-Y`).
- Une **voiture** (version) = un modèle dans une des 5 variantes `s e c l x`.
  Identifiant : `marque-gamme-époque-variante` (ex. `vel-0-Y-x`).
- Année, couleur et puissance sont tirées avec `rng(hash(idModèle))` ; la valeur avec `rng(hash(idModèle + variante))`.

### Calcul de la rareté

```
base   = borné entre 0 et 4 ( tier du segment + prestige de la marque + bonus d'époque − 1 )
rareté = min(5, base + bonus de variante)
valeur = RAR[rareté].base × (0,6 à 1,7), arrondie à 10 €
```

- tier du segment : 0 (citadine, berline, break, SUV, pick-up) à 4 (hypercar)
- prestige de la marque : 0, 1 ou 2
- bonus d'époque : P +2, C +1, Y +1, M 0, A 0
- bonus de variante : Standard 0, Édition spéciale +1, Finition carbone +2, Série limitée +2 (numérotée /500), Chrome +3 (numérotée /50)

Raretés : 0 Commune, 1 Rare, 2 Épique, 3 Légendaire, 4 Mythique, 5 Prototype.

### Invariants à ne jamais casser

- **Les identifiants de voitures sont stockés dans les sauvegardes** (`garage[].carId`, `discovered[]`).
  Ne jamais changer l'`id` d'une marque, ni **réordonner, insérer ou supprimer** une gamme au milieu de
  `lines` (l'index fait partie de l'identifiant), ni renommer les clés d'époque ou de variante.
- Ne pas toucher à `hash`, `rng`, ni à l'ordre des appels au générateur dans `catalog.js` :
  les valeurs de toutes les voitures changeraient.
- Clé de sauvegarde : `garagedrop-save-v2`. Tout nouveau champ d'état doit avoir une valeur par défaut
  dans `INITIAL` **et** être repris dans `sanitizeSave` (`src/state/transfer.js`), sinon il est perdu au
  chargement. Toute sauvegarde (stockage local ou code collé) passe par `sanitizeSave`.
- Code de sauvegarde : `GD2.<JSON en base64url>.<hash de contrôle>`. Ne pas changer ce format sans garder la lecture de l'ancien.
- État actuel attendu : **25 marques, 237 modèles, 1185 versions**. `npm run verify` contrôle ces
  chiffres ainsi qu'une empreinte des identifiants, raretés et valeurs.

## Économie

Ne modifier ni les probabilités, ni les prix, ni les formules sans demande explicite.

| Élément | Formule |
| --- | --- |
| Gain par tap | `round(10 × niveau^1,6)` |
| Coût amélioration tap | `round(150 × 1,55^niveau)` |
| Mécanos (par seconde) | `round(8 × niveau^1,7)`, 0 au niveau 0 |
| Coût amélioration mécanos | `round(400 × 1,6^niveau)` |
| Showroom (par seconde) | `0,00002 ×` valeur de base du garage (0,12 % par minute) |
| Bonus de collection | `+5 %` de revenus passifs par marque complète |
| Hors-ligne | 50 % du revenu passif, plafonné à 2 h (au lancement et au retour d'arrière-plan ; aucun revenu passif ne tourne en arrière-plan) |
| Récompense du jour | `max(3000, 300 taps) × (1 + 0,25 × (min(série, 7) − 1))` ; série remise à 1 après 48 h |
| Cote du jour | `valeur × (1 + 0,12·sin(0,9·j + h) + 0,05·sin(2,3·j + 0,7·h))`, `j` = numéro du jour, `h = hash(modèle) % 1000` |
| Échange | 5 voitures d'une rareté (les moins chères) → 1 voiture au hasard de la rareté suivante |
| Départ | 3 500 € |

La cote dépend seulement du modèle et du jour : elle est identique pour tous les joueurs (utile pour un futur marché).

### Boîtes

| Boîte | Prix | Probabilités (Commune → Prototype, en %) | Rendement |
| --- | --- | --- | --- |
| Garage | 3 200 € | 86 / 12,5 / 1,35 / 0,14 / 0,01 / 0 | ≈ 1,09 |
| Sport | 19 000 € | 45 / 45 / 8,5 / 1,4 / 0,1 / 0 | ≈ 0,92 |
| Luxe | 110 000 € | 0 / 50 / 40 / 9 / 0,95 / 0,05 | ≈ 0,92 |
| Supercar | 500 000 € | 0 / 0 / 55 / 38 / 6,6 / 0,4 | ≈ 0,92 |
| Hypercar | 2 300 000 € | 0 / 0 / 0 / 60 / 36 / 4 | ≈ 0,92 |
| Prototype | 7 000 000 € | 0 / 0 / 0 / 0 / 80 / 20 | ≈ 0,92 |

**Invariant de rendement** (valeur moyenne obtenue / prix) : la Box Garage est légèrement rentable
(≈ 1,09) pour lancer le joueur, toutes les autres perdent un peu (≈ 0,92) : on progresse grâce au tap,
au passif et à la chance, pas en enchaînant les boîtes. `npm run verify` échoue si un rendement
s'écarte de plus de 0,01 de sa cible.

### Boîtes thématiques

- Prix : `round(prix × 1,25 / 100) × 100`.
- Tirage : on tire la rareté avec les probabilités de la boîte, puis une voiture du thème dans cette
  rareté. Si le thème n'a aucune voiture de cette rareté, `pickCar` prend la rareté la plus proche
  (d'abord en dessous, puis au-dessus).
- **Règle de désactivation** : une boîte thématique n'est proposée que si le thème contient au moins
  une voiture de **la rareté la plus basse de la boîte** (première probabilité non nulle), voir
  `boxAvailable`. Sans cela, le repli ferait sortir systématiquement des raretés supérieures et la
  boîte deviendrait une machine à argent. Exemple : pas de Box Garage « Supercars » (aucune supercar commune).
  `npm run verify` liste les combinaisons désactivées.

## Ajouter des marques ou des gammes

Tout se passe dans `src/data/brands.js`.

1. **Nouvelle gamme** : l'ajouter **à la fin** de `lines` de la marque (`|Nom:segment:époques`).
   Ajouter une époque à une gamme existante est aussi sans risque (nouveaux identifiants seulement).
2. **Nouvelle marque** : ajouter une entrée à `BRANDS` avec un `id` unique de 3 lettres minuscules,
   un `country` présent dans `COUNTRIES`, un `prestige` (0 à 2) et une palette `pal` existante.
   Nom de marque et de modèles inventés.
3. Lancer `npm run verify`. Les compteurs et l'empreinte vont changer, c'est normal : mettre à jour
   `EXPECTED` (marques, modèles, versions, empreinte) dans `scripts/verify.mjs` **après avoir vérifié
   que les rendements des boîtes restent dans la tolérance**. Si un rendement sort de sa cible,
   rééquilibrer le mélange de segments/prestiges ajoutés plutôt que de toucher aux prix sans le demander.
4. Vérifier dans la sortie du script que les combinaisons de boîtes thématiques désactivées restent cohérentes.

Renommer une gamme ou une marque (champ `name`) est sans danger : le nom n'entre ni dans l'identifiant ni dans le hasard.
Changer le segment d'une gamme, le prestige d'une marque ou les bornes d'une époque modifie raretés et valeurs : à éviter sur l'existant.

## Tester sur iPhone

Les sessions Claude Code dans le cloud ne peuvent pas ouvrir de tunnel Expo (réseau sortant filtré :
`api.expo.dev` et les serveurs ngrok sont refusés). Ne pas promettre de QR code depuis le cloud.
Vérifications possibles côté cloud : `npm run verify`, et `npx expo export --platform ios` pour
s'assurer que le bundle se construit (ajouter `EXPO_OFFLINE=1` si l'API Expo est injoignable).

## Interface : règles à respecter

- Zones sûres : utiliser `useSafeAreaInsets` (react-native-safe-area-context), jamais le `SafeAreaView` de react-native (déprécié).
- Tout retour haptique ou sonore passe par `hap()` et `sfx()` de `src/utils/feedback.js`, qui respectent les réglages du joueur.
- `Alert.alert` ne fait rien sur le web : les confirmations y sont contournées (`Platform.OS === 'web'`), utile pour les tests navigateur.
- Aucune permission : pas de micro (plugin expo-audio configuré sans). Le réseau ne sert qu'au compte en ligne facultatif. Toute nouvelle donnée envoyée en ligne doit être reflétée dans `src/data/privacy.js`, `docs/privacy.html` et `docs/store/fiche-store.md`.
- La vente d'une voiture Légendaire ou mieux, ou numérotée, demande une confirmation.

## Compte en ligne (Supabase)

- Projet Supabase **partagé avec l'app OR Vault** du même développeur : les comptes (auth.users) sont communs aux deux apps.
  Ne jamais toucher aux tables d'OR Vault ; tout ce qui concerne GarageDrop est préfixé `gd_`.
  Ne jamais appeler la fonction `delete_user` du projet depuis GarageDrop : elle supprimerait aussi le compte OR Vault.
- Pas de supabase-js : `src/cloud/client.js` appelle directement les API REST (`/auth/v1`, `/rest/v1`). Cela évite les correctifs Metro/Hermes qu'OR Vault a dû appliquer.
- Synchronisation : la partie entière est stockée en JSON dans `gd_saves.data` (une ligne par joueur, RLS `auth.uid() = user_id`).
  `updated_at` sert de témoin : au lancement, si la ligne en ligne n'a pas l'horodatage du dernier envoi de cet appareil (`session.lastPushed`), un autre appareil a joué et la partie en ligne est chargée. Dernier écrit gagnant.
- Le client fait foi (pas d'anti-triche) : à revoir avant tout classement ou marché entre joueurs.
- La clé anon vient de `EXPO_PUBLIC_SUPABASE_ANON_KEY` (secret GitHub pour le workflow Expo Go). Sans clé, l'app fonctionne en local uniquement.
