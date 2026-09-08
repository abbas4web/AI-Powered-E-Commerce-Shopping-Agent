import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertCategory(data: { name: string; slug: string; description: string }) {
  return prisma.category.upsert({
    where: { slug: data.slug },
    update: {},
    create: data,
  });
}

async function upsertBrand(data: { name: string; slug: string; website?: string }) {
  return prisma.brand.upsert({
    where: { slug: data.slug },
    update: {},
    create: data,
  });
}

async function upsertProduct(data: {
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  isFeatured?: boolean;
  categoryId: string;
  brandId: string;
  specifications: object;
}) {
  return prisma.product.upsert({
    where: { slug: data.slug },
    update: { ...data },
    create: { ...data },
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Categories ──────────────────────────────────────────────────────────────
  const [catLaptops, catPhones, catHeadphones, catPowerBanks, catTablets, catMonitors, catCameras, catTVs] =
    await Promise.all([
      upsertCategory({ name: 'Laptops', slug: 'laptops', description: 'Portable computers' }),
      upsertCategory({ name: 'Smartphones', slug: 'smartphones', description: 'Mobile phones' }),
      upsertCategory({ name: 'Headphones', slug: 'headphones', description: 'Audio headphones & earbuds' }),
      upsertCategory({ name: 'Power Banks', slug: 'power-banks', description: 'Portable chargers' }),
      upsertCategory({ name: 'Tablets', slug: 'tablets', description: 'Tablet computers' }),
      upsertCategory({ name: 'Monitors', slug: 'monitors', description: 'Desktop monitors' }),
      upsertCategory({ name: 'Cameras', slug: 'cameras', description: 'Digital cameras' }),
      upsertCategory({ name: 'Televisions', slug: 'televisions', description: 'Smart TVs' }),
    ]);
  console.log('✓ Categories seeded');

  // ── Brands ───────────────────────────────────────────────────────────────────
  const brands = await Promise.all([
    upsertBrand({ name: 'Apple', slug: 'apple', website: 'https://apple.com' }),
    upsertBrand({ name: 'Samsung', slug: 'samsung', website: 'https://samsung.com' }),
    upsertBrand({ name: 'ASUS', slug: 'asus', website: 'https://asus.com' }),
    upsertBrand({ name: 'Dell', slug: 'dell', website: 'https://dell.com' }),
    upsertBrand({ name: 'Lenovo', slug: 'lenovo', website: 'https://lenovo.com' }),
    upsertBrand({ name: 'HP', slug: 'hp', website: 'https://hp.com' }),
    upsertBrand({ name: 'Acer', slug: 'acer', website: 'https://acer.com' }),
    upsertBrand({ name: 'OnePlus', slug: 'oneplus', website: 'https://oneplus.com' }),
    upsertBrand({ name: 'Google', slug: 'google', website: 'https://store.google.com' }),
    upsertBrand({ name: 'Sony', slug: 'sony', website: 'https://sony.com' }),
    upsertBrand({ name: 'Xiaomi', slug: 'xiaomi', website: 'https://mi.com' }),
    upsertBrand({ name: 'realme', slug: 'realme', website: 'https://realme.com' }),
    upsertBrand({ name: 'boAt', slug: 'boat', website: 'https://boat-lifestyle.com' }),
    upsertBrand({ name: 'Noise', slug: 'noise', website: 'https://gonoise.com' }),
    upsertBrand({ name: 'Anker', slug: 'anker', website: 'https://anker.com' }),
    upsertBrand({ name: 'MSI', slug: 'msi', website: 'https://msi.com' }),
    upsertBrand({ name: 'Microsoft', slug: 'microsoft', website: 'https://microsoft.com' }),
    upsertBrand({ name: 'Motorola', slug: 'motorola', website: 'https://motorola.com' }),
  ]);

  const B: Record<string, string> = {};
  for (const b of brands) B[b.slug] = b.id;
  console.log('✓ Brands seeded');

  // ══════════════════════════════════════════════════════════════════════════
  // LAPTOPS
  // ══════════════════════════════════════════════════════════════════════════
  const laptops = [
    // Apple
    { slug: 'apple-macbook-air-m2-2023', name: 'Apple MacBook Air M2 (2023)', brand: 'apple', price: 114900, originalPrice: 119900, rating: 4.8, reviewCount: 3210, viewCount: 42000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600',
      description: 'Apple MacBook Air M2 features the blazing-fast M2 chip, 13.6-inch Liquid Retina display, up to 18 hours of battery life, and a fanless silent design. Perfect for developers, students, and creators.',
      specifications: { processor: 'Apple M2 8-core CPU', ram: 8, ramType: 'Unified Memory', storage: 256, storageType: 'SSD', display: { size: 13.6, resolution: '2560x1664', refreshRate: 60, panelType: 'Liquid Retina' }, battery: { capacity: 52.6, unit: 'Wh', life: 18 }, weight: 1.24, os: 'macOS Sonoma', ports: ['MagSafe 3', 'Thunderbolt 4 x2', '3.5mm Jack'] } },

    { slug: 'apple-macbook-air-m3-2024', name: 'Apple MacBook Air M3 (2024)', brand: 'apple', price: 134900, originalPrice: 139900, rating: 4.9, reviewCount: 1840, viewCount: 28000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
      description: 'MacBook Air M3 is the most advanced MacBook Air ever. M3 chip, up to 18-hour battery, support for two external displays. Perfect for power users on the go.',
      specifications: { processor: 'Apple M3 8-core CPU', ram: 8, ramType: 'Unified Memory', storage: 256, storageType: 'SSD', display: { size: 13.6, resolution: '2560x1664', refreshRate: 60, panelType: 'Liquid Retina' }, battery: { capacity: 52.6, unit: 'Wh', life: 18 }, weight: 1.24, os: 'macOS Sonoma', ports: ['MagSafe 3', 'Thunderbolt 4 x2', '3.5mm Jack'] } },

    { slug: 'apple-macbook-pro-14-m3-2024', name: 'Apple MacBook Pro 14" M3 Pro', brand: 'apple', price: 199900, originalPrice: 209900, rating: 4.9, reviewCount: 980, viewCount: 18000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600',
      description: 'MacBook Pro 14-inch with M3 Pro chip, Liquid Retina XDR display, ProMotion 120Hz, up to 22 hours battery. The ultimate professional laptop for developers and creators.',
      specifications: { processor: 'Apple M3 Pro 11-core CPU', ram: 18, ramType: 'Unified Memory', storage: 512, storageType: 'SSD', display: { size: 14.2, resolution: '3024x1964', refreshRate: 120, panelType: 'Liquid Retina XDR' }, battery: { capacity: 72, unit: 'Wh', life: 22 }, weight: 1.61, os: 'macOS Sonoma', ports: ['MagSafe 3', 'Thunderbolt 4 x3', 'HDMI 2.1', 'SD Card'] } },

    { slug: 'apple-macbook-air-15-m3-2024', name: 'Apple MacBook Air 15" M3', brand: 'apple', price: 154900, originalPrice: 164900, rating: 4.9, reviewCount: 1020, viewCount: 18000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=600',
      description: "MacBook Air 15-inch M3 — world's best 15-inch laptop. M3 chip, 15.3-inch Liquid Retina display, 18-hour battery, fanless design. Ideal for multitasking professionals.",
      specifications: { processor: 'Apple M3 8-core CPU', ram: 8, ramType: 'Unified Memory', storage: 256, storageType: 'SSD', display: { size: 15.3, resolution: '2880x1864', refreshRate: 60, panelType: 'Liquid Retina' }, battery: { capacity: 66.5, unit: 'Wh', life: 18 }, weight: 1.51, os: 'macOS Sonoma', ports: ['MagSafe 3', 'Thunderbolt 4 x2', '3.5mm Jack'] } },

    // Dell
    { slug: 'dell-xps-15-9530-2023', name: 'Dell XPS 15 (9530)', brand: 'dell', price: 169990, originalPrice: 179990, rating: 4.6, reviewCount: 720, viewCount: 12000,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600',
      description: 'Dell XPS 15 features 15.6-inch OLED 3.5K display, 13th-gen Intel Core i7, NVIDIA RTX 4060, and CNC aluminum chassis. Built for creative professionals.',
      specifications: { processor: 'Intel Core i7-13700H', ram: 16, ramType: 'DDR5', storage: 512, storageType: 'SSD NVMe', display: { size: 15.6, resolution: '3456x2160', refreshRate: 60, panelType: 'OLED' }, battery: { capacity: 86, unit: 'Wh', life: 10 }, weight: 1.86, os: 'Windows 11 Home', ports: ['Thunderbolt 4 x2', 'USB-C 3.2', 'SD Card'], gpu: 'NVIDIA RTX 4060 8GB' } },

    { slug: 'dell-inspiron-15-3530-2024', name: 'Dell Inspiron 15 3530 (2024)', brand: 'dell', price: 52990, originalPrice: 59990, rating: 4.2, reviewCount: 1420, viewCount: 18000,
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
      description: 'Dell Inspiron 15 3530 powered by Intel Core i5-1335U, 16GB RAM, 512GB SSD. A reliable everyday laptop with Full HD display and all-day battery.',
      specifications: { processor: 'Intel Core i5-1335U', ram: 16, ramType: 'DDR4', storage: 512, storageType: 'SSD', display: { size: 15.6, resolution: '1920x1080', refreshRate: 120, panelType: 'WVA' }, battery: { capacity: 54, unit: 'Wh', life: 9 }, weight: 1.76, os: 'Windows 11 Home', ports: ['USB-A 3.0 x2', 'USB-C 3.2', 'HDMI 1.4', 'SD Card'] } },

    { slug: 'dell-g15-5530-gaming', name: 'Dell G15 Gaming (5530)', brand: 'dell', price: 89990, originalPrice: 99990, rating: 4.4, reviewCount: 890, viewCount: 14000,
      imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600',
      description: 'Dell G15 gaming laptop with Intel Core i7-13650HX, NVIDIA RTX 4060, 165Hz FHD display, and excellent thermal management for sustained gaming.',
      specifications: { processor: 'Intel Core i7-13650HX', ram: 16, ramType: 'DDR5', storage: 512, storageType: 'SSD NVMe', display: { size: 15.6, resolution: '1920x1080', refreshRate: 165, panelType: 'IPS' }, battery: { capacity: 86, unit: 'Wh', life: 6 }, weight: 2.5, os: 'Windows 11 Home', ports: ['USB-A 3.2 x3', 'USB-C 3.2', 'HDMI 2.1', 'RJ45'], gpu: 'NVIDIA RTX 4060 8GB' } },

    { slug: 'dell-vostro-15-3530-2024', name: 'Dell Vostro 15 3530 (2024)', brand: 'dell', price: 48990, originalPrice: 56990, rating: 4.1, reviewCount: 980, viewCount: 13000,
      imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600',
      description: 'Dell Vostro 15 3530 with Intel Core i5-1335U, 8GB RAM, 512GB SSD. Business laptop with ProSupport and security features.',
      specifications: { processor: 'Intel Core i5-1335U', ram: 8, ramType: 'DDR4', storage: 512, storageType: 'SSD', display: { size: 15.6, resolution: '1920x1080', refreshRate: 120, panelType: 'WVA' }, battery: { capacity: 54, unit: 'Wh', life: 8 }, weight: 1.73, os: 'Windows 11 Pro', ports: ['USB-A 3.0 x2', 'USB-C 3.2', 'HDMI 1.4'] } },

    // Lenovo
    { slug: 'lenovo-ideapad-slim-5-16-2024', name: 'Lenovo IdeaPad Slim 5 16" (2024)', brand: 'lenovo', price: 75990, originalPrice: 84990, rating: 4.4, reviewCount: 521, viewCount: 7100, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600',
      description: 'Lenovo IdeaPad Slim 5 16-inch with Intel Core i5-12450H, Intel Arc GPU, 16GB LPDDR5, 512GB SSD, and 12-hour battery. Excellent battery life for Flutter developers.',
      specifications: { processor: 'Intel Core i5-12450H', ram: 16, ramType: 'LPDDR5', storage: 512, storageType: 'SSD', display: { size: 15.6, resolution: '1920x1080', refreshRate: 60, panelType: 'IPS' }, battery: { capacity: 60, unit: 'Wh', life: 12 }, weight: 1.65, os: 'Windows 11 Home', ports: ['USB-A 3.2 x2', 'USB-C 3.2 x2', 'HDMI 2.0'] } },

    { slug: 'lenovo-thinkpad-x1-carbon-gen11', name: 'Lenovo ThinkPad X1 Carbon Gen 11', brand: 'lenovo', price: 159990, originalPrice: 174990, rating: 4.7, reviewCount: 420, viewCount: 8000,
      imageUrl: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=600',
      description: 'ThinkPad X1 Carbon Gen 11: the legendary ultralight business laptop. 1.12kg, Intel Core i7-1365U, 14-inch 2.8K OLED, MIL-SPEC durability, all-day battery.',
      specifications: { processor: 'Intel Core i7-1365U', ram: 16, ramType: 'LPDDR5', storage: 512, storageType: 'SSD', display: { size: 14, resolution: '2880x1800', refreshRate: 60, panelType: 'OLED' }, battery: { capacity: 57, unit: 'Wh', life: 15 }, weight: 1.12, os: 'Windows 11 Pro', ports: ['Thunderbolt 4 x2', 'USB-A 3.2 x2', 'HDMI 2.0'] } },

    { slug: 'lenovo-yoga-9i-2024', name: 'Lenovo Yoga 9i (2024)', brand: 'lenovo', price: 129990, originalPrice: 139990, rating: 4.6, reviewCount: 310, viewCount: 6000,
      imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
      description: 'Lenovo Yoga 9i 2-in-1 with Intel Core Ultra 7, 14-inch OLED 2.8K 120Hz display, rotating soundbar, and premium build. The best 2-in-1 laptop in its class.',
      specifications: { processor: 'Intel Core Ultra 7 155H', ram: 16, ramType: 'LPDDR5X', storage: 1000, storageType: 'SSD', display: { size: 14, resolution: '2880x1800', refreshRate: 120, panelType: 'OLED' }, battery: { capacity: 75, unit: 'Wh', life: 12 }, weight: 1.4, os: 'Windows 11 Home', ports: ['Thunderbolt 4 x2', 'USB-A 3.2', 'HDMI 2.1'] } },

    { slug: 'lenovo-legion-5i-gen9-2024', name: 'Lenovo Legion 5i Gen 9 (2024)', brand: 'lenovo', price: 99990, originalPrice: 109990, rating: 4.5, reviewCount: 680, viewCount: 11000,
      imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
      description: 'Lenovo Legion 5i Gen 9: Intel Core i7-14650HX, NVIDIA RTX 4060, 165Hz FHD display, Legion ColdFront cooling. Gaming laptop with professional build quality.',
      specifications: { processor: 'Intel Core i7-14650HX', ram: 16, ramType: 'DDR5', storage: 512, storageType: 'SSD NVMe', display: { size: 15.6, resolution: '1920x1080', refreshRate: 165, panelType: 'IPS' }, battery: { capacity: 80, unit: 'Wh', life: 7 }, weight: 2.4, os: 'Windows 11 Home', ports: ['USB-C 3.2 x2', 'USB-A 3.2 x3', 'HDMI 2.1', 'RJ45'], gpu: 'NVIDIA RTX 4060 8GB' } },

    // ASUS
    { slug: 'asus-vivobook-16-2024', name: 'ASUS Vivobook 16 (2024)', brand: 'asus', price: 72990, originalPrice: 82990, rating: 4.3, reviewCount: 412, viewCount: 5800, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=600',
      description: 'ASUS Vivobook 16 with AMD Ryzen 7 7730U, 16GB DDR4, 512GB SSD, 16-inch FHD IPS display. Powerful all-rounder for development and light gaming.',
      specifications: { processor: 'AMD Ryzen 7 7730U', ram: 16, ramType: 'DDR4', storage: 512, storageType: 'SSD', display: { size: 16, resolution: '1920x1200', refreshRate: 60, panelType: 'IPS' }, battery: { capacity: 50, unit: 'Wh', life: 8 }, weight: 1.88, os: 'Windows 11 Home', ports: ['USB-A 3.2 x2', 'USB-C 3.2', 'HDMI 1.4', '3.5mm Jack', 'SD Card'] } },

    { slug: 'asus-zenbook-14-oled-2024', name: 'ASUS Zenbook 14 OLED (2024)', brand: 'asus', price: 89990, originalPrice: 99990, rating: 4.6, reviewCount: 580, viewCount: 9500, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600',
      description: 'ASUS Zenbook 14 OLED with Intel Core Ultra 7, 14-inch 2.8K 120Hz OLED display, 32GB RAM, and 1TB SSD. Ultra-portable powerhouse for creators.',
      specifications: { processor: 'Intel Core Ultra 7 155H', ram: 32, ramType: 'LPDDR5X', storage: 1000, storageType: 'SSD', display: { size: 14, resolution: '2880x1800', refreshRate: 120, panelType: 'OLED' }, battery: { capacity: 75, unit: 'Wh', life: 14 }, weight: 1.2, os: 'Windows 11 Home', ports: ['Thunderbolt 4 x2', 'USB-A 3.2', 'HDMI 2.1'] } },

    { slug: 'asus-rog-strix-g16-2024', name: 'ASUS ROG Strix G16 (2024)', brand: 'asus', price: 119990, originalPrice: 129990, rating: 4.6, reviewCount: 480, viewCount: 9000,
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600',
      description: 'ASUS ROG Strix G16 gaming laptop with Intel Core i9-14900HX, NVIDIA RTX 4070, 240Hz QHD display, MUX Switch, and ROG Intelligent Cooling.',
      specifications: { processor: 'Intel Core i9-14900HX', ram: 16, ramType: 'DDR5', storage: 1000, storageType: 'SSD NVMe', display: { size: 16, resolution: '2560x1600', refreshRate: 240, panelType: 'IPS' }, battery: { capacity: 90, unit: 'Wh', life: 5 }, weight: 2.5, os: 'Windows 11 Home', ports: ['USB-C 4.0', 'USB-A 3.2 x3', 'HDMI 2.1', 'RJ45'], gpu: 'NVIDIA RTX 4070 8GB' } },

    { slug: 'asus-vivobook-15-x1502za', name: 'ASUS Vivobook 15 X1502 (2023)', brand: 'asus', price: 54990, originalPrice: 62990, rating: 4.2, reviewCount: 820, viewCount: 11000,
      imageUrl: 'https://images.unsplash.com/photo-1448932223592-d1fc686e76ea?w=600',
      description: 'ASUS Vivobook 15 with Intel Core i5-12500H, 16GB DDR4, 512GB SSD, FHD IPS 60Hz display. Budget-friendly and capable laptop for everyday computing.',
      specifications: { processor: 'Intel Core i5-12500H', ram: 16, ramType: 'DDR4', storage: 512, storageType: 'SSD', display: { size: 15.6, resolution: '1920x1080', refreshRate: 60, panelType: 'IPS' }, battery: { capacity: 42, unit: 'Wh', life: 7 }, weight: 1.7, os: 'Windows 11 Home', ports: ['USB-A 3.2 x2', 'USB-C 3.2', 'HDMI 1.4', 'SD Card'] } },

    // HP
    { slug: 'hp-envy-x360-14-2024', name: 'HP Envy x360 14 (2024)', brand: 'hp', price: 99990, originalPrice: 112990, rating: 4.5, reviewCount: 380, viewCount: 7200,
      imageUrl: 'https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?w=600',
      description: 'HP Envy x360 14 with AMD Ryzen 7 8840U, 14-inch 2.8K OLED 120Hz touchscreen, 16GB RAM, 1TB SSD, and impressive battery life. 2-in-1 for professionals.',
      specifications: { processor: 'AMD Ryzen 7 8840U', ram: 16, ramType: 'LPDDR5X', storage: 1000, storageType: 'SSD', display: { size: 14, resolution: '2880x1800', refreshRate: 120, panelType: 'OLED Touch' }, battery: { capacity: 65, unit: 'Wh', life: 14 }, weight: 1.4, os: 'Windows 11 Home', ports: ['USB-C 4.0 x2', 'USB-A 3.2', 'HDMI 2.1'] } },

    { slug: 'hp-pavilion-15-eg3-2024', name: 'HP Pavilion 15 (eg3, 2024)', brand: 'hp', price: 61990, originalPrice: 70990, rating: 4.1, reviewCount: 640, viewCount: 9000,
      imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600',
      description: 'HP Pavilion 15 with Intel Core i5-1335U, 16GB RAM, 512GB SSD, and micro-edge FHD display. Great everyday laptop for students and home users.',
      specifications: { processor: 'Intel Core i5-1335U', ram: 16, ramType: 'DDR4', storage: 512, storageType: 'SSD', display: { size: 15.6, resolution: '1920x1080', refreshRate: 60, panelType: 'IPS' }, battery: { capacity: 41, unit: 'Wh', life: 8 }, weight: 1.75, os: 'Windows 11 Home', ports: ['USB-A 3.0 x2', 'USB-C 3.2', 'HDMI 1.4', 'SD Card'] } },

    { slug: 'hp-omen-16-gaming-2024', name: 'HP Omen 16 Gaming (2024)', brand: 'hp', price: 119990, originalPrice: 134990, rating: 4.5, reviewCount: 290, viewCount: 5500,
      imageUrl: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=600',
      description: 'HP Omen 16 gaming laptop with Intel Core i7-14700HX, NVIDIA RTX 4070, 165Hz QHD display, OMEN Tempest cooling, and customizable RGB keyboard.',
      specifications: { processor: 'Intel Core i7-14700HX', ram: 16, ramType: 'DDR5', storage: 1000, storageType: 'SSD NVMe', display: { size: 16.1, resolution: '2560x1440', refreshRate: 165, panelType: 'IPS' }, battery: { capacity: 83, unit: 'Wh', life: 6 }, weight: 2.3, os: 'Windows 11 Home', ports: ['USB-C 4.0', 'USB-A 3.2 x3', 'HDMI 2.1', 'RJ45'], gpu: 'NVIDIA RTX 4070 8GB' } },

    // Acer
    { slug: 'acer-aspire-5-a515-2024', name: 'Acer Aspire 5 (A515, 2024)', brand: 'acer', price: 49990, originalPrice: 57990, rating: 4.1, reviewCount: 1120, viewCount: 15000,
      imageUrl: 'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?w=600',
      description: 'Acer Aspire 5 with AMD Ryzen 5 7530U, 16GB RAM, 512GB SSD, 15.6-inch FHD IPS. Value-for-money laptop for students and everyday computing.',
      specifications: { processor: 'AMD Ryzen 5 7530U', ram: 16, ramType: 'DDR4', storage: 512, storageType: 'SSD', display: { size: 15.6, resolution: '1920x1080', refreshRate: 60, panelType: 'IPS' }, battery: { capacity: 50, unit: 'Wh', life: 8 }, weight: 1.8, os: 'Windows 11 Home', ports: ['USB-A 3.2 x2', 'USB-C 3.2', 'HDMI 2.0', 'SD Card'] } },

    { slug: 'acer-swift-go-14-2024', name: 'Acer Swift Go 14 (2024)', brand: 'acer', price: 79990, originalPrice: 89990, rating: 4.4, reviewCount: 360, viewCount: 6500,
      imageUrl: 'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=600',
      description: 'Acer Swift Go 14 with Intel Core Ultra 5, 14-inch 2.8K OLED display, 16GB RAM, 512GB SSD, and excellent battery life in a premium aluminium chassis.',
      specifications: { processor: 'Intel Core Ultra 5 125U', ram: 16, ramType: 'LPDDR5', storage: 512, storageType: 'SSD', display: { size: 14, resolution: '2880x1800', refreshRate: 90, panelType: 'OLED' }, battery: { capacity: 65, unit: 'Wh', life: 12 }, weight: 1.35, os: 'Windows 11 Home', ports: ['Thunderbolt 4', 'USB-C 3.2', 'USB-A 3.2 x2', 'HDMI 2.0'] } },

    { slug: 'acer-nitro-16-gaming-2024', name: 'Acer Nitro 16 Gaming (2024)', brand: 'acer', price: 84990, originalPrice: 94990, rating: 4.3, reviewCount: 520, viewCount: 8500,
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600',
      description: 'Acer Nitro 16 with AMD Ryzen 7 7745HX, NVIDIA RTX 4060, 165Hz QHD display, and Acer CoolBoost cooling. A capable gaming laptop at a great price.',
      specifications: { processor: 'AMD Ryzen 7 7745HX', ram: 16, ramType: 'DDR5', storage: 512, storageType: 'SSD NVMe', display: { size: 16, resolution: '2560x1600', refreshRate: 165, panelType: 'IPS' }, battery: { capacity: 90, unit: 'Wh', life: 6 }, weight: 2.5, os: 'Windows 11 Home', ports: ['USB-C 3.2', 'USB-A 3.2 x3', 'HDMI 2.1', 'RJ45'], gpu: 'NVIDIA RTX 4060 8GB' } },

    // MSI
    { slug: 'msi-modern-15-2024', name: 'MSI Modern 15 (2024)', brand: 'msi', price: 57990, originalPrice: 64990, rating: 4.2, reviewCount: 280, viewCount: 4500,
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
      description: 'MSI Modern 15 with Intel Core i5-1335U, 16GB RAM, 512GB NVMe SSD, FHD IPS display. Thin, light, and stylish laptop for business and students.',
      specifications: { processor: 'Intel Core i5-1335U', ram: 16, ramType: 'DDR4', storage: 512, storageType: 'SSD', display: { size: 15.6, resolution: '1920x1080', refreshRate: 60, panelType: 'IPS' }, battery: { capacity: 52, unit: 'Wh', life: 9 }, weight: 1.6, os: 'Windows 11 Home', ports: ['USB-C 3.2', 'USB-A 3.2 x2', 'HDMI 2.0', 'SD Card'] } },

    { slug: 'msi-titan-gt77-2024', name: 'MSI Titan GT77 HX (2024)', brand: 'msi', price: 249990, originalPrice: 274990, rating: 4.7, reviewCount: 140, viewCount: 4200,
      imageUrl: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600',
      description: 'MSI Titan GT77 with Intel Core i9-14900HX, NVIDIA RTX 4090, 17.3-inch 4K 144Hz Mini-LED display. The most powerful gaming laptop money can buy.',
      specifications: { processor: 'Intel Core i9-14900HX', ram: 64, ramType: 'DDR5', storage: 2000, storageType: 'SSD NVMe x2', display: { size: 17.3, resolution: '3840x2160', refreshRate: 144, panelType: 'Mini-LED' }, battery: { capacity: 99, unit: 'Wh', life: 4 }, weight: 3.3, os: 'Windows 11 Pro', ports: ['Thunderbolt 4 x2', 'USB-A 3.2 x4', 'HDMI 2.1', 'RJ45'], gpu: 'NVIDIA RTX 4090 16GB' } },

    // Microsoft Surface
    { slug: 'microsoft-surface-laptop-5-2024', name: 'Microsoft Surface Laptop 5 (2024)', brand: 'microsoft', price: 99990, originalPrice: 109990, rating: 4.5, reviewCount: 310, viewCount: 5800,
      imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=600',
      description: 'Microsoft Surface Laptop 5 with Intel Core i5-1245U, 13.5-inch PixelSense touchscreen, 16GB RAM, premium Alcantara keyboard, and 18-hour battery.',
      specifications: { processor: 'Intel Core i5-1245U', ram: 16, ramType: 'LPDDR5', storage: 512, storageType: 'SSD', display: { size: 13.5, resolution: '2256x1504', refreshRate: 60, panelType: 'PixelSense Touch' }, battery: { capacity: 47.4, unit: 'Wh', life: 18 }, weight: 1.29, os: 'Windows 11 Home', ports: ['USB-C 3.2', 'USB-A 3.2', 'Surface Connect', '3.5mm Jack'] } },
  ];

  let laptopCount = 0;
  for (const p of laptops) {
    await upsertProduct({
      slug: p.slug, name: p.name, description: p.description,
      price: p.price, originalPrice: p.originalPrice,
      imageUrl: p.imageUrl, rating: p.rating,
      reviewCount: p.reviewCount, viewCount: p.viewCount,
      isFeatured: p.isFeatured ?? false,
      categoryId: catLaptops.id,
      brandId: B[p.brand],
      specifications: p.specifications,
    });
    laptopCount++;
  }
  console.log(`✓ ${laptopCount} laptops seeded`);

  // ══════════════════════════════════════════════════════════════════════════
  // SMARTPHONES
  // ══════════════════════════════════════════════════════════════════════════
  const phones = [
    // Apple iPhone
    { slug: 'apple-iphone-15-pro-max', name: 'Apple iPhone 15 Pro Max', brand: 'apple', price: 159900, originalPrice: 164900, rating: 4.8, reviewCount: 4210, viewCount: 65000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
      description: 'iPhone 15 Pro Max with A17 Pro chip, titanium design, 48MP main camera with 5x optical zoom, Action Button, and USB-C with USB 3 speeds.',
      specifications: { processor: 'Apple A17 Pro', ram: 8, storage: 256, display: { size: 6.7, resolution: '2796x1290', refreshRate: 120, type: 'Super Retina XDR ProMotion' }, camera: { main: 48, front: 12, ultraWide: 12, telephoto: 12 }, battery: { capacity: 4422, charging: 27 }, os: 'iOS 17', network: ['5G'] } },

    { slug: 'apple-iphone-15', name: 'Apple iPhone 15', brand: 'apple', price: 79900, originalPrice: 84900, rating: 4.7, reviewCount: 3180, viewCount: 48000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1695048132069-8d8b0e39ad72?w=600',
      description: 'iPhone 15 with Dynamic Island, A16 Bionic chip, 48MP camera system, USB-C connector, and all-day battery life. The perfect everyday iPhone.',
      specifications: { processor: 'Apple A16 Bionic', ram: 6, storage: 128, display: { size: 6.1, resolution: '2556x1179', refreshRate: 60, type: 'Super Retina XDR' }, camera: { main: 48, front: 12, ultraWide: 12 }, battery: { capacity: 3349, charging: 20 }, os: 'iOS 17', network: ['5G'] } },

    { slug: 'apple-iphone-14-plus', name: 'Apple iPhone 14 Plus', brand: 'apple', price: 69900, originalPrice: 79900, rating: 4.6, reviewCount: 1840, viewCount: 28000,
      imageUrl: 'https://images.unsplash.com/photo-1664478546384-d57ffe74a78c?w=600',
      description: 'iPhone 14 Plus with 6.7-inch Super Retina XDR display, A15 Bionic chip, 26-hour video playback, and 48MP camera. Best value big-screen iPhone.',
      specifications: { processor: 'Apple A15 Bionic', ram: 6, storage: 128, display: { size: 6.7, resolution: '2778x1284', refreshRate: 60, type: 'Super Retina XDR' }, camera: { main: 12, front: 12, ultraWide: 12 }, battery: { capacity: 4325, charging: 20 }, os: 'iOS 17', network: ['5G'] } },

    // Samsung
    { slug: 'samsung-galaxy-s24-ultra', name: 'Samsung Galaxy S24 Ultra', brand: 'samsung', price: 134999, originalPrice: 144999, rating: 4.8, reviewCount: 2840, viewCount: 42000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1706874894878-a1d37741781e?w=600',
      description: 'Galaxy S24 Ultra with Snapdragon 8 Gen 3, built-in S Pen, 200MP camera, 12GB RAM, and 5000mAh battery. The ultimate Android flagship.',
      specifications: { processor: 'Snapdragon 8 Gen 3', ram: 12, storage: 256, display: { size: 6.8, resolution: '3088x1440', refreshRate: 120, type: 'Dynamic AMOLED 2X' }, camera: { main: 200, front: 12, ultraWide: 12, telephoto: 10 }, battery: { capacity: 5000, charging: 45 }, os: 'Android 14', network: ['5G'] } },

    { slug: 'samsung-galaxy-s24-plus', name: 'Samsung Galaxy S24+', brand: 'samsung', price: 99999, originalPrice: 109999, rating: 4.7, reviewCount: 1620, viewCount: 26000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600',
      description: 'Galaxy S24+ with Snapdragon 8 Gen 3, 50MP triple camera, 6.7-inch Dynamic AMOLED 2X, 4900mAh battery, and Galaxy AI features.',
      specifications: { processor: 'Snapdragon 8 Gen 3', ram: 12, storage: 256, display: { size: 6.7, resolution: '3088x1440', refreshRate: 120, type: 'Dynamic AMOLED 2X' }, camera: { main: 50, front: 12, ultraWide: 12, telephoto: 10 }, battery: { capacity: 4900, charging: 45 }, os: 'Android 14', network: ['5G'] } },

    { slug: 'samsung-galaxy-s24', name: 'Samsung Galaxy S24', brand: 'samsung', price: 74999, originalPrice: 79999, rating: 4.6, reviewCount: 2180, viewCount: 34000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1543081965-f3b6b9c21286?w=600',
      description: 'Galaxy S24 with Snapdragon 8 Gen 3, Galaxy AI, 50MP camera, 6.2-inch Dynamic AMOLED, and 7 years of OS updates. The best compact Android.',
      specifications: { processor: 'Snapdragon 8 Gen 3', ram: 8, storage: 256, display: { size: 6.2, resolution: '2340x1080', refreshRate: 120, type: 'Dynamic AMOLED 2X' }, camera: { main: 50, front: 12, ultraWide: 12, telephoto: 10 }, battery: { capacity: 4000, charging: 25 }, os: 'Android 14', network: ['5G'] } },

    { slug: 'samsung-galaxy-a55-5g', name: 'Samsung Galaxy A55 5G', brand: 'samsung', price: 38999, originalPrice: 43999, rating: 4.4, reviewCount: 1840, viewCount: 28000,
      imageUrl: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600',
      description: 'Galaxy A55 5G with Exynos 1480, 50MP OIS camera, 6.6-inch Super AMOLED 120Hz, IP67 rating, and 5000mAh battery. Best mid-range Samsung.',
      specifications: { processor: 'Exynos 1480', ram: 8, storage: 256, display: { size: 6.6, resolution: '2340x1080', refreshRate: 120, type: 'Super AMOLED' }, camera: { main: 50, front: 32, ultraWide: 12 }, battery: { capacity: 5000, charging: 25 }, os: 'Android 14', network: ['5G'] } },

    { slug: 'samsung-galaxy-a35-5g', name: 'Samsung Galaxy A35 5G', brand: 'samsung', price: 26999, originalPrice: 31999, rating: 4.3, reviewCount: 2240, viewCount: 36000,
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
      description: 'Galaxy A35 5G with Exynos 1380, 50MP OIS camera, 6.6-inch Super AMOLED, IP67 water resistance, and 5000mAh battery at an accessible price.',
      specifications: { processor: 'Exynos 1380', ram: 6, storage: 128, display: { size: 6.6, resolution: '2340x1080', refreshRate: 120, type: 'Super AMOLED' }, camera: { main: 50, front: 13, ultraWide: 8 }, battery: { capacity: 5000, charging: 25 }, os: 'Android 14', network: ['5G'] } },

    // OnePlus
    { slug: 'oneplus-12-2024', name: 'OnePlus 12 (2024)', brand: 'oneplus', price: 64999, originalPrice: 69999, rating: 4.7, reviewCount: 1820, viewCount: 28000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
      description: 'OnePlus 12 with Snapdragon 8 Gen 3, Hasselblad camera, 50MP triple cameras, 6.82-inch ProXDR 120Hz display, 5400mAh battery, 100W SUPERVOOC charging.',
      specifications: { processor: 'Snapdragon 8 Gen 3', ram: 12, storage: 256, display: { size: 6.82, resolution: '3168x1440', refreshRate: 120, type: 'LTPO3 AMOLED' }, camera: { main: 50, front: 32, ultraWide: 48, telephoto: 64 }, battery: { capacity: 5400, charging: 100 }, os: 'OxygenOS 14 (Android 14)', network: ['5G'] } },

    { slug: 'oneplus-nord-ce4', name: 'OnePlus Nord CE 4', brand: 'oneplus', price: 24999, originalPrice: 28999, rating: 4.3, reviewCount: 1240, viewCount: 19000,
      imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600',
      description: 'OnePlus Nord CE 4 with Snapdragon 7 Gen 3, 50MP Sony LYT-600 camera, 6.7-inch FHD+ 120Hz AMOLED, 5500mAh battery, and 100W SUPERVOOC charging.',
      specifications: { processor: 'Snapdragon 7 Gen 3', ram: 8, storage: 128, display: { size: 6.7, resolution: '2412x1080', refreshRate: 120, type: 'AMOLED' }, camera: { main: 50, front: 16, ultraWide: 8 }, battery: { capacity: 5500, charging: 100 }, os: 'OxygenOS 14 (Android 14)', network: ['5G'] } },

    // Google Pixel
    { slug: 'google-pixel-8-pro', name: 'Google Pixel 8 Pro', brand: 'google', price: 106999, originalPrice: 114999, rating: 4.7, reviewCount: 980, viewCount: 16000,
      imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
      description: 'Google Pixel 8 Pro with Tensor G3, 50MP triple cameras, 6.7-inch LTPO OLED 120Hz display, temperature sensor, and 7 years of OS and security updates.',
      specifications: { processor: 'Google Tensor G3', ram: 12, storage: 128, display: { size: 6.7, resolution: '2992x1344', refreshRate: 120, type: 'LTPO OLED' }, camera: { main: 50, front: 10.5, ultraWide: 48, telephoto: 48 }, battery: { capacity: 5050, charging: 30 }, os: 'Android 14', network: ['5G'] } },

    { slug: 'google-pixel-8a', name: 'Google Pixel 8a', brand: 'google', price: 52999, originalPrice: 59999, rating: 4.6, reviewCount: 820, viewCount: 13000,
      imageUrl: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600',
      description: 'Pixel 8a with Tensor G3, 64MP camera, 6.1-inch OLED 120Hz, IP67 water resistance, and 7 years of software updates. Best camera in the mid-range.',
      specifications: { processor: 'Google Tensor G3', ram: 8, storage: 128, display: { size: 6.1, resolution: '2400x1080', refreshRate: 120, type: 'OLED' }, camera: { main: 64, front: 13, ultraWide: 13 }, battery: { capacity: 4492, charging: 18 }, os: 'Android 14', network: ['5G'] } },

    // Xiaomi
    { slug: 'xiaomi-14-ultra', name: 'Xiaomi 14 Ultra', brand: 'xiaomi', price: 99999, originalPrice: 109999, rating: 4.7, reviewCount: 640, viewCount: 12000,
      imageUrl: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600',
      description: 'Xiaomi 14 Ultra with Snapdragon 8 Gen 3, Leica quad-camera with 1-inch sensor, 50MP x4 cameras, 6.73-inch 120Hz LTPO OLED, 5000mAh 90W battery.',
      specifications: { processor: 'Snapdragon 8 Gen 3', ram: 16, storage: 512, display: { size: 6.73, resolution: '3200x1440', refreshRate: 120, type: 'LTPO AMOLED' }, camera: { main: 50, front: 32, ultraWide: 50, telephoto: 50 }, battery: { capacity: 5000, charging: 90 }, os: 'Android 14', network: ['5G'] } },

    { slug: 'xiaomi-redmi-note-13-pro', name: 'Xiaomi Redmi Note 13 Pro+', brand: 'xiaomi', price: 31999, originalPrice: 37999, rating: 4.4, reviewCount: 2840, viewCount: 44000,
      imageUrl: 'https://images.unsplash.com/photo-1632635173428-7e37b1fbd8c7?w=600',
      description: 'Redmi Note 13 Pro+ with Dimensity 7200 Ultra, 200MP camera, 6.67-inch curved AMOLED 120Hz, IP68 waterproof, 120W HyperCharge, 5000mAh battery.',
      specifications: { processor: 'MediaTek Dimensity 7200 Ultra', ram: 8, storage: 256, display: { size: 6.67, resolution: '2712x1220', refreshRate: 120, type: 'Curved AMOLED' }, camera: { main: 200, front: 16, ultraWide: 8 }, battery: { capacity: 5000, charging: 120 }, os: 'Android 13', network: ['5G'] } },

    // Motorola
    { slug: 'motorola-edge-50-pro', name: 'Motorola Edge 50 Pro', brand: 'motorola', price: 31999, originalPrice: 37999, rating: 4.3, reviewCount: 920, viewCount: 15000,
      imageUrl: 'https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=600',
      description: 'Motorola Edge 50 Pro with Snapdragon 7 Gen 3, 50MP OIS triple camera, 6.7-inch pOLED 144Hz curved display, IP68, 125W TurboPower charging.',
      specifications: { processor: 'Snapdragon 7 Gen 3', ram: 12, storage: 256, display: { size: 6.7, resolution: '2712x1220', refreshRate: 144, type: 'pOLED Curved' }, camera: { main: 50, front: 50, ultraWide: 13, telephoto: 10 }, battery: { capacity: 4500, charging: 125 }, os: 'Android 14', network: ['5G'] } },

    { slug: 'motorola-moto-g84-5g', name: 'Motorola Moto G84 5G', brand: 'motorola', price: 17999, originalPrice: 21999, rating: 4.2, reviewCount: 1680, viewCount: 26000,
      imageUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600',
      description: 'Motorola Moto G84 with Snapdragon 695, 50MP OIS camera, 6.55-inch pOLED 120Hz display, 5000mAh battery, and IP54 splash resistance.',
      specifications: { processor: 'Snapdragon 695', ram: 12, storage: 256, display: { size: 6.55, resolution: '2400x1080', refreshRate: 120, type: 'pOLED' }, camera: { main: 50, front: 16, ultraWide: 8 }, battery: { capacity: 5000, charging: 33 }, os: 'Android 13', network: ['5G'] } },

    // realme
    { slug: 'realme-gt-6', name: 'realme GT 6', brand: 'realme', price: 39999, originalPrice: 45999, rating: 4.4, reviewCount: 1020, viewCount: 17000,
      imageUrl: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600',
      description: 'realme GT 6 with Snapdragon 8s Gen 3, 50MP Sony LYT-808 camera, 6.78-inch 120Hz AMOLED, 5500mAh battery, 120W SUPERVOOC charging.',
      specifications: { processor: 'Snapdragon 8s Gen 3', ram: 12, storage: 256, display: { size: 6.78, resolution: '2780x1264', refreshRate: 120, type: 'AMOLED' }, camera: { main: 50, front: 32, ultraWide: 8 }, battery: { capacity: 5500, charging: 120 }, os: 'Android 14', network: ['5G'] } },

    { slug: 'realme-narzo-70-pro', name: 'realme Narzo 70 Pro 5G', brand: 'realme', price: 19999, originalPrice: 23999, rating: 4.2, reviewCount: 1840, viewCount: 29000,
      imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600',
      description: 'realme Narzo 70 Pro 5G with Dimensity 7050, 50MP Sony camera, 6.67-inch AMOLED 120Hz, 5000mAh battery, and 45W fast charging.',
      specifications: { processor: 'MediaTek Dimensity 7050', ram: 8, storage: 128, display: { size: 6.67, resolution: '2400x1080', refreshRate: 120, type: 'AMOLED' }, camera: { main: 50, front: 16 }, battery: { capacity: 5000, charging: 45 }, os: 'Android 14', network: ['5G'] } },
  ];

  let phoneCount = 0;
  for (const p of phones) {
    await upsertProduct({
      slug: p.slug, name: p.name, description: p.description,
      price: p.price, originalPrice: p.originalPrice,
      imageUrl: p.imageUrl, rating: p.rating,
      reviewCount: p.reviewCount, viewCount: p.viewCount,
      isFeatured: p.isFeatured ?? false,
      categoryId: catPhones.id,
      brandId: B[p.brand],
      specifications: p.specifications,
    });
    phoneCount++;
  }
  console.log(`✓ ${phoneCount} smartphones seeded`);

  // ══════════════════════════════════════════════════════════════════════════
  // HEADPHONES & EARBUDS
  // ══════════════════════════════════════════════════════════════════════════
  const headphones = [
    { slug: 'sony-wh-1000xm5', name: 'Sony WH-1000XM5', brand: 'sony', price: 26990, originalPrice: 34990, rating: 4.8, reviewCount: 4820, viewCount: 68000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      description: 'Sony WH-1000XM5 with industry-leading noise cancellation, 30-hour battery, Multipoint connection, speak-to-chat, and crystal-clear call quality.',
      specifications: { type: 'Over-Ear', noiseCancellation: true, wirelessRange: 30, batteryLife: 30, charging: 'USB-C', foldable: false, drivers: '30mm', frequency: '4Hz–40kHz', weight: 250, connectivity: ['Bluetooth 5.2', '3.5mm Jack'] } },

    { slug: 'sony-wf-1000xm5', name: 'Sony WF-1000XM5 Earbuds', brand: 'sony', price: 19990, originalPrice: 24990, rating: 4.7, reviewCount: 2840, viewCount: 42000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600',
      description: 'Sony WF-1000XM5 true wireless earbuds with best-in-class noise cancellation, 8-hour battery (24h with case), Multipoint, and premium sound quality.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: true, batteryLife: 8, caseBattery: 24, charging: 'USB-C', weight: 5.9, connectivity: ['Bluetooth 5.3'], ipRating: 'IPX4' } },

    { slug: 'apple-airpods-pro-2', name: 'Apple AirPods Pro (2nd Gen)', brand: 'apple', price: 26900, originalPrice: 27900, rating: 4.8, reviewCount: 6240, viewCount: 84000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600',
      description: 'AirPods Pro 2 with H2 chip, Adaptive Transparency, Personalized Spatial Audio, 6-hour battery (30h with case), and MagSafe USB-C charging case.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: true, batteryLife: 6, caseBattery: 30, charging: 'USB-C / MagSafe', connectivity: ['Bluetooth 5.3'], ipRating: 'IP54', weight: 5.3 } },

    { slug: 'samsung-galaxy-buds3-pro', name: 'Samsung Galaxy Buds3 Pro', brand: 'samsung', price: 17999, originalPrice: 19999, rating: 4.5, reviewCount: 1240, viewCount: 19000,
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
      description: 'Galaxy Buds3 Pro with Intelligent ANC, 360 Audio, 6-hour battery (30h with case), IP57 rating, and seamless Galaxy ecosystem integration.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: true, batteryLife: 6, caseBattery: 30, charging: 'USB-C', connectivity: ['Bluetooth 5.4'], ipRating: 'IP57', weight: 5.5 } },

    { slug: 'boat-airdopes-141', name: 'boAt Airdopes 141', brand: 'boat', price: 1299, originalPrice: 2999, rating: 4.1, reviewCount: 28400, viewCount: 380000,
      imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
      description: 'boAt Airdopes 141 with 8mm drivers, ENx Environmental Noise Cancellation, 42-hour total playback, ASAP Charge, and IWR technology.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: false, batteryLife: 8, caseBattery: 42, charging: 'USB-C', connectivity: ['Bluetooth 5.3'], ipRating: 'IPX4', weight: 4.5 } },

    { slug: 'boat-rockerz-550', name: 'boAt Rockerz 550', brand: 'boat', price: 1799, originalPrice: 3990, rating: 4.0, reviewCount: 18400, viewCount: 240000,
      imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600',
      description: 'boAt Rockerz 550 over-ear headphone with 40mm dynamic drivers, 20-hour battery, foldable design, and super-soft cushions. Best value over-ear in India.',
      specifications: { type: 'Over-Ear', noiseCancellation: false, wirelessRange: 10, batteryLife: 20, charging: 'Micro-USB', foldable: true, drivers: '40mm', weight: 235, connectivity: ['Bluetooth 5.0', '3.5mm Jack'] } },

    { slug: 'noise-buds-vs104', name: 'Noise Buds VS104', brand: 'noise', price: 1299, originalPrice: 2999, rating: 4.0, reviewCount: 12400, viewCount: 180000,
      imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600',
      description: 'Noise Buds VS104 with 13mm drivers, Quad Mic ENC, 40-hour total playback, Type-C fast charging, and IHyper sync technology for instant pairing.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: false, batteryLife: 10, caseBattery: 40, charging: 'USB-C', connectivity: ['Bluetooth 5.3'], ipRating: 'IPX4' } },

    { slug: 'noise-one-anc', name: 'Noise One ANC Headphones', brand: 'noise', price: 2499, originalPrice: 4999, rating: 4.1, reviewCount: 6840, viewCount: 92000,
      imageUrl: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600',
      description: 'Noise One ANC over-ear with Active Noise Cancellation, 35-hour battery, 40mm MEMS drivers, foldable design, and Hyper Sync instant pairing.',
      specifications: { type: 'Over-Ear', noiseCancellation: true, wirelessRange: 10, batteryLife: 35, charging: 'USB-C', foldable: true, drivers: '40mm', connectivity: ['Bluetooth 5.3', '3.5mm Jack'] } },

    { slug: 'oneplus-buds-3', name: 'OnePlus Buds 3', brand: 'oneplus', price: 4999, originalPrice: 6499, rating: 4.4, reviewCount: 2840, viewCount: 42000,
      imageUrl: 'https://images.unsplash.com/photo-1629367494173-c78a56567877?w=600',
      description: 'OnePlus Buds 3 with 49dB Active Noise Cancellation, LHDC 5.0 codec, 44-hour total battery, 10-min fast charge = 7-hour playback, IP55 rating.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: true, batteryLife: 9, caseBattery: 44, charging: 'USB-C', connectivity: ['Bluetooth 5.3'], ipRating: 'IP55', weight: 4.6 } },

    { slug: 'realme-buds-air-6-pro', name: 'realme Buds Air 6 Pro', brand: 'realme', price: 2999, originalPrice: 4999, rating: 4.3, reviewCount: 3840, viewCount: 54000,
      imageUrl: 'https://images.unsplash.com/photo-1628253747716-0c4f5c90fdda?w=600',
      description: 'realme Buds Air 6 Pro with 50dB ANC, 10mm Titanium drivers, 38-hour total battery, LDAC support, IP55 rating, and 360 Spatial Audio.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: true, batteryLife: 9, caseBattery: 38, charging: 'USB-C', connectivity: ['Bluetooth 5.4'], ipRating: 'IP55' } },

    { slug: 'samsung-galaxy-buds-fe', name: 'Samsung Galaxy Buds FE', brand: 'samsung', price: 7999, originalPrice: 9999, rating: 4.3, reviewCount: 1840, viewCount: 27000,
      imageUrl: 'https://images.unsplash.com/photo-1615655406736-b37892f1f12e?w=600',
      description: 'Samsung Galaxy Buds FE with Active Noise Cancellation, 21-hour total battery, 11mm driver, Comfort Fit design, and seamless Galaxy integration.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: true, batteryLife: 6, caseBattery: 21, charging: 'USB-C', connectivity: ['Bluetooth 5.2'], ipRating: 'IPX2' } },

    { slug: 'xiaomi-redmi-buds-5-pro', name: 'Xiaomi Redmi Buds 5 Pro', brand: 'xiaomi', price: 4999, originalPrice: 6999, rating: 4.4, reviewCount: 2140, viewCount: 32000,
      imageUrl: 'https://images.unsplash.com/photo-1625236641344-45f0e65c8765?w=600',
      description: 'Redmi Buds 5 Pro with 52dB ANC, 11mm LCP drivers, 38-hour total battery, Hi-Res Audio wireless certification, and IP54 rating.',
      specifications: { type: 'TWS Earbuds', noiseCancellation: true, batteryLife: 10, caseBattery: 38, charging: 'USB-C', connectivity: ['Bluetooth 5.4'], ipRating: 'IP54' } },
  ];

  let hpCount = 0;
  for (const p of headphones) {
    await upsertProduct({
      slug: p.slug, name: p.name, description: p.description,
      price: p.price, originalPrice: p.originalPrice,
      imageUrl: p.imageUrl, rating: p.rating,
      reviewCount: p.reviewCount, viewCount: p.viewCount,
      isFeatured: p.isFeatured ?? false,
      categoryId: catHeadphones.id,
      brandId: B[p.brand],
      specifications: p.specifications,
    });
    hpCount++;
  }
  console.log(`✓ ${hpCount} headphones/earbuds seeded`);

  // ══════════════════════════════════════════════════════════════════════════
  // POWER BANKS
  // ══════════════════════════════════════════════════════════════════════════
  const powerBanks = [
    { slug: 'anker-prime-27650mah', name: 'Anker Prime 27650mAh Power Bank', brand: 'anker', price: 12999, originalPrice: 14999, rating: 4.7, reviewCount: 1240, viewCount: 18000, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1609592806596-b60193e37754?w=600',
      description: 'Anker Prime 27650mAh with 250W total output, 140W USB-C input, Anker App control, charges MacBook Pro in 1.5 hours, and charges 3 devices simultaneously.',
      specifications: { capacity: 27650, unit: 'mAh', ports: ['USB-C 140W', 'USB-C 100W', 'USB-A 22.5W'], maxOutput: 250, maxInput: 140, wirelessCharging: false, weight: 625, size: 'Large', passThrough: true } },

    { slug: 'anker-powercore-20100', name: 'Anker PowerCore 20100mAh', brand: 'anker', price: 3999, originalPrice: 5999, rating: 4.6, reviewCount: 8240, viewCount: 120000,
      imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600',
      description: 'Anker PowerCore 20100 with 20100mAh capacity, dual USB-A ports, PowerIQ 2.0, charges iPhone 6+ times or iPad mini 5+ times.',
      specifications: { capacity: 20100, unit: 'mAh', ports: ['USB-A x2'], maxOutput: 15, maxInput: 15, wirelessCharging: false, weight: 356, size: 'Medium', passThrough: false } },

    { slug: 'anker-327-20000mah', name: 'Anker 327 Power Bank 20000mAh', brand: 'anker', price: 2499, originalPrice: 3499, rating: 4.5, reviewCount: 4820, viewCount: 72000,
      imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600',
      description: 'Anker 327 Power Bank 20000mAh with USB-C 20W input/output, dual USB-A, trickle-charging mode for earbuds, and slim compact design.',
      specifications: { capacity: 20000, unit: 'mAh', ports: ['USB-C 20W', 'USB-A x2'], maxOutput: 20, maxInput: 20, wirelessCharging: false, weight: 440, size: 'Medium', passThrough: true } },

    { slug: 'boat-power-bank-10000', name: 'boAt Energy 10000mAh Power Bank', brand: 'boat', price: 999, originalPrice: 2499, rating: 4.1, reviewCount: 24800, viewCount: 380000,
      imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600',
      description: 'boAt Energy 10000mAh with 22.5W fast charging, dual USB-A output, Type-C input, LED indicator, and ultra-compact design.',
      specifications: { capacity: 10000, unit: 'mAh', ports: ['USB-A x2', 'USB-C'], maxOutput: 22.5, maxInput: 22.5, wirelessCharging: false, weight: 220, size: 'Compact', passThrough: false } },

    { slug: 'xiaomi-33w-10000-power-bank', name: 'Xiaomi 33W Power Bank 10000mAh', brand: 'xiaomi', price: 1299, originalPrice: 1999, rating: 4.3, reviewCount: 18400, viewCount: 280000,
      imageUrl: 'https://images.unsplash.com/photo-1609592806596-b60193e37754?w=600',
      description: 'Xiaomi 33W Power Bank 10000mAh with dual USB-A and USB-C ports, 33W fast charging, LED indicator, and pocket-friendly slim design.',
      specifications: { capacity: 10000, unit: 'mAh', ports: ['USB-A 33W', 'USB-A 22.5W', 'USB-C 33W'], maxOutput: 33, maxInput: 33, wirelessCharging: false, weight: 235, size: 'Compact', passThrough: false } },

    { slug: 'realme-150w-12000-power-bank', name: 'realme 150W Power Bank 12000mAh', brand: 'realme', price: 2499, originalPrice: 3999, rating: 4.4, reviewCount: 3840, viewCount: 54000,
      imageUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=600',
      description: 'realme 150W Power Bank with 150W two-way fast charging, 12000mAh, USB-C and USB-A ports. Full charge your phone in just 30 minutes.',
      specifications: { capacity: 12000, unit: 'mAh', ports: ['USB-C 150W', 'USB-A 30W'], maxOutput: 150, maxInput: 150, wirelessCharging: false, weight: 285, size: 'Medium', passThrough: true } },

    { slug: 'noise-airbell-10000', name: 'Noise AirBell 10000mAh Wireless', brand: 'noise', price: 1799, originalPrice: 2999, rating: 4.0, reviewCount: 4240, viewCount: 62000,
      imageUrl: 'https://images.unsplash.com/photo-1608228088998-57828365d486?w=600',
      description: 'Noise AirBell 10000mAh with 15W wireless charging, 22.5W wired fast charging, dual USB output, and LED battery indicator.',
      specifications: { capacity: 10000, unit: 'mAh', ports: ['USB-A x2', 'USB-C'], maxOutput: 22.5, maxInput: 22.5, wirelessCharging: true, wirelessOutput: 15, weight: 250, size: 'Medium', passThrough: false } },

    { slug: 'samsung-45w-20000-power-bank', name: 'Samsung 45W Power Bank 20000mAh', brand: 'samsung', price: 4999, originalPrice: 6999, rating: 4.5, reviewCount: 2840, viewCount: 42000,
      imageUrl: 'https://images.unsplash.com/photo-1631281956016-3cdc1b2fe5fb?w=600',
      description: 'Samsung 45W Super Fast Charging Power Bank 20000mAh with dual USB-C ports, USB-A, wireless charging pad, and premium build quality.',
      specifications: { capacity: 20000, unit: 'mAh', ports: ['USB-C 45W', 'USB-C 25W', 'USB-A 15W'], maxOutput: 45, maxInput: 45, wirelessCharging: true, wirelessOutput: 10, weight: 398, size: 'Large', passThrough: true } },

    { slug: 'oneplus-150w-10000-power-bank', name: 'OnePlus 150W Power Bank 10000mAh', brand: 'oneplus', price: 2999, originalPrice: 4499, rating: 4.5, reviewCount: 1840, viewCount: 28000,
      imageUrl: 'https://images.unsplash.com/photo-1600490036275-29b1dd607702?w=600',
      description: 'OnePlus 150W SUPERVOOC Power Bank 10000mAh with 150W two-way charging, charges OnePlus phones to 50% in 10 minutes, dual USB-C.',
      specifications: { capacity: 10000, unit: 'mAh', ports: ['USB-C 150W', 'USB-C 65W'], maxOutput: 150, maxInput: 150, wirelessCharging: false, weight: 268, size: 'Compact', passThrough: true } },
  ];

  let pbCount = 0;
  for (const p of powerBanks) {
    await upsertProduct({
      slug: p.slug, name: p.name, description: p.description,
      price: p.price, originalPrice: p.originalPrice,
      imageUrl: p.imageUrl, rating: p.rating,
      reviewCount: p.reviewCount, viewCount: p.viewCount,
      isFeatured: p.isFeatured ?? false,
      categoryId: catPowerBanks.id,
      brandId: B[p.brand],
      specifications: p.specifications,
    });
    pbCount++;
  }
  console.log(`✓ ${pbCount} power banks seeded`);

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('Admin@SmartShop123', 12);
  const demoPwd = await bcrypt.hash('Demo@SmartShop123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@smartshop.dev' },
    update: {},
    create: { email: 'admin@smartshop.dev', password: adminPwd, firstName: 'Admin', lastName: 'User', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'demo@smartshop.dev' },
    update: {},
    create: { email: 'demo@smartshop.dev', password: demoPwd, firstName: 'Demo', lastName: 'User', role: 'USER' },
  });
  console.log('✓ Users seeded');

  const total = laptopCount + phoneCount + hpCount + pbCount;
  console.log(`\n✅ Seeding complete! ${total} products total.`);
  console.log(`   Laptops: ${laptopCount} | Phones: ${phoneCount} | Headphones: ${hpCount} | Power Banks: ${pbCount}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
