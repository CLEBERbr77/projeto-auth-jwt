const express = require("express");
require("dotenv").config();

const server = express();

server.use(express.json());

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});