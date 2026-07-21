const express = require('express');
const db = require('../db');
const { verifierToken, exigerAdmin } = require('../auth');

const router = express.Router();
router.use(verifierToken);
router.use(exigerAdmin);

router.get('/', (req, res) => {
  const lignes = db
    .prepare(
      `SELECT d.*, e.nom_affiche AS employe_nom FROM depenses d
       LEFT JOIN employes e ON e.id = d.employe_id
       ORDER BY d.date_creation DESC`
    )
    .all();
  const total = lignes.reduce((s, d) => s + d.montant, 0);
  res.json({ depenses: lignes, total: Math.round(total * 100) / 100 });
});

router.post('/', (req, res) => {
  const { description, montant, categorie } = req.body;
  if (!description || !description.trim() || montant === undefined || montant === null || montant === '') {
    return res.status(400).json({ erreur: 'Description et montant sont obligatoires' });
  }
  const resultat = db
    .prepare('INSERT INTO depenses (description, montant, categorie, employe_id) VALUES (?, ?, ?, ?)')
    .run(description.trim(), Number(montant), categorie || null, req.utilisateur.id);
  res.status(201).json({ id: resultat.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM depenses WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
