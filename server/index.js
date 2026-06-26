require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // initialise la base de données au démarrage

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/employes', require('./routes/employes'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/catalogue', require('./routes/catalogue'));
app.use('/api/interventions', require('./routes/interventions'));
app.use('/api/badgeuse', require('./routes/badgeuse'));

// En production : sert aussi le frontend déjà construit (dossier client/dist)
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur LS Custom démarré sur le port ${PORT}`);
});
