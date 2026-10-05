# Progress

Fail ini ialah ingatan antara sesi. Setiap sesi autonomous bermula kosong dan
membaca fail ini dahulu — jadi apa yang tidak ditulis di sini tidak wujud.

**Setiap sesi mesti menambah satu entri**, walaupun sesi itu gagal.

Format entri (terbaru di atas):

```
## YYYY-MM-DD — <ID task> <tajuk>
PR: <pautan>
Apa yang berubah: <2–3 baris>
Keputusan yang diambil: <apa-apa yang sesi akan datang perlu tahu>
Nota: <apa yang mengejutkan, apa yang rapuh>
```

---

## Tersekat

Apa-apa yang menghalang kemajuan. Kosongkan apabila selesai.

- **A5b, B3a, C6a** memerlukan Aqeef — lihat `BACKLOG.md`. B3a (kelayakan
  ToyyibPay sandbox) menyekat B4 dan B5, iaitu separuh Fasa B. Ia bermula
  dengan pendaftaran SSM, yang mengambil masa paling lama. Mulakan awal.
- **A2b menunggu P2 sahaja sekarang.** Skema dan migrasi SQL sudah siap (A2),
  tetapi belum pernah dijalankan terhadap Postgres sebenar. Aqeef perlu buka
  akaun Neon, ambil `DATABASE_URL`, dan letak dalam `.env.local` — tiada
  langkah lain. Halangan alat sudah tiada: sebelum A2c, `npm run db:push`
  gagal walaupun dengan `.env.local` yang betul, kerana drizzle-kit tidak
  membaca fail itu. Itu sudah dibaiki. A3 dan A4 sudah siap tanpa DB.
- **P2 kini halangan sebenar untuk Fasa A, bukan lagi hanya A2b.** A3 dan A4
  ialah dua task terakhir yang boleh disiapkan tanpa pangkalan data. Kriteria
  "Siap bila" bagi A5 ialah `npm run db:seed` berjaya; A6 mesti membaca galeri
  **dari DB, bukan senarai hardcoded**; A7 menyimpan draf. Ketiga-tiganya
  memerlukan `DATABASE_URL`. **Sesi seterusnya kemungkinan besar akan berhenti
  pada A5 melainkan P2 sudah selesai** — satu akaun Neon percuma dan satu
  baris dalam `.env.local` membuka tiga task sekali gus. Ini satu-satunya
  perkara yang Aqeef perlu buat untuk Fasa A terus berjalan.

---

## Log

## 2026-10-05 — A4 Renderer kad
PR: https://github.com/aqeeflew/naeqah/pull/6
Apa yang berubah: tambah `components/card/` — `card-renderer.tsx` (akar),
`card-sections.tsx` (satu komponen setiap seksyen + `sectionRegistry`),
`card-theme.ts` (tema → CSS custom properties), `card-format.ts` (tarikh dan
masa Bahasa Malaysia), `placeholder-card.ts` (satu kad rekaan untuk preview
A6 dan test), dan `index.ts`. 310 test hijau, termasuk 112 test baharu.
Keputusan yang diambil:
- **Seksyen dipilih melalui `sectionRegistry`, bukan melalui `if`.** Renderer
  berjalan atas `theme.layout.sections`, mencari setiap id dalam satu
  `Record<SectionId, …>`, dan merender apa yang dijumpainya. Taip `Record`
  itu bermakna menambah id baharu pada `sectionIdSchema` **tanpa** blok di
  sini gagal typecheck — satu tema tidak boleh menamakan seksyen yang
  renderer senyap-senyap buang. Inilah mekanisme yang menggantikan kod
  per-template; jangan ganti dengan senarai JSX yang disusun tangan.
