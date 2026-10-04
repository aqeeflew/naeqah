# Naeqah

Platform SaaS kad kahwin digital untuk pasaran Malaysia. Pengantin pilih
template, bayar, isi butiran majlis, dan terbit satu pautan jemputan yang
diedar melalui WhatsApp. Tetamu buka pautan itu dalam browser — tiada app,
tiada akaun, tiada kata laluan.

- Spesifikasi penuh: `docs/SPEC.md`
- Senarai task: `docs/BACKLOG.md`
- Status semasa: `docs/PROGRESS.md`

---

## PROTOKOL SESI AUTONOMOUS — baca ini dahulu

Setiap sesi berjadual bermula **kosong**. Tiada ingatan daripada sesi sebelum
ini. Semua konteks datang daripada fail dalam repo ini — itulah sebabnya
`docs/PROGRESS.md` wajib dikemas kini setiap kali.

Urutan setiap sesi:

1. `git pull` pada `main` — pastikan terkini.
2. Baca `docs/PROGRESS.md`, kemudian `docs/BACKLOG.md`.
3. Ambil **satu** task `[ ]` pertama yang tiada blocker. Satu sahaja.
4. Laksanakan sepenuhnya, termasuk test.
5. Jalankan `npm run verify` (typecheck + lint + test). Mesti hijau.
6. Commit ke branch `task/<ID>-<slug>`, push, buka PR.
7. Dalam PR yang sama: tanda `[x]` dalam `docs/BACKLOG.md` dan tulis entri
   baharu dalam `docs/PROGRESS.md`.

### Bila tersekat

Kalau task tidak boleh disiapkan — kelayakan tiada, keperluan tidak jelas,
keputusan reka bentuk diperlukan — **jangan teka** dan **jangan lompat ke task
lain**. Tulis dalam `docs/PROGRESS.md` di bawah `## Tersekat`: task mana, apa
yang menghalang, dan apa yang Aqeef perlu sediakan. Kemudian berhenti.

Satu sesi yang berhenti dengan sebab yang jelas lebih berguna daripada lima PR
yang mengandaikan perkara yang salah.

### Peraturan keras

- **Satu task satu sesi.** Jangan sesekali gabungkan dua.
- **Jangan push terus ke `main`.** Sentiasa PR. Aqeef yang merge.
- **Jangan commit rahsia.** Tiada kunci API, tiada `.env`. Kemas kini
  `.env.example` sahaja.
- **Jangan tukar stack** di bawah. Ia sudah diputuskan; menukarnya setiap sesi
  adalah punca utama projek autonomous jadi tidak konsisten.
- **Jangan reka nilai sebenar.** Kalau perlu ID merchant, kadar yuran gateway,
  atau apa-apa fakta luar — itu blocker, bukan tekaan.
- **Template bukan komponen React.** Lihat "Enjin template" di bawah.

### Apa yang sesi autonomous TIDAK patut cuba

Perkara ini memerlukan mata manusia atau kelayakan sebenar. Kalau task
menyentuhnya, tulis sebagai blocker:

- Reka bentuk visual template (rupa kad itu sendiri) — ini yang menjual produk,
  dan ia keputusan estetik, bukan keputusan kod.
- Integrasi payment gateway hidup, pendaftaran merchant, ujian webhook sebenar.
- Teks pemasaran, harga muktamad, polisi undang-undang atau PDPA.
- Apa-apa yang memadam data pengguna atau menukar tetapan pengeluaran.

---

## Stack (muktamad — jangan tukar)

| Lapisan | Pilihan |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| ORM / DB | Drizzle ORM + Postgres (Neon) |
| Test unit | Vitest |
| Test e2e | Playwright |
| Payment | ToyyibPay (sandbox dahulu) |
| Hosting | Vercel |

## Konvensyen

- **Bahasa UI: Bahasa Malaysia.** Kod, nama pembolehubah, komen dan mesej
  commit: English.
- **Mobile-first.** Reka pada 390px dahulu, kemudian lebarkan. Majoriti
  pengantin dan hampir semua tetamu guna telefon.
- **Halaman kad mesti statik.** `/kad/[slug]` dijana semasa build atau ISR —
  tiada query pangkalan data semasa request. Kalau app atau DB down pada pagi
  majlis, kad tetamu mesti tetap buka. Hanya penghantaran RSVP perlu app hidup.
- Fail test duduk sebelah sumbernya: `foo.ts` + `foo.test.ts`.
- Mesej commit: `<type>(<scope>): <ringkasan>` — contoh `feat(editor): add venue fields`.

## Enjin template

Satu template **bukan** komponen React baharu. Satu template ialah satu rekod
konfigurasi (JSON) yang dibaca oleh renderer yang sama:

- `lib/card-schema.ts` — bentuk data kad yang tetap: nama pengantin, nama ibu
  bapa, tarikh, masa, tempat, atur cara, doa, gambar.
- `lib/themes/<slug>.json` — palet warna, pasangan font, susun atur, imej latar.
- `components/card/` — renderer yang membaca kedua-duanya.

Tambah template = tambah satu fail JSON dan asetnya. Kalau anda dapati diri
anda menulis komponen React baharu untuk satu template, berhenti — reka bentuk
itu salah dan ia akan patah sekitar template ke-10.

## Arahan

```
npm run dev        # server pembangunan
npm run verify     # typecheck + lint + test — mesti hijau sebelum PR
npm run db:push    # terapkan perubahan skema
npm run db:seed    # isi data contoh
```
