# LS Custom — Outil de gestion / comptabilité

Application web pour gérer les réparations et customs de ton métier mécanicien sur ton serveur GTA RP.

Elle gère : la connexion par employé (avec grade et % de commission), le catalogue de prix,
l'enregistrement des réparations/customs (plaque, véhicule, client), et le calcul automatique
des commissions et bénéfices.

---

## 1. Ce qu'il te faut installer sur ton ordinateur (une seule fois)

1. **Node.js** : va sur https://nodejs.org, télécharge la version "LTS" et installe-la
   (clique "Suivant" partout, les réglages par défaut suffisent).
2. Vérifie que ça a marché : ouvre une invite de commande (Windows : touche `Windows` puis tape `cmd`,
   Mac : `Terminal`) et tape :
   ```
   node --version
   ```
   Si un numéro de version s'affiche (ex: v22.x.x), c'est bon.

Tu n'as besoin de rien d'autre pour l'instant (pas de MySQL à installer, la base de données est
un simple fichier qui se crée automatiquement).

---

## 2. Lancer le projet sur ton PC pour tester

Dans l'invite de commande, déplace-toi dans le dossier du projet (remplace le chemin par le tien) :

```
cd chemin/vers/ls-custom
```

### a) Démarrer le serveur (backend)

```
cd server
npm install
copy .env.example .env        (sur Mac/Linux : cp .env.example .env)
npm install -g nodemon        (optionnel, pour le rechargement automatique)
node index.js
```

Tu devrais voir s'afficher :
```
>> Compte admin créé : identifiant="admin" mot de passe="admin123" (à changer !)
Serveur LS Custom démarré sur le port 3001
```

**Laisse cette fenêtre ouverte.** Le serveur tourne tant que cette fenêtre est ouverte.

### b) Démarrer l'interface (frontend)

Ouvre une **deuxième** fenêtre d'invite de commande, et tape :

```
cd chemin/vers/ls-custom/client
npm install
npm run dev
```

Tu verras une adresse du type `http://localhost:5173`. Ouvre-la dans ton navigateur.

Tu arrives sur la page de connexion. Connecte-toi avec :
- **Identifiant :** `admin`
- **Mot de passe :** `admin123`

⚠️ Change ce mot de passe dès que possible (page "Équipe" une fois que tu auras ajouté
la fonctionnalité de modification, ou directement en base si besoin — dis-moi si tu veux
que je l'ajoute à l'interface).

---

## 3. Comment ça fonctionne

- **Tableau de bord** : vue d'ensemble des stats de la semaine.
- **Répas/Custom** : la page principale. Bouton "Nouvelle Réparation" / "Nouveau Custom" pour
  enregistrer une intervention (tu choisis dans le catalogue ou tu saisis librement, tu rentres
  la plaque, le véhicule, le client, le prix). La commission et le bénéfice sont calculés
  automatiquement selon le grade de la personne connectée.
- **Catalogue** : liste des prestations avec prix fixes (modifiable par un admin).
- **Équipe** : liste des employés, et création de nouveaux comptes (admin uniquement).
- **Fiches Clients** : récapitulatif automatique par client/plaque basé sur l'historique.
- **Mon profil** : tes propres statistiques (total généré, commissions perçues).
- **Contrats / Badgeuse / Mes documents** : pages prévues pour plus tard — dis-moi ce que tu
  veux qu'elles fassent exactement et je les développerai.

### Les grades et commissions

4 grades sont créés par défaut (modifiables dans la base, ou je peux ajouter une page pour ça) :
- Mécano Apprenti : 40%
- Mécano Confirmé : 55%
- Chef Mécano : 70%
- Patron : 100%

Le % s'applique sur la **marge** (prix − coût matériel). Exemple : un custom à 300$ avec 120$
de matériel pour un Mécano Apprenti (40%) :
- Marge = 300 − 120 = 180$
- Commission = 180 × 40% = 72$
- Bénéfice (pour le garage) = 180 − 72 = 108$

---

## 4. Mettre le site en ligne pour que toute l'équipe l'utilise

Une fois que tu as testé en local et que tout te convient, voici la méthode la plus simple et
gratuite pour démarrer :

1. Crée un compte sur **Railway** (https://railway.app) ou **Render** (https://render.com)
   — connexion possible avec un compte GitHub.
2. Mets ton projet sur **GitHub** (je peux te guider étape par étape quand tu seras prêt).
3. Sur Railway/Render, tu connectes ton dépôt GitHub, et la plateforme installe et démarre
   le serveur automatiquement.
4. Tu obtiens une adresse en ligne (ex: `ls-custom.up.railway.app`).
5. Si tu as un nom de domaine (comme `tsuky.ovh` dans ton exemple), tu peux le pointer vers
   cette adresse depuis les réglages DNS de ton hébergeur de domaine.

Dis-moi quand tu en es là et je te guide pas à pas pour cette partie — c'est plus simple
qu'il n'y paraît.

---

## 5. Si quelque chose ne marche pas

- **"command not found" ou "node n'est pas reconnu"** → Node.js n'est pas installé correctement,
  réinstalle-le et redémarre ton PC.
- **Le site affiche une erreur de connexion** → vérifie que la fenêtre du serveur (étape 2a)
  est toujours ouverte et n'affiche pas d'erreur rouge.
- **"Cannot find module"** → tu as oublié de lancer `npm install` dans le bon dossier.

N'hésite pas à revenir avec le message d'erreur exact si quelque chose bloque, je t'aiderai à
le résoudre.
