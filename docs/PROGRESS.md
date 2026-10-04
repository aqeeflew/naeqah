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

## 2026-10-04 — Sesi dilangkau (PR #1 belum di-merge)
Sesi dilangkau mengikut protokol langkah 0: PR #1 (task A1 — init projek)
masih terbuka dan menunggu semakan Aqeef. Tiada task baharu dimulakan, kerana
`main` belum mengandungi scaffold itu dan dua PR akan berlanggar. PR #1 tiada
CI dikonfigurasi (belum ada `.github/workflows`), tiada komen dan tiada
semakan — tiada apa-apa untuk dibetulkan di sana. Merge PR #1 untuk membuka
sesi seterusnya; task seterusnya ialah A2.


## 2026-10-04 — Scaffold awal
PR: tiada (commit terus semasa persediaan)
Apa yang berubah: cipta `CLAUDE.md`, `docs/SPEC.md`, `docs/BACKLOG.md`,
`docs/PROGRESS.md`. Repo masih tiada kod aplikasi.
Keputusan yang diambil: stack dipilih dan dikunci dalam `CLAUDE.md` (Next.js,
Drizzle, Postgres, ToyyibPay, Vercel). Template direka sebagai data JSON, bukan
komponen React — ini keputusan seni bina paling penting dalam projek.
Nota: task seterusnya ialah A1.
