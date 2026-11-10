"""Adaptador independente para EasyOCR; stdout contem apenas JSON."""

import contextlib
import json
from pathlib import Path
import sys

import cv2
import numpy as np


# Melhor compromisso entre CF-e.png e NFC-e.jpg nos testes de 10/11/2026.
# Ver Docs/ajuste-ocr.md; nao garante o melhor resultado para outras fotos.
PREPROCESSAMENTO = {
    'escala': 2.0,                 # ampliar nao recupera detalhes perdidos
    'lado_maximo': 2560,           # limita o custo de memoria/processamento
    'inverter': False,             # True para texto claro em fundo escuro
    'recortar_fundo': False,       # apenas para papel claro sobre fundo escuro
    'limiar_papel': 210,
    'equalizar_histograma': False, # pode apagar texto pequeno; compare ligado/desligado
    'desfoque_kernel': 0,          # 0 desliga; caso contrario, impar >= 3
    'desfoque_sigma': 2.0,
    'binarizacao': 'adaptativa',           # 'otsu', 'adaptativa', 'manual' ou None
    'limiar_manual': 215,
    'bloco_adaptativo': 67,        # impar >= 3
    'constante_adaptativa': 15,
    'corrigir_inclinacao': False,  # estima pequenas inclinacoes por linhas
    'angulo_maximo': 10,
    'morfologia': None,            # 'engrossar', 'afinar' ou None
    'morfologia_kernel': 1,        # 1 nao altera os tracos
    'borda': 10,                   # pixels brancos, adicionados ao final
    'salvar_em': 'cupomProcessado.png',             # ex.: 'cupom-processado.png' para inspecao
}

LEITOR_OCR = {
    'lang_list': ['pt', 'en'],
    'gpu': False,
}

LEITURA_OCR = {
    'decoder': 'greedy',           # tambem aceita 'beamsearch'
    'beamWidth': 5,
    'batch_size': 1,
    'workers': 0,
    'paragraph': False,
    'min_size': 10,
    'contrast_ths': 0.1,
    'adjust_contrast': 0.5,
    'text_threshold': 0.7,
    'low_text': 0.4,
    'link_threshold': 0.4,
    'canvas_size': 2560,           # acompanhe lado_maximo ao aumentar a imagem
    'mag_ratio': 1.0,              # a ampliacao ja ocorre no preprocessamento
    'slope_ths': 0.1,
    'ycenter_ths': 0.5,
    'height_ths': 0.5,
    'width_ths': 0.5,
    'add_margin': 0.1,
    'allowlist': None,
    'blocklist': None,
    'rotation_info': None,
}


