const instancia = [];                                                   //Armazena itens a serem adicionados

const aliasesToNome = {                                                 //Dicionario de nomes conhecidos
    "req.": "requeijao",
    "requeijao": "requeijao",
    "leite": "leite",
    "pao": "pao",
};

const map = new Map(Object.entries(aliasesToNome));


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
        let quant;
        if (/\d+/.test(item)) {
            quant = item.match(/\d+/g)[0];
            item = item.replace(/\d+/g, '').trim();
        }else{
            item = item.trim();
            quant = 1;
        }

        for (const [key, value] of map) {
            if (item.includes(key)) {
                item = value;
            }
        }

        if (!Array.from(map.values()).includes(item)) {
            let novoitem = await askQuestion('Item não encontrado, qual o nome do item?\n');
            novoitem = novoitem.toLowerCase().trim();
            map.set(item, novoitem);
            instancia.push({
                Nome: novoitem,
                quantidade: quant,
            });
        } else {
            if(instancia.some((obj) => obj.Nome === item)){
                instancia.find((o, i) =>{
                    if(o.Nome === item){
                        instancia[i].quantidade += quant;
                        return true;
                    }
                });
            }
            instancia.push({
                Nome: item,
                quantidade: quant,
            });
        }

        instancia.sort((a, b) => a.Nome.localeCompare(b.Nome));
    }
    console.log(instancia);
    rl.close();
}

main();