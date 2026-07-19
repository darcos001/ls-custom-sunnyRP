const express = require('express');
const db = require('../db');
const { verifierToken, exigerAdmin } = require('../auth');

const router = express.Router();
router.use(verifierToken);

router.get('/', (req, res) => {
  const contrat = db.prepare('SELECT * FROM contrat_travail WHERE id = 1').get();
  const maSignature = db
    .prepare('SELECT * FROM signatures_contrat WHERE employe_id = ? ORDER BY version DESC LIMIT 1')
    .get(req.utilisateur.id);

  res.json({
    contenu: contrat.contenu,
    version: contrat.version,
    ma_signature:
      maSignature && maSignature.version === contrat.version
        ? { date_signature: maSignature.date_signature }
        : null,
  });
});

router.get('/signatures', exigerAdmin, (req, res) => {
  const contrat = db.prepare('SELECT * FROM contrat_travail WHERE id = 1').get();
  const employes = db.prepare('SELECT id, nom_affiche FROM employes ORDER BY nom_affiche').all();

  const resultat = employes.map((emp) => {
    const signature = db
      .prepare('SELECT * FROM signatures_contrat WHERE employe_id = ? ORDER BY version DESC LIMIT 1')
      .get(emp.id);
    const aSigne = signature && signature.version === contrat.version;
    return {
      employe_id: emp.id,
      nom_affiche: emp.nom_affiche,
      a_signe: !!aSigne,
      date_signature: aSigne ? signature.date_signature : null,
    };
  });

  res.json({ version: contrat.version, employes: resultat });
});

router.put('/', exigerAdmin, (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim()) {
    return res.status(400).json({ erreur: 'Le contenu du contrat ne peut pas être vide' });
  }
  db.prepare(
    "UPDATE contrat_travail SET contenu = ?, version = version + 1, date_modif = datetime('now') WHERE id = 1"
  ).run(contenu);
  const contrat = db.prepare('SELECT * FROM contrat_travail WHERE id = 1').get();
  res.json({ ok: true, version: contrat.version });
});

router.post('/signer', (req, res) => {
  const contrat = db.prepare('SELECT * FROM contrat_travail WHERE id = 1').get();
  const dejaSigne = db
    .prepare('SELECT id FROM signatures_contrat WHERE employe_id = ? AND version = ?')
    .get(req.utilisateur.id, contrat.version);

  if (dejaSigne) {
    return res.status(409).json({ erreur: 'Déjà signé' });
  }

  db.prepare('INSERT INTO signatures_contrat (employe_id, version) VALUES (?, ?)').run(
    req.utilisateur.id,
    contrat.version
  );
  const signature = db
    .prepare('SELECT * FROM signatures_contrat WHERE employe_id = ? AND version = ?')
    .get(req.utilisateur.id, contrat.version);
  res.status(201).json({ ok: true, date_signature: signature.date_signature });
});

module.exports = router;
