const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const DATA = "argent.json";
const LINKS = "links.json";

function read(){
  return JSON.parse(fs.readFileSync(DATA,"utf8"));
}
function write(d){
  fs.writeFileSync(DATA, JSON.stringify(d,null,2));
}
function readLinks(){
  return JSON.parse(fs.readFileSync(LINKS,"utf8"));
}
function writeLinks(d){
  fs.writeFileSync(LINKS, JSON.stringify(d,null,2));
}

/* USER ACTUEL (exemple) */
app.get("/me",(req,res)=>{
  const d = read();
  res.json(d.accounts[0]);
});

/* ENVOI CLASSIQUE */
app.post("/send",(req,res)=>{
  const d = read();
  const from = d.accounts[0];
  const to = d.accounts.find(a=>a.card === req.body.to);

  if(!to || from.balance < req.body.amount) return res.status(400).end();

  from.balance -= req.body.amount;
  to.balance += req.body.amount;

  from.history.push("-" + req.body.amount + "€");
  to.history.push("+" + req.body.amount + "€");

  write(d);
  res.end();
});

/* CRÉER LIEN */
app.post("/create-link",(req,res)=>{
  const links = readLinks();
  const id = Math.random().toString(36).substring(2,8);

  links[id] = {
    amount: req.body.amount,
    to: req.body.to,
    used: false
  };

  writeLinks(links);
  res.json({ link: "/pay/" + id });
});

/* INFOS LIEN */
app.get("/link/:id",(req,res)=>{
  const l = readLinks()[req.params.id];
  if(!l || l.used) return res.status(404).end();
  res.json(l);
});

/* PAYER VIA LIEN */
app.post("/pay-link",(req,res)=>{
  const links = readLinks();
  const l = links[req.body.id];
  if(!l || l.used) return res.status(400).end();

  const d = read();
  const from = d.accounts.find(a=>a.card === req.body.from);
  const to = d.accounts.find(a=>a.card === l.to);

  if(!from || !to) return res.status(400).end();
  if(from.password !== req.body.password) return res.s
