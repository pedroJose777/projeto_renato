
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { rmSync } = require('fs');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'troque_esta_chave';

// === SQLite ===
const DBSOURCE = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
  console.log('Conectado ao SQLite.');
});

// cria tabela se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT UNIQUE,
    senha TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// helpers com promises
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      err ? reject(err) : resolve(row);
    });
  });

// === ROTAS ===

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ error: 'Dados incompletos' });

    if (senha.length < 6)
      return res
        .status(400)
        .json({ error: 'Senha precisa ter no mínimo 6 caracteres' });

    const hash = await bcrypt.hash(senha, 10);

    await run(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hash]
    );

    res.json({ message: 'Conta criada com sucesso' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: usuarios.email'))
      return res.status(409).json({ error: 'Email já cadastrado' });

    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha)
      return res.status(400).json({ error: 'Dados incompletos' });

    const user = await get('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ message: 'Login OK', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// rota protegida
app.get('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ error: 'Sem autorização' });

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: payload });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

//app.get('/', (req, res) => {
  //res.send('Rota de perfil protegida');
//});
// start server
app.listen(PORT, () =>
  console.log(`Backend (SQLite) rodando na porta ${PORT}`)
); 