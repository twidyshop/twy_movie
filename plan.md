# Guardian — Product Requirements Document & Website Blueprint

**Status:** Draft v1.0  
**Tanggal:** 29 Agustus 2026  
**Produk:** Guardian — katalog film dan series dengan streaming  
**Bahasa utama:** Indonesia  


---

## 1. Ringkasan Produk

Guardian adalah website katalog film dan series dengan tampilan dark cinematic, poster grid, pencarian cepat, filter katalog, halaman detail, daftar season/episode, serta pemutar video. Pengguna dapat menemukan konten berdasarkan genre, negara, tahun, popularitas, rating, kualitas, dan kategori editorial.

Fokus versi awal:

- Home yang kaya section editorial.
- Browse dengan filter dan pagination.
- Search melalui API JSON.
- Detail movie dan series.
- Streaming video  melalui URL terproteksi atau provider berlisensi.
- Tampilan responsive untuk mobile, tablet, dan desktop.

---

## 2. Tujuan Produk

### Tujuan utama

1. Memudahkan pengguna menemukan film dan series secara cepat.
2. Menampilkan katalog dalam UI modern yang nyaman untuk browsing lama.
3. Menyediakan pengalaman detail konten yang lengkap dan jelas.
4. Memutar konten dengan player yang stabil.
5. Menyiapkan fondasi yang mudah dikembangkan menjadi akun pengguna, watchlist, rekomendasi, dan subscription.

### Indikator keberhasilan MVP

- Home dapat dimuat dalam waktu kurang dari 3 detik pada koneksi normal.
- Pengguna dapat menemukan konten melalui search kurang dari 10 detik.
- Halaman detail memiliki poster, sinopsis, metadata, cast, rating, dan tombol tonton.
- Player dapat memutar sumber video  yang valid.
- Layout berfungsi baik pada lebar layar 360px hingga desktop besar.

---

## 3. Non-Goals MVP

Fitur berikut ditunda setelah MVP:

- Sistem pembayaran dan subscription.
- User-generated review atau komentar publik.
- Download offline melalui aplikasi native.
- Personalisasi berbasis machine learning.
- Multi-region licensing dan geo-blocking kompleks.
- Live streaming.
- Moderasi komunitas skala besar.

---

## 4. Target Pengguna

### Pengunjung umum

Ingin menemukan film atau series berdasarkan tren, genre, negara, tahun, dan rating.

### Pengguna rutin

Ingin melanjutkan tontonan, menyimpan watchlist, dan mengikuti episode series terbaru.

### Admin/editor

Ingin mengelola katalog, metadata, section Home, poster, season, episode, dan sumber streaming.

---

## 5. Prinsip UX dan Visual

### Arah visual

- Dark cinematic.
- Background utama hampir hitam dengan aksen abu-abu kebiruan.
- Poster menjadi elemen visual utama.
- Aksen warna merah/oranye atau warna brand Guardian.
- Kontras tinggi untuk keterbacaan.
- Border radius moderat, bukan terlalu bulat.
- Animasi halus dan tidak mengganggu.

### Struktur navigasi

Header desktop:

- Logo Guardian.
- Home.
- Movies.
- Series.
- Genre.
- Country.
- Year.
- Search.
- Tombol login/profile jika autentikasi sudah aktif.

Mobile:

- Logo.
- Search.
- Menu drawer atau bottom navigation.

### Komponen visual inti

- Hero banner dengan backdrop, gradient overlay, judul, sinopsis singkat, rating, tombol Watch Now, tombol Detail.
- Horizontal content rail untuk section Home.
- Poster card dengan gambar, judul, tahun, rating, kualitas, dan badge episode/season.
- Filter chips dan select dropdown.
- Breadcrumb pada halaman detail dan browse.
- Skeleton loading.
- Empty state dan error state yang konsisten.

---

## 6. Sitemap dan Route

### Public routes

