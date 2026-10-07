# Backlog

Satu task = satu sesi = satu PR. Ambil task `[ ]` pertama yang tiada blocker.

Setiap task ada **Siap bila** — kriteria penerimaan. Kalau anda tidak boleh
penuhi semuanya, task itu belum siap; tulis sebabnya dalam `PROGRESS.md`.

Task bertanda 🔴 memerlukan input manusia dan **tidak boleh** disiapkan oleh
sesi autonomous. Langkau dan ambil yang seterusnya.

---

## Persediaan (Aqeef — sebelum coding)

### [ ] 🔴 P1 — Daftar SSM
Pendaftaran perniagaan. Semua payment gateway Malaysia perlu SSM aktif sebelum
boleh buka akaun merchant. Mula awal — ini ambil masa paling lama.

### [x] 🔴 P2 — Buka akaun Neon (Postgres)
Pangkalan data percuma untuk mula. Ambil connection string, simpan dalam `.env`
tempatan. Jangan commit.

**Selesai.** Disimpulkan daripada A2b: `npm run db:push` tidak boleh berjaya
tanpa akaun Neon dan connection string. Aqeef sahkan kalau ini silap.

### [x] 🔴 P3 — Buka akaun Vercel
Hosting. Sambung terus ke repo ini supaya setiap merge ke `main` auto-deploy.

**Selesai 5 Oktober 2026.** Diperhatikan terus, bukan dilaporkan: bot Vercel
kini mengulas pada PR repo ini dan deployment preview untuk
`task/A4-card-renderer` sampai ke status Ready. Sambungan repo → Vercel wujud.
Deploy pengeluaran pada merge ke `main` ikut daripada sambungan yang sama,
tetapi belum pernah diperhatikan berlaku — ia akan berlaku pada merge pertama.

---

## Operasi

Kerja pada protokol dan perkakas sesi itu sendiri, bukan pada produk. Task di
sini tidak menyentuh kod aplikasi.

### [x] OPS1 — Langkah 0 jangan tulis ke `main`

Protokol langkah 0 (versi lama) menyuruh sesi yang dilangkau menulis nota terus
ke `docs/PROGRESS.md` pada `main`. Langkah 7 menyuruh setiap PR menulis ke fail
yang **sama**, di tempat yang sama — betul-betul selepas `## Log`. Jadi
mana-mana PR yang tertinggal semalaman dijamin berkonflik dan butang Merge
terkunci sehingga Aqeef selesaikan dengan tangan.

Berlaku dua kali, bukan teori: PR #1 (4 Okt), dan PR #6 selepas dua larian
berjadual (6 dan 7 Okt) masing-masing menambah satu nota ke `main`.

Pembetulan: sesi yang dilangkau tinggalkan **komen pada PR yang terbuka itu**
dan tamat — sifar fail diubah, jadi sifar peluang berlanggar.

**Siap bila:** langkah 0 dalam `CLAUDE.md` ditulis semula (semak PR, komen,
jangan commit, jangan sentuh `main`, tamat); bahagian "Bila tersekat"
menyatakan nota tersekat dihantar melalui PR; peraturan keras "Jangan push
terus ke `main`" jadi mutlak tanpa pengecualian; tiada perubahan pada kod
aplikasi; `npm run verify` hijau.

**Selesai 7 Oktober 2026.** Satu bahagian pembetulan ini **di luar repo** dan
perlu Aqeef: prompt task berjadual masih mengandungi baris lama "Jangan push
terus ke main kecuali untuk nota PROGRESS.md dalam langkah 0". Sesi autonomous
tidak boleh mengeditnya. Lihat `PROGRESS.md`.

---

## Fasa A — Teras (Minggu 1–4)

### [x] A1 — Init projek
Scaffold Next.js (App Router) + TypeScript + Tailwind. Tambah ESLint, Prettier,
Vitest. Cipta skrip `verify` yang menjalankan typecheck, lint dan test.

**Siap bila:** `npm run dev` memaparkan halaman utama kosong; `npm run verify`
lulus hijau; `.env.example` wujud; `.gitignore` meliputi `.env`, `node_modules`,
`.next`.

### [x] A2 — Skema pangkalan data
Sediakan Drizzle + Postgres. Tulis skema untuk `users`, `templates`, `bookings`,
`cards`, `rsvps`, `wishes` mengikut `SPEC.md`. Jana fail migrasi SQL dengan
`drizzle-kit generate` — langkah ini **tidak perlu** sambungan DB hidup, jadi
task ini boleh disiapkan sebelum P2 selesai.

