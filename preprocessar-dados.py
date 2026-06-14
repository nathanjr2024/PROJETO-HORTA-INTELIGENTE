#!/usr/bin/env python3
"""
Script one-shot: pré-processa CSVs em JSONs para o mock do frontend.
Não vai para o git.
"""
import csv, json, math
from pathlib import Path
from datetime import datetime, timedelta

INPUT = Path("dados-sinteticos")
OUTPUT = Path("frontend/src/services/data")
OUTPUT.mkdir(parents=True, exist_ok=True)

# --- Carregar leituras do Canteiro 1 ---
leituras = []
with open(INPUT / "leituras.csv", newline="") as f:
    for row in csv.DictReader(f):
        if row["canteiro_id"] == "1":
            leituras.append({
                "ts": row["timestamp"],
                "umidade": float(row["umidade_solo"]),
                "temperatura": float(row["temperatura_ar"]),
            })

leituras.sort(key=lambda x: x["ts"])
total = len(leituras)
print(f"Leituras Canteiro 1: {total}")

def downsample(data, n):
    """Pega n pontos espaçados uniformemente."""
    if len(data) <= n:
        return data
    step = len(data) / n
    return [data[int(i * step)] for i in range(n)]

def formatar(data, label_fmt="%H:%M"):
    return [
        {
            "hora": datetime.strptime(p["ts"], "%Y-%m-%d %H:%M:%S").strftime(label_fmt),
            "umidade": round(p["umidade"], 1),
            "temperatura": round(p["temperatura"], 1),
        }
        for p in data
    ]

# 24h = últimos 288 registros (5min × 288 = 1440 min), downsample para 48
ultimos_24h = leituras[-288:]
hist_24h = formatar(downsample(ultimos_24h, 48))

# 7d = últimos 2016 registros, downsample para 168
ultimos_7d = leituras[-2016:]
hist_7d = formatar(downsample(ultimos_7d, 168), "%d/%m %Hh")

# 30d = todos os registros (37 dias), downsample para 180
hist_30d = formatar(downsample(leituras, 180), "%d/%m")

# --- Irrigações do Canteiro 1 ---
irrigacoes = []
with open(INPUT / "irrigacoes.csv", newline="") as f:
    for row in csv.DictReader(f):
        if row["canteiro_id"] == "1":
            irrigacoes.append({
                "id": int(row["id"]),
                "timestampInicio": row["timestamp_inicio"],
                "duracao_min": int(row["duracao_min"]),
                "umidadeSoloAntes": float(row["umidade_solo_antes"]),
                "umidadeSoloDepois": float(row["umidade_solo_depois"]),
                "acionadoPor": row["acionado_por"],
            })

# --- Relatório semanal (4 semanas) ---
def semanas(leituras_raw, irrigacoes_raw):
    result = []
    # Dividir em 4 blocos de ~9 dias (37 dias / 4)
    block = len(leituras_raw) // 4
    for i in range(4):
        bloco = leituras_raw[i * block:(i + 1) * block]
        inicio = datetime.strptime(bloco[0]["ts"], "%Y-%m-%d %H:%M:%S")
        fim = datetime.strptime(bloco[-1]["ts"], "%Y-%m-%d %H:%M:%S")
        # Contar irrigações no período
        irr_periodo = [
            ir for ir in irrigacoes_raw
            if inicio.strftime("%Y-%m-%d") <= ir["timestampInicio"][:10] <= fim.strftime("%Y-%m-%d")
        ]
        # Estimar consumo: média de 5L/min por irrigação
        consumo = round(sum(ir["duracao_min"] * 5 for ir in irr_periodo), 1)
        result.append({
            "semana": f"{inicio.strftime('%d/%m')}–{fim.strftime('%d/%m')}",
            "qtdIrrigacoes": len(irr_periodo),
            "consumoAgua_litros": consumo,
        })
    return result

relatorio = semanas(leituras, irrigacoes)

# --- Salvar JSONs ---
def salvar(nome, dados):
    path = OUTPUT / nome
    with open(path, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    print(f"  {path} — {len(dados)} registros")

print("Gerando JSONs em", OUTPUT)
salvar("historico-24h.json", hist_24h)
salvar("historico-7d.json", hist_7d)
salvar("historico-30d.json", hist_30d)
salvar("irrigacoes.json", irrigacoes)
salvar("relatorio-semanal.json", relatorio)
print("Pronto.")
