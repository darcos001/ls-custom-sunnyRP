const express = require('express');
const db = require('../db');
const { verifierToken, exigerAdmin } = require('../auth');

const router = express.Router();
router.use(verifierToken);

router.get('/', (req, res) => {
  const contrats = db.prepare('SELECT * FROM contrats WHERE actif = 1 ORDER BY nom').all();
  const debutSemaine = new Date();
  const jour = debutSemaine.getDay();
  const decalage = jour === 0 ? -6 : 1 - jour;
  debutSemaine.setDate(debutSemaine.getDate() + decalage);
  debutSemaine.setHours(0, 0, 0, 0);
  const debutISO = debutSemaine.toISOString().slice(0, 19).replace('T', ' ');
  const resultat = contrats.map((c) => {
    const totalSemaine = db.prepare(`SELECT COALESCE(SUM(prix), 0) AS total FROM interventions WHERE contrat_id = ? AND date_creation >= ?`).get(c.id, debutISO);
    const totalGeneral = db.prepare(`SELECT COALESCE(SUM(prix), 0) AS total FROM interventions WHERE contrat_id = ?`).get(c.id);
    const plaques = db.prepare(`SELECT DISTINCT plaque, marque_vehicule, nom_client FROM interventions WHERE contrat_id = ? ORDER BY date_creation DESC`).all(c.id);
    return { ...c, total_semaine: totalSemaine.total, total_impaye: totalGeneral.total, plaques };
  });
  res.json(resultat);
});

router.get('/:id/plaques', (req, res) => {
  const { id } = req.params;
  const plaques = db.prepare(`SELECT DISTINCT plaque, marque_vehicule, nom_client FROM interventions WHERE contrat_id = ? ORDER BY date_creation DESC`).all(id);
  res.json(plaques);
});

router.post('/', exigerAdmin, (req, res) => {
  const { nom, description, prix_reparation, prix_kit } = req.body;
  if (!nom) return res.status(400).json({ erreur: 'Le nom est obligatoire' });
  const prixRepa = prix_reparation === '' || prix_reparation == null ? null : Number(prix_reparation);
  const prixKit = prix_kit === '' || prix_kit == null ? null : Number(prix_kit);
  const existant = db.prepare('SELECT id, actif FROM contrats WHERE nom = ?').get(nom.trim());
  if (existant) {
    if (existant.actif === 0) {
      db.prepare('UPDATE contrats SET actif = 1, description = ?, prix_reparation = ?, prix_kit = ? WHERE id = ?').run(description || null, prixRepa, prixKit, existant.id);
      return res.status(201).json({ id: existant.id });
    } else {
      return res.status(409).json({ erreur: 'Un contrat avec ce nom existe déjà' });
    }
  }
  const resultat = db.prepare('INSERT INTO contrats (nom, description, prix_reparation, prix_kit) VALUES (?, ?, ?, ?)').run(nom.trim(), description || null, prixRepa, prixKit);
  res.status(201).json({ id: resultat.lastInsertRowid });
});

router.put('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;
  const { nom, description, actif, prix_reparation, prix_kit } = req.body;
  if (!nom) return res.status(400).json({ erreur: 'Le nom est obligatoire' });
  const prixRepa = prix_reparation === '' || prix_reparation == null ? null : Number(prix_reparation);
  const prixKit = prix_kit === '' || prix_kit == null ? null : Number(prix_kit);
  db.prepare('UPDATE contrats SET nom = ?, description = ?, prix_reparation = ?, prix_kit = ?, actif = ? WHERE id = ?').run(nom.trim(), description || null, prixRepa, prixKit, actif !== undefined ? (actif ? 1 : 0) : 1, id);
  res.json({ ok: true });
});

router.delete('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE contrats SET actif = 0 WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
