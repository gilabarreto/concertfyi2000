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

import { useT } from "../../i18n";
export default function VenueActions({ ticketmaster, services = {} }) {
  const t = useT();
  const [selectedDetail, setSelectedDetail] = useState(null);
  const detailsRef = useRef(null);
  const triggerRef = useRef(null);
  const fields = services.fields || {};
  const rows = [
    [
      t("Parking"),
      ticketmaster?.parkingDetail || fields.parking?.value,
      ticketmaster?.parkingDetail ? null : fields.parking,
    ],
    [
      t("Accessibility"),
      ticketmaster?.accessibleSeatingDetail || fields.accessibility?.value,
      ticketmaster?.accessibleSeatingDetail ? null : fields.accessibility,
    ],
    [t("Box office"), ticketmaster?.boxOfficeInfo?.phoneNumberDetail],
    [t("Box office hours"), ticketmaster?.boxOfficeInfo?.openHoursDetail],
    [
      t("Accepted payments"),
      ticketmaster?.boxOfficeInfo?.acceptedPaymentDetail || fields.payments?.value,
      ticketmaster?.boxOfficeInfo?.acceptedPaymentDetail ? null : fields.payments,
    ],
    [t("Will call"), ticketmaster?.boxOfficeInfo?.willCallDetail],
    [t("General rules"), ticketmaster?.generalInfo?.generalRule],
    [t("Children"), ticketmaster?.generalInfo?.childRule],
    [t("Opening hours"), fields.openingHours?.value, fields.openingHours],
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

  const availableRows = rows
    .map(([label, value, source], index) => ({ label, value, source, icon: detailIcons[index] }))
    .filter(({ value }) => {
      const text = String(value ?? "").trim();
      return text && text.toUpperCase() !== "N/A";
    });

  if (!availableRows.length) return null;

  return (
    <section aria-label={t("Venue services")} className="px-[12px] mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        {availableRows.map(({ label, value, source, icon }) => (
          <button
            key={label}
            type="button"
            aria-haspopup="dialog"
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              setSelectedDetail({ label, value, source });
              detailsRef.current.showModal();
            }}
            className="pill"
          >
            <Icon icon={icon} className="text-[0.65rem]" />
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
            aria-label={t("Close")}
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
