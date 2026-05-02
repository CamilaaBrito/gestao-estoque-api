require('dotenv').config();
const request = require('supertest');
const postLogin = require('../fixtures/postLogin.json')

const obterToken = async(app) => {
    const bodyLogin = postLogin.valida;
    
    const respostaLogin = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json') 
        .send(bodyLogin);
    
    return respostaLogin.body.access_token;    
}

module.exports = { obterToken };