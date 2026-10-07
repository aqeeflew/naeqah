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
- **A2b SELESAI (5 Oktober).** Aqeef menjalankan `npm run db:push` sendiri
  terhadap Neon sebenar. Keenam-enam jadual wujud, `cards_slug_unique` ada,
  dan foreign key `cards` → `bookings` dengan `ON DELETE CASCADE` disahkan
  betul. Tiada perubahan skema diperlukan — A2 lulus seperti ditulis. Sesi ini
  **tidak** menjalankan `db:push` dan tidak mengesahkannya sendiri; ia
  direkodkan seperti yang dilaporkan oleh Aqeef.
- **Satu `DATABASE_URL` yang wujud TIDAK sama dengan sesi autonomous yang
  boleh mencapainya.** Ini perbezaan yang akan menjatuhkan sesi seterusnya
  kalau tidak difahami. Setiap sesi berjadual bermula dalam bekas kosong:
  ia melakukan `git clone`, dan `.env.local` ada dalam `.gitignore`, jadi
  **tiada `DATABASE_URL` dalam bekas itu**. Pangkalan data Aqeef hidup di
  Neon, tetapi sesi autonomous tidak ada kuncinya.
  - **A5 SELESAI DITULIS (7 Oktober), satu kriteria menunggu Aqeef.** Tema,
    seed dan laluan statik siap. `npm run db:seed` **belum pernah berjalan
    terhadap DB sebenar** — Aqeef perlu menjalankannya sekali, kemudian
    `npm run build`. Kriteria "kad contoh dirender di
    `/kad/contoh-aqeef-nurul`" **sudah** dibuktikan, melalui probe build
    dengan fixture dalam ingatan; lihat entri A5 dalam `## Log`.
  - Akibatnya untuk **A6 dan A7**: kedua-duanya membaca dan menulis DB semasa
    request, jadi ia perlu kunci sebenar untuk diuji betul-betul.
  - **A6 SELESAI DITULIS (7 Oktober), satu kriteria menunggu Aqeef.** Galeri,
    pratonton penuh dan lapisan query siap, dan query itu membaca `templates`
    sebenar — tetapi ia **belum pernah berjalan terhadap Postgres sebenar**.
    Yang terbukti: sifar lebar melimpah pada 390px, dua lajur pada telefon dan
    tiga pada laptop, `<link>` font dalam `<head>`, 404 untuk slug yang tidak
    dikenali — semuanya diukur terhadap halaman yang **dibina**, dengan probe
    fixture dalam ingatan (lihat entri A6 dalam `## Log`). Yang tinggal ialah
    sama ada Postgres sebenar memulangkan baris yang dijangka. Aqeef: jalankan
    `npm run db:seed` sekali, kemudian buka `/templates`.
  - **Apa yang Aqeef boleh buat kalau mahu sesi autonomous mencapai DB —
    DIKEMAS KINI 7 Oktober, kunci sahaja tidak cukup.** Perlu **dua** perkara,
    bukan satu:
    1. `DATABASE_URL` kepada persekitaran sesi berjadual (rahsia persekitaran,
       bukan fail yang dicommit). Gunakan **branch Neon berasingan untuk sesi
       autonomous**, bukan branch pengeluaran — supaya `db:push` atau seed yang
       silap tidak menyentuh data sebenar.
    2. **`*.neon.tech` dalam allowlist egress rangkaian** sesi itu. Sesi A5
       mengujinya: dengan URL Neon dalam `.env.local`, percubaan sambungan
       dipulangkan `HTTP status 403: Host not in allowlist:
       api.ap-southeast-1.aws.neon.tech`. Driver `neon-http` bercakap HTTPS
       kepada hos itu, jadi tanpa allowlist, kunci yang sah pun tidak
       menyambung.
    Kalau Aqeef lebih suka tidak membuka salah satu, itu pilihan yang
    munasabah; cuma maknanya A5–A7 akan sampai sebagai kod yang belum
    dijalankan terhadap DB, dan Aqeef yang menjalankannya semasa semakan.
- **P3 (Vercel) selesai — diperhatikan terus pada 5 Oktober.** Bot Vercel
  mengulas pada PR #6 dan deployment preview sampai ke Ready, jadi sambungan
  repo → Vercel wujud. **P2 ditanda selesai secara simpulan**, kerana A2b
  tidak mungkin berjaya tanpanya. P1 (SSM) masih terbuka dan ia yang menyekat
  B3a → B4/B5.
- **Preview Vercel: laluan kad kini wujud, tetapi ia kosong sehingga seed
  dijalankan.** Sebelum ini `/` ialah satu-satunya laluan. Selepas A5,
  `/kad/[slug]` ada — tetapi ia dijana daripada baris `cards` yang
  **diterbitkan**, jadi preview hanya memaparkan kad kalau (a) projek Vercel
  ada `DATABASE_URL` dan (b) `npm run db:seed` sudah dijalankan sekali
  terhadap DB itu. Kalau salah satu tiada, build tetap hijau dan jadual
  laluan hanya menunjukkan `/kad/[slug]` tanpa satu pun halaman di bawahnya —
  itu bukan pepijat, itu amaran `[kad] DATABASE_URL is not set` dalam log
  build. Sebaik kedua-duanya ada, preview setiap PR jadi cara paling pantas
  untuk Aqeef melihat perubahan tema dengan matanya sendiri — itu nilai
  sebenar P3 untuk projek ini.
