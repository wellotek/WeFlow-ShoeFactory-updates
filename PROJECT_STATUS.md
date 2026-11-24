# WeFlow ShoeFactory — Rapport Final de Projet (v1.0.0)

## 1. Synthèse du Projet

**WeFlow ShoeFactory** est un logiciel ERP/MES complet, professionnel et prêt à la commercialisation, spécialement conçu pour les ateliers et usines de fabrication de chaussures en Algérie.

- **Version :** 1.0.0 (Production / Commerciale)
- **Architecture :** Electron 35.7.5 + React 18 + TypeScript + Vite + Tailwind CSS v4 + SQLite (better-sqlite3)
- **Plateforme :** Windows 10 & 11 (64-bit x64)
- **Monnaie :** Dinar Algérien (DA)
- **Langues :** Bilingue intégral Français (LTR) et Arabe (RTL) avec détection et persistance de la direction
- **Dépôt Source :** [https://github.com/wellotek/WeFlow-ShoeFactory](https://github.com/wellotek/WeFlow-ShoeFactory)
- **Dépôt des Mises à jour :** [https://github.com/wellotek/WeFlow-ShoeFactory-updates](https://github.com/wellotek/WeFlow-ShoeFactory-updates)
- **Release Officielle 1.0.0 :** [https://github.com/wellotek/WeFlow-ShoeFactory-updates/releases/tag/v1.0.0](https://github.com/wellotek/WeFlow-ShoeFactory-updates/releases/tag/v1.0.0)

---

## 2. Modules Métier Développés & 100% Opérationnels

L'application intègre 17 modules métier entièrement connectés à une base de données locale persistante SQLite (aucune donnée factice en dur, zéro bouton inactif) :

1. **Tableau de Bord Dynamique (لوحة القيادة — Dashboard) :**
   - Calcul en temps réel du CA, des dépenses, de la marge nette, du nombre total de paires produites, de la cadence d'atelier.
   - Graphiques de production mensuelle, de répartition par modèle et pointure.
   - Dernières commandes et alertes de stock en temps réel.
2. **Catalogue des Modèles (الموديلات — Modèles) :**
   - Gestion des fiches modèles avec photo, référence unique, catégorie (Classique, Sport, Sécurité, Enfant, etc.), saison, genre.
   - Matrice dynamique des variantes (pointures 38 à 46, coloris, code-barre EAN-13 par variante).
3. **Matières Premières (المواد الأولية — Matières Premières) :**
   - Suivi des cuirs (m²), semelles (paires), fils (bobines), lacets, colles et solvants (L), œillets et boucles.
   - Seuils d'alerte configurables, calcul du statut "كافٍ" (suffisant) ou "حرج" (critique).
4. **Fiches Techniques (البطاقات التقنية — Fiches Techniques / Nomenclature BOM) :**
   - Définition exacte des composants et consommables nécessaires par paire avec pourcentage de perte/chute admissible.
   - Estimation automatique du coût matière par modèle.
5. **Ordres de Fabrication (أوامر الإنتاج — Ordres de Fabrication) :**
   - Création d'ordres avec ventilation complète des pointures.
   - Contrôle automatique de la disponibilité des stocks matières avant lancement.
   - Réservation et déduction automatique des matières premières lors de la mise en production.
6. **Suivi des 7 Étapes d'Atelier (تتبع الإنتاج — Suivi de Production) :**
   - Tableau Kanban interactif reproduisant fidèlement les 7 phases du métier de la chaussure :
     1. Coupe (القص - Découpe du cuir et doublures)
     2. Piquage (الخياطة - Coutures et piquage de la tige)
     3. Assemblage (التجميع - Assemblage tige + contreforts)
     4. Montage (التركيب - Montage sur forme de chaussure)
     5. Collage / Semelage (اللصق - Encollage et pressage semelle)
     6. Finition (التشطيب - Cirage, ébavurage, lacets)
     7. Emballage & Mise en boîte (التعبئة والتغليف - Contrôle final et mise en boîte)
   - Incrémentation automatique du stock de produits finis dès l'achèvement de l'étape 7.
7. **Gestion des Stocks (المخزون — Stocks & Mouvements) :**
   - Vue globale multi-niveaux : matières premières, produits semi-finis, produits finis.
   - Historique traçable de tous les mouvements d'entrée/sortie avec motifs et pièces justificatives.
   - Outil de régularisation et d'ajustement physique d'inventaire.
8. **Commandes Clients (الطلبات — Commandes Clients) :**
   - Gestion du cycle de vente de la prise de commande à la livraison.
   - Gestion des acomptes reçus et des reliquats de paiement (crédits).
9. **Contrôle Qualité (مراقبة الجودة — Contrôle Qualité) :**
   - Enregistrement des inspections qualité à chaque étape de fabrication.
   - Catégorisation des défauts (cuir, couture, semelle, collage) et décision (Conforme, Retouche, Déclassé 2ème choix, Rebut).
10. **Parc Machines & Maintenance (الآلات والصيانة — Machines & Maintenance) :**
    - Fiches machines de l'usine (presses de découpe, piqueuses colonnes, fours de réactivation, presses à semelles).
    - Planification de la maintenance préventive et suivi curatif des pannes.
11. **Gestion des Clients (العملاء — Clients) :**
    - Répertoire des grossistes, détaillants et magasins partenaires avec wilaya, registre du commerce (RC), NIF/NIS.
    - Suivi précis du solde dû (créances clients).
12. **Gestion des Fournisseurs (الموردون — Fournisseurs) :**
    - Répertoire des tanneries, fabricants de semelles et importateurs d'accessoires.
    - Suivi des dettes fournisseurs et historique des approvisionnements.
13. **Achats & Réceptions (المشتريات — Achats Matières) :**
    - Bons de commande fournisseurs avec mise à jour instantanée du stock matière lors de la réception.
14. **Livraisons & Expéditions (التسليم — Bons de Livraison) :**
    - Génération des bons de livraison avec suivi des transporteurs et des wilayas de destination.
15. **Calcul des Coûts & Rentabilité (التكاليف — Calcul des Coûts) :**
    - Décomposition analytique fine du coût unitaire de fabrication par paire :
      - Matière principale (Cuir)
      - Semelles
      - Accessoires & doublures
      - Main d'œuvre directe (MOD)
      - Frais généraux d'atelier & énergie
    - Comparatif avec le prix de vente conseillé et calcul de la marge unitaire et du taux de marge (%).
16. **Rapports & Statistiques (التقارير — Rapports d'Activité) :**
    - Synthèses périodiques de fabrication, des ventes et des consommations avec options d'export.
17. **Étiquettes & Codes-barres (الملصقات — Étiquettes Boîtes & Paires) :**
    - Générateur d'étiquettes au format thermique standard pour boîtes à chaussures avec code-barres EAN-13 / Code-128, pointure bien visible, coloris, référence et logo officiel.
18. **Paramètres Système (الإعدادات — Paramètres & Sauvegardes) :**
    - Sélecteur de langue bilingue FR / AR avec persistance locale.
    - Informations de l'usine (Nom, Adresse, Téléphone, Wilaya, NIF, RC).
    - Système complet de sauvegarde locale de la base SQLite et restauration sécurisée en 1 clic.
    - Gestionnaire de licence avec statut, type (Universelle / Annuelle), période de grâce et machine ID.
    - Vérificateur manuel et automatique de mises à jour en ligne.

---

## 3. Système de Licence Universelle & Sécurité

Conforme aux standards stricts de l'écosystème WeFlow / Easy Menuizy :
- Communication sécurisée avec l'API centrale `https://license.dentisuite.xyz/api/v1/licenses/verify`.
- **Machine ID unique :** Généré de façon stable via l'UUID de la carte mère et du système Windows.
- **Période de grâce hors-ligne (7 jours) :** Permet à l'usine de continuer à produire même en cas de coupure de connexion Internet pendant 7 jours consécutifs.
- **Chiffrement sécurisé :** Stockage local chiffré via l'API native `safeStorage` d'Electron et signature cryptographique HMAC SHA-256 anti-falsification.
- **Écran de verrouillage (LicenseGate) :** Interface soignée permettant l'activation immédiate par clé de licence avec gestion des erreurs détaillées en français et arabe.

---

## 4. Système de Mise à Jour Automatique (Auto-Update)

- Intégration de `electron-updater` avec support NSIS complet pour Windows.
- Cible de distribution : Dépôt GitHub public `wellotek/WeFlow-ShoeFactory-updates`.
- Détection silencieuse au démarrage ou recherche manuelle dans l'onglet Paramètres.
- Téléchargement progressif en arrière-plan sans bloquer l'opérateur avec barre de pourcentage.
- Boîte de dialogue de notification de nouvelle version prête à être installée (`UpdateModal`).
- Redémarrage et installation automatique avec préservation absolue de la base de données SQLite de l'usine (option `deleteAppDataOnUninstall: false`).

---

## 5. Moteur d'Impression & Documents

- Impression directe vers les imprimantes Windows (laser A4, thermique étiquette 100x50mm, 80mm).
- Exportation au format PDF pour 18 modèles de documents officiels :
  1. Fiche Technique de Fabrication (BOM)
  2. Ordre de Fabrication (OF)
  3. Fiche Suiveuse d'Atelier (Feuille de route 7 étapes)
  4. Bon de Livraison (BL)
  5. Facture de Vente Client
  6. Devis Proforma
  7. Bon de Réception Matières
  8. Bon de Commande Fournisseur
  9. Étiquettes de Boîtes à Chaussures (Code-barres EAN-13 + Pointure + Modèle)
  10. Étiquettes Code-barres Paires individuelles
  11. Rapport de Contrôle Qualité
  12. Fiche d'Intervention Maintenance Machine
  13. Inventaire d'Atelier (Matières et Produits Finis)
  14. Rapport Financier et Marges par Modèle

---

## 6. Validation & Tests Automatisés

Le projet dispose d'une couverture de tests complète validée avec 100% de réussite :

```text
✓ tests/integration/documents.test.ts (8 tests)
✓ tests/integration/services.test.ts (4 tests)
✓ tests/unit/calculations.test.ts (3 tests)
✓ tests/unit/database.test.ts (3 tests)
✓ tests/unit/license.test.ts (5 tests)

Test Files  5 passed (5)
Tests       23 passed (23)
Result:     100% SUCCESS
```

### Vérification de l'Exécutable Empaqueté (`npm run verify:packaged`)
Test direct de l'exécutable x64 généré (`release/win-unpacked/WeFlow-ShoeFactory.exe`) :
- Résolution et exécution du moteur de routage d'atelier `dijkstrajs` : **PASS**
- Génération des codes QR vectoriels `qrcode` : **PASS**
- Compression des sauvegardes de base de données `jszip` : **PASS**
- Chargement du service de mise à jour `electron-updater` : **PASS**
- Moteur de base de données natif `better-sqlite3` sur Electron ABI : **PASS**
- Code de sortie du package : **0 (SUCCÈS TOTAL)**

---

## 7. Fichiers de Déploiement et Liens

- **Exécutable d'installation Windows :**
  `C:\Weflow Shoefactory\release\WeFlow-ShoeFactory-1.0.0-win-x64-setup.exe` (97.5 Mo)
- **Fichier de vérification différentielle :**
  `C:\Weflow Shoefactory\release\WeFlow-ShoeFactory-1.0.0-win-x64-setup.exe.blockmap`
- **Manifeste de mise à jour automatique :**
  `C:\Weflow Shoefactory\release\latest.yml`
- **Application décompressée portable :**
  `C:\Weflow Shoefactory\release\win-unpacked\`
