-- Uma tabela chave-valor (SPEC-venues.md). `expires_at` em segundos Unix: depois dele a
-- fonte é checada de novo, mas a linha só é trocada se a checagem der certo.
CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER NOT NULL);