- **Seksyen kosong dibuang sebelum pemisah diletak.** `visibleSections()`
  menapis seksyen yang tiada kandungan (tema senarai `doa`, pengantin tidak
  tulis doa). Kalau tidak, tetamu nampak tajuk kosong dengan garis di
  bawahnya, yang kelihatan seperti pepijat. Bilangan pemisah sentiasa
  `seksyen − 1`, dan ada test untuk itu pada kad paling nipis yang skema
  benarkan.
- **`rsvp` dan `ucapan` sentiasa ada kandungan.** Kedua-duanya bekas untuk
  apa yang tetamu hantar (B8, B9), bukan untuk data kad, jadi
  `hasContent` mereka sentiasa benar.
- **`<img>` biasa, bukan `next/image`.** Pengoptimum `next/image` ialah laluan
  pelayan (`/_next/image`), jadi setiap gambar pada kad "statik" akan
  bergantung pada app hidup. Keputusan seni bina 1 dalam `SPEC.md` kata kad
  mesti tetap buka kalau app atau DB down pada pagi majlis. Ada
  `eslint-disable-next-line` dengan sebab itu ditulis pada `Photo`. Jangan
  tukar ke `next/image` tanpa membatalkan janji itu secara sedar.
- **Tiada `Intl` untuk nama bulan dan hari.** `next build` boleh berjalan pada
  Node tanpa ICU penuh, dan `Intl.DateTimeFormat('ms-MY')` jatuh balik ke
  English secara senyap — kad akan tertulis "March". Jadual bulan dan hari
  ditulis tangan dalam `card-format.ts`. Ada test yang menegaskan
  `formatCardDateShort('2027-03-01')` tidak mengandungi "March".
- **Masa guna titik, bukan titik bertindih:** `14:30` → `2.30 petang`, ikut
  cara kad Malaysia ditulis. Sempadan waktu: 0 `tengah malam`, 1–11 `pagi`,
  12 `tengah hari`, 13–18 `petang`, 19–23 `malam`.
- **Susunan nama pengantin datang daripada `couple.host`, bukan daripada
  tema.** Pihak yang menjemput disebut dahulu. Itu fakta tentang majlis, dan
  kalau tema boleh menyusun semula, setiap template akan menduplikasi
  peraturan yang sama.
- **Hanya `card-theme.ts` menukar tema kepada gaya.** Semua seksyen melukis
  daripada custom properties (`--card-primary`, `--card-font-display`, …)
  yang dibina di situ. Tiada warna hex dalam mana-mana komponen.
- **`theme.name` tidak pernah dibaca oleh renderer.** Ia label untuk pereka
  dan galeri. Ada test yang mengimbas sumber dan gagal kalau mana-mana fail
  menyentuhnya — itu cara paling mudah untuk per-template branching menyelinap
  masuk.
- **Veil atas gambar latar ialah lapisan gradien, bukan `opacity`.** Satu
  `background-image` tidak boleh membawa opacity sendiri. Corak pula malap ke
  arah warna asasnya sendiri, bukan ke arah putih, supaya tema gelap kekal
  gelap.
- **`googleFontsHref()` dipulangkan, bukan dirender.** Pautan stylesheet milik
  `<head>` halaman `/kad/[slug]` (B6); `<link>` dari dalam badan kad dimuat
  lewat dan menyebabkan teks berkelip. Tema yang guna font sistem sahaja
  mendapat `undefined` — sifar permintaan rangkaian.
- **Pautan Maps dan Waze sengaja tiada.** Itu B7, yang mesti berfungsi dari
  alamat bertulis sahaja tanpa koordinat. Membinanya separuh di sini bermakna
  dua tempat untuk dibetulkan. Ada test yang menegaskan blok lokasi tidak
  mengandungi sebarang `<a>`.
- **Blok RSVP tiada borang dan tiada teks PDPA.** Borang ialah B8; teks notis
  ialah C6a dan **mesti** disemak manusia. Ada test yang menegaskan tiada
  `<form>`/`<input>` dan tiada perkataan "PDPA"/"persetujuan" dalam output.
