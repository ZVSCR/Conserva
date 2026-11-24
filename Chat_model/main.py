import os
import json
import asyncio
import base64
import binascii
from typing import List, Optional, Union
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from google.genai.errors import APIError
from dotenv import load_dotenv

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(title="Microserviço de OCR e Inteligência Fiscal")

MODELOS_DISPONIVEIS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash-lite",
    "gemini-3.8-flash",
]


class ItemAlimenticio(BaseModel):
    nome_padronizado: str = Field(
        description="Nome genérico/essencial do produto em português, SEM marca ou fabricante."
    )
    quantidade: float = Field(
        description="Valor numérico do peso, volume ou quantidade."
    )
    medida: str = Field(
        description="Unidade de medida (ex: 'g', 'kg', 'ml', 'l', 'un', 'cx')."
    )
    valor_unitario: float = Field(
        description="Valor unitário do produto."
    )
    valor_total_item: Optional[float] = Field(
        default=None,
        description="Valor total da linha do produto na nota fiscal. Use este valor no lugar de multiplicar quantidade por valor unitário."
    )
    is_item_novo: bool = Field(
        description="True se NÃO constar na lista de referência fornecida; False caso já exista."
    )
    categoria: str = Field(
        description="Categoria: Laticínios, Mercearia, Hortifrúti, Açougue/Peixaria, Bebidas, Padaria ou Outros."
    )
    validade_estimada: Optional[str] = Field(
        default=None,
        description="Data estimada de validade no formato YYYY-MM-DD, ou null quando não houver base segura para estimar."
    )


class RespostaNotaFiscal(BaseModel):
    itens_alimenticios: List[ItemAlimenticio]


class RespostaOCRImagem(BaseModel):
    ocr_text: str
    itens_alimenticios: List[ItemAlimenticio]


class OCRRequest(BaseModel):
    ocr_text: Optional[str] = None
    image_base64: Optional[str] = None
    mime_type: Optional[str] = None
    lista_referencia: List[str]
    data_compra: Optional[str] = None


SYSTEM_INSTRUCTION = """
Você é um sistema especialista em auditoria de compras e taxonomia de alimentos no Brasil.

REGRAS:
1. Extraia EXCLUSIVAMENTE produtos alimentícios (ignore limpeza, higiene, utilidades).
2. Remova marcas, selos e fabricantes (ex: "IOG NAT NESTLE 170G" -> "Iogurte").
3. Separe a quantidade numérica e a unidade de medida (g, kg, ml, l, un, cx).
4. Compare o produto padronizado com a lista de referência recebida. Se o produto não constar na lista, marque `is_item_novo = true`.
5. Informe `valor_total_item` com o preço total exibido na linha da nota fiscal. Não calcule esse total multiplicando quantidade por peso. Para unidades em g, kg, L ou mL, o valor da linha fiscal prevalece.
6. Estime `validade_estimada` em formato YYYY-MM-DD com base no tipo de produto e em uma estimativa típica de armazenamento após a compra. Use a data da compra recebida como ponto inicial; use uma data futura coerente e conservadora. Retorne null quando não houver como estimar com segurança, como em itens sem embalagem ou classificação insuficiente.
"""

SYSTEM_INSTRUCTION_IMAGEM = SYSTEM_INSTRUCTION + """
6. Em `ocr_text`, transcreva todo o texto legível da imagem, inclusive cabecalhos e totais, preservando linhas, códigos, quantidades e valores.
7. Use o conteúdo visual para identificar os itens alimentícios, sem inventar dados ilegíveis.
"""

MAX_IMAGE_BYTES = 3 * 1024 * 1024
TIPOS_IMAGEM_SUPORTADOS = {"image/jpeg", "image/png", "image/webp"}


def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Variável GEMINI_API_KEY não configurada na Vercel."
        )
    return genai.Client(api_key=api_key)


def dividir_em_chunks(texto: str, tamanho_lote: int = 25) -> List[str]:
    linhas = [linha.strip() for linha in texto.splitlines() if linha.strip()]
    return [
        "\n".join(linhas[i : i + tamanho_lote])
        for i in range(0, len(linhas), tamanho_lote)
    ]


