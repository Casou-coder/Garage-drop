# Fiche store GarageDrop (à copier dans App Store Connect et Google Play Console)

## Identité

| Champ | Valeur |
| --- | --- |
| Nom | GarageDrop |
| Sous-titre (iOS, 30 car. max) | Collectionne 1 185 voitures |
| Description courte (Android, 80 car. max) | Ouvre des boîtes, collectionne 1 185 voitures et fais grandir ton garage. |
| Catégorie | Jeux > Simulation (secondaire : Casual / Grand public) |
| Identifiant iOS et Android | `com.casoucoder.garagedrop` |
| Langue | Français |
| Prix | Gratuit, sans achat intégré, sans publicité |
| URL de confidentialité | https://casou-coder.github.io/Garage-drop/privacy.html |
| URL d'assistance | https://casou-coder.github.io/Garage-drop/ |

Les deux URL fonctionnent une fois GitHub Pages activé sur le dossier `docs/` (voir `docs/PUBLICATION.md`).

## Description longue

Bienvenue dans ton garage.

Tape pour gagner tes premiers euros, ouvre des boîtes et découvre ce qu'elles cachent : une citadine des années 60, un tout-terrain increvable, ou peut-être une hypercar en finition Chrome numérotée sur 50.

COLLECTIONNE
• 1 185 versions à découvrir, 237 modèles, 25 marques imaginaires venues de 10 pays
• 6 raretés, de Commune à Prototype
• 5 finitions par modèle, dont des séries limitées numérotées

OUVRE DES BOÎTES
• 6 boîtes, de la Box Garage à la Box Prototype
• Les chances de chaque rareté sont toujours affichées
• Cible un pays, une époque ou une catégorie avec les boîtes thématiques

GÈRE TON GARAGE
• Garde tes plus belles pièces : elles rapportent en continu
• Revends au bon moment : la cote de chaque modèle change tous les jours
• Échange cinq voitures contre une plus rare

PROGRESSE
• Améliore ton atelier pour gagner plus, même hors-ligne
• Complète une marque pour augmenter tes revenus
• Reviens chaque jour pour ta récompense

Gratuit, sans publicité, sans achat intégré. Tout l'argent du jeu est virtuel. Les marques et modèles sont fictifs. Jouable hors connexion, compte en ligne facultatif pour retrouver ta partie sur un autre appareil.

## Mots-clés (iOS, 100 car. max)

voiture,collection,garage,idle,clicker,boîte,rareté,auto,collectionneur,incrémental,supercar

## Texte promotionnel (iOS, 170 car. max)

1 185 voitures à collectionner. Ouvre des boîtes, garde tes pépites, revends au bon moment et complète ton carnet.

## Nouveautés de la version 1.0.0

Première version de GarageDrop.

## Captures d'écran

Dans `docs/store/screenshots/`, au format 1290 × 2796 (iPhone 6,7 pouces, accepté aussi par Google Play).
Elles viennent d'un rendu navigateur de l'app : les remplacer par de vraies captures prises sur iPhone dès que possible (la police des titres diffère légèrement).

## Questionnaires

### Apple : confidentialité de l'app
Le compte en ligne est facultatif. Déclarer, comme données **liées à l'utilisateur**, utilisées pour **le fonctionnement de l'app** uniquement, sans suivi :
- Coordonnées > Adresse e-mail
- Contenu utilisateur > Contenu de jeu (la partie sauvegardée)
- Identifiants > Identifiant utilisateur

Si l'app est publiée **sans** clé Supabase (compte en ligne désactivé), répondre « Données non collectées ».

Apple exige qu'une app permettant de créer un compte permette aussi de le supprimer depuis l'app : voir le point ouvert dans `docs/PUBLICATION.md`.

### Apple : classification par âge
- Jeux de hasard simulés : **Peu fréquents / légers**. Le jeu ouvre des boîtes au contenu aléatoire payées en monnaie virtuelle, sans argent réel ni gain réel.
- Tout le reste : Aucun.
- Achats intégrés : non. Contenu aléatoire payant en argent réel (loot boxes) : non.

### Apple : conformité export
L'app n'utilise pas de chiffrement non exempté (déjà déclaré dans `app.json`).

### Google Play : sécurité des données
Données collectées (facultatives, seulement si le joueur crée un compte) : adresse e-mail, identifiant utilisateur, progression dans le jeu. Finalité : fonctionnement de l'app et gestion du compte. Données chiffrées en transit, non partagées, suppression possible sur demande (URL : page d'assistance).

### Google Play : classification du contenu (IARC)
Pas de violence, pas de contenu sexuel, pas de langage grossier, pas de communication entre joueurs, pas d'achat. Signaler les éléments aléatoires en monnaie virtuelle si la question est posée.

### Google Play : public cible
13 ans et plus (évite les obligations du programme Familles).

### Notes pour la revue Apple
Jeu jouable hors-ligne et sans compte ; un compte en ligne facultatif (e-mail et mot de passe) sert uniquement à sauvegarder la partie. Aucun achat. Les boîtes s'achètent uniquement avec la monnaie virtuelle gagnée en jouant, et les probabilités de chaque rareté sont affichées sur chaque boîte (onglet Boîtes). Toutes les marques et tous les modèles sont fictifs.
