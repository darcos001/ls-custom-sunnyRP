const express = require('express');
const db = require('../db');
const { verifierToken } = require('../auth');

const router = express.Router();
router.use(verifierToken);

// Calcule la commission et le bénéfice selon le % du grade (utilisé pour les réparations)
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

// Prix fixe pour toutes les réparations
const PRIX_REPARATION_FIXE = 750;

// Créer une intervention (réparation ou custom)
router.post('/', (req, res) => {
  const {
    type,
    nom_prestation,
    plaque,
    marque_vehicule,
    nom_client,
    employe_id,
    notes,
  } = req.body;

  let { prix } = req.body;

  if (!type || !plaque || !marque_vehicule || !nom_client || !employe_id) {
    return res.status(400).json({ erreur: 'Tous les champs obligatoires doivent être remplis' });
  }
  if (type === 'reparation') {
    prix = PRIX_REPARATION_FIXE;
  } else if (prix === undefined || prix === null || prix === '') {
    return res.status(400).json({ erreur: 'Le prix est obligatoire pour un custom' });
  }

  const nomFinal = type === 'reparation' ? (nom_prestation || 'Réparation') : (nom_prestation || 'Custom');

  try {
    let commissionMontant, benefice;

    if (type === 'custom') {
      // Pour les customs : toujours 50% fixe, peu importe le grade
      commissionMontant = Math.round(Number(prix) * 0.5 * 100) / 100;
      benefice = Math.round((Number(prix) - commissionMontant) * 100) / 100;
    } else {
      // Pour les réparations : % du grade appliqué sur le prix fixe
      const resultatCalc = calculerMontants(employe_id, Number(prix), 0);
      commissionMontant = resultatCalc.commissionMontant;
      benefice = resultatCalc.benefice;
    }

    const resultat = db
      .prepare(
        `INSERT INTO interventions
          (type, catalogue_id, nom_prestation, plaque, marque_vehicule, nom_client,
           employe_id, prix, cout_materiel, commission_montant, benefice, notes)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
      )
      .run(
        type,
        nomFinal,
        plaque.toUpperCase(),
        marque_vehicule,
        nom_client,
        employe_id,
        Number(prix),
        commissionMontant,
        benefice,
        notes || null
      );

    res.status(201).json({ id: resultat.lastInsertRowid, commission: commissionMontant, benefice });
  } catch (e) {
    res.status(400).json({ erreur: e.message });
  }
});

// Liste avec filtres
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

// Statistiques pour le tableau de bord
router.get('/stats/semaine', (req, res) => {
  const debutSemaine = new Date();
  debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay() + 1);
  debutSemaine.setHours(0, 0, 0, 0);
  const debutISO = debutSemaine.toISOString();

  const reparations = db
    .prepare(`SELECT COUNT(*) AS c, COALESCE(SUM(prix),0) AS total FROM interventions WHERE type='reparation' AND date_creation >= ?`)
    .get(debutISO);
  const customs = db
    .prepare(`SELECT COUNT(*) AS c, COALESCE(SUM(prix),0) AS total_brut, COALESCE(SUM(benefice),0) AS benef FROM interventions WHERE type='custom' AND date_creation >= ?`)
    .get(debutISO);

  // Pour les customs : CA entreprise = 50% du prix brut
  const customs_ca_entreprise = Math.round(customs.total_brut * 0.5 * 100) / 100;

  // CA total = réparations complètes + 50% des customs seulement
  const ca_total = Math.round((reparations.total + customs_ca_entreprise) * 100) / 100;

  res.json({
    reparations_count: reparations.c,
    reparations_total: reparations.total,
    customs_count: customs.c,
    customs_total: customs_ca_entreprise,
    customs_benefice: customs.benef,
    ca_total: ca_total,
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
