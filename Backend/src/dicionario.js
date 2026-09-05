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

const instancia = [];                                                   //Armazena itens a serem adicionados

const aliasesToNome = {                                                 //Dicionario de nomes conhecidos
    "req.": "requeijao",
    "requeijao": "requeijao",
    "leite": "leite",
    "pao": "pao",
};

const map = new Map(Object.entries(aliasesToNome));                     //Faz o mapeamento de nomes definidos no dicionario

const main = async () => {
    for (let i = 0; i < 5; i++) {                                       //Recebe 5 entradas de teste do usuario
        let item = await askQuestion('Adicione um item:\n');
        item = item.toLowerCase();                                      //Converte entrada para lowercase
        let quant;
        if (/\d+/.test(item)) {                                         //Verifica se usuario definiu quantidade de itens a serem adicionados
            quant = parseInt(item.match(/\d+/g)[0]);
            item = item.replace(/\d+/g, '').trim();                     //Retira numeros do nome
        } else {
            item = item.trim();
            quant = 1;                                                  //Caso não haja quantidade, trata como se houvesse 1 item
        }

        if (!Array.from(map.values()).includes(item) && !Array.from(map.keys()).includes(item)) {   //Verifica se o item está presente no dicionario
            let novoitem = await askQuestion('Item não encontrado, qual o nome do item?\n');        //Caso não esteja, o adiciona
            novoitem = novoitem.toLowerCase().trim();
            if (Array.from(map.keys()).includes(novoitem)) {            //Caso nome inserido corresponda a um dos outros nomes conhecidos de um produto, o substitui
                for (const [key, value] of map) {                       
                    if (novoitem.includes(key)) {
                        novoitem = value;
                    }
                }
            }
            map.set(item, novoitem);
            item = novoitem;
        } else {
            for (const [key, value] of map) {                           //Substitui nome do dicionario por nome padrao caso esteja presente no dicionario
                if (item.includes(key)) {
                    item = value;
                }
            }
        }

        if (instancia.some((obj) => obj.Nome === item)) {               //Caso item já esteja na dispensa, atualiza a quantidade a ser adicionada
            instancia.find((o, i) => {
                if (o.Nome === item) {
                    instancia[i].quantidade += quant;
                    return true;
                }
            });
        } else {
            instancia.push({                                            //Caso item não esteja na dispensa, o coloca
                Nome: item,
                quantidade: quant,
            });
        }


        instancia.sort((a, b) => a.Nome.localeCompare(b.Nome));         //Ordena a dispensa em ordem alfabética
    }
    console.log(instancia);
    rl.close();
}

main();