```text
/                         Home
/movies                    Daftar film
/series                    Daftar series
/search?q=...              Hasil pencarian
/genre                     Daftar genre
/genre/:slug               Film/series berdasarkan genre
/country                   Daftar negara
/country/:slug             Film/series berdasarkan negara
/year                      Daftar tahun
/year/:year                Film/series berdasarkan tahun
/popular                   Konten populer
/latest                    Film terbaru
/latest-series             Series terbaru
/rating                    Rating tertinggi
/release                   Berdasarkan tanggal rilis
/most-commented            Paling banyak dibahas, bila komentar aktif
/top-movie-today           Top movie hari ini
/quality/:quality          Berdasarkan kualitas
/title/:slug               Detail film atau series
/watch/:id                 Halaman streaming
```

### Admin routes setelah fase berikutnya

```text
/admin
/admin/titles
/admin/titles/new
/admin/titles/:id/edit
/admin/sections
/admin/users
/admin/reports
```

---

## 7. Fitur MVP

### 7.1 Home

Home harus mendukung section yang dapat diatur dari data backend:

1. Hero featured.
2. Film Terbaru.
3. Series Unggulan.
4. Series Update.
5. Top Bulan Ini.
6. Rekomendasi Untukmu.
7. Nonton Bareng Keluarga.
8. Action Terbaru.
9. Horror Terbaru.
10. Romance Terbaru.
11. Comedy Terbaru.
12. Korea Terbaru.
13. Thailand Terbaru.
14. India Terbaru.
15. Maraton Drakor.
16. Daftar Lengkap Film Terbaru.

Setiap section memiliki:

- Judul.
- Subtitle opsional.
- Tombol Lihat Semua.
- Maksimal jumlah item.
- Urutan item.
- Tipe layout: horizontal rail atau grid.

### 7.2 Browse

Browse harus menyediakan:

- Pagination.
- Filter tipe: semua, movie, series.
- Filter genre.
- Filter negara.
- Filter tahun.
- Filter rating minimum.
- Filter kualitas.
- Sorting: terbaru, rating, populer, judul.
- Query state tersimpan di URL.
- Loading, empty, dan error state.

### 7.3 Search

Search menggunakan endpoint JSON backend Guardian, bukan request langsung dari browser ke provider pihak ketiga.

Perilaku:

- Debounce input 250–400ms.
- Minimal 2 karakter.
- Suggestion dropdown opsional.
- Hasil movie dan series.
- Pagination.
- Highlight query opsional.
- Empty state untuk hasil kosong.

### 7.4 Detail movie

Informasi minimum:

- Poster.
- Backdrop.
- Judul.
- Judul alternatif.
- Tahun rilis.
- Durasi.
- Rating dan jumlah vote.
- Kualitas.
- Genre.
- Negara.
- Sutradara.
- Cast.
- Sinopsis.
- Trailer opsional.
- Tombol Watch Now.
- Tombol Add to Watchlist setelah autentikasi.
- Konten terkait.

### 7.5 Detail series

Selain informasi movie:

- Daftar season.
- Selector season.
- Daftar episode.
- Nomor episode.
- Judul episode.
- Durasi opsional.
- Status tersedia.
- Tombol play setiap episode.
- Episode sebelumnya/berikutnya pada halaman player.

### 7.6 Streaming

Halaman `/watch/:id` harus menyediakan:

- Player utama.
- Judul konten.
- Nomor season dan episode bila series.
- Tombol server/source  yang tersedia.
- Selector kualitas jika didukung.
- Subtitle jika tersedia dan berlisensi.
- Episode navigation untuk series.
- Tombol next episode.
- Error fallback jika source tidak tersedia.
- Peringatan konten/rating usia bila dibutuhkan.

Sumber video wajib divalidasi backend dan tidak boleh menyimpan credential provider di frontend.

---

## 8. Model Data Awal

### Title

