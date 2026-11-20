import type { Metadata } from "next";
import About from "./view";

export const metadata: Metadata = {
  title: "Über uns – NEA 1889 Pizzeria Napoletana Berlin",
  description: "Pizza napoletana mit 72 Stunden Teigführung. Zimmerstraße 26/27, 10969 Berlin.",
};

export default function Page() { return <About />; }
