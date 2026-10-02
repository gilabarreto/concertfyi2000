import { useRef, useState } from "react";
import Icon from "../Icon";
import VenueSource from "./VenueSource";
import { faXmark } from "@fortawesome/free-solid-svg-icons/faXmark";
import { faSquareParking } from "@fortawesome/free-solid-svg-icons/faSquareParking";
import { faWheelchair } from "@fortawesome/free-solid-svg-icons/faWheelchair";
import { faPhone } from "@fortawesome/free-solid-svg-icons/faPhone";
import { faClock } from "@fortawesome/free-solid-svg-icons/faClock";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons/faCreditCard";
import { faTicketSimple } from "@fortawesome/free-solid-svg-icons/faTicketSimple";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons/faCircleInfo";
import { faChild } from "@fortawesome/free-solid-svg-icons/faChild";

export default function VenueActions({ ticketmaster, services = {} }) {
  const [selectedDetail, setSelectedDetail] = useState(null);
  const detailsRef = useRef(null);
  const triggerRef = useRef(null);
  const fields = services.fields || {};
  const rows = [
    [
      "Parking",
      ticketmaster?.parkingDetail || fields.parking?.value,
      ticketmaster?.parkingDetail ? null : fields.parking,
    ],
    [
      "Accessibility",
      ticketmaster?.accessibleSeatingDetail || fields.accessibility?.value,
      ticketmaster?.accessibleSeatingDetail ? null : fields.accessibility,
    ],
    ["Box office", ticketmaster?.boxOfficeInfo?.phoneNumberDetail],
    ["Box office hours", ticketmaster?.boxOfficeInfo?.openHoursDetail],
    [
      "Accepted payments",
      ticketmaster?.boxOfficeInfo?.acceptedPaymentDetail || fields.payments?.value,
      ticketmaster?.boxOfficeInfo?.acceptedPaymentDetail ? null : fields.payments,
    ],
    ["Will call", ticketmaster?.boxOfficeInfo?.willCallDetail],
    ["General rules", ticketmaster?.generalInfo?.generalRule],
    ["Children", ticketmaster?.generalInfo?.childRule],
    ["Opening hours", fields.openingHours?.value, fields.openingHours],
  ];
  const detailIcons = [
    faSquareParking,
    faWheelchair,
    faPhone,
    faClock,
    faCreditCard,
    faTicketSimple,
    faCircleInfo,
    faChild,
    faClock,
  ];

  return (
    <section aria-label="Venue services" className="px-[12px] mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        {rows.map(([label, value, source], index) => (
          <button
            key={label}
            type="button"
            aria-haspopup="dialog"
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              setSelectedDetail({ label, value: value || "N/A", source });
              detailsRef.current.showModal();
            }}
            className="flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full border text-[12px] leading-4 whitespace-nowrap transition-colors border-zinc-300 text-zinc-500 hover:border-red-600 hover:text-red-600"
          >
            <Icon icon={detailIcons[index]} className="text-[0.65rem]" />
            {label.toUpperCase()}
          </button>
        ))}
      </div>
      <dialog
        ref={detailsRef}
        onClose={() => {
          setSelectedDetail(null);
          triggerRef.current?.focus();
        }}
        aria-labelledby="venue-detail-title"
        className="venue-detail-dialog fixed inset-0 m-auto w-[min(90vw,560px)] max-h-[80dvh] rounded-lg bg-white p-0 text-zinc-900 backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-300 px-4 py-3">
          <h2 id="venue-detail-title" className="text-lg font-semibold">
            {selectedDetail?.label}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => detailsRef.current.close()}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-500 hover:text-red-600"
          >
            <Icon icon={faXmark} />
          </button>
        </div>
        <div className="p-4">
          <p className="whitespace-pre-line break-words text-base">{selectedDetail?.value}</p>
          <VenueSource detail={selectedDetail?.source} />
        </div>
      </dialog>
    </section>
  );
}
