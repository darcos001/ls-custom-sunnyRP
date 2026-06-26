const express = require('express');
const db = require('../db');
const { verifierToken, exigerAdmin } = require('../auth');

const router = express.Router();
router.use(verifierToken);

router.get('/', (req, res) => {
  const { type } = req.query;
  let items;
  if (type) {
    items = db
      .prepare('SELECT * FROM catalogue WHERE actif = 1 AND type = ? ORDER BY nom')
      .all(type);
  } else {
    items = db.prepare('SELECT * FROM catalogue WHERE actif = 1 ORDER BY type, nom').all();
  }
  res.json(items);
});

router.post('/', exigerAdmin, (req, res) => {
  const { nom, type, prix, cout_materiel } = req.body;
  if (!nom || !type || prix === undefined) {
    return res.status(400).json({ erreur: 'Nom, type et prix requis' });
  }
  const resultat = db
    .prepare('INSERT INTO catalogue (nom, type, prix, cout_materiel) VALUES (?, ?, ?, ?)')
    .run(nom, type, prix, cout_materiel || 0);
  res.status(201).json({ id: resultat.lastInsertRowid });
});

router.put('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;
  const { nom, type, prix, cout_materiel, actif } = req.body;
  db.prepare(
    'UPDATE catalogue SET nom = ?, type = ?, prix = ?, cout_materiel = ?, actif = ? WHERE id = ?'
  ).run(nom, type, prix, cout_materiel, actif === undefined ? 1 : actif ? 1 : 0, id);
  res.json({ ok: true });
});

router.delete('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;
  // On désactive plutôt que supprimer, pour garder l'historique cohérent
  db.prepare('UPDATE catalogue SET actif = 0 WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
