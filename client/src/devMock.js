// Dev Fill butonunun UI'a bastığı örnek sonuçlar (Zebur "savaş" araması).
// Yalnızca geliştirme modunda kullanılır; API çağrısı yapmadan kart/rozet/kopyalama
// tasarımlarını denemek için.
const L = 'Zebur (Mezmurlar) — İbranice';

export const MOCK_QUERY = 'savaş';
export const MOCK_TEXT = 'Zebur (Mezmurlar)';

export const MOCK_RESULTS = [
  {
    term: "Kayam RAB'be övgüler olsun; ellerimi savaşa, parmaklarımı çarpışmaya alıştırır.",
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'RAB, kayam, kutlu olsun; ellerimi savaşa, parmaklarımı muharebeye O öğretir.',
    meaning: "Mezmurlar 144:1 — Davut'un ilahisi; Tanrı'nın savaş için eğiten, güç veren olarak övüldüğü giriş bölümü.",
    why: "Savaşın hazırlığı ve disiplinine ilişkin; savaş becerisinin kaynağını Tanrı'ya bağlar.",
  },
  {
    term: "Kimi savaş arabalarına, kimi atlara güvenir; bizse Tanrımız RAB'bin adına güveniriz.",
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: "Bazıları savaş arabalarına, bazıları atlara güvenir; ama biz RAB Tanrımız'ın adını anarız/güveniriz.",
    meaning: 'Mezmurlar 20:7 — Zafer duası mezmuru; askerî teçhizata karşılık ilahî isme güven vurgusu.',
    why: 'Savaşta güven ve dayanaktan söz eder; askeri güce değil ilahî yardıma yaslanmayı öğütler.',
  },
  {
    term: 'Hiçbir kral ordusunun çokluğuyla kurtulmaz; yiğit büyük gücüyle kurtulamaz. At, kurtuluş için boş bir umuttur; büyük gücüyle kurtuluş getiremez.',
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'Hiçbir kral kalabalık ordusuyla kurtulmaz; yiğit, çok gücüyle de kurtulamaz. At, kurtuluş umudu değildir; büyük kudreti kurtuluş sağlamaz.',
    meaning: 'Mezmurlar 33:16-17 — Yaratıcıya güven mezmuru; askeri nicelik ve teknolojinin sınırlılığı belirtilir.',
    why: "Savaşın sonucu konusunda teolojik bakış sunar; sonucun Tanrı'ya bağlı olduğunu ifade eder.",
  },
  {
    term: 'Savaşları dünyanın dört bucağında durdurur; yayı kırar, mızrağı parçalar, savaş arabalarını ateşe verir.',
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'Savaşları yeryüzünün sonuna dek durdurur; yayı kırar, mızrağı keser, savaş arabalarını ateşle yakar.',
    meaning: "Mezmurlar 46:9 — Tanrı'nın egemenliği ve barış tesis edici kudretine dair ilahi.",
    why: "Savaşın sona erdirilmesi temasını açıkça işler; Tanrı'nın barışı dayattığını söyler.",
  },
  {
    term: 'Ordu bana karşı ordugâh kursa, yüreğim korkmaz; bana karşı savaş çıksa bile, yine de güvenimi yitirmem. (parafraz)',
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'Bir ordu bana karşı konaklasa korkmam; savaş doğsa bile yine güvenirim. (parafraz)',
    meaning: 'Mezmurlar 27:3 — Güven mezmuru; düşman kuşatması ve harp olasılığı karşısında sarsılmaz iman.',
    why: 'Savaş tehdidi ve kuşatma altında bile iç cesareti ve güveni betimler.',
  },
  {
    term: 'Ellerimi savaşa alıştırır, kollarım tunç yayı gerer.',
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'Ellerimi savaşa eğitiyor; kollarım tunç yayı gerer hâle geliyor.',
    meaning: "Mezmurlar 18:34 — Davut'un kurtuluş ilahisi; savaşta beceri ve güç bahşeden Tanrı'ya şükran.",
    why: 'Savaş yetkinliği ve dayanıklılığının ilahî armağan olduğuna dair vurgu yapar.',
  },
  {
    term: 'Gecenin dehşetinden, gündüz uçan oktan korkmazsın... Yanında bin kişi, sağında on bin kişi kırılsa da, sana yaklaşmaz.',
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'Gece dehşetinden, gündüz uçan oktan korkmazsın... Yanında bin, sağında on bin düşse de sana yaklaşmaz.',
    meaning: 'Mezmurlar 91:5,7 — Korunma mezmuru; ok, kitlesel kırımlar ve savaş-salgın imgeleri arasında ilahî himaye.',
    why: 'Savaşın kaygı ve tehlikeleri içinde korkusuzluk ve korunma umudunu dile getirir.',
  },
  {
    term: 'Orada kırdı şimşekli okları, kalkanı, kılıcı ve savaş araçlarını. (parafraz)',
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'Orada savaşın silahlarını —okları, kalkanı, kılıcı— parçaladı. (parafraz)',
    meaning: "Mezmurlar 76:3 — Tanrı'nın düşman savaş gücünü etkisiz kılışına dair Siyon ilahisi.",
    why: 'Savaş donanımının Tanrı karşısında boşa çıkmasını betimler.',
  },
  {
    term: 'Ey Egemen RAB, güçlü kurtarıcım, savaş gününde başımı örttün.',
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'Ey Rab YAHVE, kudretli kurtarıcım, savaş gününde başımı (miğfer gibi) örttün.',
    meaning: 'Mezmurlar 140:7 — Düşmanlardan korunma duasında savaş günü imgesiyle ilahî siperlik.',
    why: 'Savaş anındaki koruma ve ilahî savunmayı doğrudan dile getirir.',
  },
  {
    term: "Ağızlarında Tanrı'ya yüce övgüler, ellerinde iki ağızlı kılıç olsun; uluslardan öç almak, halkları cezalandırmak için.",
    language: L,
    kind: 'pasaj',
    pronunciation: '',
    literal: 'Ağızlarında yüce övgüler, ellerinde iki ağızlı kılıç; uluslardan öç almak ve halkları cezalandırmak için.',
    meaning: 'Mezmurlar 149:6-7 — Tapınma ve savaş imgelerinin iç içe geçtiği son mezmurlardan biri.',
    why: 'Savaş aleti ve eylemi (kılıç, ceza) ile kutsal övgünün birlikte anıldığı nadir bir pasajdır.',
  },
];
