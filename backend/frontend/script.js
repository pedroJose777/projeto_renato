// URL correta do Backend:
// script.js ou no HTML
const API = "https://shiny-rotary-phone-7vxr4qqgw4q4f45-3000.app.github.dev/api";











// ======================================
// LOGIN
// ======================================
async function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const msg = document.getElementById("mensagem");

  msg.textContent = "";

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    const json = await res.json();

    if (!res.ok) {
      msg.textContent = json.error;
      return;
    }

    localStorage.setItem("token", json.token);
    window.location.href = "inicio.html";

  } catch (e) {
    msg.textContent = "Erro de conexão.";
  }
}


// ======================================
// CADASTRO
// ======================================
async function criarConta() {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const msg = document.getElementById("mensagem");

  msg.textContent = "";

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha })
    });

    const json = await res.json();

    if (!res.ok) {
      msg.textContent = json.error;
      return;
    }

    alert("Conta criada com sucesso!");
    window.location.href = "index.html";

  } catch (e) {
    msg.textContent = "Erro de conexão.";
  }
}


// ======================================
// PROTEGER A TELA DE INÍCIO
// ======================================
async function carregarPerfil() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  try {
    const res = await fetch(`${API}/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return;
    }

    const json = await res.json();
    document.getElementById("user-info").textContent =
      `Olá, ${json.user.nome}!`;

  } catch {
    window.location.href = "index.html";
  }
}


// Executa automaticamente quando estiver no início
if (window.location.pathname.includes("inicio.html")) {
  carregarPerfil();
}


// ======================================
// LOGOUT
// ======================================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