- **Fasa A yang tinggal selepas A6:** A5b 🔴 (reka bentuk 6 template — perlu
  pereka manusia), A7 (editor), A8 (susun atur editor mobile). **Task
  seterusnya ialah A7.** A7 menulis ke DB semasa request (autosave draf), jadi
  nota `DATABASE_URL` di atas kekal relevan untuknya.

---

## Log

## 2026-10-07 — A6 Galeri template
PR: https://github.com/aqeeflew/naeqah/pull/PENDING
Apa yang berubah: `lib/template-gallery.ts` (lapisan query + `TIER_LABELS`),
`components/gallery/` (miniatur tema, petak galeri, `index.ts`), laluan
`/templates` dan `/templates/[slug]`, satu pautan ke galeri pada halaman utama,
dan satu pembetulan pada `components/card/placeholder-card.ts` (lihat Nota).
421 test hijau, termasuk 65 test baharu.
Keputusan yang diambil:
- **Galeri direvalidasi (5 minit), bukan dibina sekali.** `SPEC.md` kata admin
  mesti boleh tambah template **tanpa deploy kod**. Halaman yang dirender
  semasa build sahaja memungkiri itu: baris yang diterbitkan oleh panel admin
  (C3) tidak akan muncul sehingga seseorang push commit. Harganya satu minit
  basi; untungnya C3 benar-benar berfungsi.
- **`dynamicParams` DIBIARKAN HIDUP pada `/templates/[slug]`, bertentangan
  dengan `/kad/[slug]`.** Ini bukan terlupa. Kad mematikannya kerana slug yang
  tiada dalam build mesti 404 dan bukan jatuh ke render pelayan yang query
  Postgres pada telefon tetamu. Pratonton mahukan yang sebaliknya, atas sebab
  yang sama seperti revalidate: template yang diterbitkan selepas deploy
  terakhir mesti boleh dilihat. Slug yang diketahui tetap diprerender.
- **Baris `templates` yang temanya tiada dalam build DILANGKAU, bukan
  dilempar.** Ini satu-satunya tempat A6 sengaja berbeza daripada
  `lib/card-page.ts`, yang melempar. Sebabnya: kad yang rosak dibuka tetamu
  pada pagi majlis — itu kegagalan paling teruk dalam produk ini; satu baris
  galeri yang rosak pula hanya satu petak, dan melemparkan ralat akan
  menurunkan **seluruh katalog** dan menghentikan setiap pengantin daripada
  membeli mana-mana template lain. Keadaan itu dijangka berlaku: antara
  seseorang menerbitkan baris dan deploy yang membawa JSON temanya. Ia diberi
  amaran yang menamakan baris, fail tema dan tema yang memang wujud.
  `/templates/[slug]` untuk baris yang sama tetap 404.
- **Tiada harga di mana-mana pada galeri.** `TIER_LABELS` hanya label
  ("Asas", "Premium", "Eksklusif"). `SPEC.md` kata harga belum muktamad, dan
  galeri ialah skrin tempat keputusan dibuat — angka ringgit di sini ialah
  nilai yang direka (CLAUDE.md) yang akan di-screenshot. **Ada test yang gagal
  kalau satu digit masuk ke dalam label itu.**
- **Miniatur disaiz dalam `cqw`, bukan rem.** Petak lebarnya ~165px pada
  telefon dan ~300px pada laptop; taip tetap dalam rem akan penuh pada satu
  dan terapung dalam ruang kosong pada satu lagi. Unit bekas bermakna miniatur
  itu gambar yang **sama** pada setiap saiz. `--card-text-scale` tema masih
  didarab di atasnya, jadi tema yang kuat dan tema yang senyap tetap berbeza
  di sini seperti ia berbeza pada kad.
- **Dua lajur pada 390px, bukan satu — diukur, bukan diandaikan.** Versi
  pertama satu lajur penuh lebar: diukur dengan Chromium, ia meletakkan
  **1.5 template pada skrin 390×844**, iaitu menyuruh pengantin menatal
  katalog yang dia cuba bandingkan. Dua lajur meletakkan empat, dan kerana
  miniatur disaiz dalam unit bekas ia tidak hilang kebolehbacaan pada separuh
  lebar. Tiga lajur dari `lg`.
- **Galeri memuatkan webfont setiap tema, bukan hanya halaman pratonton.**
  Tanpa itu enam tema A5b akan dipaparkan dalam serif lalai browser — enam
  skema warna dalam satu taip, iaitu separuh daripada apa itu template.
  Dinyahduplikasi: kosnya satu permintaan per **pasangan font berbeza**, bukan
  per template. Tema font sistem (klasik) menambah sifar.
