const express = require("express");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs"); // 1. Corrigido para bcryptjs

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

const FILE_PATH = path.join(__dirname, "users.json");

// 2. Corrigido o nome da função (sem o 'l' extra)
function readUsersFromFile() {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
        return [];
    }
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(data);
}

function saveUsersToFile(users) {
    // 3. Corrigido para JSON.stringify em maiúsculas
    fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2));
}

// Inicialização correta da variável global 'users'
let users = readUsersFromFile();

// ------------------------------------------------------------------
// ROTAS
// ------------------------------------------------------------------

server.get("/users", (req, res) => {
    users = readUsersFromFile();
    console.log("GET :: /users", users);
    return res.json(users);
});

server.get("/users/:id", (req, res) => {
    users = readUsersFromFile();
    const id = parseInt(req.params.id);
    const user = users.find((item) => item.id === id);

    if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
    }

    console.log("GET :: /users/:id", user, JSON.stringify(user));
    return res.status(200).json(user);
});

server.post("/users", (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "O body da requisição está vazio ou mal formatado" });
    }

    const { name, site } = req.body;

    if (!name || !site) {
        return res.status(400).json({ error: "Nome e site são obrigatórios!" });
    }

    users = readUsersFromFile();

    const id = users.length > 0 ? users[users.length - 1].id + 1 : 1;
    const newUser = { id, name, site };

    users.push(newUser);
    saveUsersToFile(users);

    return res.status(201).json(newUser);
});

server.put("/users:id" , (req , res) => {
     if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "O body da requisição está vazio ou mal formatado" });
    }
    const id = parseint(req.params.id);
    users = readUsersFromFile();

    const useIndex = users.findIndex((item) => item.id === id);

    if (userIndex === -1){
        return res.status(404).json({error : "usuario nao encontrado para atualizacao"});

    }

    const { name , site } = req.body;

    if (index >= 0) {
        users[index] = { id: parseInt(id), name, site };
    }

    return res.status(200).json(users[index]);



});

server.delete("/users/:id", (req, res) => {
    const id = parseInt(req.params.id);
    users = readUsersFromFile();

    const userIndex = users.findIndex((item) => item.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ error: "Usuário não encontrado para remoção" });
    }

    // Remove o usuário do array
    const deletedUser = users.splice(userIndex, 1);
    saveUsersToFile(users);

    console.log("DELETE :: /users/:id", deletedUser[0]);
    return res.status(200).json({ message: "Usuário removido com sucesso", user: deletedUser[0] });

});

const PORT = process.env.PORT || 3004;

// 4. Corrigido para usar a variável PORT
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});