# Naeqah

Platform kad kahwin digital untuk pasaran Malaysia. Pengantin pilih template,
bayar, isi butiran majlis, dan terbit satu pautan jemputan untuk diedar melalui
WhatsApp.

## Dokumen

| Fail | Isi |
| --- | --- |
| `CLAUDE.md` | Konvensyen dan protokol untuk sesi pembangunan autonomous |
| `docs/SPEC.md` | Apa yang dibina dan kenapa |
| `docs/BACKLOG.md` | Task bertertib, satu task satu PR |
| `docs/PROGRESS.md` | Apa yang sudah siap, apa yang tersekat |

## Cara projek ini dibangunkan

Satu scheduled task menjalankan sesi Claude Code secara berkala. Setiap sesi
mengambil **satu** task dari `docs/BACKLOG.md`, melaksanakannya, dan membuka PR.
Aqeef menyemak dan merge.

Sesi itu bermula kosong setiap kali — semua konteks datang dari fail dalam repo
ini. Itulah sebabnya `docs/PROGRESS.md` wajib dikemas kini setiap sesi.

Task bertanda 🔴 dalam backlog memerlukan pertimbangan manusia (reka bentuk
visual, kelayakan merchant, teks undang-undang) dan dilangkau oleh sesi
autonomous.