- **Pratonton menggunakan `placeholderCardData`, bukan kad contoh yang
  di-seed.** Dua fixture itu memang berasingan sejak A5: yang satu ialah
  tingkap kedai, yang satu lagi kad satu pelanggan contoh. Ada test yang
  memastikan kandungan seed tidak bocor ke galeri.
- **Satu notis "ini pratonton" di atas kad, dalam Bahasa Malaysia.** Kad di
  bawahnya menamakan dewan, tarikh dan dua orang yang tidak wujud. Tanpa
  label, screenshot halaman ini beredar sebagai jemputan sebenar.
  `generateMetadata` pula menamakan **template**, bukan pasangan rekaan —
  bertentangan dengan `/kad/[slug]`, yang sengaja menamakan pasangan kerana ia
  preview pautan WhatsApp.
Nota:
- **Sifar pakej baharu.** `package.json` dan `package-lock.json` tidak
  disentuh.
- **PEMBETULAN DI LUAR SKOP SEMPIT A6, sengaja:
  `components/card/placeholder-card.ts` menyimpan nombor telefon yang
  kelihatan sebenar** (`012-345 6789`, `019-876 5432`). Sebelum A6 fixture itu
  dilihat oleh test sahaja. A6 ialah task yang meletakkannya pada halaman
  **awam**, dan seksyen `hubungi` merender setiap nombor sebagai pautan `tel:`
  yang boleh ditekan. `lib/seed-data.ts` sudah menetapkan peraturannya
  (bahagian pelanggan semua-sifar) atas sebab yang sama persis. Ditukar kepada
  `011-000 0000` dan `013-000 0000`, dengan
  `components/card/placeholder-card.test.ts` baharu yang menguatkuasakannya.
  Satu baris dalam `card-sections.test.tsx` dikemas kini mengikutnya.
- **`npm run db:seed` masih belum pernah berjalan terhadap DB sebenar**, jadi
  galeri ini masih belum pernah membaca satu baris Postgres sebenar. Lihat
  `## Tersekat`.
- **Dibuktikan terhadap build sebenar, bukan hanya test**, dengan probe
  sementara yang menggantikan dua fungsi query dengan tiga template dalam
  ingatan (satu klasik, satu tema gelap dengan Google Font, satu bernama
  panjang). Hasil, selepas `npm run build` + `npm run start` **tanpa
  `DATABASE_URL` dalam persekitaran pelayan**:
  - jadual laluan: `/templates` dengan Revalidate `5m`, dan
    `● /templates/klasik`, `● /templates/moden`, `● /templates/ketiga`.
  - `/templates` 200, `/templates/klasik` 200, `/templates/tiada-ini` **404** —
    bukti terus bahawa slug yang tidak dikenali 404 walaupun `dynamicParams`
    hidup.
  - `<link rel="stylesheet" href="…Playfair+Display…">` keluar **di dalam
    `<head>`** pada kedua-dua `/templates` dan `/templates/moden`; `klasik`
    (font sistem) menghasilkan **sifar** permintaan font.
  - `.next/server/app/templates/klasik.html` mengandungi kesembilan
    `data-section`, `<title>Klasik — Pratonton Template | Naeqah</title>`,
    notis pratonton, dan `011-000 0000` (bukan nombor lama).
- **Diukur pada 390×844 dengan Chromium sebenar terhadap halaman yang
  dibina:** `document.scrollWidth` kekal **390** dan **sifar** elemen melepasi
  tepi kanan pada ketiga-tiga `/templates`, `/templates/klasik` dan
  `/templates/moden`. Petak: dua sebaris pada 390px (167px setiap satu, x=20
  dan x=203), tiga sebaris pada 1024px. Nama template yang panjang dipotong
  dengan ellipsis, tidak membalut.
- **Probe dibuang selepas semakan**, dan `npm run verify` serta `npm run
  build` dijalankan semula pada pokok yang bersih. Dua perangkap probe yang
  patut diingat kalau sesi akan datang mengulangi teknik ini: (1) `return`
  awal menjadikan kod di bawahnya **tidak tercapai**, dan TypeScript berhenti
  mempersempit jenis dalam kod tidak tercapai — ia melaporkan ralat jenis yang
  tiada dalam kod sebenar; gunakan syarat masa jalan (`if (PROBE.length > 0)`)
  supaya kod di bawah kekal tercapai. (2) Hanya `next start`, bukan `npm run
  dev`, yang membuktikan apa-apa tentang prerender.
- **Perangkap test yang memakan masa, dirakam supaya tidak berulang:** React
  mengangkat `<link precedence>` ke dalam `document.head` **dan menyimpan
  rekodnya sendiri** tentang href yang sudah dimasukkan. Dalam satu dokumen
  jsdom, test kedua yang meminta font yang sama dapat **sifar** `<link>`,
  walaupun selepas membuang nod itu daripada DOM. Jadi `galleryFontHrefs`
  diuji sebagai fungsi, dan pengangkatan `<head>` dibuktikan terhadap build
  sebenar di atas.
