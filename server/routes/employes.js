const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifierToken, exigerAdmin } = require('../auth');

const router = express.Router();
router.use(verifierToken);

router.get('/', (req, res) => {
  const employes = db
    .prepare(
      `SELECT e.id, e.identifiant, e.nom_affiche, e.est_admin, e.en_service,
              g.id as grade_id, g.nom as grade_nom, g.commission_pourcentage, g.couleur
       FROM employes e
       JOIN grades g ON g.id = e.grade_id
       ORDER BY e.nom_affiche`
    )
    .all();
  res.json(employes);
});

router.get('/en-service/compte', (req, res) => {
  const r = db.prepare('SELECT COUNT(*) AS c FROM employes WHERE en_service = 1').get();
  res.json({ en_service: r.c });
});

router.post('/:id/service', (req, res) => {
  const { id } = req.params;
  const { en_service } = req.body;
  if (Number(id) !== req.utilisateur.id && !req.utilisateur.est_admin) {
    return res.status(403).json({ erreur: 'Non autorisé' });
  }
  db.prepare('UPDATE employes SET en_service = ? WHERE id = ?').run(en_service ? 1 : 0, id);
  res.json({ ok: true });
});

router.post('/', exigerAdmin, (req, res) => {
  const { identifiant, mot_de_passe, nom_affiche, grade_id, est_admin } = req.body;
  if (!identifiant || !mot_de_passe || !nom_affiche || !grade_id) {
