"""
Teste de Contrato — UC01: Visualizar leituras dos sensores
==========================================================
Valida que a API aceita exatamente o schema que o firmware ESP32 publica.
Ancora na linha UC01 da matriz de risco em docs/test-strategy.md.

Como rodar:
    # Contra a API de referência da aula:
    cd aula-13/assets/api-horta-ref/ && uvicorn main:app --reload &
    pytest tests/contract/test_api_leituras.py -v

    # Contra a API própria (quando disponível):
    pytest tests/contract/test_api_leituras.py -v --base-url=http://localhost:8000
"""

import pytest
import requests
import jsonschema

# URL da API de referência (aula-13/assets/api-horta-ref/)
BASE_URL = "http://localhost:8000"

# Schema exato que o firmware ESP32 envia — versionado aqui como fonte de verdade.
# Se o firmware mudar o payload, este schema DEVE ser atualizado antes do merge.
SCHEMA_LEITURA_ESP32 = {
    "type": "object",
    "required": ["temperatura", "umidade", "nivel_agua"],
    "properties": {
        "temperatura": {
            "type": "number",
            "minimum": -10,
            "maximum": 60,
            "description": "Temperatura em graus Celsius"
        },
        "umidade": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Umidade do solo em porcentagem"
        },
        "nivel_agua": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Nível do reservatório de água em porcentagem"
        }
    },
    "additionalProperties": False
}

# Payload válido — replica exatamente o que o ESP32 envia
PAYLOAD_VALIDO = {
    "temperatura": 28.5,
    "umidade": 62.0,
    "nivel_agua": 80.0
}


class TestContratoLeituras:
    """
    Contrato: POST /leituras deve aceitar o schema do ESP32 e retornar 201.
    Âncora: UC01 — linha 1 da matriz de risco (docs/test-strategy.md).
    """

    def test_payload_valido_schema_correto(self):
        """O schema do payload que vamos enviar é válido segundo o contrato."""
        # Valida o schema localmente (sem depender da API ainda)
        jsonschema.validate(instance=PAYLOAD_VALIDO, schema=SCHEMA_LEITURA_ESP32)
        # Se chegou aqui, o schema está correto

    def test_api_aceita_payload_do_esp32_retorna_201(self):
        """
        A API deve aceitar o payload do ESP32 e retornar HTTP 201.
        Esse é o contrato principal: se falhar, o sensor não consegue registrar leituras.
        """
        response = requests.post(f"{BASE_URL}/leituras", json=PAYLOAD_VALIDO, timeout=5)

        assert response.status_code == 201, (
            f"API retornou {response.status_code} em vez de 201. "
            f"Resposta: {response.text}. "
            f"RISCO: firmware não consegue registrar leituras."
        )

    def test_api_retorna_id_na_resposta(self):
        """
        A resposta deve conter o campo 'id' da leitura criada.
        O frontend usa esse campo para rastrear leituras individuais.
        """
        response = requests.post(f"{BASE_URL}/leituras", json=PAYLOAD_VALIDO, timeout=5)

        assert response.status_code == 201
        body = response.json()
        assert "id" in body, (
            f"Campo 'id' ausente na resposta. Body recebido: {body}. "
            f"RISCO: frontend não consegue rastrear leituras."
        )

    def test_api_rejeita_payload_sem_campo_umidade(self):
        """
        Se o campo 'umidade' estiver ausente, a API deve retornar 422.
        Garante que a API não aceita dados incompletos silenciosamente.
        """
        payload_incompleto = {
            "temperatura": 28.5,
            "nivel_agua": 80.0
            # 'umidade' propositalmente ausente
        }

        response = requests.post(f"{BASE_URL}/leituras", json=payload_incompleto, timeout=5)

        assert response.status_code == 422, (
            f"API aceitou payload sem 'umidade' (retornou {response.status_code}). "
            f"RISCO: leituras inválidas persistem no banco com null para umidade."
        )

    def test_api_rejeita_temperatura_fora_do_range(self):
        """
        Temperatura fora do range físico do sensor (-10 a 60°C) deve ser rejeitada.
        """
        payload_invalido = {
            "temperatura": 999.0,  # impossível para sensor de horta
            "umidade": 62.0,
            "nivel_agua": 80.0
        }

        response = requests.post(f"{BASE_URL}/leituras", json=payload_invalido, timeout=5)

        assert response.status_code == 422, (
            f"API aceitou temperatura=999 (retornou {response.status_code}). "
            f"RISCO: leituras corrompidas distorcem o histórico e disparam irrigação errada."
        )
