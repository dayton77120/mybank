async function login() {
  const password = document.getElementById("password").value;
  const card = localStorage.getItem("card");

  if (!card || !password) {
    alert("Erreur de données");
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Erreur de connexion");
      return;
    }

    alert("Connexion réussie ! Solde : " + data.balance + " ₳");
    // ici tu redirigeras vers le dashboard plus tard

  } catch (e) {
    alert("Impossible de contacter le serveur");
  }
}
