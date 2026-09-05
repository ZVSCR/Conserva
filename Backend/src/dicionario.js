const instancia = [];
const map = new Map();
map.set("req.", "requeijao");

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const main = async () => {
    for (let i = 0; i < 5; i++) {
        let item = await askQuestion('Adicione um item:\n');
        item = item.toLowerCase();
        let quant = item.match(/\d+/g)[0];
        item = item.replace(/\d+/g, '').trim();

        for(const [key, value] of map){
            if(item.includes(key)){
                item = value;
            }
        }

        if(!Array.from(map.values()).includes(item)){
            let novoitem = await askQuestion('Item não encontrado, qual o nome do item?\n');
        }

        instancia.push({
            Nome: item,
            quantidade: quant,
        });
        instancia.sort((a, b) => {
            a.Nome.localeCompare(b.Nome);
        });
    }
    console.log(instancia);
    rl.close();
}

main();