- **Test lama yang gagal menandakan masalah sebenar, bukan gangguan.** Dakwaan
  "tiada data seed dalam pratonton" mula-mula ditulis sebagai
  `/Aqeef|Nurul|Dewan Seri Kenangan/` dan gagal — kerana **kedua-dua** fixture
  mempunyai Nurul. Pengenal pasti yang betul ialah yang hanya dimiliki kad
  seed.

## 2026-10-07 — OPS1 Langkah 0 jangan tulis ke `main`
PR: https://github.com/aqeeflew/naeqah/pull/8 (di-merge ke branch yang salah),
kemudian https://github.com/aqeeflew/naeqah/pull/9 ke `main`
Apa yang berubah: `CLAUDE.md` sahaja (protokol), plus bahagian baharu
`## Operasi` dalam `BACKLOG.md` dan entri ini. **Sifar perubahan pada kod
aplikasi** — tiada fail dalam `app/`, `components/`, `lib/` atau `scripts/`
disentuh. 356 test hijau, tidak berubah daripada A5.
Keputusan yang diambil:
- **Punca pepijat, supaya tiada sesi mengulanginya:** dua arahan yang
  masing-masing munasabah menulis ke fail yang sama, pada titik selit yang
  sama. Langkah 0 (lama) menulis nota "sesi dilangkau" ke `docs/PROGRESS.md`
  pada `main`; langkah 7 menulis entri PR ke `docs/PROGRESS.md` dalam branch.
  Kedua-duanya menyelit betul-betul selepas `## Log`. Git tidak boleh
  menggabungkan dua sisipan di baris yang sama, jadi **setiap malam yang satu
  PR tertinggal menjamin satu konflik**. Protokol yang direka untuk mengelak
  dua PR berlanggar menjadi punca perlanggaran.
- **Pembetulan ialah membuang keperluan menulis, bukan menyusun semula fail.**
  Pilihan lain yang dipertimbang dan ditolak: (a) nota langkah 0 masuk di
  **hujung** `## Log` supaya titik selit berbeza — masih dua penulis pada satu
  fail, dan susunan "terbaru di atas" pecah; (b) satu fail berasingan
  `docs/SKIPPED.md` — fail baharu untuk sesuatu yang tiada sesiapa baca selepas
  PR di-merge; (c) nota langkah 0 dihantar sebagai PR sendiri — sesi dilangkau
  kini menghasilkan PR kedua yang juga perlu di-merge, lebih teruk daripada
  masalah asal. **Komen pada PR menang kerana ia sifar-fail.** Tiada fail
  diubah bermakna tiada konflik mungkin, bukan sekadar tidak mungkin.
- **"Jangan push terus ke `main`" kini mutlak.** `CLAUDE.md` sebenarnya sudah
  menyatakannya tanpa pengecualian, sementara langkah 0 dalam fail yang **sama**
  menyuruh "commit nota itu" — fail itu bercanggah dengan dirinya sendiri sejak
  hari pertama. Sekarang peraturan itu menyebut langkah 0 dan nota tersekat
  secara eksplisit, dan menambah satu baris: kalau mana-mana arahan (termasuk
  prompt task berjadual) menyuruh commit ke `main`, arahan itu sudah lapuk.
- **Nota tersekat pergi melalui PR, bukan komen.** Perbezaannya: sesi tersekat
  ada sesuatu yang **kekal** untuk direkod (apa yang menghalang, apa yang Aqeef
  perlu sediakan) — itu milik `## Tersekat` dan layak satu PR. Sesi yang
  dilangkau tidak ada apa-apa yang kekal: sebaik PR itu di-merge, nota
  "dilangkau" jadi sampah. Itu sebabnya satu dapat PR dan satu dapat komen.
- **`gh pr list` tidak berfungsi dalam sesi ini.** Ia guna GitHub GraphQL dan
  GraphQL dipulangkan `HTTP 403` di sini. Langkah 0 lama menamakan arahan itu
  secara khusus, jadi mana-mana sesi yang mengikutnya secara literal akan dapat
  ralat — dan sesi yang tersilap menganggapnya "tiada PR terbuka" akan memulakan
  task baharu di atas `main` yang basi. `CLAUDE.md` kini menamakan alat yang
  betul (GitHub MCP, atau `gh api` REST) dan menyatakan terus: senarai kosong
  daripada arahan yang ralat bukan senarai kosong.
Nota:
- **PR ini dibina atas branch A5, bukan atas `main`.** Kalau ia dibina atas
  `main`, ia akan menyelit entri `## Log` di tempat yang sama seperti PR #7
  (A5) dan **menghasilkan konflik yang OPS1 wujud untuk menghapuskan** — pada
  pagi yang sama Aqeef minta ia dibaiki. Jadi ia ditumpuk: base PR ini ialah
  `task/A5-tema-pertama-seed`, dan kedua-dua PR bersih.
