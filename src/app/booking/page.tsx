import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Calendar className="h-7 w-7 text-indigo-300" />
        </div>
        <h1 className="text-2xl font-extrabold">Booking page is workspace-based</h1>
        <p className="text-sm text-gray-400">
          Public booking funnels are generated from each real workspace. Sign in, open Booking Funnel, add real slots, and share your AI booking link in channel auto-replies.
        </p>
        <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500">
          Open dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
