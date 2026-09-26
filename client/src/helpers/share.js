// Share sheet nativo no celular; no desktop, onde quase nenhum browser tem, copia o link.
// Devolve true só quando copiou, para o botão mostrar "LINK COPIED".
export async function shareOrCopy(url, title = document.title) {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return false;
    }
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // usuário fechou o share sheet ou o clipboard foi negado — nada a recuperar
    return false;
  }
}
