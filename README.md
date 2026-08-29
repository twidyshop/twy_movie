# Guardian Streaming 🎬

Website katalog **film & series** dengan tampilan dark cinematic, pencarian cepat, filter katalog, halaman detail lengkap, daftar season/episode, dan pemutar streaming.

Data diambil **langsung dari scraper** (`server/lk21.js`) secara real-time — bukan mock data. Aplikasi terdiri dari frontend React (Vite) dan backend Node kecil yang menjalankan scraper dan menyajikannya sebagai JSON API.

> ⚠️ Konten film/series bersumber dari situs pihak ketiga (LK21 / dramamu / gudangvape). Gunakan untuk keperluan pribadi dan patuhi hukum yang berlaku di wilayah Anda.

---

## ✨ Fitur

### Home
- **Hero featured** film/series pilihan.
- Section editorial otomatis dari scraper: **Film Terbaru, SERIES UNGGULAN, SERIES UPDATE, TOP BULAN INI, Rekomendasi Untukmu, Nonton Bareng Keluarga**, serta rail genre (Action / Horror / Romance / Comedy) dan regional (Korea / Thailand / India Terbaru), **Maraton Drakor**.
- **Daftar Lengkap Film Terbaru** dalam grid.

### Browse (dengan pagination & filter movie/series)
- `/genre/:slug` — berdasarkan genre (Action, Horror, Romance, dll).
- `/country/:slug` — berdasarkan negara (Korea, India, Thailand, dll).
- `/year/:year` — berdasarkan tahun.
- `/populer`, `/latest`, `/latest-series`, `/rating`, `/release`, `/most-commented`, `/top-movie-today`, `/quality/:quality`.
- **Filter Movie / Series / All** + pagination halaman.
- Halaman daftar **Genre**, **Negara**, dan **Tahun** (chip navigasi).

### Search
- Pencarian film/series via JSON API.
- Hasil movie & series, mendukung pagination.

### Detail
- **Movie:** poster, judul, rating & jumlah vote, genre, negara, sutradara, cast, sinopsis, tanggal rilis, trailer, **link download**, tombol watch.
- **Series:** semua info di atas **plus** daftar **season & episode per season** (via redirect dramamu).

### Streaming
- Pemutar video dengan **pilihan server/source** (p2p, turbovip, cast, dll).
- **Navigasi episode** sebelumnya/berikutnya untuk series.

---

## 🧱 Arsitektur

```
┌─────────────────┐      /api (Vite proxy)      ┌──────────────────┐
│  React SPA      │ ───────────────────────────▶ │  Node backend    │
│  (Vite, :5173)  │ ◀─────────────────────────── │  (server, :8787) │
└─────────────────┘                              └────────┬─────────┘
                                                          │ cheerio + fetch
                                                          ▼
                                            ┌──────────────────────────┐
                                            │ situs sumber (LK21/dll)   │
                                            └──────────────────────────┘
```

- **Frontend** (`src/`) — React + TypeScript + Vite. Semua data lewat `src/api.ts` yang memanggil `/api`.
- **Backend** (`server/`) — server HTTP Node polos (tanpa framework eksternal).
  - `server/lk21.js` — scraper (parse HTML dengan `cheerio` + `fetch`).
  - `server/index.js` — memetakan scraper menjadi endpoint JSON + menormalkan data ke bentuk yang dipakai UI.
- **Proxy** — pada mode dev, permintaan `/api` dari browser diteruskan Vite ke backend, sehingga **tidak ada masalah CORS** (server yang scrape, bukan browser).

---

## 🚀 Menjalankan

Prasyarat: **Node.js ≥ 18** (mendukung global `fetch`).

```bash
# 1. Install dependency
npm install

# 2. Jalankan backend scraper (terminal 1)
npm run server
#   → Guardian backend listening on http://localhost:8787

# 3. Jalankan web app (terminal 2)
npm run dev
#   → buka http://localhost:5173
```

### Mode produksi

```bash
npm run build        # tsc + vite build → folder dist
npm run preview      # sajikan build produksi
```

> Backend tetap harus berjalan secara terpisah (`npm run server`) karena frontend mengambil data dari `/api` saat runtime.