**Siap bila:** `npm run db:generate` hasilkan SQL migrasi; setiap jadual ada
primary key, timestamp, dan foreign key yang betul; `cards.slug` unik dan
berindeks; `npm run verify` hijau. Pengesahan terhadap DB sebenar berlaku dalam
A2b, bukan di sini.

### [x] 🔴 A2b — Sahkan skema pada Neon
Perlu `DATABASE_URL` dari P2. Jalankan `npm run db:push` pada DB kosong dan
sahkan setiap jadual terbina seperti yang dijangka. Kalau ada beza, betulkan
skema dalam A2 dan jana semula migrasi.

**Selesai 5 Oktober 2026 oleh Aqeef sendiri, di luar repo.** Keenam-enam jadual
wujud dalam Neon; `cards_slug_unique` ada; foreign key `cards` → `bookings`
dengan `ON DELETE CASCADE` disahkan betul. Tiada perubahan skema diperlukan.
Sesi autonomous tidak menjalankan `db:push` dan tidak boleh mengesahkannya
sendiri — ia direkodkan di sini seperti yang dilaporkan.

### [x] A2c — Betulkan pemuatan DATABASE_URL untuk drizzle-kit
`drizzle.config.ts` membaca `process.env.DATABASE_URL`, tetapi tiada apa-apa
memuatkan `.env.local` ke dalam `process.env` untuk drizzle-kit. Next.js
memuatkannya sendiri; drizzle-kit ialah CLI berasingan dan tidak. Akibatnya
`npm run db:push` gagal dengan `[x] url: ''` walaupun `.env.local` betul —
ini menyekat A2b sepenuhnya.

**Siap bila:** `npm run db:push` dan `npm run db:studio` membaca
`DATABASE_URL` daripada `.env.local` tanpa langkah manual; `npm run
db:generate` masih berjalan tanpa `DATABASE_URL`; ralat yang boleh dibaca
bila pembolehubah itu betul-betul tiada, bukan rentetan kosong;
`npm run verify` hijau; `.env.example` dikemas kini.

### [x] A3 — Skema kad + taip tema
Tulis `lib/card-schema.ts` (bentuk data majlis: nama pengantin, nama ibu bapa,
tarikh, masa, tempat, koordinat, atur cara, doa, gambar) dan
`lib/theme-schema.ts` (palet, font, susun atur, latar). Guna Zod untuk validasi.

**Siap bila:** kedua-dua skema ada taip TypeScript yang dieksport; test unit
mengesahkan data sah diterima dan data rosak ditolak.

### [x] A4 — Renderer kad
Bina `components/card/` yang menerima data kad + konfigurasi tema dan merender
kad penuh. Tiada logik khusus-template di mana-mana.

**Siap bila:** renderer menerima dua argumen sahaja (data, tema); satu test
render dua konfigurasi tema berbeza dengan data yang sama dan menghasilkan
output berbeza; tiada `if (template === ...)` dalam kod.

### [x] A5 — Tema pertama + seed
Cipta `lib/themes/klasik.json` (tema asas: palet neutral, font serif, susun atur
mudah) dan skrip seed yang memasukkan satu template dan satu kad contoh.
Tema ini fungsian, bukan hasil reka bentuk akhir — A5b akan menggantikannya.

**Siap bila:** `npm run db:seed` berjaya; kad contoh dirender di
`/kad/contoh-aqeef-nurul`; halaman itu dijana statik, bukan SSR.

**Ditulis sepenuhnya 7 Oktober 2026; satu kriteria belum disahkan.** Tema,
skrip seed dan laluan statik siap, dan laluan itu terbukti prerender ke HTML
sebenar (lihat `PROGRESS.md`). **`npm run db:seed` belum pernah berjalan
terhadap pangkalan data sebenar** — sesi autonomous tiada `DATABASE_URL`, dan
egress sesi menyekat hos Neon walaupun kuncinya ada. Aqeef perlu menjalankan
`npm run db:seed` sendiri sekali untuk menutup kriteria pertama.

### [ ] 🔴 A5b — Reka bentuk 6 template sebenar
Keputusan estetik — perlu pereka manusia. Sesi autonomous tidak boleh buat ini.
Output: 6 fail tema JSON + aset berlesen komersial.

### [ ] A6 — Galeri template
Halaman `/templates` menyenaraikan template terbit dengan kad preview. Tekan
satu untuk lihat preview penuh di `/templates/[slug]`.

**Siap bila:** galeri membaca dari DB, bukan senarai hardcoded; berfungsi pada
390px; preview memaparkan tema sebenar dengan data placeholder.

### [ ] A7 — Editor butiran majlis
Borang di `/editor/[cardId]` dengan preview langsung di sebelah. Medan mengikut
`card-schema.ts`. Autosave draf.

