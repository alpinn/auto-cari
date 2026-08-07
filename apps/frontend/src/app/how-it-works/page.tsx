import Link from "next/link";
import { MessageCircle, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: MessageCircle,
    title: "Tanya dengan Bahasa Natural",
    description:
      'Ketik kebutuhanmu seperti bicara ke teman. Contoh: "laptop buat coding budget 8 juta" — tidak perlu istilah teknis atau filter rumit.',
    iconBg: "bg-info/10 text-info",
  },
  {
    icon: Search,
    title: "AI Mencari & Menganalisis",
    description:
      "Autocari mencari di Tokopedia, Shopee, Lazada, dan Blibli sekaligus — membandingkan harga, rating, dan ulasan dari ribuan produk dalam hitungan detik.",
    iconBg: "bg-warning/10 text-warning",
  },
  {
    icon: CheckCircle2,
    title: "Dapatkan Rekomendasi",
    description:
      "Terima rekomendasi produk terbaik lengkap dengan kelebihan, kekurangan, dan alasan AI yang spesifik ke kebutuhanmu — bukan sekadar daftar hasil pencarian.",
    iconBg: "bg-success/10 text-success",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="space-y-16 py-12">
      <section className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Menemukan Produk yang Tepat Tidak Harus Sulit
        </h1>
        <p className="mt-3 text-base-content/60">
          Autocari AI menyaring ribuan produk di marketplace Indonesia untuk menemukan yang paling
          sesuai kebutuhanmu.
        </p>
      </section>

      <section className="mx-auto max-w-3xl space-y-10 px-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const reversed = i % 2 === 1;
          return (
            <div
              key={step.title}
              className={cn(
                "flex flex-col items-center gap-6 sm:flex-row",
                reversed && "sm:flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex size-24 shrink-0 items-center justify-center rounded-full",
                  step.iconBg,
                )}
              >
                <Icon className="size-10" />
              </div>
              <div className={cn("flex-1", reversed ? "sm:text-right" : "sm:text-left", "text-center sm:text-inherit")}>
                <span className="text-sm font-bold text-primary">Langkah {i + 1}</span>
                <h2 className="mt-1 text-xl font-bold">{step.title}</h2>
                <p className="mt-2 text-base-content/70">{step.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-3xl px-4">
        <div className="flex flex-col items-center gap-4 rounded-box bg-primary px-6 py-10 text-center text-primary-content">
          <h2 className="text-2xl font-bold">Siap Menemukan Produk Favoritmu?</h2>
          <p className="text-primary-content/80">
            Rasakan cara belanja yang lebih cerdas di Indonesia hari ini.
          </p>
          <Link href="/" className="btn btn-lg bg-base-100 text-primary hover:bg-base-200">
            Coba Autocari Explore
          </Link>
        </div>
      </section>
    </div>
  );
}
