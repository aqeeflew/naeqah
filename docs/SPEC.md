# Naeqah — Spesifikasi

Dokumen ini ialah sumber kebenaran untuk apa yang dibina. Proposal penuh
(pasaran, harga, risiko, go-to-market) ada secara berasingan; fail ini hanya
mengandungi apa yang mempengaruhi kod.

## Apa itu Naeqah

Pengantin pilih template kad kahwin digital, bayar, isi butiran majlis, dan
terbit satu pautan jemputan peribadi untuk diedar melalui WhatsApp.

Bayaran sekali per majlis. Bukan langganan — pengantin kahwin sekali.

## Tiga pengguna

| Pengguna | Apa dia buat | Kekangan penting |
| --- | --- | --- |
| Pengantin | Pilih template, bayar, isi butiran, terbit, pantau RSVP | Majoriti guna telefon; mesti siap dalam 10 minit tanpa bantuan |
| Tetamu | Buka pautan, baca, tekan lokasi, jawab RSVP, tulis ucapan | Semua umur; tiada app, tiada akaun, tiada kata laluan |
| Admin | Lihat tempahan, tambah template, uruskan refund | Tambah template tanpa deploy kod |

## Aliran utama

```
Pengantin:  pilih template → bayar (FPX) → isi butiran → terbit → edar pautan
Tetamu:     buka pautan → tekan lokasi → hantar RSVP → tulis ucapan
Pengantin:  dashboard RSVP → export CSV untuk katering
```

**Bayaran berlaku sebelum pengisian butiran**, bukan selepas. Pengantin yang
sudah bayar akan siapkan kad mereka; yang isi dahulu akan tinggalkan separuh
jalan.

## Keputusan seni bina yang tidak boleh dirunding

1. **Halaman kad dihidang statik.** `/kad/[slug]` dijana semasa terbit dan
   dihidang dari CDN. Tiada query DB semasa request. Kalau app atau DB down
   pada pagi majlis, kad tetamu mesti tetap buka. Hanya POST RSVP perlu app.
2. **Template ialah data, bukan kod.** Satu skema kad tetap + konfigurasi tema
   JSON + satu set renderer. Pendekatan "satu komponen React per template"
   patah sekitar template ke-10 dan menghalang pereka bukan-programmer daripada
   menyumbang.
3. **Mobile-first.** 390px dahulu.
4. **Lorong tetamu tanpa geseran.** Setiap langkah tambahan pada tetamu
   menurunkan kadar RSVP, dan kadar RSVP adalah sebab pengantin membayar.

## Skop MVP

Termasuk: galeri + preview template, editor butiran majlis, lokasi Maps/Waze,
borang RSVP, dashboard RSVP + export CSV, ucapan tetamu, checkout + payment,
URL unik per kad, admin panel asas.

Fasa 2 (jangan bina sekarang): salam kaut / DuitNow QR hadiah, guest list
dengan nama auto-isi, QR check-in, muzik latar + galeri prewedding, tukar
warna/font.

Tidak termasuk langsung: drag-and-drop design editor bebas (itu Canva), cetak
kad fizikal, app mobile native.

## Model data (bentuk, bukan skema akhir)

- `users` — pengantin yang mendaftar
- `templates` — slug, nama, tier, rujukan fail tema, status terbit
- `bookings` — pengguna, template, tier, status bayaran, rujukan gateway
- `cards` — tempahan, slug unik, data majlis (JSON ikut card-schema), status terbit
- `rsvps` — kad, nama, telefon, kehadiran, bilangan tetamu, masa
- `wishes` — kad, nama, mesej, bendera moderasi

## Tier harga (untuk logik kod; harga belum muktamad)

| Tier | Harga semasa | Kad aktif |
| --- | --- | --- |
| Asas | RM35 | 3 bulan selepas majlis |
| Premium | RM75 | 12 bulan |
| Eksklusif | RM139 | 12 bulan |

Tier Asas memaparkan baris "Dibuat dengan Naeqah" pada kaki kad. Ini saluran
pertumbuhan utama — setiap kad dilihat 200–600 tetamu.

## PDPA

Borang RSVP mengumpul nama dan nombor telefon tetamu. Perlu: notis persetujuan
pada borang, padam data 6 bulan selepas tarikh majlis, jangan kongsi atau jual.
Teks notis sebenar perlu disemak manusia — jangan karang sendiri.
