const { Router } = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = Router();

// Caminho para o arquivo JSON de dados
const FILE_PATH = path.join(__dirname, "data", "users.json");


// FUNÇÕES AUXILIARES DE ARQUIVO
function readUsersFromFile() {
    if (!fs.existsSync(FILE_PATH)) {
        const dir = path.dirname(FILE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
        return [];
    }
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
}

function saveUsersToFile(users) {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2));
}

//middlewares de segurança para fazer a verificaçao do login
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ error: "Formato do token inválido" });
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || "sua_chave_secreta";

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
}

function adminMiddleware(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado: privilégios de admin necessários" });
    }
    return next();
}

// ------------------------------------------------------------------
// DEFINIÇÃO DAS ROTAS
// ------------------------------------------------------------------

// POST /auth/register - Cadastro público
router.post("/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios!" });
    }

    const users = readUsersFromFile();
    if (users.find((user) => user.email === email)) {
        return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        role: "user"
    };

    users.push(newUser);
    saveUsersToFile(users);

    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
});

// POST /auth/login - Login público
router.post("/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios!" });
    }

    const users = readUsersFromFile();
    const user = users.find((u) => u.email === email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const secret = process.env.JWT_SECRET || "sua_chave_secreta";
    const expiresIn = process.env.JWT_EXPIRES_IN || "8h";

    const token = jwt.sign(payload, secret, { expiresIn });

    return res.status(200).json({ token, user: payload });
});

// GET /profile - Rota protegida por autenticação
router.get("/profile", authMiddleware, (req, res) => {
    return res.status(200).json(req.user);
});

// GET /admin/users - Rota protegida por autenticação + autorização admin
router.get("/admin/users", authMiddleware, adminMiddleware, (req, res) => {
    const users = readUsersFromFile();
    const safeUsers = users.map(({ password, ...user }) => user);
    return res.status(200).json(safeUsers);
});

// Exporta as rotas
module.exports = router;
