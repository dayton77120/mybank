const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = "argent.json";

/* ---------- Utils ---------- */

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ accounts: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-8);
}

/* ---------- API ---------- */

// LOGIN
app.post("/api/login", (req, res) => {
  const { card, password } = req.body;
  const data = loadData();

  let account = data.accounts.find(a => a.card === card);

  // Création compte si inexistant
  if (!account) {
    const tempPassword = generateTempPassword();
    account = {
      card,
      password: tempPassword,
      balance: 1000,
      history: [`Compte créé – mot de passe temporaire : ${tempPassword}`]
    };
    data.accounts.push(account);
    saveData(data);

    return res.json({
      new: true,
      tempPassword
    });
  }

  // Vérification mot de passe
  if (account.password !== password) {
    return res.status(401).json({ error: "WRONG_PASSWORD" });
  }

  res.json({
    card: account.card,
    balance: account.balance,
    history: account.history
  });
});

// TRANSFERT
app.post("/api/send", (req, res) => {
  const { from, to, amount } = req.body;
  const data = loadData();

  const sender = data.accounts.find(a => a.card === from);
  const receiver = data.accounts.find(a => a.card === to);

  if (!sender || !receiver) {
    return res.status(400).json({ error: "CARD_NOT_FOUND" });
  }

  if (sender.balance < amount) {
    return res.status(400).json({ error: "INSUFFICIENT_FUNDS" });
  }

  sender.balance -= amount;
  receiver.balance += amount;

  sender.history.push(`Envoyé ${amount} ₳ → ${to}`);
  receiver.history.push(`Reçu ${amount} ₳ ← ${from}`);

  saveData(data);
  res.json({ success: true });
});

// PAGE CREATE
app.get("/create", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "create.html"));
});

app.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});
