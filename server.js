const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = "./argent.json";

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

/* ---------- Routes ---------- */
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", (req, res) => {
  const { card, password } = req.body;

  if (!card || !password) {
    return res.status(400).json({ error: "Missing data" });
  }

  const data = loadData();
  let account = data.accounts.find(a => a.card === card);

  // 🟢 SI LE COMPTE N’EXISTE PAS → ON LE CRÉE
  if (!account) {
    account = {
      card,
      password,
      balance: 1000,
      history: []
    };

    data.accounts.push(account);
    saveData(data);

    return res.json({
      new: true,
      balance: account.balance,
      tempPassword: password
    });
  }

  // 🔴 MAUVAIS MOT DE PASSE
  if (account.password !== password) {
    return res.status(401).json({ error: "Wrong password" });
  }

  // ✅ CONNEXION OK
  res.json({
    new: false,
    balance: account.balance,
    history: account.history
  });
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
