const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { genererToken } = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { identifiant, mot_de_passe } = req.body;
  if (!identifiant || !mot_de_passe) {
    return res.status(400).json({ erreur: 'Identifiant et mot de passe requis' });
  }

  const employe = db
    .prepare('SELECT * FROM employes WHERE identifiant = ?')
    .get(identifiant.trim().toLowerCase());

  if (!employe) {
    return res.status(401).json({ erreur: 'Identifiant ou mot de passe incorrect' });
  }

  const motDePasseValide = bcrypt.compareSync(mot_de_passe, employe.mot_de_passe_hash);
  if (!motDePasseValide) {
    return res.status(401).json({ erreur: 'Identifiant ou mot de passe incorrect' });
  }

  db.prepare('UPDATE employes SET en_service = 1 WHERE id = ?').run(employe.id);

  const token = genererToken(employe);
  const grade = db.prepare('SELECT * FROM grades WHERE id = ?').get(employe.grade_id);

  res.json({
    token,
    employe: {
      id: employe.id,
      identifiant: employe.identifiant,
      nom_affiche: employe.nom_affiche,
      est_admin: !!employe.est_admin,
      grade,
    },
  });
});

router.post('/logout', (req, res) => {
  const { employe_id } = req.body;
  if (employe_id) {
    db.prepare('UPDATE employes SET en_service = 0 WHERE id = ?').run(employe_id);
  }
  res.json({ ok: true });
});

module.exports = router;
