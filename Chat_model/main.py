import os
import json
from typing import List
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

# 1. Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# 2. Inicializa a aplicação FastAPI
app = FastAPI(title="Microserviço de OCR e Inteligência Fiscal")

# -------------------------------------------------------------------
# SCHEMA PYDANTIC PARA O GEMINI STRUCTURED OUTPUT
# -------------------------------------------------------------------
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
    is_item_novo: bool = Field(
        description="True se NÃO constar na lista de referência fornecida; False caso já exista."
    )
    categoria: str = Field(
        description="Categoria: Laticínios, Mercearia, Hortifrúti, Açougue/Peixaria, Bebidas, Padaria ou Outros."
    )

class RespostaNotaFiscal(BaseModel):
    itens_alimenticios: List[ItemAlimenticio]

# -------------------------------------------------------------------
# SCHEMAS DE REQUISIÇÃO DA API FASTAPI
# -------------------------------------------------------------------
class OCRRequest(BaseModel):
    ocr_text: str
    lista_referencia: List[str]

# -------------------------------------------------------------------
# PROMPT SYSTEM INSTRUCTION
# -------------------------------------------------------------------
SYSTEM_INSTRUCTION = """
Você é um sistema especialista em auditoria de compras e taxonomia de alimentos no Brasil.

REGRAS:
1. Extraia EXCLUSIVAMENTE produtos alimentícios (ignore limpeza, higiene, utilidades).
2. Remova marcas, selos e fabricantes (ex: "IOG NAT NESTLE 170G" -> "Iogurte").
3. Separe a quantidade numérica e a unidade de medida (g, kg, ml, l, un, cx).
4. Compare o produto padronizado com a lista de referência recebida. Se o produto não constar na lista, marque `is_item_novo = true`.
"""

# Inicializa o cliente do Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Variável GEMINI_API_KEY não configurada no arquivo .env.")

client = genai.Client(api_key=GEMINI_API_KEY)

# -------------------------------------------------------------------
# ENDPOINT DO MICROSERVIÇO
# -------------------------------------------------------------------
@app.post("/api/v1/process-receipt", response_model=RespostaNotaFiscal)
async def process_receipt(payload: OCRRequest, x_api_secret: str = Header(None)):
    # Validação simples de segurança entre backend Node.js e microserviço Python
    INTERNAL_SECRET = os.getenv("INTERNAL_API_SECRET", "super-segredo-interno")
    if x_api_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Não autorizado")

    try:
        user_prompt = f"""
LISTA DE REFERÊNCIA DE PRODUTOS CONHECIDOS:
{json.dumps(payload.lista_referencia, ensure_ascii=False, indent=2)}

TEXTO DO OCR DA NOTA FISCAL:
---
{payload.ocr_text}
---
"""

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=RespostaNotaFiscal,
            temperature=0.1,
        )

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=user_prompt,
            config=config,
        )

        return json.loads(response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))