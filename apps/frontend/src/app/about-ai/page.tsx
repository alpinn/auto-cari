import Link from "next/link";
import { Sparkles, ShoppingBag, HeartPulse, ShieldCheck, Eye, BadgeCheck } from "lucide-react";

const CORE_CARDS = [
  {
    icon: Sparkles,
    title: "Didukung oleh Claude",
    description:
      "Model AI dari Anthropic menganalisis kebutuhanmu, membaca ulasan, dan menyusun alasan rekomendasi dalam Bahasa Indonesia yang mudah dipahami.",
  },
  {
    icon: ShoppingBag,
    title: "Integrasi Google Shopping",
    description:
      "Data harga & produk real-time dari Tokopedia, Shopee, Lazada, dan Blibli — bukan data statis yang bisa kedaluwarsa.",
  },
  {
    icon: HeartPulse,
    title: "Analisis Sentimen Mendalam",
    description:
      "AI membaca ulasan & artikel terkait untuk menilai kualitas produk sesungguhnya, bukan cuma rating bintang.",
  },
];

const THINKING_STEPS = [
  "Memahami maksud & prioritas di balik pertanyaanmu (budget, kebutuhan, preferensi).",
  "Mencari produk yang relevan dari marketplace terpercaya secara real-time.",
  "Membandingkan harga, rating, dan ulasan untuk menyusun skor & alasan tiap produk.",
];

const TRUST_BADGES = [
  { icon: Eye, label: "Penalaran Transparan", description: "Setiap rekomendasi disertai alasan yang bisa kamu telusuri." },
  { icon: BadgeCheck, label: "Sumber Terverifikasi", description: "Hanya marketplace resmi yang kami rekomendasikan." },
  { icon: ShieldCheck, label: "Bebas Bias Bayaran", description: "Tidak ada slot iklan berbayar yang memengaruhi ranking." },
];

export default function AboutAiPage() {
  return (
    <div className="space-y-16 py-12">
      <section className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Membangun Kepercayaan Lewat Transparansi AI
        </h1>
        <p className="mt-3 text-base-content/60">
          Kami percaya rekomendasi AI harus bisa dipertanggungjawabkan. Berikut cara Autocari
          bekerja di balik layar.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-base-content/50">
          Inti Kecerdasan Autocari
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CORE_CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-box border border-base-300 bg-base-100 p-5">
                <Icon className="mb-3 size-8 text-primary" />
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-base-content/70">{c.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4">
        <div className="rounded-box bg-neutral p-6 text-neutral-content">
          <span className="mb-2 inline-block rounded-full bg-neutral-content/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            Zero-Bias
          </span>
          <h2 className="text-xl font-bold">Rekomendasi Tanpa Bias</h2>
          <p className="mt-2 text-neutral-content/70">
            Kami tidak menerima bayaran dari marketplace atau brand untuk memengaruhi urutan
            rekomendasi. Skor & ranking murni berdasarkan analisis AI terhadap kebutuhanmu.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4">
        <h2 className="mb-4 text-xl font-bold">Bagaimana Autocari Berpikir</h2>
        <ol className="space-y-4">
          {THINKING_STEPS.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
                {i + 1}
              </span>
              <p className="text-base-content/80">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TRUST_BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.label} className="rounded-box border border-base-300 bg-base-100 p-5 text-center">
                <Icon className="mx-auto mb-2 size-7 text-primary" />
                <h3 className="font-semibold">{b.label}</h3>
                <p className="mt-1 text-sm text-base-content/60">{b.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4">
        <div className="flex flex-col items-center gap-4 rounded-box bg-primary px-6 py-10 text-center text-primary-content">
          <h2 className="text-2xl font-bold">Siap Merasakan Belanja Lebih Cerdas?</h2>
          <Link href="/" className="btn btn-lg bg-base-100 text-primary hover:bg-base-200">
            Coba Autocari Explore
          </Link>
        </div>
      </section>
    </div>
  );
}
