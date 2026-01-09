const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const FILE = "argent.json";

function read(){
  return JSON.parse(fs.readFileSync(FILE,"utf8"));
}
function write(d){
  fs.writeFileSync(FILE, JSON.stringify(d,null,2));
}

app.post("/login",(req,res)=>{
  const data = read();
  const c = data[req.body.card];
  if(!c || c.password !== req.body.password)
    return res.status(403).end();
  res.json(c);
});

app.post("/transfer",(req,res)=>{
  const d = read();
  const {from,to,amount} = req.body;
  if(!d[from] || !d[to] || d[from].balance < amount)
    return res.status(400).end();
  d[from].balance -= amount;
  d[to].balance += amount;
  d[from].history.push(`-${amount}€ → ${to}`);
  d[to].history.push(`+${amount}€ ← ${from}`);
  write(d);
  res.end();
});

app.post("/admin/create",(req,res)=>{
  const d = read();
  const card = Math.floor(100000+Math.random()*900000).toString();
  d[card] = { balance:0, password:"0000", history:[] };
  write(d);
  res.send("Carte créée : "+card+" | mdp: 0000");
});

app.get("/admin/cards",(req,res)=>{
  res.json(read());
});

app.listen(3000,()=>console.log("OK http://localhost:3000"));
