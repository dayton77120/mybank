const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = "argent.json";
const LINKS_FILE = "links.json";

/* =========================
   INIT DES FICHIERS (RENDER)
   ========================= */

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        accounts: [
          {
            card: "VX-216267",
            password: "1234",
            balance: 1000000000000,
            history: []
          }
        ]
      },
      null,
      2
    )
  );
}

if (!fs.existsSync(LINKS_FILE)) {
  fs.writeFileSync(LINKS_FILE, JSON.stringify({}, null, 2));
}

/* =========================
   HELPERS
   ========================= */

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function readLinks() {
  return JSON.parse(fs.readFileSync(LINKS_FILE));
}

function saveLinks(data) {
  fs.writeFileSync(LINKS_FILE, JSON.stringify(data, null, 2));
}

/* =========================
   API COMPTES
   ========================= */

// Connexion
app.post("/api/login", (req, res) => {
  const { card, password } = req.body;
  const data = readData();

  const account = data.accounts.find(
    a => a.card === card && a.password === password
  );

  if (!account) {
    return res.status(401).json({ error: "Carte ou mot de passe invalide" });
  }

  res.json({
    card: account.card,
    balance: account.balance,
    history: account.history
  });
});

// Envoyer de l'argent
app.post("/api/send", (req, res) => {
  const { from, to, amount } = req.body;
  const data = readData();

  const sender = data.accounts.find(a => a.card === from);
  const receiver = data.accounts.find(a => a.card === to);

  if (!sender || !receiver) {
    return res.status(404).json({ error: "Carte introuvable" });
  }

  if (sender.balance < amount) {
    return res.status(400).json({ error: "Solde insuffisant" });
  }

  sender.balance -= amount;
  receiver.balance += amount;

  sender.history.push(`- ${amount} ₳ vers ${to}`);
  receiver.history.push(`+ ${amount} ₳ de ${from}`);

  saveData(data);
  res.json({ success: true });
});

/* =========================
   LIENS DE PAIEMENT
   ========================= */

// Créer un lien
app.post("/api/create-link", (req, res) => {
  const { card, amount } = req.body;
  const links = readLinks();

  const id = Math.random().toString(36).substring(2, 10);

  links[id] = {
    card,
    amount,
    paid: false
  };

  saveLinks(links);
  res.json({ link: `/pay/${id}` });
});

// Payer via lien
app.post("/api/pay/:id", (req, res) => {
  const links = readLinks();
  const data = readData();

  const link = links[req.params.id];
  if (!link || link.paid) {
    return res.status(404).json({ error: "Lien invalide" });
  }

  const account = data.accounts.find(a => a.card === link.card);
  if (!account) {
    return res.status(404).json({ error: "Compte introuvable" });
  }

  account.balance += link.amount;
  account.history.push(`+ ${link.amount} ₳ (paiement lien)`);

  link.paid = true;

  saveData(data);
  saveLinks(links);

  res.json({ success: true });
});

/* =========================
   ROUTES PAGES
   ========================= */

app.get("/create", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "create.html"));
});

app.get("/pay/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pay.html"));
});

/* =========================
   START
   ========================= */

app.listen(PORT, () => {
  console.log("✅ Serveur lancé sur le port", PORT);
});