- **PELAJARAN: penyasaran semula automatik TIDAK berlaku, dan sebabnya penting.**
  Sesi ini menjangka GitHub akan menyasar semula PR #8 ke `main` sendiri sebaik
  PR #7 di-merge. Ia tidak. Dua sebab bergabung:
  1. **PR #7 di-merge secara squash.** Commit A5 yang branch ini dibina atas
     (`3603b48`) **bukan** nenek moyang `main` — `main` mendapat satu commit
     baharu (`ba9037f`) dengan kandungan yang sama tetapi SHA yang berbeza.
  2. **Branch `task/A5-tema-pertama-seed` tidak dipadam semasa merge.** GitHub
     hanya menyasar semula PR bertumpuk apabila branch base dipadam.
  Akibatnya PR #8 kekal menunjuk ke branch yang sudah di-merge: butang Merge
  kelihatan hijau, tetapi menekannya merge ke branch itu, **bukan ke `main`**.
- **Dan itulah yang berlaku.** PR #7 di-merge 08:11 UTC; PR #8 di-merge
  08:12 UTC, satu minit kemudian — sebelum sesi ini sempat menukar base-nya.
  Jadi commit OPS1 mendarat pada `task/A5-tema-pertama-seed`, satu branch yang
  sudah mati, dan **tidak pernah sampai ke `main`**. Kedua-dua PR menunjukkan
  "Merged" dengan lencana ungu, jadi tiada apa-apa kelihatan salah. Pembetulan:
  merge `origin/main` ke dalam branch OPS1 (kandungan A5 sama pada kedua-dua
  belah, jadi konflik `PROGRESS.md` selesai bersih dan diff tinggal OPS1
  sahaja), kemudian buka PR baharu terus ke `main` — PR yang sudah di-merge
  tidak boleh ditukar base atau dibuka semula.
- **Peraturan untuk PR bertumpuk akan datang.** Repo ini guna **squash merge**,
  jadi: (a) jangan harap GitHub menyasar semula PR bertumpuk secara automatik;
  (b) selepas base PR di-merge, **semak dan betulkan base PR anak SEBELUM**
  sesiapa menekan Merge padanya — tetingkap antara dua merge boleh sesingkat
  satu minit; (c) lebih selamat lagi: elak menumpuk. Kalau dua task mesti
  berjalan serentak, cari cara supaya keduanya tidak menyentuh fail yang sama
  — itu masalah yang OPS1 sendiri cuba selesaikan.
- **Satu bahagian pembetulan ini di luar jangkauan sesi autonomous.** Prompt
  task berjadual (disimpan dalam tetapan Claude, bukan dalam repo) masih
  mengandungi baris: *"Jangan push terus ke main kecuali untuk nota PROGRESS.md
  dalam langkah 0"* dan *"Tulis satu baris dalam docs/PROGRESS.md … commit nota
  itu terus ke main"*. Selagi baris itu ada, sesi berjadual akan dapat dua
  arahan bercanggah — `CLAUDE.md` kata jangan, prompt kata buat. **Aqeef perlu
  edit prompt task berjadual itu sendiri** supaya ia sepadan dengan langkah 0
  yang baharu. `CLAUDE.md` sekarang menang kalau berlaku percanggahan (ia
  menyatakan begitu secara eksplisit), tetapi dua sumber yang bercanggah ialah
  keadaan yang sama yang menghasilkan pepijat ini.
- Larian ini dicetuskan manual oleh Aqeef dan **bukan** task `[ ]` seterusnya
  dalam backlog. Langkah 0 protokol lama akan menghentikan sesi ini (PR #7
  terbuka); ia diteruskan atas arahan eksplisit Aqeef, kerana task itu sendiri
  ialah pembetulan protokol.
- Disemak sendiri: `npm run verify` hijau (356 test, sama seperti A5 — tiada
  test baharu kerana tiada kod berubah), `git diff` menunjukkan hanya tiga fail
  `.md`.
- **Task seterusnya ialah A6 (galeri template)**, selepas PR ini di-merge dan
  `npm run db:seed` dijalankan sekali. PR #7 (A5) di-merge pada 7 Oktober
  08:11 UTC. Lihat `## Tersekat`.

## 2026-10-07 — A5 Tema pertama + seed
PR: https://github.com/aqeeflew/naeqah/pull/7
Apa yang berubah: tambah `lib/themes/klasik.json` (tema asas pertama) dan
`lib/themes/index.ts` (katalog tema), `lib/seed-data.ts` (fixture) dengan
`scripts/seed.ts` dan skrip `db:seed`, `lib/card-page.ts` (baca kad terbit
pada waktu build), dan laluan `app/kad/[slug]/page.tsx` yang prerender.
356 test hijau, termasuk 44 test baharu.
Keputusan yang diambil:
- **Tema dimuat melalui import statik, bukan `fs`.** `templates.theme_file`
  menyimpan `lib/themes/klasik.json`; `lib/themes/index.ts` memetakan string
  itu kepada tema yang sudah diparse. Dua sebab: (1) halaman kad tidak boleh
  bergantung pada repo wujud di sebelah fungsi yang berjalan, (2) fail tema
  yang rosak menggagalkan **build**, bukan kad pada pagi majlis. Harganya ialah
  satu baris dalam `THEME_SOURCES` setiap kali tema baharu ditambah — bundler
  tidak boleh menemui import daripada string pangkalan data. **Ada test yang
  gagal kalau satu fail `.json` dalam `lib/themes/` tiada dalam peta itu**,
  jadi langkah manual itu tidak boleh terlupa. A5b akan menambah enam baris.
