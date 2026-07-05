const express = require('express');
const db = require('../db');
const { verifierToken, exigerAdmin } = require('../auth');

const router = express.Router();
router.use(verifierToken);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM marques_vehicules ORDER BY nom').all());
});

router.post('/', (req, res) => {
  const { nom } = req.body;
  if (!nom || !nom.trim()) return res.status(400).json({ erreur: 'Le nom de la marque est obligatoire' });
  try {
    const resultat = db.prepare('INSERT OR IGNORE INTO marques_vehicules (nom) VALUES (?)').run(nom.trim());
    const ligne = db.prepare('SELECT * FROM marques_vehicules WHERE nom = ?').get(nom.trim());
    res.status(201).json(ligne);
  } catch (e) {
    res.status(400).json({ erreur: e.message });
  }
});

router.delete('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM marques_vehicules WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
