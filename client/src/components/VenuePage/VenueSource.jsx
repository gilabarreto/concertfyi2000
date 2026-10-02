const safeUrl = (value) => (/^https?:\/\//i.test(value || "") ? value : undefined);

export default function VenueSource({ detail, inline = false }) {
  if (!detail?.source) return null;
  return (
    <p className={`${inline ? "" : "mt-2 text-center "}text-xs text-zinc-500`}>
      Source:{" "}
      <a
        href={safeUrl(detail.url)}
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-red-600"
      >
        <span translate="no">{detail.source}</span>
      </a>
      {detail.source === "OpenStreetMap" && (
        <>
          {" "}
          · © OpenStreetMap contributors ·{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            ODbL
          </a>
        </>
      )}
      {detail.attributions?.map((item, index) => (
        <span key={index}>
          {" "}
          ·{" "}
          <a href={safeUrl(item.url)} target="_blank" rel="noreferrer" className="underline">
            {item.name}
          </a>
        </span>
      ))}
    </p>
  );
}
