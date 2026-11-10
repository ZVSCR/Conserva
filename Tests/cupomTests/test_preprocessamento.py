"""Testes sem modelos OCR: python -m unittest discover -s Tests/cupomTests -p test_*.py."""

import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import cv2
import numpy as np


SCRIPT = Path(__file__).resolve().parents[2] / 'Backend/src/scripts/extrairTextoCupom.py'
spec = importlib.util.spec_from_file_location('ocr', SCRIPT)
ocr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ocr)


class PreprocessamentoTest(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.TemporaryDirectory()
        self.addCleanup(self.pasta.cleanup)
        self.caminho = Path(self.pasta.name) / 'cupom-acentuação.png'
        self.config = dict(escala=1, equalizar_histograma=False,
                           desfoque_kernel=0, binarizacao=None, borda=0,
                           corrigir_inclinacao=False, morfologia=None,
                           morfologia_kernel=2, salvar_em=None)
        # Alterar o perfil de uso nao deve mudar os casos isolados nem salvar
        # sobre a imagem de depuracao do usuario durante o teste do adaptador.
        self.perfil = patch.dict(ocr.PREPROCESSAMENTO, self.config)
        self.perfil.start()
        self.addCleanup(self.perfil.stop)

    def processar(self, imagem, **ajustes):
        cv2.imencode('.png', imagem)[1].tofile(self.caminho)
        return ocr.preprocessar_imagem(self.caminho, {**self.config, **ajustes})

    def test_transparencia_sobre_branco_e_caminho_unicode(self):
        imagem = np.zeros((20, 30, 4), dtype=np.uint8)
        imagem[5:10, 5:10, 3] = 255
        resultado = self.processar(imagem)
        self.assertEqual(resultado[0, 0], 255)
        self.assertEqual(resultado[7, 7], 0)

    def test_escala_limitada_e_borda_branca(self):
        resultado = self.processar(np.zeros((20, 30), np.uint8),
                                   escala=4, lado_maximo=60, borda=10)
        self.assertEqual(resultado.shape, (60, 80))
        self.assertTrue(np.all(resultado[:10] == 255))

    def test_recorte_inclui_ultima_linha_e_coluna(self):
        imagem = np.zeros((40, 50), np.uint8)
        imagem[5:35, 10:45] = 255
        resultado = self.processar(imagem, recortar_fundo=True)
        self.assertEqual(resultado.shape, (30, 35))
        # Sem regiao clara, a imagem inteira deve continuar disponivel.
        resultado = self.processar(np.zeros((40, 50), np.uint8), recortar_fundo=True)
        self.assertEqual(resultado.shape, (40, 50))

    def test_binarizacao_e_limiar_manual(self):
        imagem = np.tile(np.arange(256, dtype=np.uint8), (40, 1))
        for metodo in ['otsu', 'adaptativa', 'manual']:
            with self.subTest(metodo=metodo):
                resultado = self.processar(imagem, binarizacao=metodo)
                self.assertTrue(set(np.unique(resultado)) <= {0, 255})
        resultado = self.processar(imagem, binarizacao='manual', limiar_manual=60)
        self.assertEqual(resultado[0, 59], 0)
        self.assertEqual(resultado[0, 60], 255)

    def test_morfologia_respeita_texto_preto(self):
        imagem = np.full((40, 40), 255, np.uint8)
        imagem[10:30, 15:25] = 0
        engrossada = self.processar(imagem, morfologia='engrossar')
        afinada = self.processar(imagem, morfologia='afinar')
        self.assertGreater(np.count_nonzero(engrossada == 0), np.count_nonzero(imagem == 0))
        self.assertLess(np.count_nonzero(afinada == 0), np.count_nonzero(imagem == 0))

    def test_deskew_sem_linhas_e_com_linhas_inclinadas(self):
        branco = np.full((100, 200), 255, np.uint8)
        np.testing.assert_array_equal(ocr.corrigir_inclinacao(branco, 10), branco)
        for y in [20, 40, 60]:
            cv2.line(branco, (10, y), (190, y + 12), 0, 2)
        resultado = ocr.corrigir_inclinacao(branco, 10)
        linhas = cv2.HoughLinesP(cv2.Canny(resultado, 50, 150), 1, np.pi / 180,
                                 30, minLineLength=100, maxLineGap=10)
        self.assertIsNotNone(linhas)
        self.assertTrue(all(abs(y2 - y1) <= 2 for x1, y1, x2, y2 in linhas.reshape(-1, 4)))

    def test_arquivo_invalido_e_configuracao_invalida(self):
        self.caminho.write_bytes(b'nao e imagem')
        with self.assertRaisesRegex(ValueError, 'ler a imagem'):
            ocr.preprocessar_imagem(self.caminho)
        for ajustes in [dict(escala=0), dict(desfoque_kernel=4),
                        dict(binarizacao='invalida')]:
            with self.subTest(ajustes=ajustes), self.assertRaises(ValueError):
                self.processar(np.zeros((20, 30), np.uint8), **ajustes)

    def test_imagem_salva_e_entrada_do_easyocr(self):
        destino = Path(self.pasta.name) / 'processada.png'
        imagem = np.full((40, 50), 255, np.uint8)
        resultado = self.processar(imagem, salvar_em=destino)
        np.testing.assert_array_equal(cv2.imdecode(np.fromfile(destino, np.uint8), 0), resultado)
        with patch.dict('sys.modules', easyocr=unittest.mock.MagicMock()) as modulos:
            leitor = modulos['easyocr'].Reader.return_value
            leitor.readtext.return_value = ['ARROZ', '2 UN 10,00']
            self.assertEqual(ocr.extrair_texto_cupom(self.caminho), 'ARROZ\n2 UN 10,00')
            self.assertIsInstance(leitor.readtext.call_args.args[0], np.ndarray)
            self.assertEqual(leitor.readtext.call_args.kwargs['detail'], 0)

    def test_nao_sobrescreve_original(self):
        with self.assertRaisesRegex(ValueError, 'imagem original'):
            self.processar(np.zeros((20, 30), np.uint8), salvar_em=self.caminho)

    def test_equalizacao_e_blur_podem_ser_combinados(self):
        imagem = np.full((40, 80), 200, np.uint8)
        imagem[10:30, 20:60] = 70
        resultado = self.processar(imagem, equalizar_histograma=True,
                                   desfoque_kernel=5, binarizacao='manual')
        self.assertEqual(set(np.unique(resultado)), {0, 255})


if __name__ == '__main__':
    unittest.main()
