import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {

  stages: [
    { duration: '30s', target: 30 },
    { duration: '1m', target: 30 },
    { duration: '30s', target: 60 },
    { duration: '1m', target: 60 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(90)< 2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const postLogin = JSON.parse(open('../../fixtures/postLogin.json'));

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(postLogin.valida), {
    headers: { 'Content-Type': 'application/json' },
  });
  return { token: loginRes.json('access_token') };
}

export default function (data) {
  const url = `${BASE_URL}/items`;

  const payload = JSON.stringify({
    name: `Item Stress ${Date.now()}-VU${__VU}-${__ITER}`,
    unit: "UN",
    unit_price: 10.5,
    total_quantity: 50,
    min_estoque: 10,
    is_active: true,
    expiry_lead_time: 30
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`
    },
  };

  const res = http.post(url, payload, params);
  check(res, { 'criado com sucesso (status 201)': (r) => r.status === 201 });

  const getRes = http.get(url, params);
  check(getRes, { 'listagem retornada com sucesso (status 200)': (r) => r.status === 200 });

  sleep(1);
}
