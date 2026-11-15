# **GUIA DE USO DO OCR**

# Como Rodar o OCR:

1. Abra um terminal  
2. Acesse a pasta raiz do projeto  
3. Rode os seguintes comandos:  
   py \-3.12 \-m venv .venv-ocr  
   .\\.venv-ocr\\Scripts\\python.exe \-m pip install \--upgrade pip  
   .\\.venv-ocr\\Scripts\\python.exe \-m pip install \-r Backend/requirements-ocr.txt  
4. Rode o seguinte comando ("C:\\path\\to\\receipt.jpg" deve ser o caminho para a imagem no seu dispositivo):  
   .\\.venv\\Scripts\\python.exe Backend/src/scripts/extrairTextoCupom.py "C:\\path\\to\\receipt.jpg" \| ConvertFrom-Json  
   Ou caso queira que a saída imprima novas linhas como \\n:  
   .\\.venv-ocr\\Scripts\\python.exe Backend/src/scripts/extrairTextoCupom.py "C:\\path\\to\\receipt.jpg"  
     
   

# Configurações do OCR:

Todas as seguintes opções podem ser modificadas no arquivo “[extrairTextoCupom.py](http://extrairTextoCupom.py)”

Ordem de Processamento da Imagem:

Imagem → preparação e filtros → detecção das regiões de texto → reconhecimento dos caracteres → texto de saída

## Pré-Processamento

No dicionário PREPROCESSAMENTO, os parâmetros modificam a imagem antes de ela chegar ao EasyOCR. A composição da transparência sobre fundo branco e a conversão para tons de cinza acontecem automaticamente.  
\- escala  
  Define o fator de redimensionamento. 2.0 tenta dobrar a largura e a altura; 1.0 mantém o tamanho; 0.5 reduz pela metade.  
  A ampliação pode facilitar a leitura de caracteres pequenos, mas apenas interpola os pixels existentes: não recupera detalhes perdidos por desfoque ou baixa resolução. O resultado também depende de lado\_maximo.

\- lado\_maximo  
  Limita o maior lado da imagem durante o redimensionamento, preservando sua proporção. Se uma imagem tem 1.500 pixels de altura e escala=2.0, o resultado seria 3.000; esse limite reduz a ampliação para que a altura fique em 2.560 por exemplo.  
  Também pode reduzir imagens originalmente maiores que o limite. A correção de inclinação e a borda acontecem depois, podendo aumentar as dimensões finais.

\- inverter  
  Inverte as intensidades: branco vira preto, preto vira branco e os tons intermediários também são invertidos.  
  É apropriado para imagens com texto claro sobre fundo escuro. Em um cupom comum, com letras escuras sobre papel claro, normalmente deve permanecer desligado.

\- recortar\_fundo   
  Procura a maior região clara conectada e recorta o retângulo que a envolve. A intenção é separar um papel claro de um fundo escuro.  
  Não é um detector completo de documentos: sombras podem dividir o papel em regiões, e um objeto claro no fundo pode ser escolhido por engano. Se não encontrar uma região clara, mantém a imagem inteira.

\- limiar\_papel  
  Define a intensidade mínima para um pixel ser considerado parte de uma região clara no recorte. A intensidade vai de 0, preto, até 255, branco.  
  Aumentar o valor exige pixels mais claros; diminuir inclui regiões mais escuras. Só tem efeito quando recortar\_fundo=True.

\- equalizar\_histograma  
  Redistribui as intensidades da imagem para aumentar o contraste global. Pode tornar letras apagadas mais visíveis.  
  Como considera a imagem inteira, também pode destacar manchas, textura do papel e compressão. Não equivale a corrigir sombras localmente e pode prejudicar caracteres pequenos.

\- desfoque\_kernel  
  Define o tamanho da vizinhança usada pelo desfoque gaussiano. 0 desliga a etapa; para ativá-la, o código exige um número inteiro ímpar maior ou igual a 3, como 3, 5 ou 7\.  
  O desfoque suaviza variações e ruídos, mas também reduz detalhes. Valores maiores podem unir traços ou apagar pequenos espaços dentro dos números.

\- desfoque\_sigma  
  Controla a distribuição dos pesos do filtro gaussiano. Para um mesmo kernel, valores maiores geralmente espalham mais a suavização pela vizinhança.  
  Só tem efeito se desfoque\_kernel estiver ativado. Kernel e sigma devem ser avaliados juntos.

\- binarizacao  
  Escolhe como transformar a imagem em preto e branco. Aceita quatro opções:  
  Valor	Funcionamento  
  None	Mantém os tons de cinza.  
  'otsu'	Calcula automaticamente um único limiar para a imagem inteira.  
  'manual'	Usa o valor definido em limiar\_manual.  
  'adaptativa'	Calcula limiares locais usando a vizinhança de cada pixel.    
  A binarização adaptativa pode lidar melhor com iluminação desigual. Entretanto, qualquer binarização elimina tons intermediários e pode alterar o formato dos caracteres.

\- limiar\_manual  
  É o ponto de corte utilizado somente em binarizacao='manual'. Pixels com intensidade maior ou igual ao limiar ficam brancos; os demais ficam pretos.  
  Aumentá-lo tende a produzir mais pixels pretos, engrossando regiões escuras ou trazendo manchas para o primeiro plano. Diminuí-lo tende a produzir mais branco, podendo apagar texto claro.

\- bloco\_adaptativo  
  Define o tamanho da vizinhança usada no cálculo do limiar adaptativo. O valor 67, por exemplo, corresponde a uma região de aproximadamente 67 × 67 pixels. Deve ser inteiro, ímpar e maior ou igual a 3\.  
  Blocos menores acompanham mudanças locais mais rápidas, mas podem reagir demais a ruídos. Blocos maiores consideram uma área mais ampla. Como essa etapa ocorre depois do redimensionamento, mudar escala também altera a relação entre o bloco e o tamanho das letras.

\- constante\_adaptativa  
  É subtraída da média local ponderada usada como limiar na binarização adaptativa.  
  Aumentar a constante tende a deixar mais pixels brancos, podendo limpar o fundo e afinar o texto. Diminuí-la tende a preservar mais pixels pretos, mas também pode manter manchas ou unir traços. Só atua no modo adaptativo.

\- corrigir\_inclinacao  
  Procura segmentos quase horizontais, calcula um ângulo representativo e gira a imagem para alinhá-los. O código expande a área de saída para evitar cortar as extremidades.  
  Corrige pequenas inclinações no plano da imagem. Não corrige perspectiva, papel curvado nem uma foto girada em 90°. Linhas de tabelas e outros elementos gráficos também podem influenciar a estimativa.

\- angulo\_maximo   
  Limita quais segmentos podem participar da estimativa de inclinação. Atualmente, considera segmentos com inclinação de até aproximadamente 10°, por exemplo, em relação à horizontal.  
  Não representa uma rotação aplicada obrigatoriamente. Se não encontrar segmentos adequados, a imagem permanece como está. Só atua quando a correção de inclinação está ligada.

\- morfologia  
  Altera a espessura dos traços. As opções são None, para desligar; 'engrossar', para expandir texto preto; e 'afinar', para reduzir sua espessura.  
  Engrossar pode ajudar letras muito finas, mas fechar os espaços de 8, 9 e 0\. Afinar pode separar traços grudados, mas também quebrar letras. A implementação considera texto preto sobre fundo claro.

\- morfologia\_kernel  
  Define o tamanho do elemento quadrado usado na operação morfológica. Um kernel 2 utiliza uma vizinhança de 2 × 2 pixels.  
  Com valor 1, a operação não altera os traços, mesmo que morfologia esteja ativada. Valores maiores produzem mudanças mais fortes.

\- borda   
  Adiciona uma margem branca de, por exemplo, 10 pixels em cada lado da imagem processada.  
  A margem separa o conteúdo dos limites da imagem. Não corrige caracteres que já estavam cortados na fotografia original.

\- salvar\_em   
  Define onde salvar a imagem final entregue ao OCR. Caminhos relativos são resolvidos a partir da pasta em que o comando foi executado.  
  É útil para verificar se os filtros apagaram ou deformaram caracteres. None desliga o salvamento. A pasta de destino precisa existir; um arquivo existente pode ser sobrescrito, mas o código rejeita o mesmo caminho da imagem original.

## OCR

No dicionário LEITOR\_OCR, os parâmetros configuram a criação do leitor e a escolha do dispositivo de processamento.

\- lang\_list  
  Informa os idiomas utilizados na configuração do reconhecimento, por exemplo: português e inglês.  
  Isso influencia a seleção do modelo e dos caracteres disponíveis. Não traduz o conteúdo nem garante que o leitor reconhecerá corretamente todas as palavras desses idiomas.

\- gpu   
  Solicita o uso de aceleração por GPU quando houver suporte no ambiente. A disponibilidade depende do dispositivo e da instalação do PyTorch.  
  False força o uso de CPU. A GPU serve principalmente para acelerar o processamento; ativá-la não é, por si só, um ajuste de qualidade.

No dicionário LEITURA\_OCR, os parâmetros controlam a detecção das caixas de texto, o reconhecimento e o agrupamento dos resultados. Essa separação também aparece na documentação oficial do EasyOCR.

\- decoder  
  Define como as previsões de caracteres são convertidas em uma sequência de texto. O modo greedy escolhe o caminho mais provável em cada etapa.  
  beamsearch mantém sequências alternativas antes de escolher o resultado, aumentando o custo de processamento. Também existe wordbeamsearch, que incorpora agrupamento orientado a palavras. Explorar alternativas não garante melhora, especialmente em preços e códigos.

\- beamWidth  
  Controla a quantidade de caminhos candidatos explorados na busca por feixes, ou beam search.  
  Valores maiores ampliam a busca e aumentam o processamento. Não tem efeito enquanto decoder='greedy'.

\- batch\_size   
  Define quantas regiões de texto são processadas juntas durante o reconhecimento.  
  Aumentar o lote pode melhorar o aproveitamento do hardware, principalmente da GPU, mas exige mais memória. Não representa o número de imagens de cupons processadas simultaneamente pelo seu script.

\- workers  
  Define a quantidade de processos auxiliares utilizados no carregamento dos dados de reconhecimento.  
  Com 0, o carregamento ocorre no processo principal. É um parâmetro de execução e desempenho, não de distinção entre caracteres parecidos.

\- paragraph   
  Controla o agrupamento das caixas reconhecidas em parágrafos.  
  Ativá-lo pode facilitar a leitura de texto corrido, mas também combinar partes de colunas diferentes de um cupom. Mantê-lo desligado não reconstrói automaticamente as linhas da tabela.

\- min\_size  
  Filtra caixas detectadas muito pequenas, usando uma medida em pixels.  
  Diminuir o valor pode preservar textos menores, mas também incluir pontos, manchas e outros elementos sem texto. Não é uma exigência direta de altura mínima de cada caractere.

\- contrast\_ths  
  Participa do mecanismo de segunda tentativa de reconhecimento com contraste ajustado.  
  Aumentá-lo pode fazer mais regiões serem reavaliadas, aumentando o trabalho realizado. Não equivale a aumentar globalmente o contraste da imagem.

\- adjust\_contrast   
  Define o ajuste de contraste utilizado nessa tentativa adicional.  
  Atua sobre regiões de reconhecimento, separadamente da equalização de histograma do preprocessamento. Seu efeito depende de a região passar pelos critérios de reprocessamento.

\- text\_threshold   
  Define um limiar de pontuação utilizado pelo detector para aceitar regiões como texto.  
  Reduzi-lo pode admitir regiões mais fracas, mas também falsos positivos. Não significa “30% de chance de o texto reconhecido estar correto”: é um critério de detecção, anterior à leitura dos caracteres.

\- low\_text   
  É um limiar inferior usado para formar regiões candidatas no mapa de detecção de texto.  
  Diminuí-lo pode preservar partes fracas dos caracteres, mas também incorporar ruído. Atua junto de text\_threshold; alterar um deles isoladamente pode não produzir o efeito esperado.

\- link\_threshold   
  Define o limiar do mapa de conexões entre regiões de caracteres.  
  Valores maiores exigem conexões mais fortes, podendo separar regiões que deveriam permanecer juntas. Valores menores permitem mais conexões, com risco de unir conteúdo indevido. Essa etapa é diferente do agrupamento geométrico controlado por width\_ths.

\- canvas\_size  
  Limita a maior dimensão da imagem usada na detecção.  
  Se a entrada ampliada ultrapassar esse tamanho, o detector a reduz. Portanto, ampliar muito no preprocessamento pode não trazer benefício se o detector reduzir a imagem novamente.

\- mag\_ratio  
  Define a ampliação solicitada na etapa de detecção, respeitando canvas\_size.  
  Com 1.0, não solicita ampliação adicional. Atua em uma etapa diferente de escala, que modifica a imagem antes da chamada ao EasyOCR.

\- slope\_ths  
  Define a inclinação tolerada durante o agrupamento de caixas.  
  É uma razão entre deslocamento vertical e horizontal, não um ângulo em graus. Aumentá-lo permite agrupar caixas mais inclinadas, mas também pode unir elementos desalinhados.

\- ycenter\_ths   
  Controla a diferença vertical tolerada entre os centros das caixas que podem ser agrupadas, usando a altura das caixas como referência.  
  Aumentá-lo permite maior desalinhamento vertical. Em cupons com linhas próximas, isso pode misturar textos de itens diferentes.

\- height\_ths   
  Controla a diferença de altura tolerada entre caixas durante o agrupamento.  
  Valores maiores permitem unir textos de tamanhos mais diferentes. Valores menores tornam essa união mais restritiva e podem fragmentar uma mesma linha.

\- width\_ths  
  Controla o espaço horizontal tolerado entre caixas que podem ser unidas, em relação à altura do texto.  
  Aumentá-lo pode juntar palavras separadas de uma descrição, mas também unir descrição, quantidade e preço. Diminuí-lo preserva mais caixas separadas.

\- add\_margin  
  Adiciona espaço ao redor das caixas utilizadas no reconhecimento, proporcionalmente ao tamanho do texto.  
  Uma margem pequena pode cortar partes dos caracteres; uma margem grande pode incluir linhas ou letras vizinhas. Não é a mesma coisa que borda, que acrescenta branco ao redor da imagem inteira.

\- allowlist   
  Restringe os caracteres que o reconhecedor pode produzir. Por exemplo, uma lista contendo apenas dígitos e separadores poderia ser usada em um recorte exclusivamente numérico.  
  Não resolve confusões entre 9, 0 e 8, pois todos continuariam permitidos. Uma restrição numérica aplicada ao cupom inteiro também prejudicaria as descrições dos produtos.

\- blocklist  
  Exclui caracteres específicos do reconhecimento.  
  É ignorada quando uma allowlist está definida. Excluir um caractere só é adequado quando ele realmente não pode aparecer naquele campo.

\- rotation\_info   
  Permite tentar rotações adicionais em cada caixa de texto, como \[90, 180, 270\], e comparar os resultados.  
  Isso aumenta o processamento. Atua nas caixas individuais e é diferente de corrigir\_inclinacao, que estima uma pequena rotação da imagem inteira.

Existe ainda detail=0, fixado diretamente na chamada de readtext. Ele determina que o retorno contenha apenas os textos reconhecidos. Com saída detalhada, o EasyOCR também pode fornecer caixas e pontuações, mas o adaptador atual espera uma lista de strings para montar o texto JSON. Alterar esse parâmetro exigiria adaptar o tratamento do resultado.