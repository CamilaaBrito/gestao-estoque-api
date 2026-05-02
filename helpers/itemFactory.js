const postItems = require("../fixtures/postItems.json");

function gerarItemAleatorio() {
    const item = { ...postItems.novoItem };
    item.name = `Item ${Date.now()} ${Math.floor(Math.random() * 10000)}`;
    return item;
}

module.exports = {
    gerarItemAleatorio
};
