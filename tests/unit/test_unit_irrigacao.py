"""
Testes Unitários — UC-02 e UC-04
=================================
UC-02: Testa a lógica de irrigação automática (deve_irrigar)
UC-04: Testa a validação do threshold de umidade (validar_threshold)

Como rodar:
    pytest tests/unit/test_unit_irrigacao.py -v
"""

import pytest


# ------------------------------------------------------------------
# Funções de domínio
# Em produção ficam em app/domain/irrigacao.py
# ------------------------------------------------------------------

def deve_irrigar(umidade, threshold):
    """Retorna True se o solo está seco o suficiente para irrigar."""
    return umidade < threshold


def validar_threshold(valor):
    """
    Valida o threshold antes de salvar no banco.
    Aceita apenas números entre 0 e 100.
    """
    if not isinstance(valor, (int, float)):
        raise TypeError("Threshold precisa ser um número")
    if valor < 0 or valor > 100:
        raise ValueError("Threshold precisa estar entre 0 e 100")
    return float(valor)


# ------------------------------------------------------------------
# UC-02 — deve_irrigar
# ------------------------------------------------------------------

def test_irriga_quando_solo_esta_seco():
    # Umidade 42% abaixo do limite 60% → deve irrigar
    assert deve_irrigar(42.0, 60.0) == True

def test_nao_irriga_quando_solo_esta_umido():
    # Umidade 75% acima do limite 60% → não irriga
    assert deve_irrigar(75.0, 60.0) == False

def test_nao_irriga_quando_umidade_igual_ao_threshold():
    # Exatamente no limite → não irriga (regra: só irriga se MENOR)
    assert deve_irrigar(60.0, 60.0) == False

def test_irriga_com_solo_completamente_seco():
    assert deve_irrigar(0.0, 60.0) == True

def test_nao_irriga_com_solo_completamente_encharcado():
    assert deve_irrigar(100.0, 60.0) == False

def test_irriga_quando_muito_proximo_do_limite():
    # 59.9% está abaixo de 60% → deve irrigar
    assert deve_irrigar(59.9, 60.0) == True

def test_nao_irriga_quando_pouquinho_acima_do_limite():
    # 60.1% está acima de 60% → não irriga
    assert deve_irrigar(60.1, 60.0) == False


# ------------------------------------------------------------------
# UC-04 — validar_threshold
# ------------------------------------------------------------------

def test_threshold_normal_e_aceito():
    assert validar_threshold(60) == 60.0

def test_threshold_zero_e_valido():
    assert validar_threshold(0) == 0.0

def test_threshold_cem_e_valido():
    assert validar_threshold(100) == 100.0

def test_threshold_decimal_e_aceito():
    assert validar_threshold(55.5) == 55.5

def test_threshold_negativo_e_rejeitado():
    # -5 faria a bomba ficar ligada pra sempre
    with pytest.raises(ValueError):
        validar_threshold(-5)

def test_threshold_acima_de_100_e_rejeitado():
    with pytest.raises(ValueError):
        validar_threshold(101)

def test_threshold_string_e_rejeitado():
    with pytest.raises(TypeError):
        validar_threshold("60")

def test_threshold_none_e_rejeitado():
    with pytest.raises(TypeError):
        validar_threshold(None)