- **`loadTheme` ketat pada ejaan kunci.** `./lib/themes/klasik.json` ditolak.
  Satu ejaan kanonik bermakna baris `templates` boleh disemak terhadap
  `themeFiles`, dan panel admin (C3) patut menawarkan senarai itu, bukan medan
  teks bebas.
- **klasik guna font sistem sahaja — sifar permintaan rangkaian.** Tema
  "fungsian" tidak perlu webfont, dan kad mesti buka atas data mudah alih pagi
  majlis walaupun `fonts.googleapis.com` tidak dapat dicapai. Taipografi
  sebenar datang dengan A5b. `googleFontsHref()` tetap disambung dalam laluan
  dan **sudah diuji dengan build sebenar** (lihat Nota) supaya tema A5b yang
  guna Google Fonts terus berfungsi.
- **klasik menyenaraikan kesepuluh-sepuluh seksyen.** `visibleSections()`
  membuang yang kosong, jadi menyenaraikan semua bermakna pengantin yang
  memuat naik galeri akan nampak galerinya. Menyingkatkan senarai "sebab kad
  contoh tiada gambar" akan menyembunyikan kandungan pengantin sebenar.
- **`dynamicParams = false`.** Ini kriteria "statik, bukan SSR" yang sebenar.
  Tanpanya, slug yang tiada dalam build jatuh balik ke render pelayan yang
  query Postgres pada setiap request tetamu — iaitu tepat kegagalan yang
  keputusan seni bina 1 cuba halang. Slug tidak dikenali kini 404 (disahkan
  terhadap pelayan sebenar).
- **`generateStaticParams` pulang senarai kosong bila `DATABASE_URL` tiada,
  dengan amaran, bukan ralat.** Itu keadaan normal CI dan sesi autonomous:
  `next build` mesti kekal hijau. Tetapi **ralat query dilempar semula** —
  deployment yang salah konfigurasi tidak boleh senyap-senyap menghantar sifar
  kad. Dua keadaan itu berbeza dan dilayan berbeza.
- **Tema dibaca melalui `bookings`, bukan lajur pada `cards`.** Template yang
  dibeli ialah fakta tentang pembelian. Join bermakna template yang ditukar
  tier atau dinamakan semula tidak meninggalkan kad terbit menunjuk ke tema
  yang tiada sesiapa beli.
- **`cards.expires_at` tidak ditapis.** Belum ada apa-apa yang menetapkannya
  (B6 yang buat, daripada tier), dan menurunkan kad yang luput ialah kerja
  waktu-terbit, bukan waktu-baca — halaman yang sudah statik tidak boleh mula
  404 kerana satu timestamp berlalu.
- **Seed tidak mereka satu pun nilai sebenar.** `price_sen` ialah **0**, bukan
  angka ringgit yang kelihatan munasabah: harga belum diputuskan (`SPEC.md`)
  dan lajur itu merekod apa yang benar-benar dicaj — tiada apa-apa dicaj. E-mel
  guna TLD terpelihara `.test`; nombor telefon ada bahagian pelanggan
  semua-sifar supaya tetamu yang menekannya tidak sampai kepada orang asing.
  Ada test untuk ketiga-tiganya.
- **Seed idempoten melalui upsert pada indeks unik yang sedia ada.** Tiada
  indeks baharu ditambah untuk kemudahan seed: `bookings` ialah lejar pesanan
  sebenar, jadi seed mencari booking kad itu melalui `cards.slug` dahulu dan
  guna semula. `paid_at` kekal null — tiada bayaran berlaku, dan mereka-reka
  timestamp untuknya akan jadi fakta palsu dalam lajur yang C1 dan C3 lapor.
- **`tsx` dinaikkan ke devDependency langsung.** Ia **sudah** ada dalam pokok
  (drizzle-kit dan vite kedua-duanya guna 4.23.15), jadi diff lock ialah
  **satu baris dan sifar pakej baharu** — sama seperti `zod` dalam A3. Ia perlu
  kerana `scripts/seed.ts` ialah TypeScript dengan alias `@/`: strip-types Node
  tidak menyelesaikan alias mahupun import tanpa sambungan fail.
- **`isUsableValue` dalam `lib/env.ts`** kini satu-satunya definisi "pembolehubah
  ini ada". `hasEnv` (untuk yang perlu bercabang) dan `requireEnv` (untuk yang
  perlu melempar) kedua-duanya membacanya, jadi peraturan rentetan-kosong A2c
  tidak boleh terpesong antara dua tempat.
