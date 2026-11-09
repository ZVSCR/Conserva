"""Adaptador independente para EasyOCR; stdout contem apenas JSON."""

import contextlib
import json
import sys


def extrair_texto_cupom(caminho_imagem):
    # EasyOCR pode imprimir avisos durante a carga e baixar modelos no primeiro uso.
    with contextlib.redirect_stdout(sys.stderr):
        import easyocr

        reader = easyocr.Reader(['pt', 'en'], gpu=False)
        trechos = reader.readtext(caminho_imagem, detail=0)
    return '\n'.join(trechos)


if __name__ == '__main__':
    print(json.dumps(extrair_texto_cupom(sys.argv[1]), ensure_ascii=True))