Nota:
- **Sifar pakej baharu.** `package.json` tidak berubah langsung.
- **Renderer ialah server component tulen** — tiada `use client`, tiada hook,
  tiada pengendali acara. Tiga test mengimbas sumber untuk ketiga-tiganya,
  supaya sesi akan datang tidak memecahkan prarender tanpa sedar.
- Disahkan dengan build sebenar, bukan hanya test: satu laluan sementara
  `app/probe-kad/page.tsx` ditambah, `npm run build` memberi
  `○ /probe-kad (Static)`, dan `.next/server/app/probe-kad.html` mengandungi
  "Sabtu, 15 Mei 2027", "Dibuat dengan Naeqah" dan kesembilan `data-section`
  mengikut susunan tema. Laluan itu **dibuang** selepas semakan — laluan kad
  sebenar ialah A5/B6, dan satu task satu sesi.
- `test-themes.ts` ialah dua tema yang sengaja berbeza pada **setiap** paksi
  skema. Ia test-only; tema sebenar pertama ialah `lib/themes/klasik.json`
  (A5). Jangan import `test-themes.ts` dari kod app.
- `placeholder-card.ts` **tiada gambar** dengan sengaja: setiap rujukan imej
  perlu fail dalam `public/`, dan aset berlesen datang dengan A5b. Preview A6
  yang memaparkan ikon gambar rosak lebih teruk daripada preview teks sahaja.
  Tambah `photos` di situ selepas A5b.
- Jarak sekitar `&` pada kad kulit ditulis sebagai `{' '}` eksplisit, bukan
  `mx-2` sahaja. Margin memberi ruang visual tetapi `textContent` jadi
  "Zulkifli&Aisyah" — itu yang pembaca skrin sebut dan yang tetamu salin.
- Disemak sendiri: `npm run verify` hijau (310 test), `npm run build` berjaya
  dengan `/` masih statik, `npx prettier --check .` bersih.
- **Task seterusnya ialah A5, dan ia kemungkinan besar tersekat pada P2.**
  Lihat `## Tersekat` di atas — `npm run db:seed` perlu `DATABASE_URL`.

## 2026-10-05 — A2c Betulkan pemuatan DATABASE_URL untuk drizzle-kit
PR: https://github.com/aqeeflew/naeqah/pull/5
Apa yang berubah: tambah `lib/env.ts` (pemuat fail env + ralat yang boleh
dibaca), sambungkan `drizzle.config.ts` kepadanya, dan buat
`lib/db/index.ts` guna mesej ralat yang sama. Kemas kini `.env.example`.
218 test hijau, termasuk 20 test baharu. Task ini **tidak** dalam backlog
asal — Aqeef jumpa bug ini sendiri semasa menyemak, dan ia ditambah sebagai
A2c dalam PR yang sama.
Keputusan yang diambil:
- **Punca bug, supaya tiada sesi mengulanginya:** `.env.local` bukan sesuatu
  yang Node baca sendiri. **Next.js** yang membacanya — setiap arahan `next`
  memuatkan fail itu ke dalam `process.env` sebelum kod aplikasi berjalan.
  `drizzle-kit` ialah CLI yang lain sepenuhnya; ia tidak tahu apa-apa tentang
  Next.js, jadi `process.env.DATABASE_URL` kosong di dalamnya. `?? ''` dalam
  config lama menukar "tiada" itu menjadi rentetan kosong, dan drizzle-kit
  melaporkannya sebagai `[x] url: ''` — mesej yang menunjuk ke arah yang
  salah. **Peraturan am: apa-apa yang dijalankan tanpa `next` mesti memuatkan
  fail env sendiri.** Itu termasuk `db:seed` (A5) dan kerja penyimpanan (C7).