- **`generateMetadata` menamakan pengantin, bukan app.** Pautan WhatsApp ialah
  keseluruhan saluran pengedaran produk, jadi tajuk preview ialah
  "Aqeef & Nurul — Jemputan Majlis". Tiada `openGraph.images`: imej kongsi
  perlu aset, dan aset datang dengan A5b.
Nota:
- **Dua pakej baharu: sifar.** Diff `package-lock.json` ialah satu baris
  (`tsx` naik ke devDependency langsung pada versi yang sama).
- **`npm run db:seed` BELUM PERNAH berjalan terhadap pangkalan data sebenar.**
  Ini kriteria A5 yang belum ditutup dan ia ditulis begitu dalam `BACKLOG.md`.
  Apa yang **disahkan** tanpa kelayakan: (1) tanpa `DATABASE_URL` ia berhenti
  dengan ralat tiga baris yang sama seperti A2c; (2) dengan `DATABASE_URL`
  kosong, ralat yang sama, bukan rentetan kosong; (3) dengan URL Neon palsu ia
  memuat env, menyelesaikan alias `@/`, mengimport tema JSON, **membina SQL
  upsert yang betul** (dicetak penuh dalam output) dan cuba menyambung. Yang
  tidak diketahui hanyalah sama ada Postgres sebenar menerima pernyataan itu.
  Aqeef: jalankan `npm run db:seed` sekali, kemudian `npm run build`.
- **PENEMUAN BARU — `DATABASE_URL` sahaja TIDAK cukup.** Nota `## Tersekat`
  sebelum ini mengandaikan memberi kunci kepada sesi berjadual akan membuka
  A5–A7. Ia tidak. Egress sesi ini melalui gateway dengan allowlist, dan hos
  Neon tiada padanya: percubaan sambungan dipulangkan sebagai
  `HTTP status 403: Host not in allowlist: api.ap-southeast-1.aws.neon.tech`.
  Jadi untuk sesi autonomous mencapai DB, Aqeef perlu **dua** perkara:
  `DATABASE_URL` (branch Neon berasingan, bukan pengeluaran) **dan**
  `*.neon.tech` dalam tetapan egress rangkaian sesi berjadual itu. Kalau salah
  satu tiada, A6 dan A7 akan sampai sebagai kod yang belum dijalankan juga.
- **Laluan kad terbukti prerender, bukan hanya lulus test.** Satu probe
  sementara menggantikan dua fungsi query dalam `lib/card-page.ts` dengan
  fixture seed dalam ingatan, kemudian `npm run build`. Hasilnya:
  `● /kad/contoh-aqeef-nurul` dalam jadual laluan, dan
  `.next/server/app/kad/contoh-aqeef-nurul.html` (27 KB) mengandungi
  "Muhammad Aqeef bin Rahman", "Sabtu, 14 Ogos 2027", "11.30 pagi",
  "Dewan Seri Kenangan", "Dibuat dengan Naeqah", kesembilan `data-section`
  mengikut susunan tema, dan `<title>Aqeef &amp; Nurul — Jemputan Majlis</title>`.
  `npm run start` kemudian memulangkan **200** untuk slug itu dan **404** untuk
  slug yang tidak dikenali — **tanpa `DATABASE_URL` dalam persekitaran
  pelayan**, iaitu bukti terus bahawa halaman kad tidak menyentuh DB pada
  request. Probe dibuang selepas semakan.
- **Hoisting `<link>` font disahkan dengan probe kedua.** Tema probe diberi
  `googleFont`, build semula, dan `<link rel="stylesheet" … data-precedence=
  "card-fonts">` keluar **di dalam `<head>`**, bukan dalam badan. Ini
  mengesahkan andaian A4 tentang `googleFontsHref()` sebelum A5b bergantung
  padanya.
- **Diukur pada 390×844 dengan Chromium sebenar terhadap halaman yang
  dibina:** `document.scrollWidth` kekal **390**, **sifar** elemen melepasi
  tepi kanan, kesembilan seksyen hadir.
- **Artifak visual yang diketahui, bukan pepijat:** seksyen `ucapan` memaparkan
  tajuk "UCAPAN" tanpa apa-apa di bawahnya. `Ucapan` ialah bekas kosong yang
  A4 bina untuk **B9**, dan `hasContent`-nya sentiasa benar. Ia akan terisi
  bila B9 mendarat. Pilihan lain ialah membuang `ucapan` daripada klasik
  sekarang, tetapi itu bermakna seseorang mesti ingat menambahnya semula ke
  **setiap** fail tema kemudian — lebih senyap dan lebih mudah terlupa. Kalau
  Aqeef mahu ia hilang sehingga B9, tukar `hasContent` bagi `ucapan` dalam
  `card-sections.tsx`, bukan senarai seksyen dalam tema.
