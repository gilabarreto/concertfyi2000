"""Venues do Overture Maps para a tabela `venues` do D1 (server/schema.sql).

    uv run --with duckdb python scripts/overture-venues.py 2026-10-21.0

Baixa só as colunas e categorias de lugar de show nos EUA e no Canadá (~8 min, ~325 mil
linhas) e compara com a última carga guardada em data/overture-venues.parquet. Escreve em
data/overture-sql/ só o que mudou, em arquivos de até 45 mil linhas: o D1 grátis grava 100
mil linhas por dia e cada INSERT conta duas (linha + chave). Um arquivo por dia:

    cd server && npx wrangler d1 execute concertfyi --remote --file ../data/overture-sql/001.sql

Só depois de carregar todos, troque a última carga pela nova (o script imprime o comando).
"""

import os
import sys

import duckdb

RELEASE = sys.argv[1] if len(sys.argv) > 1 else "2026-10-21.0"
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
LAST = os.path.join(DATA, "overture-venues.parquet")
NEW = os.path.join(DATA, f"overture-venues-{RELEASE}.parquet")
OUT = os.path.join(DATA, "overture-sql")
PER_FILE = 45_000

# Onde há show. Restaurante e salão de festa só com nome de palco ("Ironwood Stage & Grill").
CATEGORIES = [
    "music_venue", "stadium_arena", "event_venue", "theatre_venue", "performing_arts_venue",
    "dance_club", "nightlife_venue", "comedy_club", "casino", "alcoholic_beverage_venue",
    "bar", "brewery", "social_club",
]
STAGE_NAME = (
    r"(?i)\b(stage|live|music|hall|theat|arena|ballroom|lounge|saloon|tavern|pub|club|amphi"
    r"|pavilion|roadhouse|cabaret|jazz|blues)\b"
)

q = lambda v: "NULL" if v is None or v == "" else "'" + str(v).replace("'", "''") + "'"
band = lambda lat: int(lat * 4 // 1)


def plan(old, new):
    """SQL que leva o D1 de `old` para `new` ({id: (id, name, category, lat, lon, ...)}).

    O site lê a tabela durante a carga, que leva dias (2 arquivos/dia). Então nenhuma venue
    some no meio: mudou só o dado → INSERT OR REPLACE na mesma chave; mudou de lugar → o
    DELETE da chave velha vai colado ao INSERT da nova; saiu do Overture → DELETE no fim.
    Em 2026-11 o release trocou "HI" por "US-HI" em quase toda linha, e o diff antigo
    (todos os DELETE antes dos INSERT) deixou o D1 dias com 55 mil das 325 mil venues.
    """
    key = lambda r: (band(r[3]), r[4])
    upserts, removals = [], []
    for i, r in new.items():
        was = old.get(i)
        if was == r:
            continue
        if was and key(was) != key(r):
            upserts.append(f"DELETE FROM venues WHERE band = {key(was)[0]} AND lon = {was[4]} AND id = {q(i)};")
        _, name, cat, lat, lon, web, phone, addr = r
        upserts.append(
            f"INSERT OR REPLACE INTO venues (band, lon, id, lat, name, category, website, phone, address) VALUES "
            f"({band(lat)}, {lon}, {q(i)}, {lat}, {q(name)}, {q(cat)}, {q(web)}, {q(phone)}, {q(addr)});"
        )
    for i, r in old.items():
        if i not in new:
            removals.append(f"DELETE FROM venues WHERE band = {band(r[3])} AND lon = {r[4]} AND id = {q(i)};")
    return upserts + removals


def selftest():
    v = lambda i, lat, lon, addr="x": (i, "N", "bar", lat, lon, None, None, addr)
    old = {"same": v("same", 1, 1), "data": v("data", 1, 2, "HI"), "moved": v("moved", 1, 3), "gone": v("gone", 1, 4)}
    new = {"same": v("same", 1, 1), "data": v("data", 1, 2, "US-HI"), "moved": v("moved", 9, 3), "came": v("came", 1, 5)}
    s = plan(old, new)
    assert len(s) == 5, s  # "same" não gera nada
    assert s[0].startswith("INSERT") and "'US-HI'" in s[0]  # dado mudou: sem DELETE antes
    assert s[1].startswith("DELETE") and "'moved'" in s[1] and s[2].startswith("INSERT") and "'moved'" in s[2]
    assert s[3].startswith("INSERT") and "'came'" in s[3]
    assert s[4].startswith("DELETE") and "'gone'" in s[4]  # saída pura só no fim
    print("selftest ok")


def main():
    os.makedirs(OUT, exist_ok=True)
    db = duckdb.connect()
    db.sql("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';")
    if not os.path.exists(NEW):
        db.sql(f"""
        COPY (
          SELECT id, names.primary AS name, basic_category AS category,
            round((bbox.ymin + bbox.ymax) / 2, 6) AS lat, round((bbox.xmin + bbox.xmax) / 2, 6) AS lon,
            websites[1] AS website, phones[1] AS phone,
            concat_ws(', ', addresses[1].freeform, addresses[1].locality, addresses[1].region) AS address
          FROM read_parquet('s3://overturemaps-us-west-2/release/{RELEASE}/theme=places/type=place/*',
                            hive_partitioning = 1)
          WHERE bbox.xmin BETWEEN -170 AND -50 AND bbox.ymin BETWEEN 15 AND 75
            AND addresses[1].country IN ('US', 'CA') AND names.primary IS NOT NULL
            AND (basic_category IN ({", ".join(repr(c) for c in CATEGORIES)})
                 OR (basic_category IN ('restaurant', 'event_or_party_service', 'social_or_community_service')
                     AND regexp_matches(names.primary, '{STAGE_NAME}')))
        ) TO '{NEW}.part' (FORMAT parquet)""")
        os.replace(NEW + ".part", NEW)  # interrompido no meio, não deixa um arquivo pela metade

    new = f"read_parquet('{NEW}')"
    last = f"read_parquet('{LAST}')" if os.path.exists(LAST) else f"(SELECT * FROM {new} LIMIT 0)"
    cols = "id, name, category, lat, lon, website, phone, address"
    statements = plan(
        {r[0]: r for r in db.sql(f"SELECT {cols} FROM {last}").fetchall()},
        {r[0]: r for r in db.sql(f"SELECT {cols} FROM {new}").fetchall()},
    )
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))
    for n in range(0, len(statements), PER_FILE):
        with open(os.path.join(OUT, f"{n // PER_FILE + 1:03}.sql"), "w") as f:
            f.write("\n".join(statements[n : n + PER_FILE]) + "\n")
    print(f"{len(statements)} gravações: {-(-len(statements) // PER_FILE)} arquivo(s) em {OUT}")
    print(f"Depois de carregar todos: mv {NEW} {LAST}")


if __name__ == "__main__":
    selftest() if "--selftest" in sys.argv else main()
