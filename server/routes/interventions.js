const express = require('express');
const db = require('../db');
const { verifierToken } = require('../auth');

const router = express.Router();
router.use(verifierToken);

function calculerMontants(employeId, prix, coutMateriel) {
  const employe = db
    .prepare(`SELECT e.id, g.commission_pourcentage FROM employes e JOIN grades g ON g.id = e.grade_id WHERE e.id = ?`)
    .get(employeId);
  if (!employe) throw new Error('Employé introuvable');
  const margeBrute = prix - coutMateriel;
  const commissionMontant = Math.round(margeBrute * (employe.commission_pourcentage / 100) * 100) / 100;
  const benefice = Math.round((margeBrute - commissionMontant) * 100) / 100;
  return { commissionMontant, benefice };
}

const PRIX_REPARATION_FIXE = 750;

router.post('/', (req, res) => {
  const { type, nom_prestation, plaque, marque_vehicule, nom_client, employe_id, notes, contrat_id, quantite } = req.body;
  let { prix } = req.body;
  if (!type || !plaque || !marque_vehicule || !nom_client || !employe_id) {
    return res.status(400).json({ erreur: 'Tous les champs obligatoires doivent être remplis' });
  }
  if (type === 'reparation') {
    const contrat = contrat_id
      ? db.prepare('SELECT prix_reparation, prix_kit FROM contrats WHERE id = ?').get(contrat_id)
      : null;
    const estKit = quantite !== undefined && quantite !== null && quantite !== '';
    if (estKit) {
      const qte = Number(quantite) > 0 ? Number(quantite) : 1;
      const prixUnitaire = contrat && contrat.prix_kit != null ? contrat.prix_kit : PRIX_REPARATION_FIXE;
      prix = prixUnitaire * qte;
    } else {
      prix = contrat && contrat.prix_reparation != null ? contrat.prix_reparation : PRIX_REPARATION_FIXE;
    }
  } else if (prix === undefined || prix === null || prix === '') {
    return res.status(400).json({ erreur: 'Le prix est obligatoire pour un custom' });
  }
  const nomFinal = type === 'reparation' ? (nom_prestation || 'Réparation') : (nom_prestation || 'Custom');
  try {
    let commissionMontant, benefice;
    if (type === 'custom') {
      commissionMontant = Math.round(Number(prix) * 0.5 * 100) / 100;
      benefice = Math.round((Number(prix) - commissionMontant) * 100) / 100;
    } else {
      const r = calculerMontants(employe_id, Number(prix), 0);
      commissionMontant = r.commissionMontant;
      benefice = r.benefice;
    }
    const resultat = db
      .prepare(
        `INSERT INTO interventions
          (type, catalogue_id, contrat_id, nom_prestation, plaque, marque_vehicule, nom_client,
           employe_id, prix, cout_materiel, commission_montant, benefice, notes)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
      )
      .run(type, contrat_id || null, nomFinal, plaque.toUpperCase(), marque_vehicule, nom_client, employe_id, Number(prix), commissionMontant, benefice, notes || null);
    res.status(201).json({ id: resultat.lastInsertRowid, commission: commissionMontant, benefice });
  } catch (e) {
    res.status(400).json({ erreur: e.message });
  }
});

router.get('/', (req, res) => {
  const { recherche, employe_id, type, depuis, jusqu_a, tri } = req.query;
  let sql = `SELECT i.*, e.nom_affiche AS mecano_nom, c.nom AS contrat_nom FROM interventions i JOIN employes e ON e.id = i.employe_id LEFT JOIN contrats c ON c.id = i.contrat_id WHERE 1=1`;
  const params = [];
  if (recherche) {
    sql += ` AND (i.nom_client LIKE ? OR i.plaque LIKE ? OR i.marque_vehicule LIKE ? OR i.nom_prestation LIKE ?)`;
    const r = `%${recherche}%`;
    params.push(r, r, r, r);
  }
  if (employe_id) { sql += ` AND i.employe_id = ?`; params.push(employe_id); }
  if (type) { sql += ` AND i.type = ?`; params.push(type); }
  if (depuis) { sql += ` AND i.date_creation >= ?`; params.push(depuis); }
  if (jusqu_a) { sql += ` AND i.date_creation <= ?`; params.push(jusqu_a); }
  sql += tri === 'anciens' ? ' ORDER BY i.date_creation ASC' : ' ORDER BY i.date_creation DESC';
  res.json(db.prepare(sql).all(...params));
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
  const customs_ca_entreprise = Math.round(customs.total_brut * 0.5 * 100) / 100;
  const ca_total = Math.round((reparations.total + customs_ca_entreprise) * 100) / 100;
  res.json({
    reparations_count: reparations.c,
    reparations_total: reparations.total,
    customs_count: customs.c,
    customs_total: customs_ca_entreprise,
    customs_benefice: customs.benef,
    ca_total: ca_total,
  });
});

router.get('/stats/employe/:id', (req, res) => {
  const { id } = req.params;
  const stats = db
    .prepare(`SELECT COUNT(*) AS interventions_count, COALESCE(SUM(prix),0) AS total_genere, COALESCE(SUM(commission_montant),0) AS total_commission FROM interventions WHERE employe_id = ?`)
    .get(id);
  res.json(stats);
});

module.exports = router;
