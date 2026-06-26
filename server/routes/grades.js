const express = require('express');
const db = require('../db');
const { verifierToken, exigerAdmin } = require('../auth');

const router = express.Router();
router.use(verifierToken);

router.get('/', (req, res) => {
  const grades = db.prepare('SELECT * FROM grades ORDER BY commission_pourcentage').all();
  res.json(grades);
});

router.post('/', exigerAdmin, (req, res) => {
  const { nom, commission_pourcentage, couleur } = req.body;
  if (!nom || commission_pourcentage === undefined) {
    return res.status(400).json({ erreur: 'Nom et pourcentage requis' });
  }
  const resultat = db
    .prepare('INSERT INTO grades (nom, commission_pourcentage, couleur) VALUES (?, ?, ?)')
    .run(nom, commission_pourcentage, couleur || '#3b82f6');
  res.status(201).json({ id: resultat.lastInsertRowid });
});

router.put('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;
  const { nom, commission_pourcentage, couleur } = req.body;
  db.prepare('UPDATE grades SET nom = ?, commission_pourcentage = ?, couleur = ? WHERE id = ?').run(
    nom,
    commission_pourcentage,
    couleur,
    id
  );
  res.json({ ok: true });
});

router.delete('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;
  const utilise = db.prepare('SELECT COUNT(*) as c FROM employes WHERE grade_id = ?').get(id);
  if (utilise.c > 0) {
    return res.status(409).json({ erreur: 'Ce grade est utilisé par des employés, impossible de le supprimer' });
  }
  db.prepare('DELETE FROM grades WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