- **`process.loadEnvFile()`, bukan pakej `dotenv`.** Ia terbina dalam Node
  (kita pada 22) dan ialah penghurai yang sama di belakang `node --env-file`.
  Lebih penting: **ia tidak menimpa pembolehubah yang sudah ada dalam
  `process.env`**, jadi keutamaan jadi betul dengan sendirinya —
  persekitaran sebenar (Vercel, CI) > `.env.local` > `.env`. Menambah
  `dotenv` bermakna satu dependency untuk melaksanakan semula perkara yang
  sudah ada. Ada test untuk keutamaan itu.
- **`--env-file` TIDAK boleh dipakai di sini.** Node menolaknya dalam
  `NODE_OPTIONS` (sekatan keselamatan), dan `drizzle-kit` dilancarkan sebagai
  bin, bukan sebagai `node`. Jadi tiada jalan melalui skrip npm sahaja —
  pemuatan mesti berlaku di dalam `drizzle.config.ts`.
- **Config menyemak argv untuk tahu sama ada arahan itu menyambung.**
  `drizzle.config.ts` dimuatkan untuk **setiap** arahan drizzle-kit, termasuk
  `generate` yang tidak menyambung dan mesti kekal berjalan tanpa
  `DATABASE_URL` (kriteria A2). Jadi `drizzleKitCommandNeedsDatabase(argv)`
  menyenaraikan `push`/`pull`/`studio`/`migrate` sahaja, dan ia **gagal
  terbuka**: argv yang tidak dikenali dianggap tidak perlu DB. Kesan paling
  buruk kalau drizzle-kit tambah arahan baharu ialah mesej ralat mereka
  sendiri, bukan `generate` yang patah.
- **Rentetan kosong dikira sebagai tiada.** `DATABASE_URL=` dalam
  `.env.local` yang separuh diisi ialah bentuk asal bug ini. `requireEnv`
  menolak rentetan kosong dan ruang kosong.
- **Satu mesej ralat, satu tempat.** `requireDatabaseUrl` berpindah ke
  `lib/env.ts`; `lib/db/index.ts` mengeksport semula. Dua mesej berbeza untuk
  pembolehubah yang sama adalah bagaimana seseorang akhirnya dapat nasihat
  yang bercanggah.
Nota:
- **Sifar pakej baharu.** `package.json` tidak berubah sama sekali.
- Komen dalam `drizzle.config.ts` lama sudah mendakwa "`db:push` … fails with
  a readable error when the variable is missing". Itu tidak benar — komen itu
  menerangkan niat, bukan kod. Sekarang ia benar. Berhati-hati dengan komen
  yang mendakwa tingkah laku tanpa test.
- Disemak sendiri tanpa kelayakan sebenar, keempat-empat kriteria:
  (1) `db:generate` tanpa `DATABASE_URL` → berjaya, "No schema changes";
  (2) `db:push` tanpa fail dan tanpa pembolehubah → ralat tiga baris yang
  menamakan fail yang dicari dan pembetulannya; (3) `.env.local` dengan
  `DATABASE_URL=` kosong → ralat yang sama, bukan `url: ''`;
  (4) `db:push` dan `db:studio` dengan url palsu dalam `.env.local` → kedua-dua
  melepasi semakan dan **mencuba menyambung**, iaitu buktinya fail itu dibaca.
  `npm run verify` hijau, `npm run build` berjaya dengan `/` masih statik.
- **Tiada `db:push` dijalankan terhadap Neon sebenar.** Itu masih A2b dan ia
  bertanda 🔴 — ia perlu kelayakan Aqeef.
- `.env.local` ujian dibuang selepas semakan; ia dalam `.gitignore` juga.
- A4 (renderer kad) **tidak** disentuh dan kekal `[ ]` — satu task satu sesi.
  Ia masih task seterusnya, dan masih tidak perlu DB.

