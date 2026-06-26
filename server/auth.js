const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change_moi_en_production';

function genererToken(employe) {
  return jwt.sign(
    {
      id: employe.id,
      identifiant: employe.identifiant,
      nom_affiche: employe.nom_affiche,
      grade_id: employe.grade_id,
      est_admin: employe.est_admin,
    },
    SECRET,
    { expiresIn: '7d' }
  );
}

function verifierToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ erreur: 'Connexion requise' });

  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, SECRET);
    req.utilisateur = payload;
    next();
  } catch (e) {
    return res.status(401).json({ erreur: 'Session invalide, reconnecte-toi' });
  }
}

function exigerAdmin(req, res, next) {
  if (!req.utilisateur || !req.utilisateur.est_admin) {
    return res.status(403).json({ erreur: 'Accès réservé aux administrateurs' });
  }
  next();
}

module.exports = { genererToken, verifierToken, exigerAdmin, SECRET };
