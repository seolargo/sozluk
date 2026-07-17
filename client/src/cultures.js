// Kavram aramasında seçilebilecek ülke ve medeniyetler.
// Değerler serbest metin olarak modele iletilir; gruplar sadece görsel düzen içindir.
// Söz aramasında seçilebilecek ünlü kişiler.
export const PERSON_GROUPS = [
  {
    label: 'Türk Büyükleri',
    options: [
      'Mustafa Kemal Atatürk', 'Mevlânâ Celâleddîn-i Rûmî', 'Yunus Emre',
      'Hacı Bektaş-ı Veli', 'Ömer Hayyam', 'Ali Kuşçu', 'Fatih Sultan Mehmet',
      'Kanuni Sultan Süleyman', 'Nâzım Hikmet', 'Sabahattin Ali',
      'Ahmet Hamdi Tanpınar', 'Aşık Veysel',
    ],
  },
  {
    label: 'Antik Filozoflar',
    options: [
      'Sokrates', 'Platon', 'Aristoteles', 'Çiçero', 'Seneca', 'Marcus Aurelius',
      'Epiktetos', 'Epikür', 'Herakleitos', 'Diyojen', 'Konfüçyüs', 'Lao Tzu',
      'Buda', 'Sun Tzu',
    ],
  },
  {
    label: 'Düşünürler & Filozoflar',
    options: [
      'Friedrich Nietzsche', 'Immanuel Kant', 'Arthur Schopenhauer',
      'Søren Kierkegaard', 'Jean-Paul Sartre', 'Albert Camus',
      'Simone de Beauvoir', 'Hannah Arendt', 'Michel de Montaigne',
      'Baruch Spinoza', 'John Stuart Mill', 'İbn-i Haldun', 'Erasmus',
    ],
  },
  {
    label: 'Yazarlar & Şairler',
    options: [
      'William Shakespeare', 'Johann Wolfgang von Goethe', 'Lev Tolstoy',
      'Fyodor Dostoyevski', 'Franz Kafka', 'Oscar Wilde', 'Mark Twain',
      'Victor Hugo', 'Hâfız-ı Şirâzî', 'Halil Cibran', 'Rabindranath Tagore',
      'Pablo Neruda', 'Emily Dickinson', 'Virginia Woolf', 'Jorge Luis Borges',
      'Antoine de Saint-Exupéry', 'Samuel Beckett',
    ],
  },
  {
    label: 'Liderler & Devlet İnsanları',
    options: [
      'Winston Churchill', 'Abraham Lincoln', 'Mahatma Gandhi', 'Nelson Mandela',
      'Kraliçe I. Elizabeth', 'Kraliçe II. Elizabeth', 'Napolyon Bonapart',
      'Julius Caesar', 'Martin Luther King', 'John F. Kennedy',
      'Eleanor Roosevelt', 'Selahaddin Eyyubi',
    ],
  },
  {
    label: 'Bilim İnsanları',
    options: [
      'Albert Einstein', 'Isaac Newton', 'Marie Curie', 'Nikola Tesla',
      'Charles Darwin', 'Galileo Galilei', 'İbn-i Sina', 'Stephen Hawking',
      'Carl Sagan', 'Richard Feynman',
    ],
  },
  {
    label: 'Sanatçılar',
    options: [
      'Leonardo da Vinci', 'Michelangelo', 'Vincent van Gogh', 'Pablo Picasso',
      'Frida Kahlo', 'Ludwig van Beethoven', 'Wolfgang Amadeus Mozart',
      'Charlie Chaplin',
    ],
  },
];