## 2026-10-05 — A3 Skema kad + taip tema
PR: https://github.com/aqeeflew/naeqah/pull/4
Apa yang berubah: tambah `zod` sebagai dependency pengeluaran, tulis
`lib/card-schema.ts` (data majlis: pengantin, ibu bapa, tarikh, masa, tempat,
koordinat, atur cara, doa, gambar, hubungi) dan `lib/theme-schema.ts` (palet,
pasangan font, susun atur, latar). 198 test hijau, termasuk 150 test baharu.
Keputusan yang diambil:
- **Dua fail, dua tanggungjawab, dan skema saling menolak kunci satu sama
  lain.** Semua objek ialah `z.strictObject`, jadi `cardDataSchema` menolak
  `palette`/`fonts`/`layout`/`background` dan `themeSchema` menolak
  `couple`/`event`/`venue`. Ada test untuk kedua-dua arah. Inilah penguatkuasaan
  mesin bagi "template ialah data, bukan kod" — kalau seseorang mula menyelit
  gaya ke dalam data kad, test merah.
- **`cardSchema` dan `cardDataSchema` ialah dua eksport berbeza.** Zod menolak
  `.partial()` pada objek yang membawa refinement, dan editor A7 perlu bentuk
  partial untuk autosave draf. Jadi `cardSchema` ialah objek tulen, dan
  `cardDataSchema = cardSchema.check(...)` menambah peraturan silang-medan
  (tarikh akhir RSVP tidak boleh selepas majlis; atur cara mesti menaik).
  **Parse dengan `cardDataSchema`**; guna `cardSchema` hanya untuk mengarang
  borang.
- **Mesej validasi dalam Bahasa Malaysia**, nama medan dalam English. Mesej itu
  dipaparkan terus dalam editor (A7 "Siap bila"), jadi ia bukan teks dalaman.
  Nilai domain yang pereka atau tetamu lihat — id seksyen, `host` — BM, ikut
  enum A2.
- **Koordinat opsional di setiap tempat.** B7 mesti bina pautan Maps/Waze dari
  alamat bertulis sahaja; ada test yang menegaskan `venue` sah tanpa koordinat.
  Julat koordinat global (-90..90, -180..180), bukan dikurung ke Malaysia.
- **Nombor telefon disimpan seperti yang ditaip.** "012-345 6789" kekal begitu.
  Menormalkan ke E.164 bermakna meneka kod negara yang pengantin tidak beri.
- **Tarikh ialah string `YYYY-MM-DD`, disemak terhadap kalendar sebenar.**
  `Date.parse('2027-02-31')` **tidak** gagal — JS menggulungnya ke 3 Mac. Jadi
  `isRealCalendarDate()` membandingkan komponen yang diparse semula. Jangan
  ganti dengan `Date.parse` atau `z.iso.date()` tanpa menyemak perkara ini.
- **`venue.state` ialah string bebas, bukan enum 13 negeri.** Kad untuk majlis
  di luar negara mesti tetap sah. Poskod pula ketat lima digit.
- **`background` ialah `z.discriminatedUnion('kind', …)`** dengan empat varian
  (`warna`/`gradien`/`imej`/`corak`), bukan himpunan medan opsional — satu tema
  tidak boleh mengisytiharkan gradien *dan* imej lalu menyerahkan pilihan
  kepada renderer.
- **Palet ada lapan slot dan semuanya wajib** (termasuk `onPrimary`). Tema yang
  meninggalkan satu slot memaksa renderer mencipta fallback, dan fallback
  per-template itulah yang reka bentuk ini cuba halang.
- **`layout.sections` ialah kontrak A4.** Senarai id seksyen BM, mesti unik,
  mesti bermula dengan `pembuka`, dan mesti mengandungi `rsvp` — kad tanpa
  jalan untuk menjawab ialah perkara yang pengantin bayar untuk dapatkan.
  A4 membaca susunan ini; jangan hardcode susunan dalam renderer.
- **`themeSchema` ada `version: z.literal(1)`.** Tema ialah JSON tulis-tangan;
  versi itulah satu-satunya cara sesi akan datang tahu satu fail mendahului
  perubahan skema. Naikkan ke 2 hanya bersama kod migrasi.
