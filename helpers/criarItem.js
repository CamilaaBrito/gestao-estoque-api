const request = require("supertest");
const { gerarItemAleatorio } = require("./itemFactory");

async function criarItem(token, bodyItem) {
    const payload = bodyItem || gerarItemAleatorio();
    
    const resposta = await request(process.env.BASE_URL)
        .post("/items")
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
    
    return resposta.body;
}

module.exports = { criarItem };