async def processar_chunk(
    client: genai.Client,
    semaphore: asyncio.Semaphore,
    chunk_texto: str,
    lista_referencia: List[str],
    data_compra: Optional[str] = None,
) -> List[ItemAlimenticio]:
    user_prompt = f"""
LISTA DE REFERÊNCIA DE PRODUTOS CONHECIDOS:
{json.dumps(lista_referencia, ensure_ascii=False, indent=2)}

TEXTO DO OCR DA NOTA FISCAL:
---
{chunk_texto}
---

DATA DA COMPRA:
{data_compra or "Não informada"}
"""

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=RespostaNotaFiscal,
        temperature=0.1,
    )

    ultimo_erro = None

    async with semaphore:
        for modelo in MODELOS_DISPONIVEIS:
            try:
                response = await client.aio.models.generate_content(
                    model=modelo,
                    contents=user_prompt,
                    config=config,
                )
                dados = json.loads(response.text)
                return [ItemAlimenticio(**item) for item in dados.get("itens_alimenticios", [])]

            except APIError as e:
                ultimo_erro = str(e)
                erro_lower = ultimo_erro.lower()
                is_sobrecarga = (
                    e.code in (403, 429, 503)
                    or "high demand" in erro_lower
                    or "overloaded" in erro_lower
                )
                if is_sobrecarga:
                    await asyncio.sleep(0.5)
                    continue
                raise HTTPException(status_code=e.code or 500, detail=ultimo_erro)

            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(
        status_code=503,
        detail=f"Modelos indisponíveis por alta demanda. Último erro: {ultimo_erro}",
    )


async def processar_imagem(
    client: genai.Client,
    imagem: bytes,
    mime_type: str,
    lista_referencia: List[str],
    data_compra: Optional[str] = None,
) -> RespostaOCRImagem:
    user_prompt = f"""
LISTA DE REFERÊNCIA DE PRODUTOS CONHECIDOS:
{json.dumps(lista_referencia, ensure_ascii=False, indent=2)}

Leia o cupom fiscal anexado e retorne o texto OCR completo junto com os itens
alimentícios identificados na imagem.

DATA DA COMPRA:
{data_compra or "Não informada"}
"""

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION_IMAGEM,
        response_mime_type="application/json",
        response_schema=RespostaOCRImagem,
        temperature=0.1,
    )
    conteudo = [types.Part.from_bytes(data=imagem, mime_type=mime_type), user_prompt]
    ultimo_erro = None

    for modelo in MODELOS_DISPONIVEIS:
        try:
            response = await client.aio.models.generate_content(
                model=modelo,
                contents=conteudo,
                config=config,
            )
            dados = json.loads(response.text)
            return RespostaOCRImagem(**dados)
        except APIError as e:
            ultimo_erro = str(e)
            erro_lower = ultimo_erro.lower()
            is_sobrecarga = (
                e.code in (403, 429, 503)
                or "high demand" in erro_lower
                or "overloaded" in erro_lower
            )
            if is_sobrecarga:
                await asyncio.sleep(0.5)
                continue
            raise HTTPException(status_code=e.code or 500, detail=ultimo_erro)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(
        status_code=503,
        detail=f"Modelos indisponíveis por alta demanda. Último erro: {ultimo_erro}",
    )


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "gemini_key_configurada": bool(os.getenv("GEMINI_API_KEY")),
    }


@app.post(
    "/api/v1/process-receipt",
    response_model=Union[RespostaOCRImagem, RespostaNotaFiscal],
)
async def process_receipt(payload: OCRRequest, x_api_secret: str = Header(None)):
    internal_secret = os.getenv("INTERNAL_API_SECRET")
    if not internal_secret:
        raise HTTPException(
            status_code=500,
            detail="Variável INTERNAL_API_SECRET não configurada na Vercel."
        )
    if x_api_secret != internal_secret:
        raise HTTPException(status_code=401, detail="Não autorizado")

    if payload.image_base64 is not None:
        if payload.ocr_text is not None:
            raise HTTPException(status_code=400, detail="Envie texto OCR ou imagem, não ambos.")
        if payload.mime_type not in TIPOS_IMAGEM_SUPORTADOS:
            raise HTTPException(status_code=415, detail="Use uma imagem JPEG, PNG ou WebP.")
        try:
            imagem = base64.b64decode(payload.image_base64, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(status_code=400, detail="A imagem enviada não é um Base64 válido.")
        if not imagem:
            raise HTTPException(status_code=400, detail="A imagem enviada está vazia.")
        if len(imagem) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="A imagem deve ter no máximo 3 MB.")
        client = get_gemini_client()
        return await processar_imagem(
            client,
            imagem,
            payload.mime_type,
            payload.lista_referencia,
            payload.data_compra,
        )

    if payload.ocr_text is None:
        raise HTTPException(status_code=400, detail="Envie o texto OCR ou a imagem do cupom.")
    client = get_gemini_client()
    chunks = dividir_em_chunks(payload.ocr_text, tamanho_lote=25)

    if not chunks:
        return RespostaNotaFiscal(itens_alimenticios=[])

    semaphore = asyncio.Semaphore(3)
    resultados_lotes = await asyncio.gather(
        *[
            processar_chunk(
                client,
                semaphore,
                chunk,
                payload.lista_referencia,
                payload.data_compra,
            )
            for chunk in chunks
        ]
    )

    todos_itens = [item for lote in resultados_lotes for item in lote]
    return RespostaNotaFiscal(itens_alimenticios=todos_itens)