- **Tema TIDAK mengandungi `slug`, nama galeri atau tier** — ketiga-tiganya
  lajur pada jadual `templates` (A2). Menduplikasi mereka dalam JSON menjemput
  dua sumber kebenaran yang terpesong.
- `showBranding` eksplisit dalam tema, bukan disimpulkan daripada tier. Baris
  "Dibuat dengan Naeqah" ialah saluran pertumbuhan utama (SPEC.md), jadi ia
  patut kelihatan dalam fail yang pereka buka.
Nota:
- **`zod` sudah ada dalam `package-lock.json`** sebagai dependency dev
  transitif (di bawah `drizzle-kit`). `npm install zod` hanya menaikkannya ke
  dependency langsung pada versi yang sama (4.6.5) — **sifar pakej baharu, sifar
  versi berubah**. Diff lock ialah dua baris.
- Zod 4, bukan 3: guna `{ error: '…' }` bukan `{ message: '…' }`, dan
  `.check((ctx) => ctx.issues.push(…))` bukan `.superRefine()`.
- `lib/theme-schema.test.ts` mengimbas `lib/themes/*.json` dan mengesahkan
  setiap fail. Direktori itu masih kosong, jadi test itu lulus secara remeh
  **sekarang** — ia menjadi pengawal sebenar sebaik A5 meletakkan
  `klasik.json` di sana. Itulah sebab pereka boleh tambah template tanpa
  menyentuh TypeScript.
- Had saiz dipilih supaya kad kekal pantas pada data mudah alih: galeri 12
  gambar, atur cara 20 baris, 4 nombor hubungi, 4 berat font per keluarga.
  Angka itu boleh dirunding; ia bukan fakta luar.
- Disemak sendiri: `npm run verify` hijau (198 test), `npm run build` berjaya
  dengan `/` masih prerender statik, `npx prettier --check .` bersih. Lima
  probe adversarial dijalankan berasingan (tarikh `+2027-03-14`, baris alamat
  ruang kosong sahaja, masa tamat sama dengan masa mula, dua baris atur cara
  pada masa sama); dua yang bernilai difoldkan ke dalam suite.
- Task seterusnya ialah A4 (renderer kad). Ia membaca kedua-dua skema ini dan
  tidak perlu DB — boleh jalan walaupun A2b masih tersekat.

## 2026-10-05 — A2 Skema pangkalan data
PR: https://github.com/aqeeflew/naeqah/pull/3
Apa yang berubah: tambah Drizzle ORM + `@neondatabase/serverless`, tulis
`lib/db/schema.ts` (enam jadual: `users`, `templates`, `bookings`, `cards`,
`rsvps`, `wishes`) dan `lib/db/index.ts` (klien dengan sambungan malas). Jana
`drizzle/0000_initial_schema.sql` dengan `drizzle-kit generate`. 47 test hijau,
termasuk 45 test baharu yang menyemak skema melalui `getTableConfig`.
Keputusan yang diambil:
- **Driver: `drizzle-orm/neon-http` + `@neondatabase/serverless`.** Laluan yang
  Neon sendiri syorkan untuk Vercel serverless. Tiada pool untuk diuruskan.
- **Klien dibina pada panggilan pertama (`getDb()`), bukan semasa import.**
  `next build` dan semua test berjalan tanpa `DATABASE_URL`. Kalau pembolehubah
  itu tiada, `requireDatabaseUrl()` baling ralat yang boleh dibaca, bukan jejak
  tumpukan driver.
- **Wang disimpan dalam sen sebagai `integer`** (`bookings.price_sen`). RM35.00
  → 3500. Jangan sesekali tukar ke `numeric` atau float.
- **Harga tier TIDAK dimasukkan ke dalam kod.** `SPEC.md` kata harga belum
  muktamad; `bookings.price_sen` merekod apa yang sebenarnya dicaj. Tiada jadual
  harga hardcoded dalam repo.