```ts
interface Title {
  id: string
  slug: string
  type: 'movie' | 'series'
  title: string
  originalTitle?: string
  synopsis: string
  posterUrl: string
  backdropUrl?: string
  trailerUrl?: string
  releaseDate?: string
  year?: number
  runtimeMinutes?: number
  rating?: number
  voteCount?: number
  quality?: string[]
  genres: Genre[]
  countries: Country[]
  director?: Person
  cast: Person[]
  status?: 'released' | 'ongoing' | 'upcoming'
  createdAt: string
  updatedAt: string
}
```

### Season dan Episode

```ts
interface Season {
  id: string
  titleId: string
  seasonNumber: number
  name?: string
  posterUrl?: string
  episodes: Episode[]
}

interface Episode {
  id: string
  seasonId: string
  episodeNumber: number
  title: string
  synopsis?: string
  runtimeMinutes?: number
  releaseDate?: string
  thumbnailUrl?: string
  sources: StreamSource[]
}
```

### StreamSource

```ts
interface StreamSource {
  id: string
  label: string
  provider: string
  playbackUrl: string
  format: 'hls' | 'dash' | 'mp4'
  quality?: string
  subtitles?: SubtitleTrack[]
  isActive: boolean
}
```

### HomeSection

```ts
interface HomeSection {
  id: string
  type: string
  title: string
  subtitle?: string
  seeAllUrl?: string
  itemIds: string[]
  position: number
  isVisible: boolean
}
```

---

## 9. API Contract

Base URL contoh: `/api`.

### Home

```text
GET /api/home
```

Response:

```json
{
  "hero": {},
  "sections": [
    {
      "type": "latest",
      "title": "Film Terbaru",
      "seeAll": "/latest",
      "items": []
    }
  ]
}
```

### Browse

```text
GET /api/titles?page=1&limit=24&type=movie&genre=action&country=us&year=2026&sort=latest
```

Response:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 24,
    "totalItems": 0,
    "totalPages": 0
  },
  "filters": {
    "type": "movie",
    "genre": "action"
  }
}
```

### Search

```text
GET /api/search?q=guardian&page=1&limit=20
```

### Metadata

```text
GET /api/genres
GET /api/countries
GET /api/years
```

### Detail

```text
GET /api/titles/:slug
```

### Streaming

```text
GET /api/titles/:id/stream
GET /api/episodes/:id/stream
```

Backend harus:

- Memvalidasi parameter.
- Memberikan status HTTP yang benar.
- Menyembunyikan credential dan signing key.
- Mengatur cache untuk metadata.
- Mencatat error provider tanpa membocorkan URL sensitif ke log publik.

---

## 10. Arsitektur Teknis yang Disarankan

Karena repository masih kosong, implementasi dapat dimulai sebagai aplikasi full-stack modern dengan pemisahan berikut:

```text
app/
  routes atau pages/
  components/
  layouts/
  lib/
  styles/
server/
  routes/
  services/
  adapters/
  validators/
  repositories/
public/
  images/
db/
  schema/
