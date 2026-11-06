import { tableEndTime } from "@/lib/reservation-rules";

type IcsInput = { uid: string; date: string; time: string; guests: number };

/** Calendar file for a request the server has accepted. The request is unconfirmed until staff confirm it. */
export function icsFor({ uid, date, time, guests }: IcsInput) {
  const stamp = (d: string, t: string) => `${d.replaceAll("-", "")}T${t.replace(":", "")}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NEA 1889//Reservierung//DE",
    "BEGIN:VEVENT",
    `UID:${uid}@nea1889`,
    `DTSTART;TZID=Europe/Berlin:${stamp(date, time)}`,
    `DTEND;TZID=Europe/Berlin:${stamp(date, tableEndTime(time))}`,
    `SUMMARY:NEA 1889 – Tischanfrage für ${guests}`,
    "LOCATION:Zimmerstraße 26/27\\, 10969 Berlin",
    "DESCRIPTION:Anfrage – erst nach persönlicher Bestätigung durch NEA 1889 verbindlich.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