---

## 🔌 Endpoint API

Base URL dev: `http://localhost:8787` (atau via Vite `http://localhost:5173/api`).

| Method | Endpoint | Deskripsi |
| ------ | -------- | --------- |
| GET | `/api/health` | Health check |
| GET | `/api/home` | Section home + daftar film terbaru |
| GET | `/api/browse<path>?page=1&type=movie\|series` | Listing: `/genre/x`, `/country/x`, `/year/x`, `/populer`, `/latest`, `/latest-series`, `/rating`, `/release`, `/most-commented`, `/top-movie-today`, `/quality/x` |
| GET | `/api/search?q=<query>&page=1` | Pencarian via JSON API |
| GET | `/api/genres` | Daftar genre |
| GET | `/api/countries` | Daftar negara |
| GET | `/api/years` | Daftar tahun |
| GET | `/api/detail?url=<pageUrl>` | Detail film/series (cast, sutradara, sinopsis, season/episode) |
| GET | `/api/stream?url=<pageUrl>` | Daftar server streaming + navigasi episode |

Contoh:

```bash
curl http://localhost:8787/api/home
curl "http://localhost:8787/api/browse/genre/action?page=1&type=movie"
curl "http://localhost:8787/api/search?q=avengers"
curl "http://localhost:8787/api/detail?url=https://tv12.lk21official.cc/spider-man-brand-new-day-2026"
```

---

## 🧩 Struktur Proyek

```
.
├── index.html
├── package.json
├── tsconfig*.json
├── vite.config.ts            # proxy /api → backend
├── plan.md                   # PRD / blueprint produk
├── server/
│   ├── index.js              # HTTP server + normalisasi data
│   └── lk21.js               # scraper (cheerio + fetch)
└── src/
    ├── main.tsx              # entry React
    ├── App.tsx               # halaman: Home, Browse, Detail, Watch
    ├── api.ts                # client pemanggilan /api
    ├── data.ts               # tipe data bersama
    └── styles.css            # styling (dark cinematic)
```

---

## ⚙️ Konfigurasi

Beberapa hal bisa disesuaikan lewat **environment variable**:

| Vars | Default | Keterangan |
| ---- | ------- | ---------- |
| `PORT` | `8787` | Port backend |
| `CORS_PROXY` | *(kosong)* | Proksi CORS/rotation untuk request keluar scraper, mis. `https://uncors.netlify.app/` |

### Mengaktifkan CORS proxy (opsional)

Bila situs sumber memblokir IP server, request scraper bisa diteruskan lewat proksi:

```bash
CORS_PROXY=https://uncors.netlify.app/ npm run server
```

Semua permintaan keluar kemudian menjadi `{proxyURL}/?destination=<url>`.

---

## 🛠️ Troubleshooting

- **Halaman kosong / selalu "Memuat data…"** — Pastikan backend berjalan: `curl http://localhost:8787/api/health` harus mengembalikan `{"ok":true}`.
- **Player video tidak jalan** — URL stream berasal dari iframe player situs sumber; sebagian host memblokir embed. Coba **ganti server** (p2p / turbovip / cast).
- **Data tidak muncul di mode produksi** — Backend harus tetap berjalan terpisah dari `vite preview`.
- **Situs sumber tidak merespons / 5xx** — Scraper bergantung pada pihak ketiga; coba lagi nanti, atau aktifkan `CORS_PROXY`.
- **CORS di browser** — Normalnya tidak terjadi karena scraping dilakukan di backend. Jika kamu menjalankan ulang tanpa proxy Vite, pastikan frontend memanggil backend yang sama.

---

## ⚖️ Catatan Legal & Etika

Hak cipta semua film/series berada pada pemiliknya masing-masing. Aplikasi ini ditujukan untuk **pembelajaran/pengembangan** dan **penggunaan pribadi**. Pastikan Anda memiliki hak untuk mengakses konten yang ditampilkan dan mematuhi peraturan setempat.

---

## 📄 Lisensi

Proyek pribadi — mohon sesuaikan sebelum distribusi publik lanjutan.