import { useId, useRef } from "react";
import Icon from "../Icon";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function VendorPopup({ icon, title, vendors }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const hasSubtitle = vendors.some((vendor) => vendor.subtitle);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current.showModal()}
        className="flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-300 text-[12px] leading-4 whitespace-nowrap text-zinc-500 hover:border-red-600 hover:text-red-600"
      >
        <Icon icon={icon} className="text-[0.65rem]" />
        {title}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-6 backdrop:bg-black/50"
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            dialogRef.current.close();
        }}
      >
        <h3 id={titleId} className="px-6 text-center text-xl font-bold">
          {title}
        </h3>
        <button
          type="button"
          aria-label={`Close ${title}`}
          onClick={() => dialogRef.current.close()}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded text-zinc-500 hover:text-red-600"
        >
          <Icon icon={faXmark} />
        </button>
        <ul className="mt-2 flex justify-center gap-x-2 sm:gap-x-4">
          {vendors.map((vendor) => (
            <li key={vendor.name} className="min-w-0 flex-1 max-w-28">
              <a
                className="flex flex-col items-center gap-1 rounded px-1 py-2 hover:text-red-800 hover:bg-zinc-100 sm:px-3"
                href={vendor.href}
                download={vendor.download}
                target={vendor.download ? undefined : "_blank"}
                rel="noopener noreferrer"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${vendor.domain}&sz=64`}
                  alt=""
                  className="h-8 w-8 object-contain"
                  width="32"
                  height="32"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span className="text-sm text-center">{vendor.name}</span>
                {hasSubtitle && (
                  <span className="text-sm font-semibold text-center">
                    {vendor.subtitle || " "}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
