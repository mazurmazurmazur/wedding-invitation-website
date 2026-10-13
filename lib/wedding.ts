export type Language = 'pl' | 'en'
export type Bilingual = Record<Language, string>
export type Choice = 'yes' | 'no' | 'undecided'
export type Guest = {
  id: string
  name: string
  attendance: 'yes' | 'no' | null
  dietary: string
  transport: Choice
  returnTime: '01:00' | '04:00' | 'none' | 'undecided'
  accommodation: Choice
  nextDay: Choice
}
export type Invitation = {
  greetingPl: string
  greetingEn: string
  guests: Guest[]
  message: string
  respondedAt: string | null
  editable: boolean
}
export type WeddingSettings = {
  date: string
  time: string
  venue: string
  address: string
  mapsUrl: string
  deadline: string
  welcome: Bilingual
  transport: Bilingual
  returnTransport: Bilingual
  accommodation: Bilingual
  food: Bilingual
  dressCode: Bilingual
  mariaContact: string
  krzysztofContact: string
}

export const defaultSettings: WeddingSettings = {
  date: '2027-05-02',
  time: '14:00',
  venue: 'Ostoja Borucza',
  address: 'Borucza 1, 05-282 Borucza',
  mapsUrl: 'https://maps.app.goo.gl/8cKym75hHR4aYfaT7',
  deadline: '2027-01-31',
  welcome: {
    pl: 'Bierzemy ślub! I nie wyobrażamy sobie tego dnia bez Was. Spotkajmy się wśród zieleni, przy dobrym jedzeniu i na parkiecie. Po prostu — razem.',
    en: 'We’re getting married! And we can’t imagine this day without you. Join us among the trees, around the table and on the dance floor. Simply — together.',
  },
  transport: {
    pl: 'Zorganizujemy autokar z centrum Warszawy. Wyruszamy około 12:00 — dokładne miejsce zbiórki i godzinę potwierdzimy bliżej ślubu.',
    en: 'We’re arranging a coach from central Warsaw, leaving around 12:00. We’ll confirm the exact meeting point and departure time closer to the day.',
  },
  returnTransport: {
    pl: 'Powroty do Warszawy planujemy około 01:00 i 04:00, w nocy z 2 na 3 maja. Dajcie nam znać w RSVP, która opcja Wam odpowiada.',
    en: 'Coaches back to Warsaw are planned for around 01:00 and 04:00, during the night of May 2–3. Let us know your preference in your RSVP.',
  },
  accommodation: {
    pl: 'Zostańcie z nami trochę dłużej. Dla chętnych planujemy nocleg i poprawiny 3 maja. Dostępność miejsc, przydział pokoi i szczegóły potwierdzimy indywidualnie.',
    en: 'Stay a little longer. We’re planning overnight accommodation and a relaxed next-day celebration on May 3. Availability, room assignments and details will be confirmed individually.',
  },
  food: {
    pl: 'Na naszych stołach będzie w pełni wegetariańsko — i pysznie! Jeśli macie alergie, nietolerancje lub inne potrzeby żywieniowe, napiszcie o nich w RSVP.',
    en: 'Our menu will be entirely vegetarian — and delicious! Please tell us about any allergies, intolerances or other dietary needs in your RSVP.',
  },
  dressCode: {
    pl: 'Nie mamy dress code’u. Ubierzcie się tak, żebyście czuli się sobą — i żeby było Wam wygodnie tańczyć.',
    en: 'No dress code. Wear something that feels like you — and that you can dance in.',
  },
  mariaContact: '',
  krzysztofContact: '',
}

export const photos = {
  couple: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00106-y9yBRLolxs4jxHzkRSkoGTi4nRd3Od.jpg',
  kiss: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/buzi-EABR42QsWiq1fwxUyz3JY8JmclBHvu.jpg',
  together: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Image%20%283%29-0GYkRpk2LnyE2qEhVgat2idrNV7Zo9.jpg',
  embrace: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Image%20%281%29-GO6q25HTZ1qv5XfiJMhgdp5Njrs1YC.jpg',
  boat: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00257-Y9q1h3Qfo96CMdmYf729nRbOM4oig0.jpg',
  breeze: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00135-VbBImrqpIpH4ztM6w8KsDEPaLYZlin.jpg',
  krzysztof: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00190-6XGGk5Zy6gfbBbMq3MLP4fynxNuIW9.jpg',
  shallows: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00122-kVjyFHnUwWMFokbUqWVEt5fvtMJI0H.jpg',
  shore: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00114-1UVjPNzUSypd2cyhnK6uLEyEhH385r.jpg',
  maria: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00110-7wgzztgpZMiNhhQIKQZ8pXkjENCHn8.jpg',
}

export function formatDate(date: string, language: Language, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(language === 'pl' ? 'pl-PL' : 'en-GB', options ?? { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00Z`))
}

export function deadlineEnd(date: string) {
  // Resolve the Warsaw UTC offset on this date so summer deadlines also close at local midnight.
  const probe = new Date(`${date}T12:00:00Z`)
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', hourCycle: 'h23' }).format(probe))
  return new Date(Date.parse(`${date}T23:59:59.999Z`) - (hour - 12) * 3_600_000)
}
