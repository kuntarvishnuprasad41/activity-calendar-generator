import type { Metadata } from "next"
import CalendarGenerator from "@/components/calendar-generator"

export const metadata: Metadata = {
  title: "A.U.P.School Kuntar - Calendar Generator",
  description: "Generate and print school activity calendars for 2025-2026",
}

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">A.U.P.School Kuntar</h1>
        <p className="text-xl text-muted-foreground">Calendar Generator 2025-2026</p>
      </header>

      <CalendarGenerator />
    </main>
  )
}
