#!/usr/bin/env bash
# Mediana de 3 rodadas do Lighthouse mobile em cada URL. Uma rodada sozinha não diz nada:
# a Home sorteia as fotos do carrossel e anda ±7 pontos entre rodadas (CONSTRAINTS.md).
# Imprime uma tabela em Markdown e sai com 1 se alguma mediana passar do piso abaixo.
#   CHROME_PATH=... scripts/vitals.sh https://concertfyi.com/ ...
# Pisos frouxos de propósito: o runner do GitHub não é o aparelho do CONSTRAINTS, e o que
# se quer pegar é regressão grande, não ruído. LCP e CLS nos limites "ruim" do Google.
set -euo pipefail
MIN_SCORE=50 MAX_LCP_MS=8000 MAX_CLS=0.25
LIGHTHOUSE=lighthouse@13.6.0
work=$(mktemp -d)
status=0
echo "| Página | Performance | LCP | CLS | TBT |"
echo "|---|---|---|---|---|"
for url in "$@"; do
  for run in 1 2 3; do
    (cd "$work" && npx -y "$LIGHTHOUSE" "$url" --quiet --only-categories=performance \
      --output=json --output-path="$work/$run.json" \
      --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage") >/dev/null 2>&1 || true
  done
  median() { jq -s "map($1 // empty) | sort | if length == 0 then null else .[length / 2 | floor] end" "$work"/[123].json; }
  score=$(median '.categories.performance.score * 100 | round')
  lcp=$(median '.audits["largest-contentful-paint"].numericValue | round')
  cls=$(median '.audits["cumulative-layout-shift"].numericValue')
  tbt=$(median '.audits["total-blocking-time"].numericValue | round')
  rm -f "$work"/[123].json
  if [ "$score" = null ]; then
    echo "| $url | falhou | | | |"; status=1; continue
  fi
  echo "| $url | $score | ${lcp} ms | $(printf %.3f "$cls") | ${tbt} ms |"
  if [ "$score" -lt "$MIN_SCORE" ] || [ "$lcp" -gt "$MAX_LCP_MS" ] ||
    awk -v c="$cls" -v m="$MAX_CLS" 'BEGIN { exit !(c > m) }'; then
    status=1
  fi
done
exit $status
