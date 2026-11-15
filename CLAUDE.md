# GarageDrop

Jeu mobile de collection de voitures (Expo / React Native, JavaScript), interface en français.
Le développeur travaille uniquement depuis un iPhone et teste avec Expo Go.

## Concept

- **Showroom** : on tape sur le plateau pour gagner de l'argent ; récompense quotidienne avec série.
- **Boîtes** : six boîtes de prix croissants, chacune avec ses probabilités par rareté (affichées au joueur). Version thématique (pays, région, époque, catégorie) facturée 25 % de plus.
- **Garage** : chaque voiture obtenue est gardée ou revendue à la cote du jour. Échange de 5 voitures d'une rareté contre 1 de la rareté au-dessus. Vente des doublons.
- **Carnet** : collection de toutes les versions, groupées par marque, région, pays, catégorie ou époque. Une marque complète (version standard de chaque modèle) donne +5 % de revenus passifs.
- **Atelier** : améliorations du tap et des revenus passifs, réglages, remise à zéro.

Marques et modèles **fictifs uniquement** : ne jamais introduire de vraie marque ni de vrai nom de modèle.

## Commandes

```bash
npm install            # dépendances
npm run verify         # vérifie le catalogue et le rendement des boîtes (à lancer après tout changement de données)
npx expo start         # serveur de dev (Expo Go sur le même réseau)
npx expo start --tunnel  # idem via tunnel (demande un compte Expo ; `--tunnel ngrok` sinon)
npx expo install <paquet>  # toujours utiliser ceci pour ajouter une dépendance
```

Expo SDK 58, template blank, sans expo-router. Pas de TypeScript, pas de linter configuré.
N'ajouter que des modules inclus dans Expo Go (pas de code natif personnalisé).

## Architecture

```
App.js                  Coquille : en-tête, onglets, toast, modales. Aucune logique de jeu.
index.js                Point d'entrée Expo (registerRootComponent)
src/
  theme.js              Couleurs (C) et polices
  styles.js             Feuille de styles partagée (st)
  data/                 Données pures, sans React (importables depuis node)
    random.js           hash (FNV-1a) et rng seedé (mulberry32)
    rarities.js         RAR : 6 raretés, couleur et valeur de base
    taxonomy.js         REGIONS, COUNTRIES, EPOCHS, SEGMENTS, VARIANTS, PAL
    brands.js           BRANDS : les marques et leurs gammes  ← c'est ici qu'on agrandit le catalogue
    catalog.js          Génération : CARS, MODELS, CAR_MAP, BY_RARITY, MODELS_BY_BRAND
    themes.js           THEMES : filtres des boîtes thématiques
    boxes.js            BOXES, boxAvailable, boxPrice, rollRarity, pickCar
  economy/              Formules pures, sans React
    market.js           Cote du jour (marketFactor, quote)
    income.js           Tap, mécanos, showroom, bonus de marques, passiveRate
    rewards.js          Récompense quotidienne, gains hors-ligne
  state/
    save.js             SAVE_KEY, INITIAL, loadGame, saveGame (AsyncStorage)
    useGame.js          Hook : état du jeu et toutes les actions (ouvrir, vendre, échanger, améliorer…)
  components/           CarArt, BoxArt, Chip/ChipRow, RarityTag, Trend
  screens/              HomeScreen (Showroom), BoxesScreen, GarageScreen, CarnetScreen, UpgradesScreen (Atelier)
  modals/               RevealModal (ouverture de boîtes), DetailModal (fiche voiture)
  utils/                format (fmt, uid, carName…), haptics, performance (0-100, vitesse max)
scripts/verify.mjs      Contrôle des invariants
```

Règles de dépendance : `data` ne dépend de rien, `economy` dépend de `data`, l'interface dépend des deux.
Dans `src/data`, `src/economy` et `src/utils/format.js`, les imports gardent l'extension `.js`
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
  dans `INITIAL` (les anciennes sauvegardes sont fusionnées dessus).
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
| Hors-ligne | 50 % du revenu passif, plafonné à 2 h |
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
