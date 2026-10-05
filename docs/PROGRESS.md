# Progress

Fail ini ialah ingatan antara sesi. Setiap sesi autonomous bermula kosong dan
membaca fail ini dahulu — jadi apa yang tidak ditulis di sini tidak wujud.

**Setiap sesi mesti menambah satu entri**, walaupun sesi itu gagal.

Format entri (terbaru di atas):

```
## YYYY-MM-DD — <ID task> <tajuk>
PR: https://github.com/aqeeflew/naeqah/pull/3
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
- **A2b menunggu P2.** Skema dan migrasi SQL sudah siap (A2), tetapi belum
  pernah dijalankan terhadap Postgres sebenar. Aqeef perlu buka akaun Neon,
  ambil `DATABASE_URL`, dan letak dalam `.env.local`. Selepas itu `npm run
  db:push` boleh dijalankan dan A2b disahkan. Ini **tidak** menyekat A3/A4 —
  kedua-duanya kerja TypeScript tulen tanpa DB.

---

## Log

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
