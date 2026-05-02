require('dotenv').config();
const { expect } = require("chai");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");

// Array de rotas que necessitam de autorização
const rotasProtegidas = [
    { method: 'post', url: '/items' },
    { method: 'get', url: '/items' },
    { method: 'get', url: '/items/alerts' },
    { method: 'patch', url: '/items/1' },
    { method: 'post', url: '/movements' },
    { method: 'get', url: '/movements/1' }
];

describe("Autorização e Segurança de Rotas", () => {

    describe("Acesso Sem Token (Header Ausente)", () => {
        rotasProtegidas.forEach(rota => {
            it(`Deve rejeitar requisição sem header de Authorization: ${rota.method.toUpperCase()} ${rota.url}`, async () => {
                const resposta = await request(process.env.BASE_URL)
                [rota.method](rota.url)
                    .send({});

                expect(resposta.status).to.equal(401);
                //expect(resposta.body).to.have.property("code").equal("MISSING_TOKEN");
                expect(resposta.body).to.have.property("message");
            });
        });
    });

    describe("Acesso Com Token Inválido (String aleatória)", () => {
        rotasProtegidas.forEach(rota => {
            it(`Deve rejeitar token malformado ou falso: ${rota.method.toUpperCase()} ${rota.url}`, async () => {
                const resposta = await request(process.env.BASE_URL)
                [rota.method](rota.url)
                    .set('Authorization', 'Bearer token-super-invalido-e-falso')
                    .send({});

                expect(resposta.status).to.equal(401);
                //expect(resposta.body).to.have.property("code").equal("MISSING_TOKEN");
            });
        });
    });

    describe("Acesso Com Token Expirado", () => {
        let tokenExpirado;

        before(() => {
            // Forjamos um token legítimo, assinado com o mesmo secret da API,
            // porém que expirou há 1 hora atrás (-1h)
            const jwtSecret = process.env.JWT_SECRET || "gestao-estoque-api-secret";
            tokenExpirado = jwt.sign(
                { sub: "admin", role: "admin" },
                jwtSecret,
                { expiresIn: "-1h" } // Expirado
            );
        });

        rotasProtegidas.forEach(rota => {
            it(`Deve rejeitar token expirado: ${rota.method.toUpperCase()} ${rota.url}`, async () => {
                const resposta = await request(process.env.BASE_URL)
                [rota.method](rota.url)
                    .set('Authorization', `Bearer ${tokenExpirado}`)
                    .send({});

                expect(resposta.status).to.equal(401);
                //expect(resposta.body).to.have.property("code").equal("MISSING_TOKEN");
                expect(resposta.body).to.have.property("message");
            });
        });
    });

});