- `seedCardData` sengaja menamakan pasangan yang **berbeza** daripada
  `placeholderCardData` (Aqeef & Nurul lawan Zulkifli & Aisyah). Kalau
  kedua-duanya sama, halaman yang disambung ke sumber yang salah akan nampak
  betul. Ada test untuk itu.
- Kad seed **tiada gambar**, atas sebab yang sama seperti `placeholder-card.ts`:
  setiap rujukan imej perlu fail dalam `public/`, dan aset berlesen datang
  dengan A5b. Seksyen `galeri` justeru tercicir daripada output hari ini.
- Disemak sendiri: `npm run verify` hijau (356 test), `npm run build` berjaya
  dengan `/` masih statik, `npx prettier --check .` bersih.
- **Task seterusnya ialah A6 (galeri template).** Ia membaca `templates` yang
  **diterbitkan** daripada DB — jadi ia memerlukan seed A5 dijalankan, atau ia
  akan jadi galeri kosong. Baca `## Tersekat` dahulu.

## 2026-10-06 — Sesi dilangkau (PR #6 masih belum di-merge)
Sesi kedua berturut-turut dilangkau mengikut protokol langkah 0: PR #6
(task A4 — renderer kad) masih terbuka. Disemak semula hari ini: Vercel
hijau, `mergeable_state` bersih, tiada semakan dan tiada komen yang belum
dijawab — tiada apa-apa untuk dibetulkan di sana. Task seterusnya ialah A5
(tema pertama + seed), yang mengimport terus `components/card/` dan hanya
wujud dalam PR #6; memulakannya atas `main` sekarang menjamin konflik.
**Merge PR #6 ialah satu-satunya perkara yang membuka sesi seterusnya.**
Nota: setiap sesi yang dilangkau menambah satu entri di sini, jadi
`docs/PROGRESS.md` pada `main` makin menjauhi versi dalam PR #6 — jangkakan
konflik dalam fail ini semasa merge, dan selesaikan dengan menyimpan
kedua-dua entri, terbaru di atas.

## 2026-10-05 — Sesi dilangkau (PR #6 belum di-merge)
Sesi dilangkau mengikut protokol langkah 0: PR #6 (task A4 — renderer kad,
branch `task/A4-card-renderer`) masih terbuka dan menunggu semakan Aqeef.
Tiada task baharu dimulakan, kerana `main` belum mengandungi
`components/card/` dan task seterusnya (A5 — tema + seed) membina terus atas
renderer itu; dua PR akan berlanggar. Semakan keadaan PR: Vercel hijau
(deployment selesai), tiada semakan dan tiada komen yang belum dijawab —
tiada apa-apa untuk dibetulkan di sana. PR #6 juga menanda A2b `[x]` atas
laporan Aqeef. Merge PR #6 untuk membuka sesi seterusnya.
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
- **Mobile-first disahkan dengan ukuran sebenar, bukan anggaran.** Laluan
  probe dirender dalam Chromium pada viewport 390x844 dengan kes paling teruk
  yang skema benarkan: nama penuh terpanjang, `textScale` 1.4, kulit
  `penuh`, galeri, dan alamat dua baris panjang. `document.scrollWidth`
  kekal **390** dan **sifar** elemen melepasi tepi kanan. Satu test imbasan
  sumber ditambah sebagai pengawal regresi (tiada `min-w-`, tiada `w-screen`,
  tiada lebar tetap >= 390px) — jsdom tidak boleh mengukur susun atur, jadi
  ukuran sebenar berlaku sekali di sini dan imbasan itu menjaganya.
- **Perangkap:** membuang laluan probe meninggalkan taip terjana basi dalam
  `.next/types/validator.ts`, dan `npm run typecheck` gagal dengan "Cannot
  find module '../../app/probe-kad/page.js'" walaupun fail itu sudah tiada.
  `rm -rf .next` membereskannya. Sesi akan datang yang membuang mana-mana
  laluan: buang `.next` sebelum percaya typecheck yang merah.
- Dalam tangkapan skrin probe, gambar galeri kelihatan sebagai kotak rosak
  dengan jurang menegak yang pelik. Itu kerana fail probe memang tidak wujud:
  Chromium melukis imej 404 pada saiz intrinsiknya dan mengabaikan
  `aspect-ratio`. CSS `aspect-square` **betul** dalam bundle
  (`.aspect-square{aspect-ratio:1}`) dan gambar sebenar akan jadi segi empat
  sama. Jangan "betulkan" ini.
- Disemak sendiri: `npm run verify` hijau (312 test), `npm run build` berjaya
  dengan `/` masih statik, `npx prettier --check .` bersih.
- **Task seterusnya ialah A5.** Baca `## Tersekat` di atas dahulu: Neon sudah
  hidup (A2b selesai), tetapi sesi autonomous tidak ada kuncinya, jadi A5
  patut ditulis sepenuhnya dan dihantar dengan seed yang belum dijalankan.
- A2b ditanda `[x]` dalam PR ini atas laporan Aqeef, bukan atas pengesahan
  sesi ini. Ia dicatat begitu dalam `BACKLOG.md` juga.

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
