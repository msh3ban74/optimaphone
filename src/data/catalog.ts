import {
  Brand,
  Category,
  Coupon,
  Product,
  Review,
} from '../domain/entities';
import { IMG } from './images';

export const CATEGORIES: Category[] = [
  { id: 'phones', name: 'Phones', icon: '📱' },
  { id: 'laptops', name: 'Laptops', icon: '💻' },
  { id: 'tablets', name: 'Tablets', icon: '🖥️' },
  { id: 'audio', name: 'Audio', icon: '🎧' },
  { id: 'wearables', name: 'Wearables', icon: '⌚' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'accessories', name: 'Accessories', icon: '🔌' },
];

export const BRANDS: Brand[] = [
  { id: 'apple', name: 'Apple', monogram: '' },
  { id: 'samsung', name: 'Samsung', monogram: 'S' },
  { id: 'google', name: 'Google', monogram: 'G' },
  { id: 'sony', name: 'Sony', monogram: 'SO' },
  { id: 'asus', name: 'ASUS', monogram: 'A' },
  { id: 'lenovo', name: 'Lenovo', monogram: 'L' },
  { id: 'anker', name: 'Anker', monogram: 'AN' },
];

/** Flash deals end a fixed window after app launch so countdowns are live. */
const flashEnd = (hours: number) =>
  new Date(Date.now() + hours * 3600 * 1000).toISOString();

const review = (
  id: string,
  author: string,
  rating: number,
  title: string,
  body: string,
  date: string,
  verified = true,
): Review => ({ id, author, rating, title, body, date, verified });

