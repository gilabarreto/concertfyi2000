import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useApiLab } from "../api/apiLabQuery";
import catalog from "../data/apiCatalog.json";
import provenance from "../data/apiProvenance.json";

const API_SOURCES = catalog.map(({ id, name, docsUrl }) => [id, name, docsUrl]);

const asText = (value) => (typeof value === "string" ? value : "");

function highlight(result) {
  const data = result.data;
  if (!data) return "";
  if (result.id === "musicbrainz") {
    const members = data.relations?.filter((relation) => relation.type === "member of band") || [];
    return [
      data.type,
      data["life-span"]?.begin,
      data["begin-area"]?.name,
      data.genres
        ?.map((genre) => genre.name)
        .slice(0, 6)
        .join(", "),
      members
        .map((relation) => relation.artist?.name)
        .filter(Boolean)
        .join(", "),
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (result.id === "setlistfm")
    return `${data.total ?? 0} setlists encontrados; exibindo até ${data.setlist?.length || 0}.`;
  if (result.id === "ticketmaster") {
    const attraction = data._embedded?.attractions?.[0];
    return attraction
      ? `${attraction.name} · ${attraction.classifications?.[0]?.genre?.name || "sem gênero"} · ${attraction.images?.length || 0} imagens`
      : "Nenhuma atração encontrada.";
  }
  if (result.id === "audiodb") {
    const profile = data.profile || {};
    return [
      data.artistName,
      profile.country,
      profile.formedYear,
      profile.genre,
      `${data.images?.length || 0} imagens`,
      `${profile.biography?.length || 0} caracteres de biografia`,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (result.id === "eventart")
    return data.artwork
      ? `Pôster encontrado: ${data.artwork.sourceUrl}`
      : "A consulta do show não retornou pôster.";
  if (result.id === "coverart")
    return data.artwork?.length
      ? `${data.artwork.length} imagens do release “${data.releaseGroup?.title}”.`
      : `Nenhuma capa para “${data.releaseGroup?.title || "o release consultado"}”.`;
  if (result.id === "listenbrainz")
    return `${Array.isArray(data) ? data.length : 0} gravações populares retornadas.`;
  if (result.id === "commons")
    return `${Array.isArray(data) ? data.length : 0} arquivos encontrados; confira a licença individual.`;
  if (result.id === "wikidata") {
    const fields = data.fields || {};
    return [
      data.match?.id,
      data.match?.label,
      data.match?.description,
      fields.inception,
      fields.countryOfOrigin,
      fields.genres?.join(", "),
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (result.id === "wikipedia")
    return `${data.description || ""} · ${data.extract?.length || 0} caracteres de resumo.`;
  if (result.id === "archive") return `${data.length || 0} itens encontrados.`;
  if (result.id === "github") return `${data.total || 0} repositórios encontrados.`;
  if (result.id === "youtube") return `${data.length || 0} vídeos encontrados.`;
  return "Resposta disponível abaixo.";
}

function imageResults(result) {
  if (result.id === "audiodb") {
    return (result.data?.images || []).map((image) => ({
      url: image.imageUrl,
      href: result.data.sourceUrl,
      label: image.label,
    }));
  }
  if (result.id === "commons") {
    return (result.data || [])
      .filter((image) => image.imageUrl)
      .map((image) => ({
        url: image.imageUrl,
        href: image.pageUrl,
        label: `${image.title} · ${image.license}`,
      }));
  }
  if (result.id === "wikipedia") {
    const data = result.data;
    return data.imageUrl ? [{ url: data.imageUrl, href: data.pageUrl, label: data.title }] : [];
  }
  if (result.id === "ticketmaster") {
    return (result.data?._embedded?.attractions?.[0]?.images || []).slice(0, 8).map((image) => ({
      url: image.url,
      href: image.url,
      label: `${image.ratio || "Artist image"} · Ticketmaster`,
    }));
  }
  if (result.id === "coverart") {
    return (result.data?.artwork || [])
      .map((image) => ({
        url: image.thumbnails?.large || image.thumbnails?.small || image.image,
        href: image.image,
        label: (image.types || []).join(", ") || "Album artwork",
      }))
      .filter((image) => image.url);
  }
  return [];
}

function inspectResponse(result) {
  const page = window.open("about:blank", "_blank");
  if (!page) return;
  page.opener = null;
  page.document.title = `${result.name} · API response`;
  const response = page.document.createElement("pre");
  response.textContent = JSON.stringify(result.data ?? result, null, 2);
  response.style.whiteSpace = "pre-wrap";
  response.style.overflowWrap = "anywhere";
  page.document.body.append(response);
}

// sessionStorage: some ao fechar a aba, e recarregar a página no celular não pede de novo.
const TOKEN_KEY = "apiLabToken";
const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

export default function ApiLab() {
  const [results, setResults] = useState(new Map());
  const [token, setToken] = useState(readToken);
  const saveToken = (value) => {
    setToken(value);
    try {
      sessionStorage.setItem(TOKEN_KEY, value);
    } catch {
      // storage bloqueado: a senha vale só enquanto a página estiver aberta
    }
  };
  const [filter, setFilter] = useState("");
  const {
    mutate,
    data,
    isPending: isFetching,
    isError,
    error,
    variables,
  } = useApiLab((response) => {
    setResults(
      (previous) => new Map([...previous, ...response.results.map((item) => [item.id, item])]),
    );
  });

  return (
    <main className="w-full min-w-0 px-4 py-6 sm:px-6">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Test page</p>
          <h1 className="text-3xl font-bold">API lab · fontes e oportunidades</h1>
          <p className="max-w-3xl text-zinc-600">
            Esta tela faz chamadas ao vivo e mostra o que cada fonte devolve. Algumas usam as chaves
            locais já configuradas; fontes que precisam de credenciais adicionais, arquivo de áudio
            ou não têm API pública aparecem com o motivo. Use Test API em cada cartão ou Test all
            APIs para testar todas. Inspect response abre a resposta em uma nova aba.
          </p>
          <label className="block max-w-xs space-y-1 text-sm text-zinc-600">
            <span className="font-semibold">Password</span>
            <input
              type="password"
              value={token}
              onChange={(event) => saveToken(event.target.value)}
              autoComplete="current-password"
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            />
            <span className="block text-xs text-zinc-500">
              Needed on the live site; local dev without API_LAB_TOKEN ignores it.
            </span>
          </label>
          <button
            type="button"
            onClick={() => mutate({ token })}
            disabled={isFetching}
            className="rounded-md bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isFetching && !variables?.source ? "Calling APIs…" : "Test all APIs"}
          </button>
          {isFetching && (
            <p role="status" className="text-sm text-zinc-500">
              This can take several seconds; API quotas apply.
            </p>
          )}
          {isError && (
            <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">
              {error?.status === 401
                ? "Wrong password."
                : error?.status === 404
                  ? "The API lab is off on this server. Set API_LAB_TOKEN on Render, or run the server locally with `npm run dev`."
                  : asText(error?.message) || "Could not reach the API lab server."}
            </p>
          )}
        </header>

        {data && (
          <p className="text-sm text-zinc-500">
            {data.mbid ? (
              <>
                Artist MBID: <code>{data.mbid}</code>
              </>
            ) : (
              "Consulta experimental isolada"
            )}{" "}
            · This page does not change ArtistInfo or save the results.
          </p>
        )}

        <section aria-label="Origem das informações" className="space-y-3">
          <h2 className="text-2xl font-bold">Árvore de dados do ConcertFYI</h2>
          <p className="text-sm text-zinc-600">
            Revisão: 01/10/2026. Sugestões ainda não são fallbacks implementados. Testes legados:
            Foo Fighters; novos testes de shows: Brasil. Test all inclui chamadas com custo ou
            quota; prefira testes individuais.
          </p>
          {provenance.map((node) => (
            <details key={node.area} className="rounded border border-zinc-200 p-3">
              <summary className="cursor-pointer font-semibold">
                {node.area} → {node.source}
              </summary>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="font-semibold">Informações</dt>
                  <dd>{node.fields}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Fallback atual</dt>
                  <dd>{node.fallback}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Opção a avaliar</dt>
                  <dd>{node.proposal}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Código</dt>
                  <dd className="break-words">{node.code}</dd>
                </div>
              </dl>
            </details>
          ))}
        </section>
        <label className="block text-sm font-semibold">
          Filtrar fontes, país ou ideias
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="mt-2 block w-full rounded border border-zinc-300 p-3"
            placeholder="Brasil, biografia, gratuito…"
          />
        </label>
        <section aria-label="API results" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {API_SOURCES.filter(([id]) =>
            JSON.stringify(catalog.find((item) => item.id === id))
              .toLowerCase()
              .includes(filter.toLowerCase()),
          ).map(([id, name, docsUrl]) => {
            const info = catalog.find((item) => item.id === id);
            const result = results.get(id);
            const status = result?.status;
            const badge =
              status === "ok"
                ? "Called"
                : status === "error"
                  ? "Error"
                  : status === "unavailable"
                    ? "Not called"
                    : "Ready";
            return (
              <article
                key={id}
                className="min-w-0 rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{name}</h2>
                    <a
                      href={docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-zinc-500 underline hover:text-red-600"
                    >
                      {info.probe ? "API documentation" : "Official source / access research"}
                    </a>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${status === "ok" ? "bg-green-100 text-green-800" : status === "error" ? "bg-red-100 text-red-800" : status === "unavailable" ? "bg-amber-100 text-amber-900" : "bg-zinc-100 text-zinc-600"}`}
                  >
                    {badge}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-zinc-600">
                  <p>
                    <strong>Uso:</strong> {info.state}
                  </p>
                  <p>
                    <strong>Acesso/custo:</strong> {info.cost}
                  </p>
                  <p>
                    <strong>Cobertura:</strong> {info.coverage}
                  </p>
                  <p>
                    <strong>Ideia:</strong> {info.suggestion}
                  </p>
                </div>
                {info.probe && (
                  <button
                    type="button"
                    onClick={() => mutate({ source: id, token })}
                    disabled={isFetching}
                    aria-label={`Test ${name}`}
                    className="mt-3 rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isFetching && (!variables?.source || variables.source === id)
                      ? "Calling API…"
                      : "Test API"}
                  </button>
                )}
                {result ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="break-words text-zinc-700">{result.note}</p>
                    {result.status === "ok" && highlight(result) && (
                      <p className="break-words rounded bg-zinc-50 p-2 text-zinc-800">
                        {highlight(result)}
                      </p>
                    )}
                    {result.status === "ok" &&
                      result.id === "audiodb" &&
                      result.data.profile?.biography && (
                        <p className="line-clamp-5 text-zinc-600">
                          {result.data.profile.biography}
                        </p>
                      )}
                    {result.status === "ok" && imageResults(result).length > 0 && (
                      <div className="grid grid-cols-3 gap-2" aria-label={`${name} image results`}>
                        {imageResults(result).map((image) => (
                          <a
                            key={image.url}
                            href={image.href || image.url}
                            target="_blank"
                            rel="noreferrer"
                            title={image.label}
                          >
                            <img
                              src={image.url}
                              alt={image.label}
                              loading="lazy"
                              className="aspect-video w-full rounded object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="break-all font-mono text-[11px] text-zinc-400">
                      {result.endpoint}
                    </p>
                    <button
                      type="button"
                      onClick={() => inspectResponse(result)}
                      className="font-semibold text-red-700 underline"
                      aria-label={`Inspect ${name} response (opens in a new tab)`}
                    >
                      Inspect response ↗
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">
                    {info.probe
                      ? "Waiting for the test run."
                      : "Pesquisa documental: nenhum endpoint será chamado."}
                  </p>
                )}
              </article>
            );
          })}
        </section>
        <p className="text-xs text-zinc-500">
          AcoustID identifies audio from a fingerprint, not an artist-name lookup. My Show Poster
          and Concert Collect did not have public API documentation in the source review; the GitHub
          card is repository search, not a curated music database.
        </p>
      </div>
    </main>
  );
}