export const CULTURE_GROUPS = [
  {
    label: 'Kadim Medeniyetler',
    options: [
      'İnka Medeniyeti',
      'Maya Medeniyeti',
      'Aztek Medeniyeti',
      'Antik Mısır',
      'Mezopotamya (Sümer, Babil, Akad)',
      'Antik Yunan',
      'Roma İmparatorluğu',
      'Bizans',
      'Antik Pers',
      'Fenike',
      'Hitit',
      'Kartaca',
      'Kelt Medeniyeti',
      'Vikingler / İskandinav Mitolojisi',
      'Göktürkler / Eski Türkler',
      'Osmanlı İmparatorluğu',
      'Endülüs',
      'Moğol İmparatorluğu',
      'Antik Çin',
      'Antik Hindistan (Vedik / Sanskrit)',
      'Aksum (Antik Habeşistan)',
      'Kuzey Amerika Yerlileri',
      'Aborjin Avustralya',
      'Maori Kültürü',
      'Polinezya',
    ],
  },
  {
    label: 'Avrupa',
    options: [
      'Almanya', 'Andorra', 'Arnavutluk', 'Avusturya', 'Belçika', 'Beyaz Rusya (Belarus)',
      'Birleşik Krallık', 'Bosna-Hersek', 'Bulgaristan', 'Çekya', 'Danimarka', 'Estonya',
      'Finlandiya', 'Fransa', 'Hırvatistan', 'Hollanda', 'İrlanda', 'İspanya', 'İsveç',
      'İsviçre', 'İtalya', 'İzlanda', 'Karadağ', 'Kosova', 'Kuzey Makedonya', 'Letonya',
      'Lihtenştayn', 'Litvanya', 'Lüksemburg', 'Macaristan', 'Malta', 'Moldova', 'Monako',
      'Norveç', 'Polonya', 'Portekiz', 'Romanya', 'Rusya', 'San Marino', 'Sırbistan',
      'Slovakya', 'Slovenya', 'Ukrayna', 'Vatikan', 'Yunanistan',
    ],
  },
  {
    label: 'Asya',
    options: [
      'Afganistan', 'Azerbaycan', 'Bangladeş', 'Bhutan', 'Brunei', 'Çin', 'Doğu Timor',
      'Endonezya', 'Ermenistan', 'Filipinler', 'Güney Kore', 'Gürcistan', 'Hindistan',
      'Japonya', 'Kamboçya', 'Kazakistan', 'Kırgızistan', 'Kuzey Kore', 'Laos', 'Malezya',
      'Maldivler', 'Moğolistan', 'Myanmar', 'Nepal', 'Özbekistan', 'Pakistan', 'Singapur',
      'Sri Lanka', 'Tacikistan', 'Tayland', 'Tayvan', 'Türkmenistan', 'Vietnam',
    ],
  },
  {
    label: 'Orta Doğu',
    options: [
      'Bahreyn', 'Birleşik Arap Emirlikleri', 'Filistin', 'Irak', 'İran', 'İsrail',
      'Katar', 'Kıbrıs', 'Kuveyt', 'Lübnan', 'Suriye', 'Suudi Arabistan', 'Türkiye',
      'Umman', 'Ürdün', 'Yemen',
    ],
  },
  {
    label: 'Afrika',
    options: [
      'Angola', 'Benin', 'Botsvana', 'Burkina Faso', 'Burundi', 'Cezayir', 'Cibuti',
      'Çad', 'Demokratik Kongo Cumhuriyeti', 'Ekvator Ginesi', 'Eritre', 'Esvatini',
      'Etiyopya', 'Fas', 'Fildişi Sahili', 'Gabon', 'Gambiya', 'Gana', 'Gine',
      'Gine-Bissau', 'Güney Afrika', 'Güney Sudan', 'Kamerun', 'Kenya', 'Komorlar',
      'Kongo Cumhuriyeti', 'Lesotho', 'Liberya', 'Libya', 'Madagaskar', 'Malavi',
      'Mali', 'Mauritius', 'Mısır', 'Moritanya', 'Mozambik', 'Namibya', 'Nijer',
      'Nijerya', 'Orta Afrika Cumhuriyeti', 'Ruanda', 'São Tomé ve Príncipe', 'Senegal',
      'Seyşeller', 'Sierra Leone', 'Somali', 'Sudan', 'Tanzanya', 'Togo', 'Tunus',
      'Uganda', 'Yeşil Burun Adaları', 'Zambiya', 'Zimbabve',
    ],
  },
  {
    label: 'Kuzey Amerika & Karayipler',
    options: [
      'ABD', 'Antigua ve Barbuda', 'Bahamalar', 'Barbados', 'Belize', 'Dominika',
      'Dominik Cumhuriyeti', 'El Salvador', 'Grenada', 'Guatemala', 'Haiti', 'Honduras',
      'Jamaika', 'Kanada', 'Kosta Rika', 'Küba', 'Meksika', 'Nikaragua', 'Panama',
      'Saint Kitts ve Nevis', 'Saint Lucia', 'Saint Vincent ve Grenadinler',
      'Trinidad ve Tobago',
    ],
  },
  {
    label: 'Güney Amerika',
    options: [
      'Arjantin', 'Bolivya', 'Brezilya', 'Ekvador', 'Guyana', 'Kolombiya', 'Paraguay',
      'Peru', 'Surinam', 'Şili', 'Uruguay', 'Venezuela',
    ],
  },
  {
    label: 'Okyanusya',
    options: [
      'Avustralya', 'Fiji', 'Kiribati', 'Marshall Adaları', 'Mikronezya', 'Nauru',
      'Palau', 'Papua Yeni Gine', 'Samoa', 'Solomon Adaları', 'Tonga', 'Tuvalu',
      'Vanuatu', 'Yeni Zelanda',
    ],
  },
];
