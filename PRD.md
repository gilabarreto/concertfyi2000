# PRD.md — ConcertFYI

Escrito em 2026-10-01 a partir do que está no ar. Este arquivo diz **o quê e por quê**. O
**como** está no `CLAUDE.md`, o estado técnico no `DOSSIE_TECNICO_ATUALIZADO.md`, a régua de
qualidade no `CONSTRAINTS.md`, a direção visual no `DESIGN.md` e o backlog com o motivo de cada
item no `SUGESTOES_ATUALIZADO.md`. O que já está nesses arquivos não é repetido aqui.

Substitui o `docs/user-stories.md` de 2025, removido em 2026-10-01 (continua no histórico do git).
Ele descrevia contas, login e rede social, e nada disso foi construído.

---

## Problema

Quem gosta de um artista precisa abrir três lugares para responder a três perguntas:

1. **O que ele tocou?** Setlist.fm tem o histórico, mas não vende ingresso.
2. **Quando ele toca perto de mim?** Ticketmaster tem a agenda, mas não guarda o passado.
3. **Como eu vou?** Ingresso, hotel e lembrete no calendário ficam cada um num site diferente.

O ConcertFYI junta as três respostas numa página por show.

## Para quem

Fã que já tem um artista em mente: quer saber o que esperar do próximo show, rever um show
a que foi ou decidir se vale viajar para ver um. Não é ferramenta de descoberta às cegas. A Home
sugere shows perto da localização da pessoa, mas o fluxo principal começa numa busca por nome.

Sem conta e sem login. Tudo que é pessoal (favoritos, "I WAS THERE", avaliações, lembretes,
localização escolhida) fica no `localStorage` do navegador.

## Objetivo do produto

Ser a página que a pessoa abre antes e depois de um show, e transformar a parte do "antes" em
receita por link de afiliado (ingresso, hotel, discos).

---

## Escopo — o que existe hoje

| Área | O que a pessoa faz | Fonte |
|---|---|---|
| Home | Vê shows próximos num carrossel (Cover Flow); troca a cidade | Ticketmaster + geolocalização |
| Recently Added (Home) | Setlists dos shows de ontem que acabaram de ser postados | setlist.fm |
| Busca | Procura artista por nome | Ticketmaster (suggest) |
| Página do show | Data, turnê, local, mapa, foto e informações do artista | Setlist.fm + Ticketmaster |
| Setlist | Lista de músicas com encore sinalizado, paginação, copiar, letra, prévia no Spotify/YouTube | Setlist.fm, LRCLib, Spotify, YouTube |
| Playlist | Cria no Spotify da pessoa uma playlist com o setlist | Spotify (OAuth via popup) |
| Tour Statistics | Números da turnê (shows, países, música mais tocada, abertura, encerramento) e mapa com shows passados e futuros | Setlist.fm + Ticketmaster |
| Shows passados | Lista navegável dos shows anteriores do artista | Setlist.fm |
| Venue | Página do local: o que foi tocado lá (qualquer artista) e o que está à venda | Setlist.fm + Ticketmaster |
| My City | Setlists do ano na cidade escolhida e shows à venda nela | Setlist.fm + Ticketmaster |
| Próximos shows | Lista com ingresso, hotel e lembrete `.ics` | Ticketmaster + afiliados |
| Show perto de você | Faixa avisando quando o artista toca perto da cidade escolhida | Ticketmaster |
| Pessoal | Favoritar artista, "I WAS THERE", nota e comentário no show | `localStorage` |
| Compartilhar | Link com prévia (Open Graph) do show | Rota `/share` no servidor |
| Discos | Álbuns do artista com link de compra | Amazon (afiliado, tag pendente) |

## Fora de escopo (por decisão, não por esquecimento)

- **Contas, login, seguir pessoas, perfil público.** Exigiriam banco e servidor com estado, e o
  servidor de hoje é um proxy sem estado (ver `CLAUDE.md`). Avaliações e comentários vivem num
  navegador só.
- **Notificação por e-mail/SMS.** No lugar delas entrou o `.ics` (ver `SUGESTOES_ATUALIZADO.md`).
- **Horários de abertura dos portões e lineup.** A API do setlist.fm não expõe esses dados de forma
  estruturada. Adiado até existir uma fonte confiável.
- **Pôster oficial da turnê.** Sem fonte que associe um pôster à turnê certa. Experimento retirado
  em 2026-09-26.
- **Página de artista indexável (SSR/pre-render).** Só vale a pena quando houver tráfego medido.
- **Widget para outros sites** ("onde [artista] toca a seguir?"). Ideia do documento de 2025,
  nunca priorizada.

## Requisitos não funcionais

Os números e os comandos estão no `CONSTRAINTS.md`. Em resumo, o produto se compromete com:

- **Nenhuma chave secreta no navegador.** Toda API com segredo passa pelo servidor.
- **Falha parcial não derruba a página.** As duas fontes são casadas por nome de artista. Se uma
  delas cair, a página mostra o que a outra devolveu (ver `useArtistData`).
- **Datas corretas em qualquer fuso.** Um show de amanhã nunca aparece como passado.
- **Acessibilidade 100 no Lighthouse** e contraste WCAG AA.
- **Mobile primeiro.** O mapa do Google é hoje o maior custo de carregamento (LCP de 7 s na página
  de artista).

---

## Métricas de sucesso

**Hoje nenhuma é medida:** o site não tem analytics (item aberto no `SUGESTOES_ATUALIZADO.md`, depende
de uma conta do dono). As métricas abaixo são uma proposta e passam a valer quando houver dado:

| Métrica | Por que importa |
|---|---|
| Cliques em ingresso/hotel/disco por visita à página do show | É a receita: o objetivo do produto |
| Proporção de visitas que chegam à página do show (vindas da busca ou da Home) | Mostra se a busca e o carrossel levam a pessoa ao conteúdo |
| Playlists criadas e links compartilhados | Uso do "depois do show", o que traz a pessoa de volta |
| Taxa de recusa da geolocalização | Gatilho registrado no `CONSTRAINTS.md` para repensar a Home |

## Riscos

- **Casamento por nome entre Setlist.fm e Ticketmaster.** Um nome escrito diferente nas duas APIs
  deixa os cards vazios. É a costura frágil do app e não tem solução sem um mapeamento de ids.
- **Dependência de APIs de terceiros com cota** (YouTube, Spotify, setlist.fm). Uma chave revogada
  derruba uma seção inteira.
- **Receita ainda não liga.** A tag de afiliado da Amazon está pendente e a Ticketmaster só publica
  preço para cerca de 20% dos eventos.

## Perguntas abertas (decisão do dono)

- **Diferencial de mercado:** curadoria, cenas locais, social ou setlists e letras? Define o que o
  `/about` promete e o que entra a seguir.
- **Contas:** a próxima feature grande pede login (avaliações visíveis para todos, favoritos entre
  aparelhos)? Se sim, o servidor deixa de ser só proxy e esta seção de escopo muda.
- **Hospedagem:** sair do GitHub Pages destrava 404 real, CSP por header e SEO das páginas de
  artista.
