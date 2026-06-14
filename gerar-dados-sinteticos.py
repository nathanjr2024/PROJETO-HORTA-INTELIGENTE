#!/usr/bin/env python3
"""
Gerador de dados sintéticos — Horta Comunitária Inteligente (PI 2026/1)

Gera CSVs realistas para alimentar o sistema sem depender de sensores reais.
Sem dependências externas (só stdlib).

Uso:
    python3 gerar-dados-sinteticos.py              # padrão: 180 dias, 4 canteiros
    python3 gerar-dados-sinteticos.py --dias 90     # customizar período
    python3 gerar-dados-sinteticos.py --seed 42     # resultado reprodutível
"""

import argparse
import csv
import math
import os
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Parâmetros ajustáveis
# ---------------------------------------------------------------------------

INTERVALO_LEITURA_MIN = 5

CANTEIROS = [
    {"id": 1, "nome": "Canteiro A — Hortaliças folhosas", "cultura": "Alface e Rúcula"},
    {"id": 2, "nome": "Canteiro B — Temperos", "cultura": "Manjericão e Cebolinha"},
    {"id": 3, "nome": "Canteiro C — Leguminosas", "cultura": "Feijão-vagem"},
    {"id": 4, "nome": "Canteiro D — Raízes", "cultura": "Cenoura e Beterraba"},
]

SENSORES_POR_CANTEIRO = [
    {"tipo": "DHT22", "mede": "temperatura_ar,umidade_ar"},
    {"tipo": "Capacitivo", "mede": "umidade_solo"},
    {"tipo": "LDR", "mede": "luminosidade"},
]

USUARIOS = [
    {"id": 1, "nome": "Maria Silva", "email": "maria@horta.local", "papel": "admin"},
    {"id": 2, "nome": "João Santos", "email": "joao@horta.local", "papel": "operador"},
    {"id": 3, "nome": "Ana Costa", "email": "ana@horta.local", "papel": "visualizador"},
]

REGRA_IRRIGACAO_UMIDADE = 40.0
REGRA_IRRIGACAO_LUX = 500.0
DURACAO_IRRIGACAO_MIN = (3, 8)


# ---------------------------------------------------------------------------
# Funções de geração de dados realistas
# ---------------------------------------------------------------------------

def hora_fracionaria(dt: datetime) -> float:
    return dt.hour + dt.minute / 60.0


def temperatura_ar(dt: datetime, rng: random.Random) -> float:
    hora = hora_fracionaria(dt)
    dia_ano = dt.timetuple().tm_yday

    # sazonalidade — hemisfério sul: jan quente, jun-ago frio (Engenheiro Coelho/SP)
    sazonal = 5.0 * math.cos(2 * math.pi * (dia_ano - 15) / 365)

    # ciclo diário: máxima ~14h, mínima ~2h
    diurno = 5.0 * math.cos(2 * math.pi * (hora - 14) / 24)

    base = 22.0 + sazonal + diurno
    return round(base + rng.gauss(0, 1.2), 1)


def umidade_ar(temp: float, dt: datetime, rng: random.Random) -> float:
    # correlação inversa com temperatura + variação
    base = 80 - (temp - 18) * 1.5
    hora = hora_fracionaria(dt)
    # madrugada mais úmida
    noturno = 5.0 * math.cos(2 * math.pi * (hora - 4) / 24)
    valor = base + noturno + rng.gauss(0, 3)
    return round(max(30, min(99, valor)), 1)


def luminosidade(dt: datetime, rng: random.Random) -> float:
    hora = hora_fracionaria(dt)
    if hora < 5.5 or hora > 18.5:
        return round(max(0, rng.gauss(5, 3)), 0)

    # curva de sino centrada no meio-dia
    pico = 12.0
    spread = 3.5
    fator = math.exp(-((hora - pico) ** 2) / (2 * spread ** 2))
    base = 900 * fator

    # dias nublados (~20% das vezes)
    if rng.random() < 0.20:
        base *= rng.uniform(0.2, 0.5)

    return round(max(0, base + rng.gauss(0, 30)), 0)


