# Release Notes – 2025-11-30 (SHFMK Event-Ready Snapshot)

## Përmbledhje
- Autentikim i adminëve përmes Supabase Auth me allowlist (admin_users) dhe cookies të qëndrueshme.
- Panel për menaxhim të administratorëve (UI + API) për shtim/hezje email-esh, me validim dhe moslejim të heqjes së vetes.
- Përmirësime email/QR: dërgim me CID, ripostim i sigurt, hardening ndaj regjistrimeve të dyfishta dhe ripostimeve.
- Regjistrim dhe API të forcuara (kontrolle kohe/kapaciteti, verifikime, mesazhe të qarta gabimesh).
- UI/UX: navigim krye/fundor me ankorat e reja, seksionet e konferencës/agenda/faq, CTA të regjistrimit të qëndrueshme, error/not-found/custom pages.
- Scanner/offline: fluks i rifreskuar dhe skripte ndihmëse; tsconfig/artefakte të pastruara.
- Ndarje env: përdorim i SUPABASE_ANON_KEY për auth, SUPABASE_SERVICE_KEY vetëm në server; shembuj të përditësuar.
- Qëndrueshmëri sesioni: cookie attributes të rregulluara (Path=/, SameSite=Lax, Secure në prod) dhe middleware logging opsional.
- Migrime Supabase të reja për admin_users dhe check-in (SQL në supabase/migrations/).

## Si të verifikohet
1) Regjistrim publik: plotëso formularin, merr email-in me QR (CID inline), hap faqen e suksesit me QR.
2) Skanim/check-in: përdor aplikacionin scanner, skano QR, shih që check-in ruhet në DB dhe që QR i ridërgohet nëse kërkohet.
3) Admin login: hyr me përdorues Supabase që është në admin_users; lundro në faqe publike dhe kthehu te “Admin” pa u kërkuar rihyrje.
4) Admin panel: shiko regjistrimet, eksport/ri-dërgo email, menaxho agjendën dhe cilësimet; provo shto/hiq admin (nuk lejon heqjen e vetes).
5) Navigim publik: linket “Kryefaqja/Konferenca/Agenda/Regjistrimi/Kontakti” funksionojnë nga header/footer dhe ankorat çojnë në seksionet përkatëse.

## Shënime për Deploy/Vercel
- Vendos env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL, QR_PRIVATE_KEY_PEM, SITE_BASE_URL, CONFERENCE_SLUG, ADMIN_AUTH_DEBUG (opsionale, vetëm për logim server-side).
- Siguro që buildi përdor anon key për auth dhe service key vetëm në server; .env.local të mos publikohet.
- Pas deploy, testo /admin/login, /admin/registrations, /admin/admins dhe fluksin e regjistrimit/suksesit/ri-dërgimit.