- **`cards.data` ialah `jsonb`**, jadi menambah medan pada kad (A3) tidak perlu
  migrasi. Tarikh majlis didenormalkan ke `cards.event_date` (taip `date`,
  berindeks) supaya kerja penyimpanan C7 boleh query dalam SQL.
- **`onDelete`**: `rsvps`/`wishes` → `cards` ialah `cascade` (padam kad =
  padam data tetamu, yang C7 perlukan); `cards` → `bookings` `cascade`;
  `bookings` → `users`/`templates` `restrict`, supaya rekod bayaran tidak boleh
  hilang secara tidak sengaja.
- **`bookings.gateway_ref` unik secara separa** (`where gateway_ref is not
  null`). Semua tempahan `pending` boleh biarkan ia `null`, tetapi satu bil
  ToyyibPay hanya boleh dipetakan ke satu tempahan — ini asas keidempotenan B5.
- **Enum dalam Bahasa Malaysia untuk nilai domain** (`tier`: asas/premium/
  eksklusif; `attendance`: hadir/tidak_hadir), English untuk status teknikal
  (`pending`/`paid`/`failed`/`refunded`, `draft`/`published`).
- `cards.booking_id` unik — satu tempahan satu kad. Kalau kemudian satu
  tempahan perlu beberapa kad, buang indeks itu secara sedar, bukan terlanggar.
Nota:
- Skrip baharu: `db:generate`, `db:push`, `db:studio`. **`db:seed` masih belum
  ada** walaupun `CLAUDE.md` menyebutnya — ia milik A5 bersama tema pertama.
- Migrasi dijana dengan `--name=initial_schema` supaya nama failnya bermakna;
  `drizzle-kit` tanpa flag itu memberi nama rawak (`0000_quiet_bloodstrike`).
  Guna `--name=` untuk migrasi akan datang juga.
- `drizzle/` ditambah ke `.prettierignore` — fail SQL dan `meta/*.json` dijana,
  memformatnya hanya menghasilkan diff bising.
- **`db:push` belum pernah dijalankan.** Tiada `DATABASE_URL` dalam sesi ini,
  jadi skema ini belum disahkan terhadap Postgres sebenar. Itu A2b, dan ia
  disenaraikan dalam `## Tersekat` di atas.
- `package-lock.json` bertambah 87 pakej (drizzle-kit membawa esbuild dan
  kawan-kawan). Disemak: **tiada** versi pakej sedia ada berubah dan tiada yang
  dibuang — next, react, typescript, vitest, eslint semuanya kekal.
- Disemak sendiri: `npm run verify` hijau, `npm run build` berjaya dengan `/`
  masih prerender statik, `npm run db:generate` menghasilkan SQL yang
  mengandungi enam `CREATE TABLE` dan `CREATE UNIQUE INDEX "cards_slug_unique"`.
- Task seterusnya ialah A3 (skema kad + taip tema, dengan Zod). Ia tidak perlu
  DB, jadi ia boleh jalan walaupun A2b masih tersekat.

## 2026-10-04 — Sesi dilangkau (PR #1 belum di-merge)
Sesi dilangkau mengikut protokol langkah 0: PR #1 (task A1 — init projek)
masih terbuka dan menunggu semakan Aqeef. Tiada task baharu dimulakan, kerana
`main` belum mengandungi scaffold itu dan dua PR akan berlanggar. PR #1 tiada
CI dikonfigurasi (belum ada `.github/workflows`), tiada komen dan tiada
semakan — tiada apa-apa untuk dibetulkan di sana. Merge PR #1 untuk membuka
sesi seterusnya; task seterusnya ialah A2.

