const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifierToken, SECRET } = require('../auth');

const router = express.Router();

const TAUX_HORAIRE = 100;

function debutSemaineISO() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function calculerHeures(sessions) {
  let totalMs = 0;
  const maintenant = Date.now();
  for (const s of sessions) {
    const debut = new Date(s.debut).getTime();
    const fin = s.fin ? new Date(s.fin).getTime() : maintenant;
    totalMs += Math.max(0, fin - debut);
  }
  return totalMs / (1000 * 60 * 60);
}

function terminerSessionPourEmploye(employeId) {
  const enCours = db
    .prepare('SELECT id FROM sessions_service WHERE employe_id = ? AND fin IS NULL')
    .get(employeId);
  if (enCours) {
    db.prepare("UPDATE sessions_service SET fin = datetime('now') WHERE id = ?").run(enCours.id);
  }
  db.prepare('UPDATE employes SET en_service = 0 WHERE id = ?').run(employeId);
}

router.post('/fin-beacon', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).end();
  try {
    const payload = jwt.verify(token, SECRET);
    terminerSessionPourEmploye(payload.id);
    res.status(204).end();
  } catch (e) {
    res.status(401).end();
  }
});

router.use(verifierToken);

router.post('/debut', (req, res) => {
  const employeId = req.utilisateur.id;

  const enCours = db
    .prepare('SELECT id FROM sessions_service WHERE employe_id = ? AND fin IS NULL')
    .get(employeId);

  if (enCours) {
    db.prepare("UPDATE sessions_service SET fin = datetime('now') WHERE id = ?").run(enCours.id);
  }

  db.prepare('INSERT INTO sessions_service (employe_id) VALUES (?)').run(employeId);
  db.prepare('UPDATE employes SET en_service = 1 WHERE id = ?').run(employeId);
  res.status(201).json({ ok: true });
});

router.post('/fin', (req, res) => {
  terminerSessionPourEmploye(req.utilisateur.id);
  res.json({ ok: true });
});

router.get('/moi', (req, res) => {
  const employeId = req.utilisateur.id;

  const toutes = db
    .prepare('SELECT * FROM sessions_service WHERE employe_id = ? ORDER BY debut DESC')
    .all(employeId);

  const semaine = toutes.filter((s) => s.debut >= debutSemaineISO());

  const heuresSemaine = calculerHeures(semaine);
  const heuresTotal = calculerHeures(toutes);

  res.json({
    sessions: toutes.slice(0, 30),
    en_service: toutes.some((s) => !s.fin),
    heures_semaine: heuresSemaine,
    montant_semaine: Math.round(heuresSemaine * TAUX_HORAIRE * 100) / 100,
    heures_total: heuresTotal,
    montant_total: Math.round(heuresTotal * TAUX_HORAIRE * 100) / 100,
    taux_horaire: TAUX_HORAIRE,
  });
});

router.get('/equipe', (req, res) => {
  if (!req.utilisateur.est_admin) {
    return res.status(403).json({ erreur: 'Accès réservé aux administrateurs' });
  }

  const employes = db.prepare('SELECT id, nom_affiche FROM employes ORDER BY nom_affiche').all();
  const debutSemaine = debutSemaineISO();

  const resultat = employes.map((emp) => {
    const toutes = db
      .prepare('SELECT * FROM sessions_service WHERE employe_id = ? ORDER BY debut DESC')
      .all(emp.id);
    const semaine = toutes.filter((s) => s.debut >= debutSemaine);
    const heuresSemaine = calculerHeures(semaine);
    const heuresTotal = calculerHeures(toutes);

    return {
      employe_id: emp.id,
      nom_affiche: emp.nom_affiche,
      en_service: toutes.some((s) => !s.fin),
      heures_semaine: heuresSemaine,
      montant_semaine: Math.round(heuresSemaine * TAUX_HORAIRE * 100) / 100,
      heures_total: heuresTotal,
      montant_total: Math.round(heuresTotal * TAUX_HORAIRE * 100) / 100,
    };
  });

  res.json({ employes: resultat, taux_horaire: TAUX_HORAIRE });
});

module.exports = router;
