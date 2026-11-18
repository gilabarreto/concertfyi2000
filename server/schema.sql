-- Uma tabela chave-valor (SPEC-venues.md). `expires_at` em segundos Unix: depois dele a
-- fonte é checada de novo, mas a linha só é trocada se a checagem der certo.
CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER NOT NULL);

-- Venues do Overture Maps (CDLA-Permissive 2.0: pode guardar), EUA e Canadá, carregadas por
-- scripts/overture-venues.py. Sem índice extra de propósito: no D1 cada índice conta mais uma
-- linha gravada, e o plano grátis grava 100 mil por dia. A chave já é o índice da busca:
-- faixa de latitude (lat * 4, ~28 km) e longitude em ordem dentro dela.
CREATE TABLE IF NOT EXISTS venues (band INTEGER NOT NULL, lon REAL NOT NULL, id TEXT NOT NULL, lat REAL NOT NULL, name TEXT NOT NULL, category TEXT, website TEXT, phone TEXT, address TEXT, PRIMARY KEY (band, lon, id)) WITHOUT ROWID;