class SimuladorSolo:
    """Simula umidade do solo com decaimento e reposição por irrigação."""

    def __init__(self, rng: random.Random, cultura: str):
        self.rng = rng
        self.umidade = rng.uniform(55, 70)
        # taxa de secagem varia por cultura
        self.taxa_secagem_base = 0.015 if "Alface" in cultura else 0.012

    def atualizar(self, temp: float, lux: float, irrigou: bool, minutos: int = 5) -> float:
        # evaporação maior com mais calor e sol
        fator_temp = 1 + max(0, temp - 25) * 0.02
        fator_sol = 1 + max(0, lux - 300) * 0.0005
        perda = self.taxa_secagem_base * fator_temp * fator_sol * minutos
        self.umidade -= perda

        if irrigou:
            self.umidade += self.rng.uniform(20, 30)

        # chuva esporádica (~5% dos intervalos diurnos)
        if 6 < (minutos / 60) < 18 and self.rng.random() < 0.001:
            self.umidade += self.rng.uniform(10, 25)

        self.umidade = max(10, min(95, self.umidade))
        return round(self.umidade + self.rng.gauss(0, 0.8), 1)


# ---------------------------------------------------------------------------
# Geração principal
# ---------------------------------------------------------------------------

def gerar(dias: int, seed: int | None, output_dir: Path):
    rng = random.Random(seed)
    output_dir.mkdir(parents=True, exist_ok=True)

    inicio = datetime(2026, 1, 1, 0, 0, 0)
    fim = inicio + timedelta(days=dias)
    total_pontos = int(dias * 24 * 60 / INTERVALO_LEITURA_MIN)

    # --- Cadastros estáticos ---
    sensores = []
    sensor_id = 0
    for cant in CANTEIROS:
        for s in SENSORES_POR_CANTEIRO:
            sensor_id += 1
            sensores.append({
                "id": sensor_id,
                "canteiro_id": cant["id"],
                "tipo": s["tipo"],
                "mede": s["mede"],
                "modelo": s["tipo"],
                "instalado_em": inicio.strftime("%Y-%m-%d"),
                "ativo": True,
            })

    _escrever_csv(output_dir / "usuarios.csv", USUARIOS, ["id", "nome", "email", "papel"])

    _escrever_csv(
        output_dir / "canteiros.csv",
        [{"id": c["id"], "nome": c["nome"], "cultura": c["cultura"]} for c in CANTEIROS],
        ["id", "nome", "cultura"],
    )

    culturas = []
    for i, c in enumerate(CANTEIROS, 1):
        culturas.append({"id": i, "nome": c["cultura"], "canteiro_id": c["id"]})
    _escrever_csv(output_dir / "culturas.csv", culturas, ["id", "nome", "canteiro_id"])

    _escrever_csv(
        output_dir / "sensores.csv",
        sensores,
        ["id", "canteiro_id", "tipo", "mede", "modelo", "instalado_em", "ativo"],
    )

    # --- Leituras e irrigações ---
    solos = {c["id"]: SimuladorSolo(rng, c["cultura"]) for c in CANTEIROS}

    leituras_file = output_dir / "leituras.csv"
    irrigacoes_file = output_dir / "irrigacoes.csv"

    leitura_id = 0
    irrigacao_id = 0

    with (
        open(leituras_file, "w", newline="") as lf,
        open(irrigacoes_file, "w", newline="") as irf,
    ):
        lw = csv.writer(lf)
        lw.writerow([
            "id", "sensor_id", "canteiro_id", "timestamp",
            "temperatura_ar", "umidade_ar", "umidade_solo", "luminosidade",
        ])

        iw = csv.writer(irf)
        iw.writerow([
            "id", "canteiro_id", "timestamp_inicio", "timestamp_fim",
            "duracao_min", "umidade_solo_antes", "umidade_solo_depois",
            "acionado_por",
        ])

        dt = inicio
        passo = timedelta(minutes=INTERVALO_LEITURA_MIN)

        for _ in range(total_pontos):
            temp = temperatura_ar(dt, rng)
            um_ar = umidade_ar(temp, dt, rng)
            lux = luminosidade(dt, rng)

            for cant in CANTEIROS:
                cid = cant["id"]
                solo = solos[cid]

                # decidir irrigação ANTES de atualizar solo
                irrigou = (
                    solo.umidade < REGRA_IRRIGACAO_UMIDADE
                    and lux < REGRA_IRRIGACAO_LUX
                )

                umidade_antes = round(solo.umidade, 1)
                um_solo = solo.atualizar(temp, lux, irrigou)

                leitura_id += 1
                lw.writerow([
                    leitura_id,
                    _sensor_id_para(sensores, cid, "DHT22"),
                    cid,
                    dt.strftime("%Y-%m-%d %H:%M:%S"),
                    temp,
                    um_ar,
                    um_solo,
                    lux,
                ])

                if irrigou:
                    irrigacao_id += 1
                    dur = rng.randint(*DURACAO_IRRIGACAO_MIN)
                    fim_irr = dt + timedelta(minutes=dur)
                    iw.writerow([
                        irrigacao_id,
                        cid,
                        dt.strftime("%Y-%m-%d %H:%M:%S"),
                        fim_irr.strftime("%Y-%m-%d %H:%M:%S"),
                        dur,
                        umidade_antes,
                        round(solo.umidade, 1),
                        "automatico",
                    ])

            dt += passo

    # --- Seed SQL ---
    _gerar_seed_sql(output_dir, sensores, culturas)

    # --- Resumo ---
    print(f"Dados gerados em: {output_dir}/")
    print(f"  Período: {inicio.date()} a {(fim - timedelta(days=1)).date()} ({dias} dias)")
    print(f"  Leituras: {leitura_id:,} registros")
    print(f"  Irrigações: {irrigacao_id:,} eventos")
    print(f"  Arquivos: usuarios.csv, canteiros.csv, culturas.csv, sensores.csv,")
    print(f"            leituras.csv, irrigacoes.csv, seed.sql")


