"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/site/utils";

// Slim port of the approved shadcn Calendar: same class names, no button/cva/slot dependency.
const navButton =
  "inline-flex h-(--cell-size) w-(--cell-size) select-none items-center justify-center rounded-md p-0 hover:bg-accent hover:text-accent-foreground aria-disabled:opacity-50";

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  const d = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("bg-background group/calendar p-3 [--cell-size:2rem]", className)}
      classNames={{
        root: cn("w-fit", d.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", d.months),
        month: cn("flex w-full flex-col gap-4", d.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", d.nav),
        button_previous: cn(navButton, d.button_previous),
        button_next: cn(navButton, d.button_next),
        month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", d.month_caption),
        caption_label: cn("select-none text-sm font-medium", d.caption_label),
        table: "w-full border-collapse",
        weekdays: cn("flex", d.weekdays),
        weekday: cn("text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal", d.weekday),
        week: cn("mt-2 flex w-full", d.week),
        day: cn("group/day relative aspect-square h-full w-full select-none p-0 text-center", d.day),
        day_button: cn(
          "flex aspect-square h-auto w-full min-w-(--cell-size) items-center justify-center rounded-md font-normal leading-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none",
          "group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:text-primary-foreground",
          d.day_button,
        ),
        today: cn("bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none", d.today),
        outside: cn("text-muted-foreground aria-selected:text-muted-foreground", d.outside),
        disabled: cn("text-muted-foreground opacity-50", d.disabled),
        hidden: cn("invisible", d.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === "left" ? <ChevronLeft className={cn("size-4", c)} /> : <ChevronRight className={cn("size-4", c)} />,
      }}
      {...props}
    />
  );
}
