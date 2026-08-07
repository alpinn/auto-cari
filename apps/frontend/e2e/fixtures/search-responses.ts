// Fixtures mirror the exact shapes verified against the live backend on 2026-07-08
// (see memory: autocari-fe-build) — keep in sync if the backend contract changes.
import type {
  SearchSuccessResponse,
  SearchClarifyingResponse,
  SearchComingSoonResponse,
  SearchErrorResponse,
} from "@/lib/types";

export const SUCCESS_WITH_PRODUCTS: SearchSuccessResponse = {
  type: "success",
  summary:
    "Kamera mirrorless Sony ZV-1 II Vlogging Camera adalah pilihan terbaik untuk vlog dengan sensor 20.1MP dan UHD 4K, namun memiliki harga yang relatif tinggi.",
  sources: ["Google Shopping", "www.youtube.com"],
  cached: false,
  query_id: null,
  products: [
    {
      id: "1b5fdc8725caee60ab120e473c8e0f4d",
      name: "Sony ZV-1 II Vlogging Camera - Kamera Vlogging Multifungsi dengan Sensor 20.1MP dan UHD 4K",
      image_url: "https://placehold.co/600x450/e8f0fe/1a56db?text=ZV-1+II",
      price: 13214000,
      price_formatted: "Rp 13.214.000",
      marketplace: "shopee",
      store_name: "Sony Store",
      store_badge: null,
      rating: 4.8,
      score: 9.2,
      pros: ["Sensor 20.1MP", "UHD 4K", "Multifungsi"],
      cons: ["Harga relatif tinggi"],
      ai_reasoning:
        "Kamera ini memiliki fitur yang lengkap dan sesuai dengan kebutuhan vlog.",
      product_url: "https://shopee.co.id",
      is_editor_choice: true,
    },
    {
      id: "0269c792815182ea848782a4be6f0e25",
      name: "KameraKamera Sony ZV-1 Kamera Vlog Compact Digital Camera",
      image_url: "https://placehold.co/600x450/e8f0fe/1a56db?text=ZV-1",
      price: 10099000,
      price_formatted: "Rp 10.099.000",
      marketplace: "blibli",
      store_name: "Blibli Official",
      store_badge: null,
      rating: 4.6,
      score: 8.8,
      pros: ["Kamera vlog compact", "Digital Camera"],
      cons: ["Harga relatif tinggi"],
      ai_reasoning: "Kamera ini memiliki desain yang compact dan sesuai dengan kebutuhan vlog.",
      product_url: "https://www.blibli.com",
      is_editor_choice: false,
    },
    {
      id: "84fa7cc3bac7d3c4abc9573904a968b6",
      name: "FUJIFILM XA3 COCOK UNTUK VLOGGER DAN MUA",
      image_url: "https://placehold.co/600x450/e8f0fe/1a56db?text=XA3",
      price: 5499000,
      price_formatted: "Rp 5.499.000",
      marketplace: "shopee",
      store_name: "Fujifilm Store",
      store_badge: null,
      rating: 4.5,
      score: 8.5,
      pros: ["Cocok untuk vlogger dan mua", "Kualitas gambar yang baik"],
      cons: ["Harga relatif tinggi"],
      ai_reasoning: "Kamera ini memiliki kualitas gambar yang baik dan sesuai dengan kebutuhan.",
      product_url: "https://shopee.co.id",
      is_editor_choice: false,
    },
  ],
};

export const SUCCESS_EMPTY: SearchSuccessResponse = {
  type: "success",
  summary: "Maaf, kami tidak menemukan produk yang sesuai. Coba kata kunci lain.",
  products: [],
  sources: ["Google Shopping"],
  cached: false,
  query_id: null,
};

export const CLARIFYING: SearchClarifyingResponse = {
  type: "clarifying",
  context: "Mencari HP tapi kebutuhan belum spesifik",
  question: "HP untuk kebutuhan apa? Ini akan membantu kami memberi rekomendasi yang lebih tepat.",
  options: [
    {
      id: "option_1",
      label: "Fotografi & konten kreator",
      description: "Kamera bagus, stabilisasi video, dan layar berkualitas",
      icon: "camera",
    },
    {
      id: "option_2",
      label: "Gaming",
      description: "Performa tinggi, refresh rate tinggi, dan baterai tahan lama",
      icon: "gamepad",
    },
  ],
};

export const COMING_SOON: SearchComingSoonResponse = {
  type: "coming_soon",
  detected_category: "fashion",
  message: "Kategori Fashion & Style sedang kami siapkan!",
};

export const ERROR_LLM_TIMEOUT: SearchErrorResponse = {
  type: "error",
  code: "LLM_TIMEOUT",
  message: "Terjadi gangguan sementara. Coba lagi.",
};
