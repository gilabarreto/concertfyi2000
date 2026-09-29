import { forwardRef } from "react";

// Padrão de título dos cards: separador em cima e embaixo, título centralizado. As linhas
// do card vêm logo abaixo, sem recuo, com o mesmo border-b ocupando a largura toda.
const CardTitle = forwardRef(function CardTitle({ id, className = "", action, children }, ref) {
  return (
    // Um div só: os cards usam space-y-2, que abriria espaço entre as três peças.
    <div className="relative border-y-2 border-zinc-300">
      <h2
        id={id}
        ref={ref}
        className={`py-2 text-center text-2xl font-bold text-balance ${action ? "px-10" : ""} ${className}`}
      >
        {children}
      </h2>
      {/* Fora do h2 (um botão não é parte do título), à direita sem tirar o título do centro. */}
      {action && <div className="absolute right-0 top-1/2 -translate-y-1/2">{action}</div>}
    </div>
  );
});

export default CardTitle;
