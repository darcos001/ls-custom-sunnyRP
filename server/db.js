const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// IMPORTANT : DATA_DIR doit pointer vers un VOLUME PERSISTANT sur Railway
// (Settings > Volumes > Mount Path, ex: /app/data), sinon la base est
// effacée à chaque redéploiement car le code (et donc server/data.sqlite)
// est reconstruit à neuf à chaque déploiement.
const DATA_DIR = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'data.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE,
  commission_pourcentage REAL NOT NULL DEFAULT 0,
  couleur TEXT DEFAULT '#3b82f6'
);

CREATE TABLE IF NOT EXISTS employes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifiant TEXT NOT NULL UNIQUE,
  mot_de_passe_hash TEXT NOT NULL,
  nom_affiche TEXT NOT NULL,
  grade_id INTEGER NOT NULL,
  est_admin INTEGER NOT NULL DEFAULT 0,
  en_service INTEGER NOT NULL DEFAULT 0,
  date_creation TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (grade_id) REFERENCES grades(id)
);

CREATE TABLE IF NOT EXISTS catalogue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('reparation','custom')),
  prix REAL NOT NULL,
  cout_materiel REAL NOT NULL DEFAULT 0,
  actif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS contrats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  prix_reparation REAL,
  prix_kit REAL,
  actif INTEGER NOT NULL DEFAULT 1,
  date_creation TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interventions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('reparation','custom')),
  catalogue_id INTEGER,
  contrat_id INTEGER,
  nom_prestation TEXT NOT NULL,
  plaque TEXT NOT NULL,
  marque_vehicule TEXT NOT NULL,
  nom_client TEXT NOT NULL,
  employe_id INTEGER NOT NULL,
  prix REAL NOT NULL,
  cout_materiel REAL NOT NULL DEFAULT 0,
  commission_montant REAL NOT NULL DEFAULT 0,
  benefice REAL NOT NULL DEFAULT 0,
  quantite INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  date_creation TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (employe_id) REFERENCES employes(id),
  FOREIGN KEY (catalogue_id) REFERENCES catalogue(id),
  FOREIGN KEY (contrat_id) REFERENCES contrats(id)
);

CREATE TABLE IF NOT EXISTS marques_vehicules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE COLLATE NOCASE,
  date_creation TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parametres_paie (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  date_reset TEXT
);

CREATE TABLE IF NOT EXISTS contrat_travail (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  contenu TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  date_modif TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS signatures_contrat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employe_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  date_signature TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (employe_id) REFERENCES employes(id)
);

CREATE TABLE IF NOT EXISTS sessions_service (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employe_id INTEGER NOT NULL,
  debut TEXT NOT NULL DEFAULT (datetime('now')),
  fin TEXT,
  derniere_activite TEXT DEFAULT (datetime('now')),
  fin_automatique INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (employe_id) REFERENCES employes(id)
);
`);

// --- Migration : ajoute les colonnes de prix si la base existait déjà avant leur ajout ---
const colonnesContrats = db.prepare("PRAGMA table_info(contrats)").all();
if (!colonnesContrats.some((c) => c.name === 'prix_reparation')) {
  db.exec('ALTER TABLE contrats ADD COLUMN prix_reparation REAL');
}
if (!colonnesContrats.some((c) => c.name === 'prix_kit')) {
  db.exec('ALTER TABLE contrats ADD COLUMN prix_kit REAL');
}

const colonnesInterventions = db.prepare("PRAGMA table_info(interventions)").all();
if (!colonnesInterventions.some((c) => c.name === 'quantite')) {
  db.exec('ALTER TABLE interventions ADD COLUMN quantite INTEGER NOT NULL DEFAULT 1');
}

const colonnesSessions = db.prepare("PRAGMA table_info(sessions_service)").all();
if (!colonnesSessions.some((c) => c.name === 'derniere_activite')) {
  // SQLite interdit un DEFAULT non-constant (comme datetime('now')) sur ALTER TABLE ADD COLUMN,
  // donc on ajoute la colonne sans DEFAULT puis on la remplit juste après.
  db.exec('ALTER TABLE sessions_service ADD COLUMN derniere_activite TEXT');
  db.exec('UPDATE sessions_service SET derniere_activite = debut WHERE derniere_activite IS NULL');
}
if (!colonnesSessions.some((c) => c.name === 'fin_automatique')) {
  db.exec('ALTER TABLE sessions_service ADD COLUMN fin_automatique INTEGER NOT NULL DEFAULT 0');
}

db.prepare('INSERT OR IGNORE INTO parametres_paie (id, date_reset) VALUES (1, NULL)').run();

const contratExiste = db.prepare('SELECT id FROM contrat_travail WHERE id = 1').get();
if (!contratExiste) {
  const contratParDefaut = `CONTRAT DE TRAVAIL — LS CUSTOM