## 2026-10-04 — A1 Init projek
PR: https://github.com/aqeeflew/naeqah/pull/1
Apa yang berubah: scaffold Next.js 16 (App Router) + React 19 + TypeScript +
Tailwind 4 dengan tangan (bukan `create-next-app`, kerana repo sudah ada
`README.md` yang akan berlanggar). Tambah ESLint 9, Prettier, Vitest 5, skrip
`verify`, `.env.example`, `.gitignore` penuh, dan halaman utama kosong di `app/`.
Keputusan yang diambil:
- **TypeScript dipin pada 6.0.3.** `typescript@latest` ialah 7.0 dan
  `typescript-eslint` (dalam `eslint-config-next`) menolaknya terus — lint mati.
  Jangan naikkan TypeScript ke 7 sampai `eslint-config-next` menyokongnya.
- **`eslint-config-next@16` sudah flat config.** Import
  `eslint-config-next/core-web-vitals` dan `/typescript` secara langsung;
  `FlatCompat` daripada `@eslint/eslintrc` pecah dengannya.
- **Config Vitest ialah `vitest.config.mts`**, bukan `.ts` — Vite baharu
  mengadu sintaks ESM dalam fail yang dimuat sebagai CommonJS.
- **Prettier mengabaikan `*.md`.** Ia membalut semula jadual dan prosa Bahasa
  Malaysia dalam `CLAUDE.md`/`docs/` dan menghasilkan diff bising tanpa faedah.
- `tsconfig.json` memakai `strict`, `noUncheckedIndexedAccess`,
  `noUnusedLocals`, `noUnusedParameters`. Alias `@/*` menunjuk ke root.
- Skrip `db:push`/`db:seed` yang disebut dalam `CLAUDE.md` **belum ada** — ia
  milik task A2 bersama Drizzle.
Nota:
- `next build` menulis semula `tsconfig.json` sendiri (`jsx` → `react-jsx`,
  tambah `.next/dev/types`). Perubahan itu sudah dicommit, jadi build akan datang
  tidak akan menghasilkan diff. Jangan kembalikan `jsx: preserve`.
- `npm audit` melaporkan 5 isu `high` daripada `braces` → `micromatch` →
  `fast-glob`, semuanya transitif di bawah `@next/eslint-plugin-next`. Dev-only,
  tiada dalam bundle pengeluaran. `audit fix --force` akan menurunkan
  `eslint-config-next` ke v14 — jangan buat. Tunggu hulu.
- Disemak sendiri: `npm run verify` hijau, `npm run build` berjaya dengan `/`
  prerender statik, dan `curl localhost:3000` balas HTTP 200 dengan kandungan
  halaman. Test unit duduk sebelah sumber (`app/page.test.tsx`) ikut konvensyen.
- Nota konflik: entri A1 ini dan nota "sesi dilangkau" dalam langkah 0
  kedua-duanya menyelit betul-betul selepas `## Log`, jadi commit langkah 0 ke
  `main` berlanggar dengan PR ini dan perlu diselesaikan dengan tangan. Sesi
  akan datang: kalau anda menulis nota langkah 0 ke `main` semasa satu PR masih
  terbuka, jangkakan konflik dalam fail ini dan selesaikan dengan menyimpan
  kedua-dua entri, terbaru di atas.
- Task seterusnya ialah A2 (skema pangkalan data). Ia perlu `DATABASE_URL`
  Neon untuk `db:push` dijalankan betul-betul — kalau kelayakan itu tiada, tulis
  skema dan test, dan catat `db:push` sebagai belum disahkan pada DB sebenar.

## 2026-10-04 — Scaffold awal
PR: tiada (commit terus semasa persediaan)
Apa yang berubah: cipta `CLAUDE.md`, `docs/SPEC.md`, `docs/BACKLOG.md`,
`docs/PROGRESS.md`. Repo masih tiada kod aplikasi.
Keputusan yang diambil: stack dipilih dan dikunci dalam `CLAUDE.md` (Next.js,
Drizzle, Postgres, ToyyibPay, Vercel). Template direka sebagai data JSON, bukan
komponen React — ini keputusan seni bina paling penting dalam projek.
Nota: task seterusnya ialah A1.
