// O FontAwesome entrega o ícone como dados, não como componente:
// `{ prefix, iconName, icon: [largura, altura, ligaduras, unicode, path] }`.
// Desenhar isso é um <svg> de cinco linhas. O `@fortawesome/react-fontawesome` mais o
// `fontawesome-svg-core` que ele arrasta custavam 94,6 kB do chunk de entrada para fazer
// exatamente isto — o resto do que eles trazem (registro global de ícones, injeção de CSS,
// troca de `<i class="fa-...">` no DOM, máscaras, transformações) este app nunca usou.
//
// Os pacotes de ícones continuam: são 8,8 kB para os vinte usados, e o Vite descarta o resto.

// As duas únicas que aparecem no app. Os valores são os do CSS do próprio FontAwesome —
// e, como lá, mexem no `font-size`, não na altura. É o que faz a altura (1em) e o
// alinhamento (-0.125em) escalarem juntos. Medi a versão que mexia na altura: o ícone
// saía do tamanho certo, mas assentado na linha de base pela metade.
const SIZES = { sm: "0.875em", "2x": "2em" };

export default function Icon({ icon, className = "", size, ...rest }) {
  const [width, height, , , path] = icon.icon;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      // `w-[1.25em]` é largura fixa para qualquer ícone, como no FontAwesome: o desenho
      // continua proporcional (o `preserveAspectRatio` do SVG centraliza), mas a caixa
      // não muda de largura conforme o ícone, então nada ao lado dança.
      // `-0.125em` assenta o ícone na linha de base do texto vizinho.
      className={`inline-block h-[1em] w-[1.25em] overflow-visible align-[-0.125em] ${className}`}
      style={size ? { fontSize: SIZES[size] } : undefined}
      // Decorativo por padrão, igual ao FontAwesomeIcon. Os dez usos do app estão dentro de
      // um <a> ou <button> que já tem `aria-label` ou texto; anunciar o ícone de novo é eco.
      // Vem antes do spread para que quem precisar possa sobrescrever.
      aria-hidden="true"
      {...rest}
    >
      <path d={path} />
    </svg>
  );
}
