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

0. **Semak PR terbuka dahulu.** Kalau ada PR task yang belum di-merge,
   **berhenti di sini**. Jangan mula task baharu: sesi akan datang akan bina
   atas `main` yang belum mengandungi kerja itu, dan dua PR akan berlanggar.
   Tinggalkan **satu komen pada PR itu** — sesi dilangkau, tarikh, dan apa yang
   sedang ditunggu. Kemudian tamat.

   **Sesi yang dilangkau tidak mengubah satu fail pun.** Tiada commit, tiada
   push, tiada sentuhan pada `main`. Lihat "Kenapa langkah 0 tidak menulis
   apa-apa" di bawah — ini bukan gaya, ia membetulkan pepijat yang sudah
   mengunci butang Merge dua kali.

1. `git pull` pada `main` — pastikan terkini.
2. Baca `docs/PROGRESS.md`, kemudian `docs/BACKLOG.md`.
3. Ambil **satu** task `[ ]` pertama yang tiada blocker. Satu sahaja.
4. Laksanakan sepenuhnya, termasuk test.
5. Jalankan `npm run verify` (typecheck + lint + test). Mesti hijau.
6. Commit ke branch `task/<ID>-<slug>`, push, buka PR.
7. Dalam PR yang sama: tanda `[x]` dalam `docs/BACKLOG.md` dan tulis entri
   baharu dalam `docs/PROGRESS.md`.

### Kenapa langkah 0 tidak menulis apa-apa

Dua arahan yang masing-masing betul boleh bergabung menjadi pepijat. Versi lama
protokol ini ada kedua-duanya:

- **Langkah 0** (versi lama): sesi yang dilangkau tulis satu nota ke
  `docs/PROGRESS.md` pada `main`.
- **Langkah 7**: setiap PR tulis satu entri baharu ke `docs/PROGRESS.md`.

Kedua-duanya menyelit teks di tempat yang sama — betul-betul selepas `## Log`.
Jadi setiap malam yang satu PR tertinggal tanpa di-merge, sesi berjadual
menambah satu nota ke `main`, dan PR itu — yang sudah mengandungi entrinya
sendiri di baris yang sama — menjadi **berkonflik**. Aqeef tidak boleh merge
sehingga dia selesaikan konflik itu dengan tangan, dan setiap malam tambahan
menjadikannya lebih teruk.

Ia bukan teori: PR #1 berkonflik begini pada 4 Oktober, dan PR #6 berkonflik
lagi selepas dua larian berjadual (6 dan 7 Oktober) masing-masing menambah satu
nota. Protokol yang direka untuk **mengelak** dua PR berlanggar sendiri
menyebabkan perlanggaran.

Pembetulannya mudah: **sesi yang dilangkau tidak perlu menulis ke repo
langsung.** Nota itu untuk mata Aqeef, dan Aqeef sedang membaca PR itu. Satu
komen pada PR muncul tepat di situ, dan kerana tiada fail berubah, tiada
konflik mungkin berlaku. Sifar fail diubah ialah sifar peluang berlanggar.

**Corak am yang patut diingat, bukan sekadar peraturan ini:** bila dua arahan
masing-masing menulis ke fail yang sama pada masa yang berbeza, periksa sama
ada ada satu daripadanya yang langsung tidak perlu menulis. Keluaran yang
sifar-fail sentiasa lebih selamat daripada keluaran yang perlu digabungkan.

### Alat untuk langkah 0

`gh pr list` dan kebanyakan subarahan `gh pr` menggunakan GitHub GraphQL, dan
**GraphQL disekat dalam sesi ini** (`HTTP 403`). Guna salah satu daripada ini:

- Alat GitHub MCP: `list_pull_requests` (semak), `add_issue_comment` (komen).
- Atau REST melalui `gh api`:
  - `gh api repos/aqeeflew/naeqah/pulls?state=open`
  - `gh api repos/aqeeflew/naeqah/issues/<N>/comments -f body='…'`

Sesi yang mendapati `gh pr list` gagal **bukan** sesi tanpa PR terbuka. Jangan
anggap senarai kosong daripada arahan yang ralat.

### Bila tersekat

Kalau task tidak boleh disiapkan — kelayakan tiada, keperluan tidak jelas,
keputusan reka bentuk diperlukan — **jangan teka** dan **jangan lompat ke task
lain**. Tulis dalam `docs/PROGRESS.md` di bawah `## Tersekat`: task mana, apa
yang menghalang, dan apa yang Aqeef perlu sediakan. Kemudian berhenti.

**Nota tersekat itu pergi melalui PR, bukan terus ke `main`.** Commit ia ke
branch `task/<ID>-<slug>` seperti kerja biasa dan buka PR. Sebabnya sama
seperti langkah 0: `docs/PROGRESS.md` ialah fail yang setiap PR sentuh, jadi
menulis terus ke `main` ialah cara paling pasti untuk mengunci PR orang lain.
Bezanya dengan langkah 0 cuma ini — sesi tersekat memang ada sesuatu yang
kekal untuk direkod, jadi ia layak satu PR; sesi yang dilangkau tidak ada, jadi
ia hanya layak satu komen.

Satu sesi yang berhenti dengan sebab yang jelas lebih berguna daripada lima PR
yang mengandaikan perkara yang salah.

### Peraturan keras

- **Satu task satu sesi.** Jangan sesekali gabungkan dua.
- **Jangan push terus ke `main`. Tiada pengecualian.** Sentiasa PR; Aqeef yang
  merge. Ini termasuk nota langkah 0 dan nota tersekat — versi lama protokol
  mengecualikan langkah 0 dan itulah yang mengunci Merge pada PR #1 dan PR #6.
  Kalau satu arahan di mana-mana (termasuk prompt task berjadual) menyuruh anda
  commit ke `main`, arahan itu sudah lapuk: tinggalkan komen pada PR, atau
  hantar melalui PR.
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