export const PRODUCTS: Product[] = [
  {
    id: 'p-iphone-17-pro',
    slug: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    tagline: 'Titanium. A19 Pro. Pure power.',
    brand: 'apple',
    category: 'phones',
    images: [IMG.iphonePro, IMG.iphoneDark, IMG.iphoneCamera],
    description:
      'The iPhone 17 Pro pairs the A19 Pro chip with a vapor-chamber-cooled aluminum unibody, a 120Hz ProMotion Super Retina XDR display, and the most advanced triple 48MP camera system Apple has ever shipped.',
    highlights: [
      'A19 Pro chip with 6-core GPU and hardware ray tracing',
      '6.3″ ProMotion 120Hz display, 3000-nit peak brightness',
      'Triple 48MP Fusion camera system with 8× optical-quality zoom',
      'Up to 33 hours of video playback',
    ],
    specGroups: [
      {
        title: 'Display',
        specs: [
          { label: 'Size', value: '6.3-inch Super Retina XDR' },
          { label: 'Refresh rate', value: '1–120Hz ProMotion' },
          { label: 'Brightness', value: '3000 nits peak (outdoor)' },
        ],
      },
      {
        title: 'Performance',
        specs: [
          { label: 'Chip', value: 'A19 Pro' },
          { label: 'Neural Engine', value: '16-core' },
          { label: 'Cooling', value: 'Vapor chamber' },
        ],
      },
      {
        title: 'Camera',
        specs: [
          { label: 'Main', value: '48MP Fusion, ƒ/1.78' },
          { label: 'Ultra Wide', value: '48MP, ƒ/2.2' },
          { label: 'Telephoto', value: '48MP, 8× optical-quality' },
        ],
      },
    ],
    rating: 4.9,
    reviewCount: 2841,
    reviews: [
      review('r1', 'Lina M.', 5, 'The camera is unreal', 'Upgraded from a 14 Pro — low-light shots look like they came off a mirrorless. Battery easily lasts a day and a half.', '2026-07-18'),
      review('r2', 'Omar K.', 5, 'Fastest phone I have used', 'Gaming at max settings without a hint of throttling. The vapor chamber actually works.', '2026-07-02'),
      review('r3', 'Sara A.', 4, 'Great, but heavy', 'Everything is superb except the weight. You get used to it.', '2026-06-21'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Deep Blue', hex: '#27364B' }, storage: '256 GB', price: 1099, stock: 24 },
      { id: 'v2', color: { name: 'Deep Blue', hex: '#27364B' }, storage: '512 GB', price: 1299, stock: 11 },
      { id: 'v3', color: { name: 'Cosmic Orange', hex: '#C96F3B' }, storage: '256 GB', price: 1099, stock: 18 },
      { id: 'v4', color: { name: 'Silver', hex: '#D8D8DC' }, storage: '1 TB', price: 1499, stock: 6 },
    ],
    warrantyMonths: 12,
    isNew: true,
    isFeatured: true,
    tags: ['flagship', 'ios', '5g', 'titanium'],
  },
  {
    id: 'p-iphone-air',
    slug: 'iphone-air',
    name: 'iPhone Air',
    tagline: 'Impossibly thin. Impossibly light.',
    brand: 'apple',
    category: 'phones',
    images: [IMG.iphoneHand, IMG.iphoneTable],
    description:
      'At just 5.6mm, iPhone Air is the thinnest iPhone ever made — a titanium frame wrapped around the A19 chip and a stunning 6.5″ ProMotion display.',
    highlights: [
      '5.6mm titanium design, 165g',
      '6.5″ ProMotion 120Hz display',
      'A19 chip with 5-core GPU',
      '48MP Fusion camera',
    ],
    specGroups: [
      {
        title: 'Design',
        specs: [
          { label: 'Thickness', value: '5.6 mm' },
          { label: 'Weight', value: '165 g' },
          { label: 'Frame', value: 'Grade 5 titanium' },
        ],
      },
      {
        title: 'Performance',
        specs: [
          { label: 'Chip', value: 'A19' },
          { label: 'Connectivity', value: '5G, Wi-Fi 7, eSIM only' },
        ],
      },
    ],
    rating: 4.7,
    reviewCount: 1467,
    reviews: [
      review('r1', 'Dana H.', 5, 'Forget it is in your pocket', 'The lightness is the feature. Photos are excellent and battery is better than expected for the size.', '2026-07-11'),
      review('r2', 'Yousef T.', 4, 'Beautiful engineering', 'Single camera is the only compromise. Everything else feels from the future.', '2026-06-30'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Sky Blue', hex: '#A8C4DD' }, storage: '256 GB', price: 999, stock: 30 },
      { id: 'v2', color: { name: 'Space Black', hex: '#1E1E22' }, storage: '256 GB', price: 999, stock: 21 },
      { id: 'v3', color: { name: 'Light Gold', hex: '#E4D4B4' }, storage: '512 GB', price: 1199, stock: 9 },
    ],
    warrantyMonths: 12,
    isNew: true,
    isFeatured: true,
    tags: ['thin', 'ios', 'lightweight'],
  },
  {
    id: 'p-galaxy-s25-ultra',
    slug: 'galaxy-s25-ultra',
    name: 'Galaxy S25 Ultra',
    tagline: 'Galaxy AI at full power.',
    brand: 'samsung',
    category: 'phones',
    images: [IMG.galaxy, IMG.iphoneTable],
    description:
      'The Galaxy S25 Ultra combines a 200MP camera, the Snapdragon 8 Elite for Galaxy, and a 6.9″ QHD+ Dynamic AMOLED 2X display with Galaxy AI built into every interaction.',
    highlights: [
      'Snapdragon 8 Elite for Galaxy',
      '200MP main camera with ProVisual Engine',
      '6.9″ QHD+ Dynamic AMOLED 2X, 1–120Hz',
      'Embedded S Pen, titanium frame',
    ],
    specGroups: [
      {
        title: 'Display',
        specs: [
          { label: 'Size', value: '6.9-inch QHD+' },
          { label: 'Panel', value: 'Dynamic AMOLED 2X' },
          { label: 'Peak brightness', value: '2600 nits' },
        ],
      },
      {
        title: 'Camera',
        specs: [
          { label: 'Main', value: '200MP, ƒ/1.7, OIS' },
          { label: 'Zoom', value: '5× optical, 100× Space Zoom' },
        ],
      },
    ],
    rating: 4.8,
    reviewCount: 3193,
    reviews: [
      review('r1', 'Mohammed R.', 5, 'The complete package', 'S Pen + that zoom lens = nothing else comes close for productivity and photography in one device.', '2026-07-20'),
      review('r2', 'Elena V.', 5, 'Best Android, period', 'Seven years of updates sealed the deal for me.', '2026-07-05'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Titanium Black', hex: '#2C2C30' }, storage: '256 GB', price: 1199, compareAtPrice: 1299, stock: 27 },
      { id: 'v2', color: { name: 'Titanium Gray', hex: '#8C8C90' }, storage: '512 GB', price: 1319, compareAtPrice: 1419, stock: 14 },
      { id: 'v3', color: { name: 'Titanium Whitesilver', hex: '#DADADE' }, storage: '1 TB', price: 1659, stock: 5 },
    ],
    warrantyMonths: 24,
    isFeatured: true,
    flashDeal: { endsAt: flashEnd(9), percentOff: 8 },
    tags: ['flagship', 'android', 's-pen', 'ai'],
  },
  {
    id: 'p-galaxy-z-fold7',
    slug: 'galaxy-z-fold7',
    name: 'Galaxy Z Fold7',
    tagline: 'A phone. A tablet. A statement.',
    brand: 'samsung',
    category: 'phones',
    images: [IMG.galaxyFold, IMG.galaxy],
    description:
      'The thinnest, lightest Fold yet opens into an expansive 8″ canvas. Multitask like a workstation, then fold it into your pocket.',
    highlights: [
      '8″ main display, 6.5″ cover display',
      '4.2mm unfolded — thinnest Fold ever',
      '200MP camera inherited from the Ultra line',
      'Snapdragon 8 Elite for Galaxy',
    ],
    specGroups: [
      {
        title: 'Displays',
        specs: [
          { label: 'Main', value: '8.0-inch QXGA+ AMOLED, 120Hz' },
          { label: 'Cover', value: '6.5-inch FHD+, 120Hz' },
        ],
      },
      {
        title: 'Design',
        specs: [
          { label: 'Unfolded', value: '4.2 mm' },
          { label: 'Weight', value: '215 g' },
        ],
      },
    ],
    rating: 4.7,
    reviewCount: 876,
    reviews: [
      review('r1', 'Khalid B.', 5, 'Finally feels like a normal phone', 'Closed, it is thinner than my old S23 Ultra. Open, it replaces my iPad. Incredible.', '2026-07-25'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Blue Shadow', hex: '#3A4A63' }, storage: '256 GB', price: 1999, stock: 8 },
      { id: 'v2', color: { name: 'Silver Shadow', hex: '#C9C9CF' }, storage: '512 GB', price: 2119, stock: 4 },
    ],
    warrantyMonths: 24,
    isNew: true,
    tags: ['foldable', 'android', 'premium'],
  },
  {
    id: 'p-pixel-10-pro',
    slug: 'pixel-10-pro',
    name: 'Pixel 10 Pro',
    tagline: 'The smartest camera ever built.',
    brand: 'google',
    category: 'phones',
    images: [IMG.pixel, IMG.iphoneTable],
    description:
      'Powered by the Tensor G5 and Gemini, the Pixel 10 Pro turns computational photography and on-device AI into everyday magic.',
    highlights: [
      'Tensor G5 with on-device Gemini Nano',
      '50MP triple camera with Pro Res Zoom up to 100×',
      '6.8″ Super Actua display, 3000 nits',
      '7 years of OS and security updates',
    ],
    specGroups: [
      {
        title: 'Intelligence',
        specs: [
          { label: 'Chip', value: 'Google Tensor G5' },
          { label: 'AI', value: 'Gemini Nano on-device' },
        ],
      },
      {
        title: 'Camera',
        specs: [
          { label: 'Main', value: '50MP, ƒ/1.68' },
          { label: 'Telephoto', value: '48MP, 5× optical' },
        ],
      },
    ],
    rating: 4.6,
    reviewCount: 1204,
    reviews: [
      review('r1', 'Priya S.', 5, 'Point, shoot, wow', 'The camera decides everything for you and it is always right.', '2026-07-08'),
      review('r2', 'Tom W.', 4, 'Clean Android at its best', 'Call screening alone is worth it.', '2026-06-14'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Obsidian', hex: '#26262A' }, storage: '256 GB', price: 999, stock: 19 },
      { id: 'v2', color: { name: 'Porcelain', hex: '#EDE7DC' }, storage: '256 GB', price: 999, stock: 12 },
      { id: 'v3', color: { name: 'Moonstone', hex: '#8FA3B8' }, storage: '512 GB', price: 1119, stock: 7 },
    ],
    warrantyMonths: 12,
    tags: ['android', 'camera', 'ai'],
  },
  {
    id: 'p-macbook-pro-14-m5',
    slug: 'macbook-pro-14-m5',
    name: 'MacBook Pro 14″ M5',
    tagline: 'A beast in a whisper-quiet shell.',
    brand: 'apple',
    category: 'laptops',
    images: [IMG.macbookDesk, IMG.macbookSide, IMG.macbookCode],
    description:
      'The M5 chip brings a new class of AI performance to the 14-inch MacBook Pro, with up to 24 hours of battery life and a Liquid Retina XDR display.',
    highlights: [
      'Apple M5 chip — 10-core CPU, 10-core GPU',
      '14.2″ Liquid Retina XDR, 120Hz ProMotion',
      'Up to 24 hours battery life',
      'Three Thunderbolt 4 ports, HDMI, SDXC',
    ],
    specGroups: [
      {
        title: 'Performance',
        specs: [
          { label: 'Chip', value: 'Apple M5' },
          { label: 'Memory', value: 'Up to 32GB unified' },
          { label: 'Neural Engine', value: '16-core, 4× faster AI' },
        ],
      },
      {
        title: 'Display',
        specs: [
          { label: 'Size', value: '14.2-inch Liquid Retina XDR' },
          { label: 'Brightness', value: '1600 nits peak HDR' },
        ],
      },
    ],
    rating: 4.9,
    reviewCount: 1876,
    reviews: [
      review('r1', 'Jason L.', 5, 'Compiles like a workstation', 'Cut my Xcode build times in half versus my M2 Pro. Fans have literally never spun up audibly.', '2026-07-15'),
      review('r2', 'Aya N.', 5, 'The screen alone is worth it', 'Editing HDR video on a laptop panel this good still feels illegal.', '2026-07-01'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Space Black', hex: '#2A2A2E' }, storage: '512 GB', ram: '16 GB', price: 1599, stock: 16 },
      { id: 'v2', color: { name: 'Space Black', hex: '#2A2A2E' }, storage: '1 TB', ram: '24 GB', price: 1999, stock: 9 },
      { id: 'v3', color: { name: 'Silver', hex: '#D6D6DA' }, storage: '1 TB', ram: '32 GB', price: 2199, stock: 5 },
    ],
    warrantyMonths: 12,
    isNew: true,
    isFeatured: true,
    tags: ['macos', 'pro', 'creator'],
  },
  {
    id: 'p-macbook-air-m4',
    slug: 'macbook-air-m4',
    name: 'MacBook Air 13″ M4',
    tagline: 'Everything you need. Nothing you don’t.',
    brand: 'apple',
    category: 'laptops',
    images: [IMG.macbookAir, IMG.macbookSide],
    description:
      'Impossibly thin and fanless, the M4 MacBook Air handles everyday work, creative apps, and AI features with all-day battery life.',
    highlights: [
      'Apple M4 chip, fanless design',
      '13.6″ Liquid Retina display',
      '18 hours of battery life',
      '12MP Center Stage camera',
    ],
    specGroups: [
      {
        title: 'Performance',
        specs: [
          { label: 'Chip', value: 'Apple M4' },
          { label: 'Memory', value: '16GB unified (base)' },
        ],
      },
      {
        title: 'Portability',
        specs: [
          { label: 'Weight', value: '1.24 kg' },
          { label: 'Thickness', value: '11.3 mm' },
        ],
      },
    ],
    rating: 4.8,
    reviewCount: 2534,
    reviews: [
      review('r1', 'Fatima Z.', 5, 'The default laptop for a reason', 'Silent, cold, fast, lasts two work days. Nothing else to say.', '2026-06-28'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Sky Blue', hex: '#B7CBDE' }, storage: '256 GB', ram: '16 GB', price: 999, compareAtPrice: 1099, stock: 32 },
      { id: 'v2', color: { name: 'Midnight', hex: '#22262E' }, storage: '512 GB', ram: '16 GB', price: 1199, stock: 20 },
      { id: 'v3', color: { name: 'Starlight', hex: '#E9E0D0' }, storage: '512 GB', ram: '24 GB', price: 1399, stock: 11 },
    ],
    warrantyMonths: 12,
    isFeatured: true,
    flashDeal: { endsAt: flashEnd(6), percentOff: 9 },
    tags: ['macos', 'ultrabook', 'student'],
  },
  {
    id: 'p-rog-zephyrus-g16',
    slug: 'rog-zephyrus-g16',
    name: 'ROG Zephyrus G16',
    tagline: 'Desktop-class gaming. Carry-on thin.',
    brand: 'asus',
    category: 'gaming',
    images: [IMG.gamingLaptop, IMG.laptopKeys],
    description:
      'An RTX 5080 laptop GPU and Ryzen AI 9 HX 370 inside a CNC-milled aluminum chassis with a 240Hz OLED Nebula display.',
    highlights: [
      'NVIDIA GeForce RTX 5080 laptop GPU',
      'AMD Ryzen AI 9 HX 370',
      '16″ 2.5K OLED, 240Hz, 0.2ms',
      'Tri-fan vapor chamber cooling',
    ],
    specGroups: [
      {
        title: 'Graphics',
        specs: [
          { label: 'GPU', value: 'RTX 5080 Laptop, 175W' },
          { label: 'Display', value: '16″ 2.5K OLED 240Hz' },
        ],
      },
      {
        title: 'Platform',
        specs: [
          { label: 'CPU', value: 'Ryzen AI 9 HX 370' },
          { label: 'Cooling', value: 'Vapor chamber + Tri-fan' },
        ],
      },
    ],
    rating: 4.7,
    reviewCount: 689,
    reviews: [
      review('r1', 'Marcus D.', 5, 'OLED + 240Hz is cheating', 'Cyberpunk fully pathtraced above 100fps. On a laptop I take to class.', '2026-07-19'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Eclipse Gray', hex: '#3A3A40' }, storage: '1 TB', ram: '32 GB', price: 2499, stock: 7 },
      { id: 'v2', color: { name: 'Platinum White', hex: '#E6E6EA' }, storage: '2 TB', ram: '32 GB', price: 2799, stock: 3 },
    ],
    warrantyMonths: 24,
    isFeatured: true,
    tags: ['gaming', 'rtx', 'oled'],
  },
  {
    id: 'p-legion-9i',
    slug: 'legion-9i',
    name: 'Lenovo Legion 9i',
    tagline: 'Liquid-cooled. Limit-free.',
    brand: 'lenovo',
    category: 'gaming',
    images: [IMG.laptopKeys, IMG.gamingLaptop],
    description:
      'The first 18-inch laptop with integrated liquid cooling, pairing Intel Core Ultra 9 with the RTX 5090 laptop GPU for absolute maximum performance.',
    highlights: [
      'Integrated liquid + air hybrid cooling',
      'RTX 5090 laptop GPU, 175W TGP',
      '18″ 4K Mini-LED, 165Hz',
      'Forged carbon lid — every unit unique',
    ],
    specGroups: [
      {
        title: 'Performance',
        specs: [
          { label: 'CPU', value: 'Intel Core Ultra 9 275HX' },
          { label: 'GPU', value: 'RTX 5090 Laptop' },
        ],
      },
    ],
    rating: 4.6,
    reviewCount: 214,
    reviews: [
      review('r1', 'Viktor P.', 5, 'A desktop replacement, literally', 'Sold my tower. This is faster.', '2026-06-18'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Carbon Black', hex: '#1C1C20' }, storage: '2 TB', ram: '64 GB', price: 3999, stock: 2 },
    ],
    warrantyMonths: 36,
    tags: ['gaming', 'rtx', '18-inch'],
  },
  {
    id: 'p-ipad-pro-m5',
    slug: 'ipad-pro-m5',
    name: 'iPad Pro 13″ M5',
    tagline: 'Your studio. Anywhere.',
    brand: 'apple',
    category: 'tablets',
    images: [IMG.ipad, IMG.deskSetup],
    description:
      'The M5-powered iPad Pro with the Ultra Retina XDR tandem OLED display is the most advanced canvas Apple has ever made.',
    highlights: [
      'Apple M5 chip',
      '13″ Ultra Retina XDR tandem OLED',
      '5.1mm thin, 579g',
      'Apple Pencil Pro + Magic Keyboard support',
    ],
    specGroups: [
      {
        title: 'Display',
        specs: [
          { label: 'Panel', value: 'Tandem OLED, 1000 nits SDR' },
          { label: 'Refresh', value: '10–120Hz ProMotion' },
        ],
      },
    ],
    rating: 4.8,
    reviewCount: 941,
    reviews: [
      review('r1', 'Noor E.', 5, 'Replaced my laptop for art', 'Procreate on this display is a religious experience.', '2026-07-03'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Space Black', hex: '#2A2A2E' }, storage: '256 GB', price: 1299, stock: 13 },
      { id: 'v2', color: { name: 'Silver', hex: '#D8D8DC' }, storage: '512 GB', price: 1499, stock: 8 },
    ],
    warrantyMonths: 12,
    isNew: true,
    tags: ['tablet', 'creator', 'oled'],
  },
  {
    id: 'p-airpods-pro-3',
    slug: 'airpods-pro-3',
    name: 'AirPods Pro 3',
    tagline: 'Silence, engineered.',
    brand: 'apple',
    category: 'audio',
    images: [IMG.airpods, IMG.earbuds],
    description:
      'With twice the active noise cancellation, built-in heart-rate sensing, and Live Translation, AirPods Pro 3 are the most advanced earbuds Apple has made.',
    highlights: [
      '2× stronger Active Noise Cancellation',
      'Heart-rate sensing during workouts',
      'Live Translation with Apple Intelligence',
      'Up to 8 hours listening with ANC',
    ],
    specGroups: [
      {
        title: 'Audio',
        specs: [
          { label: 'ANC', value: '2× vs AirPods Pro 2' },
          { label: 'Battery', value: '8h (buds) / 30h (case)' },
        ],
      },
    ],
    rating: 4.8,
    reviewCount: 4102,
    reviews: [
      review('r1', 'Hana J.', 5, 'The office disappears', 'ANC is genuinely double. Translation mode blew my mind on vacation.', '2026-07-22'),
    ],
    variants: [
      { id: 'v1', color: { name: 'White', hex: '#F4F4F6' }, price: 249, stock: 60 },
    ],
    warrantyMonths: 12,
    isNew: true,
    isFeatured: true,
    flashDeal: { endsAt: flashEnd(12), percentOff: 10 },
    tags: ['earbuds', 'anc', 'ios'],
  },
  {
    id: 'p-wh1000xm6',
    slug: 'sony-wh-1000xm6',
    name: 'Sony WH-1000XM6',
    tagline: 'The gold standard of quiet.',
    brand: 'sony',
    category: 'audio',
    images: [IMG.headphones, IMG.headphonesWhite],
    description:
      'Sony’s flagship headphones return with the QN3 processor, 12 microphones, and the best noise cancellation ever measured in a consumer headset.',
    highlights: [
      'QN3 HD noise-cancelling processor',
      '12-microphone adaptive ANC',
      '30 hours battery, 3-min quick charge = 3 hours',
      'Foldable design returns',
    ],
    specGroups: [
      {
        title: 'Audio',
        specs: [
          { label: 'Driver', value: '30mm carbon-fiber dome' },
          { label: 'Codecs', value: 'LDAC, AAC, SBC, LC3' },
        ],
      },
    ],
    rating: 4.7,
    reviewCount: 1988,
    reviews: [
      review('r1', 'Leo F.', 5, 'Flights are silent now', 'Engine drone simply does not exist anymore.', '2026-07-09'),
      review('r2', 'Mira C.', 4, 'Comfort king', 'Wore them 10 hours straight. Wish the case were smaller.', '2026-06-25'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Black', hex: '#1E1E22' }, price: 449, compareAtPrice: 479, stock: 25 },
      { id: 'v2', color: { name: 'Platinum Silver', hex: '#D9D6D0' }, price: 449, stock: 17 },
      { id: 'v3', color: { name: 'Midnight Blue', hex: '#2B3550' }, price: 449, stock: 9 },
    ],
    warrantyMonths: 24,
    tags: ['headphones', 'anc', 'travel'],
  },
  {
    id: 'p-watch-ultra-3',
    slug: 'apple-watch-ultra-3',
    name: 'Apple Watch Ultra 3',
    tagline: 'Adventure-grade. Satellite-connected.',
    brand: 'apple',
    category: 'wearables',
    images: [IMG.appleWatch, IMG.smartwatch],
    description:
      'With satellite messaging, a wide-angle always-on display, and 42-hour battery life, Ultra 3 is built for the edge of the map.',
    highlights: [
      'Satellite messaging off-grid',
      '42-hour battery life',
      'Wide-angle LTPO3 always-on display',
      '100m water resistance, EN13319 certified',
    ],
    specGroups: [
      {
        title: 'Endurance',
        specs: [
          { label: 'Battery', value: '42h (72h low power)' },
          { label: 'Water', value: '100m, recreational dive' },
        ],
      },
    ],
    rating: 4.8,
    reviewCount: 1105,
    reviews: [
      review('r1', 'Amir Q.', 5, 'Summited with it', 'Satellite check-ins from 4000m worked flawlessly.', '2026-07-12'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Natural Titanium', hex: '#C8C2B6' }, price: 799, stock: 22 },
      { id: 'v2', color: { name: 'Black Titanium', hex: '#33322F' }, price: 799, stock: 15 },
    ],
    warrantyMonths: 12,
    isNew: true,
    tags: ['watch', 'fitness', 'outdoor'],
  },
  {
    id: 'p-galaxy-watch8',
    slug: 'galaxy-watch8-classic',
    name: 'Galaxy Watch8 Classic',
    tagline: 'The bezel is back.',
    brand: 'samsung',
    category: 'wearables',
    images: [IMG.smartwatch, IMG.appleWatch],
    description:
      'The rotating bezel returns on a slimmer cushion design, with Galaxy AI health insights and a 3000-nit display.',
    highlights: [
      'Rotating physical bezel',
      'Galaxy AI health coaching',
      '3000-nit Super AMOLED display',
      'BioActive sensor with antioxidant index',
    ],
    specGroups: [
      {
        title: 'Health',
        specs: [
          { label: 'Sensors', value: 'HR, ECG, BP, SpO2, temp' },
          { label: 'Battery', value: '40h typical' },
        ],
      },
    ],
    rating: 4.5,
    reviewCount: 733,
    reviews: [
      review('r1', 'Jenny O.', 5, 'The bezel never should have left', 'Scrolling with gloves on. Enough said.', '2026-06-29'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Black', hex: '#242428' }, price: 499, compareAtPrice: 529, stock: 18 },
      { id: 'v2', color: { name: 'White', hex: '#EFEFF2' }, price: 499, stock: 12 },
    ],
    warrantyMonths: 24,
    flashDeal: { endsAt: flashEnd(18), percentOff: 6 },
    tags: ['watch', 'android', 'health'],
  },
  {
    id: 'p-anker-prime-charger',
    slug: 'anker-prime-250w',
    name: 'Anker Prime 250W Charger',
    tagline: 'One brick. Six devices.',
    brand: 'anker',
    category: 'accessories',
    images: [IMG.deskSetup, IMG.laptopDesk],
    description:
      'A GaN desktop charging station delivering 250W across six ports with a live power-readout display — enough for two laptops, a phone, and everything else at once.',
    highlights: [
      '250W total GaN output',
      '4× USB-C + 2× USB-A',
      'Live per-port power display',
      'Single-port up to 140W',
    ],
    specGroups: [
      {
        title: 'Power',
        specs: [
          { label: 'Total output', value: '250W GaN' },
          { label: 'Max single port', value: '140W USB-C PD 3.1' },
        ],
      },
    ],
    rating: 4.7,
    reviewCount: 2210,
    reviews: [
      review('r1', 'Sam K.', 5, 'Desk decluttered', 'Replaced four wall warts and a power strip.', '2026-07-16'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Gunmetal', hex: '#4A4A52' }, price: 169, compareAtPrice: 199, stock: 44 },
    ],
    warrantyMonths: 24,
    flashDeal: { endsAt: flashEnd(5), percentOff: 15 },
    tags: ['charger', 'gan', 'desk'],
  },
  {
    id: 'p-galaxy-book5-pro',
    slug: 'galaxy-book5-pro',
    name: 'Galaxy Book5 Pro',
    tagline: 'The AMOLED ultrabook.',
    brand: 'samsung',
    category: 'laptops',
    images: [IMG.laptopDesk, IMG.macbookCode],
    description:
      'Intel Core Ultra 7 Series 2, a 3K 120Hz Dynamic AMOLED 2X touchscreen, and deep Galaxy ecosystem integration in a 1.23kg aluminum body.',
    highlights: [
      'Intel Core Ultra 7 (Series 2)',
      '16″ 3K AMOLED touchscreen, 120Hz',
      '1.23 kg, 11.6 mm thin',
      '25h video playback',
    ],
    specGroups: [
      {
        title: 'Display',
        specs: [
          { label: 'Panel', value: '3K Dynamic AMOLED 2X, touch' },
          { label: 'Refresh', value: '48–120Hz adaptive' },
        ],
      },
    ],
    rating: 4.5,
    reviewCount: 512,
    reviews: [
      review('r1', 'Ines B.', 4, 'That screen on Windows', 'Best display on any Windows laptop I have owned.', '2026-06-20'),
    ],
    variants: [
      { id: 'v1', color: { name: 'Gray', hex: '#7E7E86' }, storage: '512 GB', ram: '16 GB', price: 1449, stock: 10 },
      { id: 'v2', color: { name: 'Silver', hex: '#D4D4D8' }, storage: '1 TB', ram: '32 GB', price: 1749, stock: 6 },
    ],
    warrantyMonths: 24,
    tags: ['windows', 'ultrabook', 'amoled'],
  },
];

export const COUPONS: Coupon[] = [
  { code: 'WELCOME10', description: '10% off your first order', percentOff: 10, minSubtotal: 0 },
  { code: 'OPTIMA50', description: '$50 off orders over $500', amountOff: 50, minSubtotal: 500 },
  { code: 'GOLD15', description: '15% off orders over $1,000', percentOff: 15, minSubtotal: 1000 },
];

export const TRENDING_SEARCHES = [
  'iPhone 17 Pro',
  'RTX 5080 laptop',
  'AirPods Pro 3',
  'Galaxy S25 Ultra',
  'MacBook M5',
  'Noise cancelling',
];