def _sensor_id_para(sensores: list, canteiro_id: int, tipo: str) -> int:
    for s in sensores:
        if s["canteiro_id"] == canteiro_id and s["tipo"] == tipo:
            return s["id"]
    return 0


def _escrever_csv(path: Path, rows: list[dict], campos: list[str]):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(rows)


def _gerar_seed_sql(output_dir: Path, sensores: list, culturas: list):
    with open(output_dir / "seed.sql", "w") as f:
        f.write("-- Seed SQL gerado automaticamente\n")
        f.write("-- Rode os CSVs pelo LOAD DATA / COPY ou use estes INSERTs para cadastros\n\n")

        f.write("-- Usuários\n")
        for u in USUARIOS:
            f.write(
                f"INSERT INTO usuarios (id, nome, email, papel) "
                f"VALUES ({u['id']}, '{u['nome']}', '{u['email']}', '{u['papel']}');\n"
            )

        f.write("\n-- Canteiros\n")
        for c in CANTEIROS:
            f.write(
                f"INSERT INTO canteiros (id, nome) "
                f"VALUES ({c['id']}, '{c['nome']}');\n"
            )

        f.write("\n-- Culturas\n")
        for c in culturas:
            f.write(
                f"INSERT INTO culturas (id, nome, canteiro_id) "
                f"VALUES ({c['id']}, '{c['nome']}', {c['canteiro_id']});\n"
            )

        f.write("\n-- Sensores\n")
        for s in sensores:
            f.write(
                f"INSERT INTO sensores (id, canteiro_id, tipo, mede, modelo, instalado_em, ativo) "
                f"VALUES ({s['id']}, {s['canteiro_id']}, '{s['tipo']}', '{s['mede']}', "
                f"'{s['modelo']}', '{s['instalado_em']}', {s['ativo']});\n"
            )

        f.write("\n-- Leituras e Irrigações: importar dos CSVs\n")
        f.write("-- MySQL:      LOAD DATA INFILE 'leituras.csv' INTO TABLE leituras ...\n")
        f.write("-- PostgreSQL: \\COPY leituras FROM 'leituras.csv' CSV HEADER;\n")
        f.write("-- Firebase:   usar script de importação JSON\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gera dados sintéticos da Horta Inteligente")
    parser.add_argument("--dias", type=int, default=180, help="Dias de dados (padrão: 180)")
    parser.add_argument("--seed", type=int, default=None, help="Seed para reprodutibilidade")
    parser.add_argument("--output", type=str, default=None, help="Diretório de saída")
    args = parser.parse_args()

    out = Path(args.output) if args.output else Path(__file__).parent / "dados-sinteticos"
    gerar(args.dias, args.seed, out)
