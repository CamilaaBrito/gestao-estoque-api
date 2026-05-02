const { expect } = require("chai");
const request = require("supertest");
const app = require("../src/app");
const postLogin = require("../fixtures/postLogin.json");

describe("Login - Autenticação", () => {
  
  it("Deve retornar 200 com um token em string quando usar credenciais válidas", (done) => {
    request(app)
      .post("/auth/login")
      .send(postLogin.valida)
      .end((err, res) => {
        if (err) return done(err);
        
        expect(res.body).to.have.property("access_token");
        expect(res.body).to.have.property("token_type").equal("Bearer");
        expect(res.body).to.have.property("expires_in").equal("8h");
        expect(res.body.access_token).to.be.a("string");
        expect(res.body.access_token).to.not.be.empty;
        expect(res.status).to.equal(200);
        
        done();
      });
  });

  it("Deve rejeitar credenciais inválidas (senha errada)", (done) => {
    request(app)
      .post("/auth/login")
      .send(postLogin.invalida)
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        
        expect(res.body).to.have.property("code").equal("INVALID_CREDENTIALS");
        expect(res.body).to.have.property("message");
        expect(res.body.message).to.include("inválid");
        
        done();
      });
  });

    it("Deve rejeitar credenciais inválidas (login errado)", (done) => {
    request(app)
      .post("/auth/login")
      .send(postLogin.invalida)
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        
        expect(res.body).to.have.property("code").equal("INVALID_CREDENTIALS");
        expect(res.body).to.have.property("message");
        expect(res.body.message).to.include("inválid");
        
        done();
      });
  });

  it("Deve rejeitar login sem a senha", (done) => {
    request(app)
      .post("/auth/login")
      .send(postLogin.sem_senha)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        
        expect(res.body).to.have.property("code").equal("INVALID_CREDENTIALS");
        expect(res.body).to.have.property("message");
        expect(res.body.message).to.include("obrigatórios");
        
        done();
      });
  });

  it("Deve rejeitar login sem credenciais (payload vazio)", (done) => {
    request(app)
      .post("/auth/login")
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        
        expect(res.body).to.have.property("code");
        expect(res.body).to.have.property("message");
        
        done();
      });
  });

});
