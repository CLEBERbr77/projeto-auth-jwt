const express = require("express");
require("dotenv").config();


const routes = require("./routes");

const server = express();


server.use(express.json());
server.use(express.urlencoded({ extended: true }));


server.use(routes);

const PORT = process.env.PORT || 3004;

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});