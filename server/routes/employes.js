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
    return res.status(400).json({ erreur: 'Tous les champs sont requis' });
  }

  const existe = db
    .prepare('SELECT id FROM employes WHERE identifiant = ?')
    .get(identifiant.trim().toLowerCase());
  if (existe) {
    return res.status(409).json({ erreur: 'Cet identifiant existe déjà' });
  }

  const hash = bcrypt.hashSync(mot_de_passe, 10);
  const resultat = db
    .prepare(
      `INSERT INTO employes (identifiant, mot_de_passe_hash, nom_affiche, grade_id, est_admin)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(identifiant.trim().toLowerCase(), hash, nom_affiche, grade_id, est_admin ? 1 : 0);

  res.status(201).json({ id: resultat.lastInsertRowid });
});

router.put('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;
  const { identifiant, nom_affiche, grade_id, est_admin, mot_de_passe } = req.body;

  if (!nom_affiche || !grade_id) {
    return res.status(400).json({ erreur: 'Le nom et le grade sont requis' });
  }

  if (identifiant) {
    const nouvelIdentifiant = identifiant.trim().toLowerCase();
    const dejaPris = db
      .prepare('SELECT id FROM employes WHERE identifiant = ? AND id != ?')
      .get(nouvelIdentifiant, id);
    if (dejaPris) {
      return res.status(409).json({ erreur: 'Cet identifiant est déjà utilisé par un autre compte' });
    }
    db.prepare('UPDATE employes SET identifiant = ? WHERE id = ?').run(nouvelIdentifiant, id);
  }

  db.prepare(
    'UPDATE employes SET nom_affiche = ?, grade_id = ?, est_admin = ? WHERE id = ?'
  ).run(nom_affiche, grade_id, est_admin ? 1 : 0, id);

  if (mot_de_passe) {
    const hash = bcrypt.hashSync(mot_de_passe, 10);
    db.prepare('UPDATE employes SET mot_de_passe_hash = ? WHERE id = ?').run(hash, id);
  }

  res.json({ ok: true });
});

router.delete('/:id', exigerAdmin, (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.utilisateur.id) {
    return res.status(403).json({ erreur: 'Tu ne peux pas te supprimer toi-même' });
  }

  const employe = db.prepare('SELECT id FROM employes WHERE id = ?').get(id);
  if (!employe) {
    return res.status(404).json({ erreur: 'Employé introuvable' });
  }

  const suppressionComplete = db.transaction(() => {
    db.prepare('DELETE FROM interventions WHERE employe_id = ?').run(id);
    db.prepare('DELETE FROM sessions_service WHERE employe_id = ?').run(id);
    db.prepare('DELETE FROM employes WHERE id = ?').run(id);
  });
  suppressionComplete();

  res.json({ ok: true });
});

module.exports = router;