Entre LS Custom, ci-après désigné "l'employeur", et l'employé signataire, ci-après désigné "l'employé", il est convenu ce qui suit :

Article 1 — Fonction
L'employé est engagé en tant que mécanicien au sein du garage LS Custom, selon le grade qui lui est attribué.

Article 2 — Rémunération
L'employé perçoit une commission sur chaque réparation, custom et vente de kit qu'il réalise, selon le pourcentage associé à son grade. Une rémunération horaire s'ajoute pour le temps de service badgé.

Article 3 — Badgeuse et présence
L'employé s'engage à badger son entrée et sa sortie de service de manière honnête, en étant réellement présent et actif durant les heures déclarées.

Article 4 — Confidentialité
L'employé s'engage à ne pas divulguer les informations internes du garage (prix, contrats clients, données financières) à des tiers non autorisés.

Article 5 — Conduite
L'employé s'engage à respecter les autres membres de l'équipe et les clients, et à représenter le garage LS Custom de manière professionnelle.

En signant ce contrat, l'employé reconnaît avoir lu et accepté l'ensemble des conditions ci-dessus.`;

  db.prepare('INSERT INTO contrat_travail (id, contenu, version) VALUES (1, ?, 1)').run(contratParDefaut);
}

const nbGrades = db.prepare('SELECT COUNT(*) AS c FROM grades').get().c;
if (nbGrades === 0) {
  const insertGrade = db.prepare('INSERT INTO grades (nom, commission_pourcentage, couleur) VALUES (?, ?, ?)');
  insertGrade.run('Apprenti', 35, '#22c55e');
  insertGrade.run('Mecano', 40, '#0ea5e9');
  insertGrade.run('Mecano confirmé', 45, '#3b82f6');
  insertGrade.run("Chef d'équipe", 55, '#a855f7');
  insertGrade.run('Assistant Patron', 65, '#ec4899');
  insertGrade.run('Patron', 100, '#f59e0b');
}

// --- Migration : met à jour les grades existants vers la nouvelle grille de commissions ---
const renommagesGrades = [
  { ancien: 'Mécano Apprenti', nouveau: 'Apprenti', pourcentage: 35 },
  { ancien: 'Mécano Confirmé', nouveau: 'Mecano confirmé', pourcentage: 45 },
  { ancien: 'Chef Mécano', nouveau: "Chef d'équipe", pourcentage: 55 },
];
for (const r of renommagesGrades) {
  db.prepare('UPDATE grades SET nom = ?, commission_pourcentage = ? WHERE nom = ?').run(r.nouveau, r.pourcentage, r.ancien);
}
const nouveauxGradesAAjouter = [
  { nom: 'Mecano', pourcentage: 40, couleur: '#0ea5e9' },
  { nom: 'Assistant Patron', pourcentage: 65, couleur: '#ec4899' },
];
for (const g of nouveauxGradesAAjouter) {
  const existe = db.prepare('SELECT id FROM grades WHERE nom = ?').get(g.nom);
  if (!existe) {
    db.prepare('INSERT INTO grades (nom, commission_pourcentage, couleur) VALUES (?, ?, ?)').run(g.nom, g.pourcentage, g.couleur);
  }
}

const nbEmployes = db.prepare('SELECT COUNT(*) AS c FROM employes').get().c;
if (nbEmployes === 0) {
  const grade = db.prepare('SELECT id FROM grades WHERE nom = ?').get('Patron');
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO employes (identifiant, mot_de_passe_hash, nom_affiche, grade_id, est_admin) VALUES (?, ?, ?, ?, 1)`)
    .run('admin', hash, 'Administrateur', grade.id);
  console.log('>> Compte admin créé : identifiant="admin" mot de passe="admin123" (à changer !)');
}

module.exports = db;
