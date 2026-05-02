require('dotenv').config();
const { expect } = require("chai");
const request = require("supertest");
const app = require("../src/app");
const { obterToken } = require('../helpers/autenticacao');
const { criarItem } = require("../helpers/criarItem");
const postEntradaItem = require("../fixtures/postEntradaItem.json");

describe("Movimentações", () => {
    let token;
    let itemId;

    beforeEach(async () => {
        token = await obterToken(app);

        const itemCriado = await criarItem(token);
        itemId = itemCriado.id;
    });

    describe("Registrar Entrada de Estoque (INPUT)", () => {
        it("Deve validar a entrada de saldo para itens cadastrados no estoque com justificativa de reposição", async () => {
            const movementPayload = {
                ...postEntradaItem,
                item_id: itemId,
                expiry_date: "15-09-2026"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("id");
            expect(resposta.body).to.have.property("item_id").equal(itemId);
            expect(resposta.body).to.have.property("type").equal("INPUT");
            expect(resposta.body).to.have.property("quantity").equal("10");
            expect(resposta.body).to.have.property("reason").equal("reposição");
        });

        it("Deve validar que o campo expiry_date(data de validade) é obrigatório ao dar entrada em um item", async () => {
            const movementPayload = {
                ...postEntradaItem,
                item_id: itemId
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("EXPIRY_DATE_REQUIRED");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve validar que o item_id é criado ao dar entrada em um produto", async () => {
            const movementPayload = {
                ...postEntradaItem,
                expiry_date: "15-09-2026"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_INTEGER");
        });

        it("Deve validar que a quantidade na entrada é maior que zero", async () => {
            const movementPayload = {
                ...postEntradaItem,
                item_id: itemId,
                quantity: 0,
                expiry_date: "15-09-2026"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_QUANTITY");
        });

        it("Deve validar que o preço unitário e obrigatório", async () => {
            const movementPayload = {
                ...postEntradaItem,
                item_id: itemId,
                expiry_date: "15-09-2026"
            };
            delete movementPayload.unit_price;

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("UNIT_PRICE_REQUIRED");
        });

        it("Deve validar que o preço unitário pode ser igual a zero para casos de doação", async () => {
            const movementPayload = {
                ...postEntradaItem,
                item_id: itemId,
                unit_price: 0,
                expiry_date: "15-09-2026"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("unit_price").equal("0");
        });

        it("Deve calcular o balance_after após a entrada", async () => {
            const movementPayload = {
                ...postEntradaItem,
                item_id: itemId,
                quantity: 15,
                expiry_date: "15-09-2026"
            };


            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("balance_after").equal("25");
        });

        it("Deve rejeitar data passada", async () => {
            const movementPayload = {
                ...postEntradaItem,
                item_id: itemId,
                expiry_date: "01-01-2020"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("EXPIRY_DATE_IN_THE_PAST");
        });
    });

    describe("Registrar Saída de Estoque (USAGE)", () => {
        it("Deve criar um item_id para a sáida do item", async () => {
            const movementPayload = {
                item_id: itemId,
                type: "USAGE",
                quantity: 2,
                reason: "venda"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("item_id").equal(itemId);
            expect(resposta.body).to.have.property("id");
            expect(resposta.body).to.have.property("type").equal("USAGE");
        });

        it("Deve rejeitar saída com quantidade igual a 0", async () => {
            const movementPayload = {
                item_id: itemId,
                type: "USAGE",
                quantity: 0,
                reason: "venda"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_QUANTITY");
        });

        it("Deve rejeitar saídas maiores do que a quantidade de items", async () => {
            const movementPayload = {
                item_id: itemId,
                type: "USAGE",
                quantity: 999,
                reason: "venda"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INSUFFICIENT_BALANCE");
        });

        it("Deve validar a saida sem precisar preencher o preço", async () => {
            const movementPayload = {
                item_id: itemId,
                type: "USAGE",
                quantity: 1,
                reason: "venda"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("unit_price").equal(null);
        });

        it("Deve validar que o cálculo do balance_after está correto", async () => {
            const movementPayload = {
                item_id: itemId,
                type: "USAGE",
                quantity: 4,
                reason: "venda"
            };

            const resposta = await request(process.env.BASE_URL)
                .post("/movements")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(movementPayload);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("balance_after").equal("6");
        });
    });
});
