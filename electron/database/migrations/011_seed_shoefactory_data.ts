import type { AppDatabase } from '../connection'
import { nowIso } from '../sql'

export const migration = {
  id: '011_seed_shoefactory_data',
  up(db: AppDatabase): void {
    const now = nowIso()

    // 1. Models
    const insertModel = db.prepare(`
      INSERT OR IGNORE INTO shoe_models (id, reference, name, category, gender, season, collection, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertModel.run(
      1,
      'SF-001',
      'Homme Classique',
      'Classique',
      'Homme',
      'Automne-Hiver',
      '2024-2025',
      'Chaussure richelieu en cuir naturel de première qualité avec doublure respirante et semelle d’usure durable.',
      'Actif',
      now,
      now
    )
    insertModel.run(
      2,
      'SF-002',
      'Homme Sport',
      'Sport',
      'Homme',
      'Printemps-Été',
      '2024',
      'Sneaker dynamique ultra légère avec semelle amortissante et aération latérale.',
      'Actif',
      now,
      now
    )
    insertModel.run(
      3,
      'SF-003',
      'Femme Casual',
      'Classique',
      'Femme',
      'Toutes Saisons',
      '2024',
      'Mocassin élégant grand confort, cuir souple et finitions cousues main.',
      'Actif',
      now,
      now
    )
    insertModel.run(
      4,
      'SF-004',
      'Enfant Sport',
      'Enfant',
      'Enfant',
      'Rentrée 2024',
      '2024',
      'Basket résistante avec fermeture à scratch renforcée et semelle antidérapante.',
      'Actif',
      now,
      now
    )

    // 2. Variants (Sizes & Colors)
    const insertVariant = db.prepare(`
      INSERT OR IGNORE INTO shoe_variants (model_id, color, size, barcode, sku, stock_finished, stock_reserved)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const sizesMen = [38, 39, 40, 41, 42, 43, 44]
    for (const sz of sizesMen) {
      insertVariant.run(1, 'Noir', sz, `613000100${sz}`, `SF001-BLK-${sz}`, sz === 40 ? 35 : 20, 5)
      insertVariant.run(1, 'Marron', sz, `613000110${sz}`, `SF001-BRN-${sz}`, 15, 0)
      insertVariant.run(2, 'Blanc', sz, `613000200${sz}`, `SF002-WHT-${sz}`, 25, 10)
    }

    const sizesWomen = [36, 37, 38, 39, 40, 41]
    for (const sz of sizesWomen) {
      insertVariant.run(3, 'Beige', sz, `613000300${sz}`, `SF003-BGE-${sz}`, 18, 0)
      insertVariant.run(3, 'Noir', sz, `613000310${sz}`, `SF003-BLK-${sz}`, 22, 0)
    }

    const sizesKids = [28, 29, 30, 31, 32, 33, 34, 35]
    for (const sz of sizesKids) {
      insertVariant.run(4, 'Rouge', sz, `613000400${sz}`, `SF004-RED-${sz}`, 30, 0)
    }

    // 3. Suppliers
    const insertSupplier = db.prepare(`
      INSERT OR IGNORE INTO suppliers (id, name, company, phone, email, address, wilaya, provided_products, balance_due, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertSupplier.run(1, 'Mourad Badr', 'Sarl Tannerie El Badr', '033 85 41 20', 'elbadr@tannerie.dz', 'Zone Industrielle', '05 - Batna', 'Cuir naturel bovin, peausserie', 150000, now)
    insertSupplier.run(2, 'Karim Plast', 'Ets Plast-Foot', '041 32 15 44', 'contact@plastfoot.dz', 'Zone Ouest', '31 - Oran', 'Semelles caoutchouc et TR', 80000, now)
    insertSupplier.run(3, 'Tahar Fil', 'Sarl Fil d’Or', '036 91 12 00', 'fildor@setif-fil.dz', 'Zone El Eulma', '19 - Sétif', 'Bobines de fils polyester cirés', 25000, now)
    insertSupplier.run(4, 'Lounis Fix', 'Chausse-Fix', '023 54 88 12', 'chaussefix@alger.dz', 'Baraki', '16 - Alger', 'Lacets, œillets, boucles', 12000, now)
    insertSupplier.run(5, 'Farid Chim', 'Sarl Chimie-Est', '031 66 77 88', 'chimie-est@constantine.dz', 'Didouche Mourad', '25 - Constantine', 'Colles contact et néoprène', 45000, now)
    insertSupplier.run(6, 'Rachid Métal', 'Métal-Mod', '035 72 10 33', 'metalmod@bba.dz', 'BBA', '34 - Bordj Bou Arreridj', 'Accessoires métalliques', 8000, now)

    // 4. Raw Materials
    const insertMat = db.prepare(`
      INSERT OR IGNORE INTO raw_materials (id, code, designation, category, unit, unit_price, stock_quantity, min_threshold, supplier_id, supplier_name, location, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertMat.run(1, 'MAT-001', 'Cuir naturel bovin noir', 'Cuirs', 'm²', 2500, 320, 100, 1, 'Sarl Tannerie El Badr', 'Allée A-01', 'كافٍ', now)
    insertMat.run(2, 'MAT-002', 'Semelles extérieures injectées SF-001', 'Semelles', 'paires', 850, 460, 200, 2, 'Ets Plast-Foot', 'Allée B-04', 'كافٍ', now)
    insertMat.run(3, 'MAT-003', 'Bobines de fil couture haute résistance', 'Fils', 'bobines', 450, 58, 100, 3, 'Sarl Fil d’Or', 'Allée C-02', 'حرج', now)
    insertMat.run(4, 'MAT-004', 'Lacets noirs cirés et garnitures', 'Accessoires', 'paires', 50, 260, 100, 4, 'Chausse-Fix', 'Allée C-05', 'كافٍ', now)
    insertMat.run(5, 'MAT-005', 'Colle néoprène thermique spéciale semelles', 'Colles', 'litres', 850, 15, 50, 5, 'Sarl Chimie-Est', 'Armoire Chimique', 'حرج', now)
    insertMat.run(6, 'MAT-006', 'Œillets métalliques inoxydables', 'Accessoires', 'unités', 12, 1200, 500, 6, 'Métal-Mod', 'Allée D-01', 'كافٍ', now)
    insertMat.run(7, 'MAT-007', 'Doublure intérieure cuir respirante', 'Doublures', 'm²', 1000, 180, 80, 1, 'Sarl Tannerie El Badr', 'Allée A-03', 'كافٍ', now)

    // Initial Material Movements
    const insertMov = db.prepare(`
      INSERT OR IGNORE INTO material_movements (material_id, movement_type, quantity, origin, destination, user_name, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertMov.run(1, 'in', 500, 'Fournisseur Sarl Tannerie El Badr', 'Stock MP Allée A-01', 'Magasinier', 'Réception achat ACH-2024-008', now)
    insertMov.run(2, 'in', 300, 'Fournisseur Ets Plast-Foot', 'Stock MP Allée B-04', 'Magasinier', 'Réception achat ACH-2024-009', now)
    insertMov.run(1, 'out', 120, 'Stock MP Allée A-01', 'Atelier Coupe', 'Chef Atelier', 'Lancement OF PR-2026-015', now)

    // 5. Technical Sheets (BOM)
    const insertSheet = db.prepare(`
      INSERT OR IGNORE INTO technical_sheets (id, model_id, description, notes, available_sizes_json, labor_cost_per_pair, overhead_cost_per_pair, target_sale_price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertSheet.run(
      1,
      1,
      'Fiche technique standard pour Richelieu Homme Classique SF-001.',
      'Assurer une double couture renforcée sur les bordures. Utiliser la colle thermique adaptée pour la semelle naturelle.',
      JSON.stringify([38, 39, 40, 41, 42, 43, 44, 45, 46]),
      650,
      300,
      5200,
      now,
      now
    )

    const insertSheetItem = db.prepare(`
      INSERT OR IGNORE INTO technical_sheet_items (sheet_id, material_id, base_quantity, scrap_percentage, size_adjustments_json)
      VALUES (?, ?, ?, ?, ?)
    `)
    insertSheetItem.run(1, 1, 0.46, 0.0, JSON.stringify({ '39': 0.45, '40': 0.46, '41': 0.47, '42': 0.48, '43': 0.49 }))
    insertSheetItem.run(1, 2, 1.0, 0.0, null)
    insertSheetItem.run(1, 4, 1.0, 0.0, null)
    insertSheetItem.run(1, 7, 0.40, 0.0, null)

    // 6. Clients
    const insertClient = db.prepare(`
      INSERT OR IGNORE INTO customers (id, name, company, phone, email, address, wilaya, notes, balance_due, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertClient.run(1, 'Mohamed Cherif', 'Maison El Bahdja', '0550 11 22 33', 'elbahdja@alger-mode.dz', 'Rue Didouche Mourad', '16 - Alger', 'Client grossiste historique', 150000, now)
    insertClient.run(2, 'Abderrahmane Ouest', 'Chaussures de l’Ouest', '0541 33 44 55', 'ouestshoes@oran.dz', 'Boulevard Front de Mer', '31 - Oran', 'Règlement régulier par traite', 80000, now)
    insertClient.run(3, 'Noureddine Sétif', 'Société En-Nour', '0560 77 88 99', 'ennour@setif-negoce.dz', 'Centre Ville', '19 - Sétif', 'Commandes importantes saisonnières', 220000, now)
    insertClient.run(4, 'Amine Amal', 'Magasins Al-Amal', '0555 99 88 77', 'alamal@constantine.dz', 'Cité Sidi Mabrouk', '25 - Constantine', 'Réseau de 4 boutiques', 0, now)
    insertClient.run(5, 'Kamel Solidarité', 'Chaussures Solidarité', '0552 44 11 22', 'solidarite@annaba.dz', 'Cours de la Révolution', '23 - Annaba', 'Commandes institutionnelles et comités', 50000, now)

    // 7. Production Order PR-2026-015
    const insertPO = db.prepare(`
      INSERT OR IGNORE INTO production_orders (
        id, order_number, model_id, color, total_quantity, size_breakdown_json,
        start_date, due_date, manager, priority, status, observations,
        estimated_cost, actual_cost, sale_price, completion_percentage, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertPO.run(
      1,
      'PR-2026-015',
      1,
      'Noir',
      120,
      JSON.stringify({ '38': 20, '39': 25, '40': 30, '41': 25, '42': 15, '43': 5 }),
      '2026-01-10',
      '2026-01-20',
      'Ahmed Ali (Directeur Production)',
      'Haute',
      'En cours',
      'Priorité forte client El Bahdja. Contrôler le cuir avant piquage.',
      408000,
      171360,
      624000,
      42.0,
      now
    )

    // 8. 7 Production Stages for PR-2026-015
    const insertStage = db.prepare(`
      INSERT OR IGNORE INTO production_stages (
        production_order_id, stage_number, stage_name_fr, stage_name_ar,
        planned_quantity, completed_quantity, rejected_quantity, waiting_quantity,
        completion_percent, start_date, end_date, operator_name, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertStage.run(1, 1, 'Coupe', 'قص الجلد', 120, 120, 0, 0, 100.0, '2026-01-10', '2026-01-12', 'Karim Découpe', 'Terminé', 'Coupe cuir achevée sans anomalie')
    insertStage.run(1, 2, 'Piquage', 'الخياطة', 120, 72, 3, 45, 60.0, '2026-01-12', null, 'Fatima Couture', 'En cours', 'Piquage tiges en cours')
    insertStage.run(1, 3, 'Assemblage', 'التجميع', 120, 0, 0, 120, 0.0, null, null, 'Mustapha Assemblage', 'En attente', null)
    insertStage.run(1, 4, 'Montage', 'التركيب', 120, 0, 0, 120, 0.0, null, null, 'Nabil Montage', 'En attente', null)
    insertStage.run(1, 5, 'Collage', 'اللصق', 120, 0, 0, 120, 0.0, null, null, 'Brahim Collage', 'En attente', null)
    insertStage.run(1, 6, 'Finition', 'التشطيب', 120, 0, 0, 120, 0.0, null, null, 'Aissa Finition', 'En attente', null)
    insertStage.run(1, 7, 'Emballage', 'التعبئة والتغليف', 120, 0, 0, 120, 0.0, null, null, 'Yacine Emballage', 'En attente', null)

    // 9. Customer Orders
    const insertOrder = db.prepare(`
      INSERT OR IGNORE INTO customer_orders (
        id, order_number, customer_id, order_date, delivery_date, status,
        total_quantity, total_amount, discount, advance_paid, remaining_balance, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertOrder.run(1, 'CMD-2024-0482', 1, '2024-10-14', '2024-10-25', 'En production', 1200, 1450000, 0, 500000, 950000, 'Livraison par lots de 400 paires', now)
    insertOrder.run(2, 'CMD-2024-0483', 2, '2024-10-13', '2024-10-20', 'Prête', 850, 680000, 20000, 300000, 360000, 'À enlever par transporteur du client', now)
    insertOrder.run(3, 'CMD-2024-0484', 3, '2024-10-12', '2024-10-18', 'Livrée', 2500, 4250000, 50000, 4200000, 0, 'Commande exécutée et soldée', now)
    insertOrder.run(4, 'CMD-2024-0485', 4, '2024-10-12', '2024-10-28', 'En production', 450, 360000, 0, 150000, 210000, 'Assortiment pointures 39 à 43', now)
    insertOrder.run(5, 'CMD-2024-0486', 5, '2024-10-11', '2024-10-16', 'Livrée', 1100, 1950000, 0, 1950000, 0, 'Commande spéciale livrée', now)

    // 10. Deliveries
    const insertDelivery = db.prepare(`
      INSERT OR IGNORE INTO deliveries (
        id, delivery_number, customer_order_id, customer_id, delivery_date, status, driver_name, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertDelivery.run(1, 'BL-9482', 1, 1, '2024-10-15', 'En préparation', 'Mourad Chauffeur', 'Premier lot 400 paires', now)
    insertDelivery.run(2, 'BL-9483', 2, 2, '2024-10-14', 'En préparation', 'Transport Express', 'En attente chargement', now)
    insertDelivery.run(3, 'BL-9484', 3, 3, '2024-10-13', 'Livrée', 'Camion Usine 16', 'Bon de livraison émargé reçu', now)
    insertDelivery.run(4, 'BL-9485', 5, 5, '2024-10-12', 'Livrée', 'Camion Usine 16', 'Livré conforme', now)

    // 11. Machines
    const insertMachine = db.prepare(`
      INSERT OR IGNORE INTO machines (id, code, name, machine_type, acquisition_date, status, location, next_maintenance_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertMachine.run(1, 'M01', 'Presse de coupe automatique CNC', 'Coupe', '2022-03-15', 'Active', 'Atelier Coupe', '2026-02-15', 'Fonctionnement optimal')
    insertMachine.run(2, 'M02', 'Machine à coudre pilier triple entraînement', 'Piquage', '2021-08-10', 'Maintenance', 'Atelier Piquage', '2026-01-14', 'Révision courroie et graissage programmée')
    insertMachine.run(3, 'M03', 'Presse pneumatique de semelage et collage', 'Collage', '2023-01-20', 'Active', 'Atelier Montage', '2026-03-01', 'Pression calibrée à 6 bars')
    insertMachine.run(4, 'M04', 'Ligne automatique de mise en boîte et étiquetage', 'Emballage', '2023-06-12', 'Arrêt', 'Quai Emballage', '2026-02-01', 'Arrêtée pour maintenance préventive')

    // Machine Maintenances
    const insertMaint = db.prepare(`
      INSERT OR IGNORE INTO machine_maintenances (machine_id, maintenance_type, intervention_date, cost, description, technician_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertMaint.run(2, 'Préventive', '2026-01-14', 15000, 'Vidange bain d’huile et remplacement aiguilles', 'Technicien Interne', 'Planifiée')
    insertMaint.run(3, 'Corrective', '2025-11-05', 32000, 'Changement raccord pneumatique haute pression', 'Sarl Équip-Est', 'Effectuée')

    // 12. Quality Inspections
    const insertQuality = db.prepare(`
      INSERT OR IGNORE INTO quality_inspections (
        lot_number, production_order_id, model_id, model_name, size,
        quantity_inspected, quantity_accepted, quantity_rejected, defect_cause, severity, action_taken, notes, inspector_name, inspection_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertQuality.run(
      'B-2084',
      1,
      1,
      'SF-001 Homme Classique',
      41,
      45,
      0,
      45,
      'Défaut de piqûre bordure et tension fil irrégulière (Couture)',
      'Critique',
      'Rejeté',
      'Lot rejeté pour reprise intégrale de couture.',
      'Mustapha Inspecteur',
      '2026-01-13'
    )
    insertQuality.run(
      'B-2083',
      null,
      2,
      'SF-002 Homme Sport',
      42,
      12,
      0,
      12,
      'Légère variation de teinte sur le renfort talon (Décoloration)',
      'Moyenne',
      'Retouche',
      'Nettoyage et cirage correctif recommandé.',
      'Mustapha Inspecteur',
      '2026-01-12'
    )
  }
}
