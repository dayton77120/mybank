const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = "./argent.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Générer mot de passe temporaire
function generateTempPassword() {
  return Math.random().toString(36).slice(-8);
}

// LOGIN
app.post("/login", (req, res) => {
  const { card, password } = req.body;
  const data = loadData();
  const acc = data[card];

  if (!acc) return res.status(404).send("CARD_NOT_FOUND");

  if (acc.tempPassword) {
    if (password !== acc.tempPassword)
      return res.status(403).send("WRONG_PASSWORD");
    return res.json({ first: true });
  }

  if (acc.password !== password)
    return res.status(403).send("WRONG_PASSWORD");

  res.json(acc);
});

// SET NEW PASSWORD
app.post("/set-password", (req, res) => {
  const { card, password } = req.body;
  const data = loadData();
  if (!data[card]) return res.status(404).send("CARD_NOT_FOUND");

  data[card].password = password;
  data[card].tempPassword = null;

  saveData(data);
  res.send("OK");
});

// TRANSFER
app.post("/transfer", (req, res) => {
  const { from, to, amount } = req.body;
  const data = loadData();

  if (!data[from] || !data[to]) return res.status(404).send("CARD_NOT_FOUND");
  if (amount <= 0) return res.status(400).send("INVALID_AMOUNT");
  if (data[from].balance < amount) return res.status(400).send("NO_MONEY");

  data[from].balance -= amount;
  data[to].balance += amount;

  data[from].history.push(`-${amount}€ → ${to}`);
  data[to].history.push(`+${amount}€ ← ${from}`);

  saveData(data);
  res.send("OK");
});

// RECHARGE
app.post("/recharge", (req, res) => {
  const { card, amount } = req.body;
  const data = loadData();
  if (!data[card]) return res.status(404).send("CARD_NOT_FOUND");

  data[card].balance += Number(amount);
  data[card].history.push(`+${amount}€ recharge admin`);

  saveData(data);
  res.send("OK");
});

// CREATE CARD WITH TEMP PASSWORD
app.post("/create", (req, res) => {
  const { balance } = req.body;
  const data = loadData();

  const card = "VX-" + Math.floor(100000 + Math.random() * 900000);
  const tempPassword = generateTempPassword();

  data[card] = {
    card,
    balance: Number(balance || 0),
    password: null,
    tempPassword,
    history: []
  };

  saveData(data);
  res.json({ card, tempPassword });
});

// LIST CARDS (ADMIN)
app.get("/admin/cards", (req, res) => {
  const data = loadData();
  res.json(Object.values(data));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});

