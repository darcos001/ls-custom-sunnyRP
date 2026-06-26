const express = require('express');
const db = require('../db');
const { verifierToken } = require('../auth');

const router = express.Router();
router.use(verifierToken);

// Calcule la commission et le bénéfice pour un employé donné et un prix donné
function calculerMontants(employeId, prix, coutMateriel) {
  const employe = db
    .prepare(
      `SELECT e.id, g.commission_pourcentage
       FROM employes e JOIN grades g ON g.id = e.grade_id
       WHERE e.id = ?`
    )
    .get(employeId);

  if (!employe) throw new Error('Employé introuvable');

  const margeBrute = prix - coutMateriel;
  const commissionMontant = Math.round(margeBrute * (employe.commission_pourcentage / 100) * 100) / 100;
  const benefice = Math.round((margeBrute - commissionMontant) * 100) / 100;

  return { commissionMontant, benefice };
}

// Créer une intervention (réparation ou custom)
router.post('/', (req, res) => {
  const {
    type, // 'reparation' | 'custom'
    catalogue_id,
    nom_prestation,
    plaque,
    marque_vehicule,
    nom_client,
    employe_id,
    prix,
    cout_materiel,
    notes,
  } = req.body;

  if (!type || !nom_prestation || !plaque || !marque_vehicule || !nom_client || !employe_id || prix === undefined) {
    return res.status(400).json({ erreur: 'Tous les champs obligatoires doivent être remplis' });
  }

  try {
    const cout = cout_materiel || 0;
    const { commissionMontant, benefice } = calculerMontants(employe_id, prix, cout);

    const resultat = db
      .prepare(
        `INSERT INTO interventions
          (type, catalogue_id, nom_prestation, plaque, marque_vehicule, nom_client,
           employe_id, prix, cout_materiel, commission_montant, benefice, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        type,
        catalogue_id || null,
        nom_prestation,
        plaque.toUpperCase(),
        marque_vehicule,
        nom_client,
        employe_id,
        prix,
        cout,
        commissionMontant,
        benefice,
        notes || null
      );

    res.status(201).json({ id: resultat.lastInsertRowid, commission: commissionMontant, benefice });
  } catch (e) {
    res.status(400).json({ erreur: e.message });
  }
});

// Liste avec filtres (recherche, mécanicien, semaine, tri)
router.get('/', (req, res) => {
  const { recherche, employe_id, type, depuis, jusqu_a, tri } = req.query;

  let sql = `
    SELECT i.*, e.nom_affiche AS mecano_nom
    FROM interventions i
    JOIN employes e ON e.id = i.employe_id
    WHERE 1=1
  `;
  const params = [];

  if (recherche) {
    sql += ` AND (i.nom_client LIKE ? OR i.plaque LIKE ? OR i.marque_vehicule LIKE ? OR i.nom_prestation LIKE ?)`;
    const r = `%${recherche}%`;
    params.push(r, r, r, r);
  }
  if (employe_id) {
    sql += ` AND i.employe_id = ?`;
    params.push(employe_id);
  }
  if (type) {
    sql += ` AND i.type = ?`;
    params.push(type);
  }
  if (depuis) {
    sql += ` AND i.date_creation >= ?`;
    params.push(depuis);
  }
  if (jusqu_a) {
    sql += ` AND i.date_creation <= ?`;
    params.push(jusqu_a);
  }

  sql += tri === 'anciens' ? ' ORDER BY i.date_creation ASC' : ' ORDER BY i.date_creation DESC';

  const lignes = db.prepare(sql).all(...params);
  res.json(lignes);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const ligne = db.prepare('SELECT employe_id FROM interventions WHERE id = ?').get(id);
  if (!ligne) return res.status(404).json({ erreur: 'Introuvable' });
  if (ligne.employe_id !== req.utilisateur.id && !req.utilisateur.est_admin) {
    return res.status(403).json({ erreur: 'Non autorisé' });
  }
  db.prepare('DELETE FROM interventions WHERE id = ?').run(id);
  res.json({ ok: true });
});

// --- Statistiques pour le tableau de bord ---
router.get('/stats/semaine', (req, res) => {
  const debutSemaine = new Date();
  debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay() + 1); // Lundi
  debutSemaine.setHours(0, 0, 0, 0);
  const debutISO = debutSemaine.toISOString();

  const reparations = db
    .prepare(`SELECT COUNT(*) AS c, COALESCE(SUM(prix),0) AS total FROM interventions WHERE type='reparation' AND date_creation >= ?`)
    .get(debutISO);
  const customs = db
    .prepare(`SELECT COUNT(*) AS c, COALESCE(SUM(prix),0) AS total, COALESCE(SUM(benefice),0) AS benef FROM interventions WHERE type='custom' AND date_creation >= ?`)
    .get(debutISO);
  const total = db
    .prepare(`SELECT COALESCE(SUM(prix),0) AS total FROM interventions WHERE date_creation >= ?`)
    .get(debutISO);

  res.json({
    reparations_count: reparations.c,
    reparations_total: reparations.total,
    customs_count: customs.c,
    customs_total: customs.total,
    customs_benefice: customs.benef,
    ca_total: total.total,
  });
});

router.get('/stats/employe/:id', (req, res) => {
  const { id } = req.params;
  const stats = db
    .prepare(
      `SELECT COUNT(*) AS interventions_count,
              COALESCE(SUM(prix),0) AS total_genere,
              COALESCE(SUM(commission_montant),0) AS total_commission
       FROM interventions WHERE employe_id = ?`
    )
    .get(id);
  res.json(stats);
});

module.exports = router;
