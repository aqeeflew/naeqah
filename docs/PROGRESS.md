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

---

## Log

## 2026-10-04 — A1 Init projek
PR: https://github.com/aqeeflew/naeqah/pull/PENDING
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