```

### Layer

1. **UI layer** — komponen presentasional dan halaman.
2. **API layer** — route JSON publik.
3. **Service layer** — pencarian, katalog, detail, playback.
4. **Repository layer** — database atau adapter API .
5. **Provider adapter** — integrasi CMS, storage, dan video provider.
6. **Validation layer** — validasi query dan response.

### Prinsip

- Server-side fetching untuk data yang membutuhkan secret.
- DTO terpisah dari model database.
- URL playback disigned atau diproxy sesuai provider.
- Cache metadata dan gambar.
- Lazy loading poster dan section.
- Accessible keyboard navigation.

---

## 11. Rancangan Halaman

### Home

```text
[Header]
[Hero featured dengan backdrop]
[Continue Watching - bila login]
[Film Terbaru horizontal rail]
[Series Unggulan horizontal rail]
[Series Update horizontal rail]
[Top Bulan Ini horizontal rail]
[Genre/editorial rails]
[Daftar lengkap terbaru dalam grid]
[Footer]
```

### Browse

```text
[Header]
[Breadcrumb + judul halaman]
[Filter bar]
[Active filter chips]
[Poster grid]
[Pagination]
[Footer]
```

### Detail

```text
[Header]
[Backdrop hero gelap]
[Poster + informasi utama]
[CTA Watch / Watchlist]
[Sinopsis]
[Metadata]
[Cast]
[Trailer]
[Season selector + episode list jika series]
[Related titles]
[Footer]
```

### Watch

```text
[Header minimal]
[Video player]
[Judul + metadata episode]
[Server/source selector]
[Subtitle/quality selector]
[Previous / next episode]
[Episode list]
[Related content]
```

---

## 12. Keamanan dan Kepatuhan

- Hanya gunakan konten dan provider yang .
- Jangan menyimpan API key di repository.
- Gunakan environment variables untuk secret.
- Validasi dan sanitasi semua query.
- Terapkan rate limit pada search dan endpoint stream.
- Gunakan CSP, secure headers, dan HTTPS.
- Jangan menerima arbitrary URL playback dari input pengguna.
- Whitelist domain provider streaming.
- Gunakan signed URL dengan masa berlaku pendek bila tersedia.
- Tampilkan rating usia dan peringatan konten sesuai kebutuhan lisensi.
- Sediakan mekanisme takedown dan contact copyright.
- Tambahkan Terms of Service, Privacy Policy, dan Copyright Policy sebelum publikasi.

---

## 13. SEO dan Metadata

- SEO title dan description unik pada detail.
- Open Graph image menggunakan backdrop/poster.
- Canonical URL.
- JSON-LD Movie atau TVSeries.
- Sitemap untuk title aktif.
- Robots.txt.
- URL slug stabil.
- Breadcrumb structured data.

---

## 14. Performa

Target:

- Poster menggunakan format modern seperti WebP/AVIF bila didukung.
- `loading="lazy"` untuk poster di bawah fold.
- Hero image diprioritaskan dengan ukuran responsive.
- Cache API read-heavy.
- Pagination server-side.
- Hindari request per card.
- Gunakan skeleton agar layout tidak meloncat.
- Player dimuat setelah halaman siap atau setelah user menekan play.

---

## 15. Accessibility

- Semua gambar memiliki alt text.
- Tombol memiliki label yang jelas.
- Focus state terlihat.
- Navigasi keyboard untuk rail dan modal.
- Kontras teks memenuhi WCAG AA.
- Jangan mengandalkan warna saja untuk status.
- Player memiliki caption/subtitle bila tersedia.
- Respect `prefers-reduced-motion`.

---

## 16. Roadmap Implementasi

### Fase 0 — Foundation

- Tentukan framework dan package manager.
- Buat struktur aplikasi.
- Konfigurasi environment.
- Siapkan design tokens.
- Buat layout global, header, footer, dan error boundary.

### Fase 1 — Katalog dan Home

- Definisikan model Title, Genre, Country, Season, Episode.
- Implementasikan repository data.
- Buat endpoint Home dan Titles.
- Buat hero, rail, poster card, dan grid.
- Implementasikan halaman Home.

### Fase 2 — Browse dan Search

- Buat route browse dinamis.
- Tambahkan filter dan sorting.
- Tambahkan pagination.
- Implementasikan endpoint Search.
- Tambahkan debounce dan empty state.

### Fase 3 — Detail

- Buat detail movie.
- Buat detail series.
- Buat season selector dan episode list.
- Tambahkan related titles.
- Tambahkan SEO metadata.

### Fase 4 — Streaming 

- Integrasikan provider atau storage video berlisensi.
- Implementasikan stream endpoint.
- Tambahkan player HLS/DASH sesuai format provider.
- Tambahkan server, quality, subtitle, dan episode navigation.
- Tambahkan proteksi URL dan error fallback.

### Fase 5 — Quality dan Release

- Tambahkan test unit dan integration.
- Audit responsive.
- Audit accessibility.
- Audit performance.
- Tambahkan analytics yang mematuhi privacy.
- Siapkan deployment dan monitoring.

### Fase 6 — Post-MVP

- Login dan profile.
- Watchlist.
- Continue watching.
- Rating pengguna.
- Notifikasi episode baru.
- Admin CMS.
- Rekomendasi personal.

---

## 17. Acceptance Criteria MVP

### Home

- [ ] Hero menampilkan featured title dengan CTA yang berfungsi.
- [ ] Semua section utama dapat menampilkan data.
- [ ] Rail dapat discroll di mobile.
- [ ] Tombol Lihat Semua membuka browse terkait.
- [ ] Loading dan error state tersedia.

### Browse

- [ ] Filter movie/series berfungsi.
- [ ] Genre, country, year, quality, dan sorting dapat digunakan.
- [ ] Query filter dapat dibagikan melalui URL.
- [ ] Pagination berfungsi.
- [ ] Empty state tersedia.

### Search

- [ ] Search menerima query dan menampilkan hasil JSON.
- [ ] Query kosong tidak mengirim request.
- [ ] Hasil dapat difilter berdasarkan movie/series.
- [ ] Pagination search berfungsi.

### Detail

- [ ] Metadata utama tampil lengkap.
- [ ] Tombol tonton menuju halaman watch.
- [ ] Series menampilkan season dan episode.
- [ ] Related titles dapat diklik.
- [ ] Metadata SEO tersedia.

### Streaming

- [ ] Player hanya menggunakan source yang dikonfigurasi.
- [ ] Source yang tidak aktif tidak ditampilkan.
- [ ] Error playback memiliki pesan yang jelas.
- [ ] Episode sebelumnya/berikutnya berfungsi.
- [ ] Subtitle tampil bila tersedia.

### Technical

- [ ] Tidak ada secret di client bundle.
- [ ] Typecheck berhasil.
- [ ] Test utama berhasil.
- [ ] Tidak ada error console kritis.
- [ ] Layout lolos pengecekan mobile dan desktop.

---

## 18. Data Mock Awal

Sebelum provider dipilih, gunakan data mock lokal agar UI dapat dikembangkan 
Mock minimal:

- 12 movie.
- 8 series.
- 3 genre.
- 3 negara.
- 5 tahun.
- 2 series dengan beberapa season.
- 3 episode per season.
- 1 source playback per video.

Data mock harus memiliki URL placeholder yang jelas dan tidak mengarah ke konten bajakan.



## 19. Keputusan yang Masih Dibutuhkan

Sebelum implementasi teknis dimulai, tentukan:

1. Framework frontend/full-stack.
2. Database atau sumber data katalog.
3. Provider penyimpanan/video .
4. Apakah autentikasi masuk MVP.
5. Warna brand Guardian final.
6. Apakah admin CMS dibuat pada fase awal.
7. Wilayah distribusi dan aturan lisensi.
8. Format subtitle dan kualitas video.

---

## 20. Definition of Done

Sebuah fitur dianggap selesai bila:

- UI responsive dan sesuai design system.
- API tervalidasi dan memiliki error handling.
- Test relevan tersedia.
- Typecheck/build berhasil.
- Accessibility dasar terpenuhi.
- Tidak ada secret yang masuk ke repository.
- Dokumentasi penggunaan diperbarui.

---

## Ringkasan Prioritas

```text
P0: Foundation, Home, poster card, browse, search, detail, mock data
P1:  video player, episode navigation, subtitle, SEO, performance
P2: Auth, watchlist, continue watching, admin CMS
P3: Recommendation engine, notifications, subscription, analytics lanjutan
```

