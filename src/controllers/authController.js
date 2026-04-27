const authService = require("../services/authService");

async function login(request, response, next) {
  try {
    const result = authService.login(request.body);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login
};
