require('dotenv').config();
const { expect } = require("chai");
const request = require("supertest");
const app = require("../src/app");
const postLogin = require("../fixtures/postLogin.json");

describe("Login - Autenticação", () => {

    it("Deve retornar 200 com um token em string quando usar credenciais válidas", async () => {

            const bodyLogin = postLogin.valida

            const resposta = await request(process.env.BASE_URL)
            .post("/auth/login")
            .set('Content-Type', 'application/json')
            .send(bodyLogin)

        expect(resposta.body).to.have.property("access_token");
        expect(resposta.body).to.have.property("token_type").equal("Bearer");
        expect(resposta.body).to.have.property("expires_in").equal("8h");
        expect(resposta.body.access_token).to.be.a("string");
        expect(resposta.body.access_token).to.not.be.empty;
        expect(resposta.status).to.equal(200);

    });

    
        it("Deve rejeitar credenciais inválidas (senha errada)", async () => {
    
            const usernameInvalido = { ...postLogin.valida}
            usernameInvalido.password = "12345678"
    
            const resposta = await request(process.env.BASE_URL)
                .post("/auth/login")
                .send(usernameInvalido)
    
            expect(resposta.body).to.have.property("code").equal("INVALID_CREDENTIALS");
            expect(resposta.body).to.have.property("message");
            expect(resposta.body.message).to.include("inválid");
            expect(resposta.status).to.equal(401);
    
    
        });
    
    
        it("Deve rejeitar credenciais inválidas (login errado)", async () => {
    
            const usernameInvalido = { ...postLogin.valida}
            usernameInvalido.username = "administrator"
    
            const resposta = await request(process.env.BASE_URL)
                .post("/auth/login")
                .send(usernameInvalido)
    
    
            expect(resposta.body).to.have.property("code").equal("INVALID_CREDENTIALS");
            expect(resposta.body).to.have.property("message");
            expect(resposta.status).to.equal(401);
    
        });
    
    
        it("Deve rejeitar login sem a senha", async () => {
            const resposta = await request(process.env.BASE_URL)
                .post("/auth/login")
                .send(postLogin.sem_senha)
    
    
            expect(resposta.body).to.have.property("code").equal("INVALID_CREDENTIALS");
            expect(resposta.body).to.have.property("message");
            expect(resposta.body.message).to.include("obrigatórios");
            expect(resposta.status).to.equal(400);
        });
    
        it("Deve rejeitar login sem credenciais (payload vazio)", async () => {
            const resposta = await request(process.env.BASE_URL)
                .post("/auth/login")
                .send({})
    
            expect(resposta.body).to.have.property("message");
            expect(resposta.body).to.have.property("code").equal("INVALID_CREDENTIALS");
            expect(resposta.body.message).to.include("obrigatórios");
            expect(resposta.status).to.equal(400);
        });



});