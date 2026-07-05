const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.sqlite'));
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

CREATE TABLE IF NOT EXISTS sessions_service (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employe_id INTEGER NOT NULL,
  debut TEXT NOT NULL DEFAULT (datetime('now')),
  fin TEXT,
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

db.prepare('INSERT OR IGNORE INTO parametres_paie (id, date_reset) VALUES (1, NULL)').run();

const nbGrades = db.prepare('SELECT COUNT(*) AS c FROM grades').get().c;
if (nbGrades === 0) {
  const insertGrade = db.prepare('INSERT INTO grades (nom, commission_pourcentage, couleur) VALUES (?, ?, ?)');
  insertGrade.run('Mécano Apprenti', 40, '#22c55e');
  insertGrade.run('Mécano Confirmé', 55, '#3b82f6');
  insertGrade.run('Chef Mécano', 65, '#a855f7');
  insertGrade.run('Patron', 100, '#f59e0b');
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
