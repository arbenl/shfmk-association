# Udhëzues për Vullnetarët – SHFK Scanner

## Si të hapni faqen e shpërndarjes
- Hapni linkun direkt: `https://shfk.org/scanner`
- Ky link u dërgohet vetëm vullnetarëve; nuk është i listuar në faqe të tjera.

## Shkarkimi dhe instalimi
- **Android (APK)**
  - Hapni “Shkarko për Android (APK)” në faqen /scanner.
  - Lejoni instalimin nga burime të panjohura (Settings → Security → Install unknown apps).
  - Nëse shfaqet “Play Protect”, zgjidhni “Install anyway” nëse jeni i sigurt për burimin.
- **iPhone**
  - Hapni “Hap udhëzimet për iPhone” në faqen /scanner.
  - Ndiqni hapat TestFlight ose Expo Go sipas udhëzimit të shfaqur aty.

## Si të bëni check-in
1) Hapni aplikacionin “SHFK Scanner”.
2) Jepni leje për kamerën kur kërkohet.
3) Vendosni sekretin `x-admin-key` që ua jep koordinatori (ruhet në pajisje).
4) Skanoni QR nga email/PDF i pjesëmarrësit.
5) Lexoni statusin në ekran:
   - ✅ “Check-in u krye” (hyrja u shënua tani)
   - ℹ️ “Pjesëmarrësi është check-in më herët” (bileta ishte shënuar më parë)
   - ❌ “Bileta e pavlefshme” (QR nuk njihet ose është gabim)

## Troubleshooting
- **Nuk sinkronizohet / rrjet i dobët**: sigurohuni që telefoni ka internet; provoni më vonë nëse është offline.
- **Sekreti i gabuar**: verifikoni `x-admin-key` me koordinatorin dhe ri-shkruajeni.
- **Kamera nuk punon**: kontrolloni lejet e kamerës në Settings → Apps → SHFK Scanner → Permissions.
- **Status i gabuar**: rifreskoni aplikacionin dhe provoni përsëri; nëse problemi vazhdon, njoftoni koordinatorin.

## Checkliste për adminët
- Vendosni në Vercel (ose hostin tjetër):
  - `ADMIN_SECRET_KEY` (për /api/admin/checkin)
  - `SCANNER_ANDROID_URL` (link i sigurt për APK, p.sh. nga Vercel blob/S3)
  - `SCANNER_IOS_URL` (link TestFlight ose udhëzim Expo Go)
- Siguroni që `QR_PRIVATE_KEY_PEM` dhe Supabase keys janë të konfiguruara si më parë.
- Testoni një biletë: skano → merrni “✅ Check-in u krye”, skano përsëri → “ℹ️ Pjesëmarrësi është check-in më herët”.
