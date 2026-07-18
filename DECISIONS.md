# Karar Günlüğü (DECISIONS)

Bu dosya, projedeki mimari/tasarım kararlarını ve **gerekçelerini** tutar.
Amaç: 6 ay sonra "bunu neden böyle yapmıştık?" sorusuna cevap verebilmek.
Git geçmişi *ne* değiştiğini söyler; bu dosya *neden* değiştiğini söyler.

Yeni bir kalıcı karar aldığında en üste bir madde ekle (tarih + karar + gerekçe).

---

## Kararlar

### 2026-07-19 — Yazma işlemleri atomik ve sıralı hale getirildi
- **Karar:** `words.json`'a yazma artık (a) geçici dosyaya yazıp `rename` ile
  yer değiştirerek atomik yapılıyor, (b) tek bir söz üzerinden (in-process mutex,
  `updateWords`) sıraya sokuluyor. Bkz. [server/index.js](server/index.js).
- **Gerekçe:** Eski kod `oku → değiştir → yaz` döngüsünü serileştirmiyordu;
  eşzamanlı iki POST aynı listeyi okuyup üzerine yazınca biri kayboluyordu.
  Ayrıca yazma ortasında süreç çökerse dosya yarım/bozuk kalabiliyordu.
  25 eşzamanlı POST ile test edildi: artık hiçbir yazma kaybolmuyor.
- **Sınır:** Bu koruma yalnızca **tek süreç** içinde geçerli. Aynı `words.json`'a
  birden fazla sunucu süreci yazarsa koruma çalışmaz (bkz. Kontrendikasyonlar).

### 2026-07-19 — Saf mantık `lib.js`'e çıkarıldı, birim test eklendi
- **Karar:** Arama süzme, girdi doğrulama, `meta` temizleme ve kelime kurma
  mantığı [server/lib.js](server/lib.js)'e taşındı; [server/test/lib.test.js](server/test/lib.test.js)
  ile `node --test` üzerinden test ediliyor (`npm test`).
- **Gerekçe:** Bu mantık daha önce route handler'ların içinde gömülüydü ve hiç
  testi yoktu. Saf fonksiyonlar ağ/dosya/OpenAI olmadan hızlı test edilebiliyor.
  Testler yazılırken Türkçe `ç→c` yumuşamasının aramada eşleşmediği gibi gerçek
  davranışlar da belgelenmiş oldu.

### (tarih bilinmiyor) — Veri deposu olarak düz JSON dosyası
- **Karar:** Kelimeler bir veritabanı yerine `server/data/words.json` içinde tutuluyor.
- **Gerekçe:** Tek kullanıcılı, kişisel bir sözlük; veri hacmi küçük. Veritabanı
  kurulumu/işletmesi bu ölçekte gereksiz karmaşıklık olurdu.
- **Sınır:** Ölçek büyürse (çok kullanıcı, eşzamanlı yazma, büyük veri) bu karar
  yeniden değerlendirilmeli — dosya kilidi/atomiklik ancak belli bir noktaya kadar taşır.

### (tarih bilinmiyor) — Arama Türkçe locale'de
- **Karar:** Arama karşılaştırması `toLocaleLowerCase('tr')` ile yapılıyor.
- **Gerekçe:** i/İ ve ı/I ayrımı Türkçe'de anlamlı; varsayılan lowercase yanlış eşleşir.
- **Sınır:** Substring araması; kök/çekim eşlemesi yok (`amaç` → `amacı` eşleşmez).

### (tarih bilinmiyor) — `meta` alanı beyaz listeyle sınırlı
- **Karar:** İstemciden gelen `meta` yalnızca bilinen alanlara indirgeniyor
  (`language, kind, pronunciation, literal, meaning`), gerisi atılıyor.
- **Gerekçe:** Rastgele/kötü niyetli alanların kayda sızmasını önlemek.

### (tarih bilinmiyor) — `/api/discover` OpenAI gpt-5 + yapılandırılmış çıktı
- **Karar:** Kavram önerisi OpenAI `gpt-5` ile, `json_schema` (strict) kullanılarak
  alınıyor. Kişiye ait sözler ayrıca web aramasıyla çapraz doğrulanıyor (`verifyQuotes`).
- **Gerekçe:** Serbest metin yerine şema, ayrıştırmayı garantiler. Alıntı
  uydurmasını (apokrif atıf) azaltmak için ikinci bir doğrulama adımı eklendi.

---

## Kontrendikasyonlar ("bunu yapma" listesi)

Bunlar sistemin bilinen kırılganlıkları; ihlal edilirse veri kaybı/bozulma olur.

- **Aynı `words.json`'a birden fazla sunucu süreci yazdırma.** Mutex yalnızca
  süreç içi; çok süreçli/çok makineli yazma için gerçek dosya kilidi ya da
  veritabanı gerekir.
- **`updateWords`'ü atlayarak doğrudan `readWords`+`atomicWrite` yapma.** Yazma
  yolunu bölmek serileştirmeyi bozar; tüm değişiklikler `updateWords` üzerinden geçmeli.
- **`server/data/words.json`'u commit'leme.** Kişisel kullanıcı verisi; `.gitignore`'da.
- **`.env`'i commit'leme.** `OPENAI_API_KEY` orada; `.gitignore`'da.
- **`buildWord`'e `id`/`createdAt`'i dışarıdan vermeyi unutma.** Fonksiyon saf
  kalsın diye `Date.now()` içermiyor; çağıran enjekte etmeli.