def corrigir_inclinacao(imagem, angulo_maximo):
    # Usa segmentos quase horizontais, evitando estimar o angulo pelo QR code.
    bordas = cv2.Canny(imagem, 50, 150)
    largura = imagem.shape[1]
    linhas = cv2.HoughLinesP(bordas, 1, np.pi / 180, threshold=30,
                             minLineLength=max(30, largura // 4), maxLineGap=10)
    angulos = []
    if linhas is not None:
        for x1, y1, x2, y2 in linhas.reshape(-1, 4):
            angulo = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            if abs(angulo) <= angulo_maximo:
                angulos.append(angulo)
    if not angulos:
        return imagem
    angulo = float(np.median(angulos))
    altura, largura = imagem.shape
    matriz = cv2.getRotationMatrix2D((largura / 2, altura / 2), angulo, 1)
    # Expande a tela para nao cortar texto nas extremidades.
    cos, sen = abs(matriz[0, 0]), abs(matriz[0, 1])
    nova_largura = int(np.ceil(altura * sen + largura * cos))
    nova_altura = int(np.ceil(altura * cos + largura * sen))
    matriz[0, 2] += (nova_largura - largura) / 2
    matriz[1, 2] += (nova_altura - altura) / 2
    return cv2.warpAffine(imagem, matriz, (nova_largura, nova_altura),
                          flags=cv2.INTER_CUBIC, borderValue=255)


def preprocessar_imagem(caminho_imagem, configuracao=None):
    config = {**PREPROCESSAMENTO, **(configuracao or {})}
    if config['salvar_em'] and Path(config['salvar_em']).resolve() == Path(caminho_imagem).resolve():
        raise ValueError('salvar_em deve ser diferente da imagem original.')
    # imdecode + fromfile suporta caminhos Unicode no Windows.
    dados = np.fromfile(caminho_imagem, dtype=np.uint8)
    imagem = cv2.imdecode(dados, cv2.IMREAD_UNCHANGED) if dados.size else None
    if imagem is None:
        raise ValueError('Nao foi possivel ler a imagem do cupom.')
    if imagem.dtype != np.uint8:
        raise ValueError('Use uma imagem de 8 bits (PNG ou JPEG).')
    if imagem.ndim == 3:
        if imagem.shape[2] == 4:
            alpha = imagem[:, :, 3:4].astype(np.float32) / 255
            imagem = np.rint(imagem[:, :, :3] * alpha + 255 * (1 - alpha)).astype(np.uint8)
        imagem = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
    if config['inverter']:
        imagem = cv2.bitwise_not(imagem)
    if config['recortar_fundo']:
        # A maior regiao clara evita incluir pontos isolados do fundo.
        mascara = (imagem >= config['limiar_papel']).astype(np.uint8)
        contornos, _ = cv2.findContours(mascara, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contornos:
            x, y, largura, altura = cv2.boundingRect(max(contornos, key=cv2.contourArea))
            imagem = imagem[y:y + altura, x:x + largura]

    escala = config['escala']
    if escala <= 0 or config['lado_maximo'] <= 0:
        raise ValueError('escala e lado_maximo devem ser positivos.')
    escala = min(escala, config['lado_maximo'] / max(imagem.shape))
    if escala != 1:
        altura, largura = imagem.shape
        imagem = cv2.resize(imagem, (max(1, round(largura * escala)),
                                     max(1, round(altura * escala))),
                            interpolation=cv2.INTER_CUBIC if escala > 1 else cv2.INTER_AREA)
    if config['equalizar_histograma']:
        imagem = cv2.equalizeHist(imagem)
    kernel = config['desfoque_kernel']
    if kernel:
        if kernel < 3 or kernel % 2 == 0:
            raise ValueError('desfoque_kernel deve ser 0 ou um impar >= 3.')
        imagem = cv2.GaussianBlur(imagem, (kernel, kernel), config['desfoque_sigma'])
    if config['corrigir_inclinacao']:
        imagem = corrigir_inclinacao(imagem, config['angulo_maximo'])

    metodo = config['binarizacao']
    if metodo == 'otsu':
        imagem = cv2.threshold(imagem, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    elif metodo == 'manual':
        imagem = np.where(imagem >= config['limiar_manual'], 255, 0).astype(np.uint8)
    elif metodo == 'adaptativa':
        bloco = config['bloco_adaptativo']
        if bloco < 3 or bloco % 2 == 0:
            raise ValueError('bloco_adaptativo deve ser impar >= 3.')
        imagem = cv2.adaptiveThreshold(imagem, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY, bloco, config['constante_adaptativa'])
    elif metodo is not None:
        raise ValueError('binarizacao deve ser otsu, adaptativa, manual ou None.')

    operacao = config['morfologia']
    if operacao is not None:
        kernel = np.ones((config['morfologia_kernel'],) * 2, dtype=np.uint8)
        # O texto e preto: erodir engrossa os tracos; dilatar os afina.
        if operacao == 'engrossar':
            imagem = cv2.erode(imagem, kernel)
        elif operacao == 'afinar':
            imagem = cv2.dilate(imagem, kernel)
        else:
            raise ValueError('morfologia deve ser engrossar, afinar ou None.')
    borda = config['borda']
    imagem = cv2.copyMakeBorder(imagem, borda, borda, borda, borda,
                                cv2.BORDER_CONSTANT, value=255)
    if config['salvar_em']:
        destino = Path(config['salvar_em'])
        sucesso, dados = cv2.imencode(destino.suffix, imagem)
        if not sucesso:
            raise ValueError('Nao foi possivel salvar a imagem processada.')
        dados.tofile(destino)
    return imagem


def extrair_texto_cupom(caminho_imagem):
    # EasyOCR pode imprimir avisos durante a carga e baixar modelos no primeiro uso.
    with contextlib.redirect_stdout(sys.stderr):
        import easyocr

        imagem = preprocessar_imagem(caminho_imagem)
        reader = easyocr.Reader(**LEITOR_OCR)
        # detail=0 e fixo para manter o contrato de string JSON com o Node.
        trechos = reader.readtext(imagem, detail=0, **LEITURA_OCR)
    return '\n'.join(trechos)


if __name__ == '__main__':
    print(json.dumps(extrair_texto_cupom(sys.argv[1]), ensure_ascii=True))
