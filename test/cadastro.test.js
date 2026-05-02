require('dotenv').config();
const { expect } = require("chai");
const request = require("supertest");
const app = require("../src/app");
const { obterToken } = require('../helpers/autenticacao')
const postItems = require("../fixtures/postItems.json");
const { gerarItemAleatorio } = require("../helpers/itemFactory");
const { criarItem } = require("../helpers/criarItem");


describe("Cadastro de items", () => {

    let token

    beforeEach(async () => {
        token = await obterToken(app);
    });

    describe("POST /items", () => {

        it("Deve cadastrar um item ativo com todos os campos obrigatórios preenchidos", async () => {
            const bodyItem = gerarItemAleatorio();

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("id").that.is.a("number").and.is.greaterThan(0);
            expect(resposta.body).to.have.property("name");
            expect(resposta.body).to.have.property("unit_price");
            expect(resposta.body).to.have.property("total_quantity");
            expect(resposta.body).to.have.property("min_estoque");
            expect(resposta.body).to.have.property("is_active").equal(true);
        });

        it("Deve rejeitar cadastro sem preencher o campo obrigatório nome", async () => {
            const bodyItem = { ...postItems.novoItem };
            delete bodyItem.name;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_NAME");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar cadastro sem preencher o campo obrigatório unit", async () => {
            const bodyItem = { ...postItems.novoItem };
            delete bodyItem.unit;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_UNIT");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar cadastro sem preencher o campo obrigatório total_quantity", async () => {
            const bodyItem = { ...postItems.novoItem };
            delete bodyItem.total_quantity;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar cadastro sem preencher o campo obrigatório unit_price", async () => {
            const bodyItem = { ...postItems.novoItem };
            delete bodyItem.unit_price;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("UNIT_PRICE_REQUIRED");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar cadastro sem preencher o campo obrigatório expiry_lead_time", async () => {
            const bodyItem = { ...postItems.novoItem };
            delete bodyItem.expiry_lead_time;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("message");
        });

        it("Deve permitir criar um item com preço igual a zero", async () => {
            const bodyItem = gerarItemAleatorio();
            bodyItem.unit_price = 0;

            const resposta = await request(process.env.Base_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("id");
            expect(resposta.body).to.have.property("unit_price").equal("0");
            expect(resposta.body).to.have.property("name").equal(bodyItem.name);
        });

        it("Deve rejeitar datas passadas", async () => {
            const bodyItem = { ...postItems.novoItem };
            bodyItem.nearest_expiry = "01-01-2020";

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("EXPIRY_DATE_IN_THE_PAST");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar criar um item se a data for invalida", async () => {
            const bodyItem = { ...postItems.novoItem };
            bodyItem.nearest_expiry = "31-02-2030";

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_DATE");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve cadastrar item com status inativo", async () => {
            const bodyItem = gerarItemAleatorio();
            bodyItem.is_active = false;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("id");
            expect(resposta.body).to.have.property("is_active").equal(false);
            expect(resposta.body).to.have.property("name").equal(bodyItem.name);
        });

        it("Deve rejeitar criar um item com o preço negativo", async () => {
            const bodyItem = { ...postItems.novoItem };
            bodyItem.unit_price = -10;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_DECIMAL");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar cadastrar um estoque mínimo negativo", async () => {
            const bodyItem = { ...postItems.novoItem };
            bodyItem.min_estoque = -5;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_DECIMAL");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar o cadastro de nomes duplicados", async () => {
            const bodyItem = gerarItemAleatorio();

            await criarItem(token, bodyItem);

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(409);
            expect(resposta.body).to.have.property("code").equal("ITEM_ALREADY_EXISTS");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar o cadastro se o bearer token for inválido (sem autorização)", async () => {
            const bodyItem = gerarItemAleatorio();

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer token-invalido-123`)
                .send(bodyItem);

            expect(resposta.status).to.equal(401);
            expect(resposta.body).to.have.property("code").equal("INVALID_TOKEN");
            expect(resposta.body).to.have.property("message");
        });

        it("Deve rejeitar aviso de Prazo de validade menor que um dia", async () => {
            const bodyItem = gerarItemAleatorio();
            bodyItem.expiry_lead_time = 0;

            const resposta = await request(process.env.BASE_URL)
                .post("/items")
                .set('Content-Type', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyItem);

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property("code").equal("INVALID_INTEGER");
            expect(resposta.body).to.have.property("message");
        });

    })

    describe("GET /items", () => {
        it("Deve listar os items cadastrados", async () => {
            const resposta = await request(process.env.BASE_URL)
                .get("/items")
                .set('Authorization', `Bearer ${token}`);
            expect(resposta.status).to.equal(200);
            expect(resposta.body).to.have.property("data").that.is.an("array");
        });
    });

});








