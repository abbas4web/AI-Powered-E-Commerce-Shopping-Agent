import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Image pools (real CDN images) ────────────────────────────────────────────
// Using Unsplash Source API — stable, public, no auth needed
const LAPTOP_IMAGES = [
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
  'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&q=80',
  'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&q=80',
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80',
  'https://images.unsplash.com/photo-1611186871525-f87b35d36cd2?w=400&q=80',
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80',
  'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=400&q=80',
  'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&q=80',
];

const PHONE_IMAGES = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&q=80',
  'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&q=80',
  'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80',
  'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&q=80',
  'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',
  'https://images.unsplash.com/photo-1559050671-7e6b25bcb616?w=400&q=80',
  'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&q=80',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80',
  'https://images.unsplash.com/photo-1550367363-ea12860cc124?w=400&q=80',
];

const HEADPHONE_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80',
  'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80',
  'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&q=80',
  'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&q=80',
  'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80',
  'https://images.unsplash.com/photo-1619143942700-f0e0a05a4f88?w=400&q=80',
  'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=400&q=80',
  'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&q=80',
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function rnd(min: number, max: number, step = 1): number {
  const range = Math.floor((max - min) / step);
  return min + Math.floor(Math.random() * (range + 1)) * step;
}

function rating(): number {
  return Math.round((3.2 + Math.random() * 1.7) * 10) / 10;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Laptop templates ──────────────────────────────────────────────────────────

interface LaptopBrand {
  slug: string;
  names: string[];
}

const LAPTOP_BRANDS: LaptopBrand[] = [
  {
    slug: 'asus',
    names: [
      'Vivobook 15', 'Vivobook 16', 'Vivobook Pro 15', 'Vivobook Pro 16',
      'Vivobook 15X OLED', 'Vivobook 16X OLED', 'Vivobook S 15 OLED',
      'ZenBook 14', 'ZenBook 14 OLED', 'ZenBook 15', 'ZenBook Duo', 'ZenBook S 13 OLED',
      'ROG Strix G15', 'ROG Strix G16', 'ROG Zephyrus G14', 'ROG Zephyrus G16',
      'ROG Flow X13', 'ROG Flow Z13', 'ROG Strix Scar 16', 'ROG Strix Scar 18',
      'TUF Gaming A15', 'TUF Gaming F15', 'TUF Gaming A17', 'TUF Gaming F17',
      'ExpertBook B1', 'ExpertBook B3', 'Chromebook CX1', 'ProArt Studiobook 16',
    ],
  },
  {
    slug: 'dell',
    names: [
      'Inspiron 15 3520', 'Inspiron 15 3535', 'Inspiron 15 5530', 'Inspiron 16 5630',
      'Inspiron 14 5430', 'Inspiron 14 7430', 'Inspiron 16 7630',
      'Vostro 15 3530', 'Vostro 15 5630', 'Vostro 16 5630', 'Vostro 14 5430',
      'XPS 13', 'XPS 13 Plus', 'XPS 15', 'XPS 17',
      'Latitude 5540', 'Latitude 7440', 'Latitude 9440', 'Latitude 5340',
      'G15 Gaming 5530', 'G16 Gaming 7630', 'G15 Gaming 5525',
      'Alienware m16 R1', 'Alienware x16 R1', 'Alienware m18 R1',
    ],
  },
  {
    slug: 'lenovo',
    names: [
      'IdeaPad Slim 3', 'IdeaPad Slim 5', 'IdeaPad Slim 5i', 'IdeaPad Slim 5 Pro',
      'IdeaPad Slim 3i', 'IdeaPad Slim 3 Gen 8', 'IdeaPad Slim 5 Gen 8',
      'IdeaPad Flex 5', 'IdeaPad Flex 5i', 'IdeaPad Gaming 3', 'IdeaPad Gaming 3i',
      'ThinkPad E14', 'ThinkPad E16', 'ThinkPad T14s', 'ThinkPad X1 Carbon',
      'ThinkPad L14', 'ThinkPad X13', 'ThinkBook 14 G6',
      'Yoga 7i', 'Yoga 9i', 'Yoga Slim 6i', 'Yoga Slim 7i',
      'Legion 5', 'Legion 5i', 'Legion 5 Pro', 'Legion Slim 5', 'Legion Slim 5i',
      'LOQ 15', 'LOQ 15i', 'LOQ 15APH9',
    ],
  },
  {
    slug: 'hp',
    names: [
      'Pavilion 15', 'Pavilion 15 eg', 'Pavilion Plus 14', 'Pavilion Plus 16',
      'Pavilion x360 14', 'Pavilion Aero 13',
      'Laptop 15s', 'Laptop 15s-eq', 'Laptop 15s-fq', 'Laptop 14s-fq', 'Laptop 14s-eq',
      'Envy 13', 'Envy 14', 'Envy 15', 'Envy x360 13', 'Envy x360 15',
      'Spectre x360 14', 'Spectre x360 16',
      'ProBook 450 G10', 'ProBook 440 G10', 'EliteBook 840 G10', 'EliteBook 1040 G10',
      'Omen 16', 'Omen Transcend 14', 'Omen 17',
      'Victus 15', 'Victus 16', 'Victus 15 fa',
    ],
  },
  {
    slug: 'acer',
    names: [
      'Aspire 3', 'Aspire 3 Slim', 'Aspire 5', 'Aspire 5 Slim', 'Aspire 7', 'Aspire Vero 14',
      'Aspire Lite', 'Aspire Go 15', 'Aspire Go 14',
      'Swift 3', 'Swift 3 SF314', 'Swift Go 14', 'Swift Go 16', 'Swift X 14', 'Swift X 16',
      'Nitro 5', 'Nitro V 15', 'Nitro V 16', 'Nitro 17',
      'Predator Helios 16', 'Predator Helios 18', 'Predator Triton 16', 'Predator Helios 300',
      'Chromebook 315', 'Chromebook Spin 713', 'ConceptD 5',
    ],
  },
  {
    slug: 'apple',
    names: [
      'MacBook Air M2 13', 'MacBook Air M2 15', 'MacBook Air M3 13', 'MacBook Air M3 15',
      'MacBook Pro 14 M3', 'MacBook Pro 16 M3', 'MacBook Pro 14 M3 Pro',
      'MacBook Pro 16 M3 Pro', 'MacBook Pro 14 M3 Max', 'MacBook Pro 16 M3 Max',
    ],
  },
];

const LAPTOP_PROCESSORS = [
  'Intel Core i3-1215U', 'Intel Core i5-1235U', 'Intel Core i5-12450H',
  'Intel Core i5-13420H', 'Intel Core i7-1255U', 'Intel Core i7-1355U',
  'Intel Core i7-12650H', 'Intel Core i7-13620H', 'Intel Core i9-13900H',
  'Intel Core Ultra 5 125H', 'Intel Core Ultra 7 155H',
  'AMD Ryzen 3 7320U', 'AMD Ryzen 5 7520U', 'AMD Ryzen 5 7530U',
  'AMD Ryzen 5 7535HS', 'AMD Ryzen 7 7730U', 'AMD Ryzen 7 7745HX',
  'AMD Ryzen 9 7940HS', 'AMD Ryzen 9 7945HX',
  'Apple M2', 'Apple M3', 'Apple M3 Pro', 'Apple M3 Max',
];

const LAPTOP_GPUS = [
  'Intel Iris Xe Graphics', 'Intel Arc A370M', 'Intel Arc A530M',
  'AMD Radeon Graphics', 'AMD Radeon RX 6600M', 'AMD Radeon RX 7600M XT',
  'NVIDIA GeForce MX550', 'NVIDIA GeForce RTX 3050', 'NVIDIA GeForce RTX 3050 Ti',
  'NVIDIA GeForce RTX 4050', 'NVIDIA GeForce RTX 4060', 'NVIDIA GeForce RTX 4070',
  'NVIDIA GeForce RTX 4080', 'Apple M2 10-core GPU', 'Apple M3 18-core GPU',
];

const DISPLAY_PANELS = ['IPS', 'VA', 'OLED', 'AMOLED', 'Liquid Retina'];

// ─── Phone templates ──────────────────────────────────────────────────────────

interface PhoneBrand {
  slug: string;
  names: string[];
}

const PHONE_BRANDS: PhoneBrand[] = [
  {
    slug: 'samsung',
    names: [
      'Galaxy A04', 'Galaxy A04s', 'Galaxy A13', 'Galaxy A14', 'Galaxy A14 5G',
      'Galaxy A23', 'Galaxy A23 5G', 'Galaxy A24', 'Galaxy A25 5G',
      'Galaxy A34 5G', 'Galaxy A35 5G', 'Galaxy A54 5G', 'Galaxy A55 5G',
      'Galaxy M14 5G', 'Galaxy M34 5G', 'Galaxy M54 5G', 'Galaxy M15 5G',
      'Galaxy F14 5G', 'Galaxy F34 5G', 'Galaxy F54 5G',
      'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra',
      'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra',
      'Galaxy Z Fold 5', 'Galaxy Z Flip 5',
    ],
  },
  {
    slug: 'apple',
    names: [
      'iPhone 13', 'iPhone 13 mini', 'iPhone 14', 'iPhone 14 Plus',
      'iPhone 14 Pro', 'iPhone 14 Pro Max',
      'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    ],
  },
  {
    slug: 'oneplus',
    names: [
      'OnePlus Nord CE 3 Lite', 'OnePlus Nord CE 3', 'OnePlus Nord 3',
      'OnePlus Nord CE 4 Lite', 'OnePlus Nord CE 4', 'OnePlus Nord 4',
      'OnePlus 11', 'OnePlus 11R', 'OnePlus 12', 'OnePlus 12R',
      'OnePlus Open', 'OnePlus Ace 2V',
    ],
  },
  {
    slug: 'google',
    names: [
      'Pixel 7a', 'Pixel 7', 'Pixel 7 Pro',
      'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a',
      'Pixel Fold',
    ],
  },
  {
    slug: 'sony',
    names: [
      'Xperia 10 V', 'Xperia 10 VI', 'Xperia 1 V', 'Xperia 1 VI',
      'Xperia 5 V',
    ],
  },
];

const PHONE_PROCESSORS = [
  'Snapdragon 4 Gen 2', 'Snapdragon 6 Gen 1', 'Snapdragon 7 Gen 1',
  'Snapdragon 7s Gen 2', 'Snapdragon 7 Gen 3', 'Snapdragon 8 Gen 2',
  'Snapdragon 8 Gen 3', 'Snapdragon 8s Gen 3',
  'Dimensity 700', 'Dimensity 1080', 'Dimensity 7050', 'Dimensity 7200 Ultra',
  'Dimensity 9200', 'Dimensity 9300',
  'Exynos 1380', 'Exynos 2200', 'Exynos 2400',
  'Apple A15 Bionic', 'Apple A16 Bionic', 'Apple A17 Pro',
  'Google Tensor G2', 'Google Tensor G3',
];

// ─── Headphone templates ──────────────────────────────────────────────────────

interface HeadphoneBrand {
  slug: string;
  names: string[];
}

const HEADPHONE_BRANDS: HeadphoneBrand[] = [
  {
    slug: 'sony',
    names: [
      'WH-1000XM4', 'WH-1000XM5', 'WH-CH720N', 'WH-CH520', 'WH-XB910N',
      'WF-1000XM4', 'WF-1000XM5', 'WF-C700N', 'WF-C500', 'WF-SP800N',
      'MDR-7506', 'MDR-ZX110', 'MDR-ZX310',
      'Inzone H9', 'Inzone H7', 'Inzone H5', 'Inzone H3',
    ],
  },
  {
    slug: 'samsung',
    names: [
      'Galaxy Buds 2', 'Galaxy Buds 2 Pro', 'Galaxy Buds FE',
      'Galaxy Buds Pro', 'Galaxy Buds Live',
      'Galaxy Buds3', 'Galaxy Buds3 Pro',
    ],
  },
  {
    slug: 'apple',
    names: [
      'AirPods 3rd Gen', 'AirPods 4', 'AirPods Pro 2nd Gen',
      'AirPods Max',
    ],
  },
];

// Additional headphone brands not in laptop/phone list
const EXTRA_HP_BRANDS = [
  { slug: 'jbl', name: 'JBL' },
  { slug: 'bose', name: 'Bose' },
  { slug: 'sennheiser', name: 'Sennheiser' },
  { slug: 'boat', name: 'boAt' },
  { slug: 'noise', name: 'Noise' },
  { slug: 'realme', name: 'realme' },
];

const JBL_MODELS = [
  'Tune 760NC', 'Tune 770NC', 'Tune 710BT', 'Tune 510BT', 'Tune 670NC',
  'Live 660NC', 'Live 770NC', 'Live 460NC', 'Live 660NC', 'Tour One M2',
  'Free X', 'Wave Flex', 'Wave Buds', 'Wave Beam', 'Wave 200TWS', 'Wave 300TWS',
  'Vibe Beam', 'Vibe Buds', 'Club Pro Plus TWS', 'Reflect Flow Pro',
  'Quantum 100', 'Quantum 350 Wireless', 'Quantum 800',
];

const BOSE_MODELS = [
  'QuietComfort 45', 'QuietComfort Ultra', 'QuietComfort 35 II',
  'QuietComfort Earbuds II', 'QuietComfort Ultra Earbuds',
  'SoundLink Around-Ear II', 'SoundLink Flex', 'Sport Earbuds',
  'SoundSport Free', 'Frames Tenor', 'Frames Soprano',
];

const SENNHEISER_MODELS = [
  'Momentum 4 Wireless', 'Momentum True Wireless 3', 'Momentum True Wireless 4',
  'Accentum Plus Wireless', 'Accentum Wireless',
  'HD 560S', 'HD 620S', 'HD 450BT', 'HD 350BT',
  'CX Plus True Wireless', 'CX True Wireless',
];

const BOAT_MODELS = [
  'Rockerz 450', 'Rockerz 450 Pro', 'Rockerz 510', 'Rockerz 550', 'Rockerz 558 Pro',
  'Rockerz 333 Pro', 'Rockerz 400', 'Rockerz 600',
  'Airdopes 141', 'Airdopes 161', 'Airdopes 181', 'Airdopes 441', 'Airdopes 461',
  'Airdopes 131', 'Airdopes 141 ANC', 'Airdopes 201', 'Airdopes 621',
  'Bassheads 100', 'Bassheads 900', 'Bassheads 242', 'Bassheads 102',
  'Immortal 1000D', 'Nirvana Ion', 'Nirvana Bliss',
  'Wave Flex Pro', 'Wave Style', 'Wave Nano', 'Wave Buds',
];

const NOISE_MODELS = [
  'Buds VS101', 'Buds VS301', 'Buds Comfort 2', 'Buds Connect 2',
  'One ANC', 'Air Buds Pro', 'Air Buds Mini', 'Shots X5 Pro',
  'ColorFit Icon Buds', 'Sense 1 ANC', 'Buds VS104',
];

const REALME_MODELS = [
  'Buds T100', 'Buds T300', 'Buds Air 5 Pro', 'Buds Air 6 Pro',
  'Buds Wireless 3 Neo', 'Buds Classic', 'Buds 2', 'Buds Air 3',
  'Buds Air 3 Neo', 'Buds Air 3S', 'Buds Air 5', 'Buds N1',
];

// ─── Headphone extra brand models map ────────────────────────────────────────

const EXTRA_HP_MODELS: Record<string, string[]> = {
  jbl: JBL_MODELS,
  bose: BOSE_MODELS,
  sennheiser: SENNHEISER_MODELS,
  boat: BOAT_MODELS,
  noise: NOISE_MODELS,
  realme: REALME_MODELS,
};

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database with 1000+ products...');

  // ── Categories ────────────────────────────────────────────
  const categoryData = [
    { name: 'Laptops', slug: 'laptops', description: 'Portable computers' },
    { name: 'Smartphones', slug: 'smartphones', description: 'Mobile phones' },
    { name: 'Headphones', slug: 'headphones', description: 'Audio headphones & earbuds' },
    { name: 'Tablets', slug: 'tablets', description: 'Tablet computers' },
    { name: 'Monitors', slug: 'monitors', description: 'Desktop monitors' },
    { name: 'Cameras', slug: 'cameras', description: 'Digital cameras' },
    { name: 'Televisions', slug: 'televisions', description: 'Smart TVs' },
  ];

  const categories = await Promise.all(
    categoryData.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    ),
  );
  console.log(`✓ ${categories.length} categories`);

  const laptopCat = categories.find((c) => c.slug === 'laptops')!;
  const phoneCat = categories.find((c) => c.slug === 'smartphones')!;
  const headphoneCat = categories.find((c) => c.slug === 'headphones')!;

  // ── Brands ────────────────────────────────────────────────
  const brandData = [
    { name: 'Apple', slug: 'apple' },
    { name: 'Samsung', slug: 'samsung' },
    { name: 'ASUS', slug: 'asus' },
    { name: 'Dell', slug: 'dell' },
    { name: 'Lenovo', slug: 'lenovo' },
    { name: 'HP', slug: 'hp' },
    { name: 'Acer', slug: 'acer' },
    { name: 'OnePlus', slug: 'oneplus' },
    { name: 'Google', slug: 'google' },
    { name: 'Sony', slug: 'sony' },
    { name: 'JBL', slug: 'jbl' },
    { name: 'Bose', slug: 'bose' },
    { name: 'Sennheiser', slug: 'sennheiser' },
    { name: 'boAt', slug: 'boat' },
    { name: 'Noise', slug: 'noise' },
    { name: 'realme', slug: 'realme' },
  ];

  const brands = await Promise.all(
    brandData.map((b) =>
      prisma.brand.upsert({
        where: { slug: b.slug },
        update: {},
        create: b,
      }),
    ),
  );
  console.log(`✓ ${brands.length} brands`);

  const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b]));

  // ── Helpers ───────────────────────────────────────────────
  function laptopDesc(name: string, brand: string, processor: string, ram: number, gpu: string): string {
    const use = gpu.includes('RTX') || gpu.includes('RX 6') || gpu.includes('RX 7')
      ? 'gaming and content creation'
      : ram >= 32
      ? 'heavy multitasking and development'
      : 'everyday productivity and development';
    return `${brand} ${name} powered by ${processor} with ${ram}GB RAM and ${gpu}. Designed for ${use}, it offers a great balance of performance and portability.`;
  }

  function phoneDesc(name: string, brand: string, processor: string, ram: number, camera: number): string {
    return `${brand} ${name} runs on ${processor} with ${ram}GB RAM and a ${camera}MP main camera. A feature-packed smartphone built for performance and photography in India.`;
  }

  function headphoneDesc(name: string, brand: string, type: string, anc: boolean, battery: number): string {
    const ancStr = anc ? 'Active Noise Cancellation (ANC)' : 'passive noise isolation';
    if (type === 'TWS') {
      return `${brand} ${name} — compact true wireless earbuds with ${ancStr}, ${battery}h total battery, and seamless Bluetooth pairing for music and calls on the go.`;
    }
    return `${brand} ${name} — ${type} headphones featuring ${ancStr}, ${battery}h playback, and premium audio drivers engineered for immersive listening.`;
  }

  // ─────────────────────────────────────────────────────────
  // LAPTOPS  (~400 products)
  // Each brand × model × 2 RAM variants = ~370–400 entries
  // ─────────────────────────────────────────────────────────
  console.log('  Generating laptops...');

  const laptopProducts: object[] = [];
  let laptopIdx = 0;

  for (const brandDef of LAPTOP_BRANDS) {
    const brand = brandMap[brandDef.slug];
    for (const modelName of brandDef.names) {
      const isApple = brandDef.slug === 'apple';
      const ramVariants = isApple ? [8, 16, 24] : [8, 16, 32];

      for (const ram of ramVariants) {
        const processor = isApple
          ? LAPTOP_PROCESSORS.find((p) => p.startsWith('Apple')) ?? 'Apple M3'
          : LAPTOP_PROCESSORS[laptopIdx % (LAPTOP_PROCESSORS.length - 3)];

        const gpu = isApple
          ? (modelName.includes('Pro') ? 'Apple M3 18-core GPU' : 'Apple M2 10-core GPU')
          : LAPTOP_GPUS[laptopIdx % LAPTOP_GPUS.length];

        const isGaming = modelName.match(/ROG|TUF|Nitro|Predator|Alienware|LOQ|Legion|Omen|G15|G16|Strix|Helios/i);
        const basePrice = isApple
          ? rnd(99900, 219900, 1000)
          : isGaming
          ? rnd(65000, 180000, 500)
          : rnd(32000, 95000, 500);

        const originalPrice = Math.round(basePrice * (1 + rnd(5, 20) / 100) / 500) * 500;
        const storage = isApple ? (ram === 8 ? 256 : 512) : rnd(256, 1024, 256);
        const displaySize = modelName.includes('14') ? 14 : modelName.includes('16') ? 16 : modelName.includes('17') ? 17 : 15.6;
        const refreshRate = isGaming ? rnd(1, 4) * 60 : 60;
        const panel = isApple ? 'Liquid Retina' : DISPLAY_PANELS[laptopIdx % 4];
        const weight = isApple ? 1.24 + Math.random() * 0.5 : 1.4 + Math.random() * 1.1;
        const batteryLife = isApple ? rnd(16, 22) : isGaming ? rnd(4, 8) : rnd(7, 14);

        const slug = `${slugify(brandDef.slug + '-' + modelName)}-${ram}gb-${storage}gb-${laptopIdx}`;

        laptopProducts.push({
          name: `${brand.name} ${modelName} (${ram}GB)`,
          slug,
          description: laptopDesc(modelName, brand.name, processor, ram, gpu),
          price: basePrice,
          originalPrice,
          imageUrl: pick(LAPTOP_IMAGES, laptopIdx),
          images: [pick(LAPTOP_IMAGES, laptopIdx), pick(LAPTOP_IMAGES, laptopIdx + 1)],
          rating: rating(),
          reviewCount: rnd(50, 2000),
          viewCount: rnd(500, 25000),
          isFeatured: laptopIdx % 12 === 0,
          categoryId: laptopCat.id,
          brandId: brand.id,
          specifications: {
            processor,
            ram,
            ramType: isApple ? 'Unified Memory' : ram >= 16 ? 'LPDDR5' : 'DDR4',
            storage,
            storageType: 'SSD',
            display: {
              size: displaySize,
              resolution: displaySize >= 16 ? '2560x1600' : '1920x1080',
              refreshRate,
              panelType: panel,
            },
            gpu,
            battery: {
              capacity: isApple ? 52.6 : rnd(42, 90),
              unit: 'Wh',
              life: batteryLife,
            },
            weight: Math.round(weight * 100) / 100,
            os: isApple ? 'macOS Sonoma' : 'Windows 11 Home',
            ports: isApple
              ? ['Thunderbolt 4 x2', 'MagSafe 3', '3.5mm Jack']
              : ['USB-A 3.2 x2', 'USB-C 3.2', 'HDMI 2.0', '3.5mm Jack', 'SD Card Reader'],
            gaming: !!isGaming,
          },
        });

        laptopIdx++;
      }
    }
  }

  // batch insert
  let laptopCount = 0;
  for (const p of laptopProducts as any[]) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { price: p.price, imageUrl: p.imageUrl, images: p.images },
      create: p,
    });
    laptopCount++;
  }
  console.log(`  ✓ ${laptopCount} laptops`);

  // ─────────────────────────────────────────────────────────
  // PHONES  (~380 products)
  // ─────────────────────────────────────────────────────────
  console.log('  Generating phones...');

  const phoneProducts: object[] = [];
  let phoneIdx = 0;

  for (const brandDef of PHONE_BRANDS) {
    const brand = brandMap[brandDef.slug];
    for (const modelName of brandDef.names) {
      const isApple = brandDef.slug === 'apple';
      const ramVariants = isApple ? [6, 8] : [4, 6, 8, 12];

      for (const ram of ramVariants) {
        const processor = isApple
          ? (modelName.includes('Pro') ? 'Apple A17 Pro' : modelName.includes('15') ? 'Apple A16 Bionic' : 'Apple A15 Bionic')
          : PHONE_PROCESSORS[phoneIdx % (PHONE_PROCESSORS.length - 3)];

        const isflagship = modelName.match(/Ultra|Pro|S24|S23|Fold|Flip|Open|OnePlus 1[12]|Pixel [78] Pro|Xperia 1/i);
        const mainCamera = isApple
          ? (modelName.includes('Pro') ? 48 : 12)
          : isflagship ? rnd(5, 7) * 10 : rnd(4, 6) * 10;
        const storage = isApple ? (ram === 6 ? 128 : 256) : [128, 256][phoneIdx % 2];
        const battery = isApple ? 3877 : isflagship ? rnd(4400, 5000, 100) : rnd(4000, 5000, 100);

        const basePrice = isApple
          ? rnd(59900, 134900, 1000)
          : isflagship
          ? rnd(45000, 159900, 500)
          : rnd(10000, 44000, 500);
        const originalPrice = Math.round(basePrice * (1 + rnd(5, 15) / 100) / 500) * 500;

        const slug = `${slugify(brandDef.slug + '-' + modelName)}-${ram}gb-${storage}gb-${phoneIdx}`;

        phoneProducts.push({
          name: `${brand.name} ${modelName} (${ram}GB)`,
          slug,
          description: phoneDesc(modelName, brand.name, processor, ram, mainCamera),
          price: basePrice,
          originalPrice,
          imageUrl: pick(PHONE_IMAGES, phoneIdx),
          images: [pick(PHONE_IMAGES, phoneIdx), pick(PHONE_IMAGES, phoneIdx + 1)],
          rating: rating(),
          reviewCount: rnd(80, 5000),
          viewCount: rnd(1000, 40000),
          isFeatured: phoneIdx % 10 === 0,
          categoryId: phoneCat.id,
          brandId: brand.id,
          specifications: {
            processor,
            ram,
            storage,
            display: {
              size: isApple ? 6.1 : rnd(60, 68) / 10,
              resolution: '2400x1080',
              refreshRate: isApple || isflagship ? 120 : 90,
              type: isApple ? 'Super Retina XDR OLED' : 'AMOLED',
            },
            camera: {
              main: mainCamera,
              front: isApple ? 12 : 16,
              ultraWide: isApple ? 12 : mainCamera >= 50 ? 12 : null,
              telephoto: isApple && modelName.includes('Pro') ? 12 : null,
            },
            battery: {
              capacity: battery,
              charging: isApple ? 20 : isflagship ? rnd(50, 100, 5) : rnd(18, 45, 9),
            },
            os: isApple ? `iOS ${modelName.includes('15') ? 17 : 16}` : 'Android 14',
            network: ram >= 6 || isApple ? ['5G', 'Wi-Fi 6', 'Bluetooth 5.3'] : ['4G LTE', 'Wi-Fi 5', 'Bluetooth 5.1'],
          },
        });

        phoneIdx++;
      }
    }
  }

  let phoneCount = 0;
  for (const p of phoneProducts as any[]) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { price: p.price, imageUrl: p.imageUrl, images: p.images },
      create: p,
    });
    phoneCount++;
  }
  console.log(`  ✓ ${phoneCount} phones`);

  // ─────────────────────────────────────────────────────────
  // HEADPHONES  (~320 products)
  // ─────────────────────────────────────────────────────────
  console.log('  Generating headphones...');

  const headphoneList: object[] = [];
  let hpIdx = 0;

  // Sony, Samsung, Apple (already in brandMap)
  for (const brandDef of HEADPHONE_BRANDS) {
    const brand = brandMap[brandDef.slug];
    for (const modelName of brandDef.names) {
      const isApple = brandDef.slug === 'apple';
      const isTWS = modelName.match(/Buds|Pods|WF-|Airdopes|Shots|Air Buds/i) ? 'TWS' : 'Over-Ear';
      const hasAnc = modelName.match(/Pro|XM4|XM5|1000X|QuietComfort|QC|ANC|NC|Max/i) ? true : false;
      const battery = isTWS === 'TWS' ? rnd(20, 36) : rnd(20, 40);

      const basePrice = isApple
        ? (modelName.includes('Max') ? 59900 : modelName.includes('Pro') ? 24900 : 14900)
        : brandDef.slug === 'sony' && modelName.includes('1000XM')
        ? rnd(22000, 35000, 500)
        : rnd(3000, 20000, 500);
      const originalPrice = Math.round(basePrice * (1 + rnd(5, 25) / 100) / 500) * 500;

      const slug = `${slugify(brandDef.slug + '-' + modelName)}-${hpIdx}`;

      headphoneList.push({
        name: `${brand.name} ${modelName}`,
        slug,
        description: headphoneDesc(modelName, brand.name, isTWS, hasAnc, battery),
        price: basePrice,
        originalPrice,
        imageUrl: pick(HEADPHONE_IMAGES, hpIdx),
        images: [pick(HEADPHONE_IMAGES, hpIdx), pick(HEADPHONE_IMAGES, hpIdx + 1)],
        rating: rating(),
        reviewCount: rnd(100, 6000),
        viewCount: rnd(1000, 35000),
        isFeatured: hpIdx % 8 === 0,
        categoryId: headphoneCat.id,
        brandId: brand.id,
        specifications: {
          type: isTWS,
          connectivity: 'Bluetooth 5.3',
          anc: hasAnc,
          driver: isTWS === 'TWS' ? '10mm dynamic' : '40mm dynamic',
          frequency: '20Hz – 20kHz',
          battery: {
            earbuds: isTWS === 'TWS' ? rnd(6, 10) : null,
            case: isTWS === 'TWS' ? rnd(24, 30) : null,
            total: battery,
            chargingTime: 1.5,
          },
          microphone: true,
          ipRating: isTWS === 'TWS' ? 'IPX4' : null,
          weight: isTWS === 'TWS' ? rnd(4, 7) : rnd(200, 350),
          foldable: isTWS !== 'TWS',
          multiDevice: brandDef.slug !== 'boat',
        },
      });
      hpIdx++;
    }
  }

  // Extra headphone brands
  for (const extra of EXTRA_HP_BRANDS) {
    let brand = brandMap[extra.slug];
    if (!brand) {
      brand = await prisma.brand.upsert({
        where: { slug: extra.slug },
        update: {},
        create: { name: extra.name, slug: extra.slug },
      });
      brandMap[extra.slug] = brand;
    }

    const models = EXTRA_HP_MODELS[extra.slug] ?? [];
    for (const modelName of models) {
      const isTWS = modelName.match(/Buds|Airdopes|Shots|Air Buds|Wave|Free|Tune.*Earb|WF|Earbuds/i) ? 'TWS' : 'Over-Ear';
      const hasAnc = modelName.match(/ANC|NC|Quiet|XM|Pro|Momentum 4|Plus|Ultra/i) ? true : false;
      const battery = isTWS === 'TWS' ? rnd(18, 36) : rnd(20, 50);

      const priceMap: Record<string, number> = {
        bose: rnd(15000, 35000, 500),
        sennheiser: rnd(12000, 30000, 500),
        jbl: rnd(2500, 15000, 500),
        boat: rnd(800, 5000, 200),
        noise: rnd(800, 4000, 200),
        realme: rnd(700, 3500, 200),
      };
      const basePrice = priceMap[extra.slug] ?? rnd(1000, 10000, 500);
      const originalPrice = Math.round(basePrice * (1 + rnd(5, 30) / 100) / 200) * 200;

      const slug = `${slugify(extra.slug + '-' + modelName)}-${hpIdx}`;

      headphoneList.push({
        name: `${extra.name} ${modelName}`,
        slug,
        description: headphoneDesc(modelName, extra.name, isTWS, hasAnc, battery),
        price: basePrice,
        originalPrice,
        imageUrl: pick(HEADPHONE_IMAGES, hpIdx),
        images: [pick(HEADPHONE_IMAGES, hpIdx), pick(HEADPHONE_IMAGES, hpIdx + 1)],
        rating: rating(),
        reviewCount: rnd(50, 8000),
        viewCount: rnd(500, 30000),
        isFeatured: hpIdx % 9 === 0,
        categoryId: headphoneCat.id,
        brandId: brand.id,
        specifications: {
          type: isTWS,
          connectivity: 'Bluetooth 5.3',
          anc: hasAnc,
          driver: isTWS === 'TWS' ? '10mm dynamic' : '40mm dynamic',
          frequency: '20Hz – 20kHz',
          battery: {
            earbuds: isTWS === 'TWS' ? rnd(6, 10) : null,
            case: isTWS === 'TWS' ? rnd(20, 30) : null,
            total: battery,
            chargingTime: isTWS === 'TWS' ? 1 : 2,
          },
          microphone: true,
          ipRating: isTWS === 'TWS' ? 'IPX4' : null,
          weight: isTWS === 'TWS' ? rnd(4, 8) : rnd(180, 320),
          foldable: isTWS !== 'TWS',
          multiDevice: extra.slug !== 'boat',
        },
      });
      hpIdx++;
    }
  }

  let hpCount = 0;
  for (const p of headphoneList as any[]) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { price: p.price, imageUrl: p.imageUrl, images: p.images },
      create: p,
    });
    hpCount++;
  }
  console.log(`  ✓ ${hpCount} headphones`);

  // ── Users ─────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('Admin@SmartShop123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartshop.dev' },
    update: {},
    create: {
      email: 'admin@smartshop.dev',
      password: adminPwd,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const demoPwd = await bcrypt.hash('Demo@SmartShop123', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@smartshop.dev' },
    update: {},
    create: {
      email: 'demo@smartshop.dev',
      password: demoPwd,
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER',
    },
  });
  console.log(`✓ Users: ${admin.email}, ${demo.email}`);

  const total = laptopCount + phoneCount + hpCount;
  console.log(`\n✅ Seeding complete! ${total} products total`);
  console.log(`   📦 Laptops:    ${laptopCount}`);
  console.log(`   📱 Phones:     ${phoneCount}`);
  console.log(`   🎧 Headphones: ${hpCount}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