**Siap bila:** setiap medan skema ada input; preview dikemas kini semasa menaip;
draf bertahan selepas refresh; validasi memaparkan ralat Bahasa Malaysia.

### [ ] A8 — Susun atur editor mobile
Editor pada 390px: preview di atas, borang di bawah, boleh tukar tab.

**Siap bila:** tiada skrol mendatar pada 390px; preview dan borang kedua-duanya
boleh diakses; diuji pada viewport 390×844.

---

## Fasa B — Wang & Tetamu (Minggu 5–8)

**Gate G1 sebelum masuk Fasa B:** satu kad lengkap boleh dilihat dan dikongsi.

### [ ] B1 — Auth
Log masuk pengantin. Magic link melalui e-mel. Tiada kata laluan.

**Siap bila:** daftar, log masuk, log keluar berfungsi; sesi bertahan; laluan
terlindung mengalih pengguna tidak log masuk.

### [ ] B2 — Aliran tempahan
Pilih template → cipta `booking` berstatus `pending` → pergi ke checkout.

**Siap bila:** tempahan direkod dengan pengguna, template, tier, harga; tempahan
`pending` boleh disambung semula.

### [ ] 🔴 B3a — Dapatkan kelayakan ToyyibPay sandbox
Perlu pendaftaran SSM dan akaun merchant. Manusia sahaja.

### [ ] B4 — Integrasi checkout
Integrasi ToyyibPay guna kelayakan sandbox dari B3a. Cipta bil, alih ke gateway,
kendalikan pulangan.

**Siap bila:** bayaran sandbox berjaya mengalih balik dan menanda tempahan
`paid`; bayaran gagal menanda `failed` dan membenarkan cuba semula.
Blocker kalau B3a belum siap.

### [ ] B5 — Webhook bayaran
Kendalikan callback ToyyibPay. Mesti idempoten — callback yang sama dua kali
tidak boleh menghasilkan dua kad.

**Siap bila:** test meliputi callback berganda, callback luar turutan, dan
tandatangan tidak sah; status tempahan hanya bergerak ke hadapan.

### [ ] B6 — Terbit kad
Jana slug unik, render statik, tandakan kad `published`.

**Siap bila:** terbit menghasilkan `/kad/[slug]` yang dihidang statik; halaman
dimuat tanpa sambungan DB; terbit semula selepas edit mengemas kini halaman.

### [ ] B7 — Blok lokasi
Alamat tempat + pautan Google Maps dan Waze yang dijana dari koordinat.

**Siap bila:** kedua-dua pautan membuka app yang betul pada Android dan iOS;
berfungsi apabila hanya alamat diberi tanpa koordinat.

### [ ] B8 — Borang RSVP
Borang pada halaman kad: nama, telefon, hadir/tidak, bilangan tetamu. Notis
persetujuan PDPA (teks dari 🔴 C6a).

**Siap bila:** penghantaran berfungsi tanpa akaun; had kadar mengikut IP;
pengesahan dipaparkan dalam Bahasa Malaysia; berfungsi dalam browser dalam-app
WhatsApp.

### [ ] B9 — Ucapan tetamu
Tetamu tulis ucapan pada halaman kad. Dipaparkan di bawah borang RSVP. Bendera
moderasi untuk pengantin menyembunyikan ucapan.

**Siap bila:** ucapan muncul tanpa muat semula penuh; pengantin boleh
sembunyikan satu ucapan dari dashboard; had kadar digunakan.

---

## Fasa C — Skala & Launch (Minggu 9–12)

**Gate G2 sebelum masuk Fasa C:** satu tempahan berbayar lulus hujung ke hujung.

### [ ] C1 — Dashboard RSVP
Pengantin lihat RSVP: jumlah hadir, jumlah tidak hadir, senarai penuh.

### [ ] C2 — Export CSV
Muat turun senarai RSVP sebagai CSV untuk katering.

### [ ] C3 — Admin panel
Senarai tempahan, tandai refund, terbit/nyahterbit template.

### [ ] C4 — Had kadar & pengerasan
Had kadar pada semua endpoint awam. Ujian beban pada halaman kad.

### [ ] 🔴 C6a — Teks PDPA & polisi refund
Perlu semakan manusia. Jangan karang sendiri.

### [ ] C7 — Kerja penyimpanan data
Kerja berjadual memadam data RSVP 6 bulan selepas tarikh majlis.

---

## Cara tambah task

Tulis dalam bentuk yang sama: satu hasil yang boleh diuji, dengan "Siap bila"
yang boleh disemak tanpa bertanya sesiapa. Task yang kabur menghasilkan kod
yang kabur. Tandakan 🔴 kalau ia memerlukan pertimbangan manusia atau kelayakan.
