"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: 'laptops' },
            update: {},
            create: { name: 'Laptops', slug: 'laptops', description: 'Portable computers' },
        }),
        prisma.category.upsert({
            where: { slug: 'smartphones' },
            update: {},
            create: { name: 'Smartphones', slug: 'smartphones', description: 'Mobile phones' },
        }),
        prisma.category.upsert({
            where: { slug: 'tablets' },
            update: {},
            create: { name: 'Tablets', slug: 'tablets', description: 'Tablet computers' },
        }),
        prisma.category.upsert({
            where: { slug: 'monitors' },
            update: {},
            create: { name: 'Monitors', slug: 'monitors', description: 'Desktop monitors' },
        }),
        prisma.category.upsert({
            where: { slug: 'headphones' },
            update: {},
            create: { name: 'Headphones', slug: 'headphones', description: 'Audio headphones' },
        }),
        prisma.category.upsert({
            where: { slug: 'cameras' },
            update: {},
            create: { name: 'Cameras', slug: 'cameras', description: 'Digital cameras' },
        }),
        prisma.category.upsert({
            where: { slug: 'televisions' },
            update: {},
            create: { name: 'Televisions', slug: 'televisions', description: 'Smart TVs' },
        }),
    ]);
    console.log(`✓ ${categories.length} categories seeded`);
    const brands = await Promise.all([
        prisma.brand.upsert({ where: { slug: 'apple' }, update: {}, create: { name: 'Apple', slug: 'apple' } }),
        prisma.brand.upsert({ where: { slug: 'samsung' }, update: {}, create: { name: 'Samsung', slug: 'samsung' } }),
        prisma.brand.upsert({ where: { slug: 'asus' }, update: {}, create: { name: 'ASUS', slug: 'asus' } }),
        prisma.brand.upsert({ where: { slug: 'dell' }, update: {}, create: { name: 'Dell', slug: 'dell' } }),
        prisma.brand.upsert({ where: { slug: 'lenovo' }, update: {}, create: { name: 'Lenovo', slug: 'lenovo' } }),
        prisma.brand.upsert({ where: { slug: 'hp' }, update: {}, create: { name: 'HP', slug: 'hp' } }),
        prisma.brand.upsert({ where: { slug: 'acer' }, update: {}, create: { name: 'Acer', slug: 'acer' } }),
        prisma.brand.upsert({ where: { slug: 'oneplus' }, update: {}, create: { name: 'OnePlus', slug: 'oneplus' } }),
        prisma.brand.upsert({ where: { slug: 'google' }, update: {}, create: { name: 'Google', slug: 'google' } }),
        prisma.brand.upsert({ where: { slug: 'sony' }, update: {}, create: { name: 'Sony', slug: 'sony' } }),
    ]);
    console.log(`✓ ${brands.length} brands seeded`);
    const laptopCategory = categories.find((c) => c.slug === 'laptops');
    const phoneCategory = categories.find((c) => c.slug === 'smartphones');
    const asus = brands.find((b) => b.slug === 'asus');
    const dell = brands.find((b) => b.slug === 'dell');
    const lenovo = brands.find((b) => b.slug === 'lenovo');
    const apple = brands.find((b) => b.slug === 'apple');
    const samsung = brands.find((b) => b.slug === 'samsung');
    const laptops = await Promise.all([
        prisma.product.upsert({
            where: { slug: 'asus-vivobook-16-2024' },
            update: {},
            create: {
                name: 'ASUS Vivobook 16 (2024)',
                slug: 'asus-vivobook-16-2024',
                description: 'Powerful all-rounder with AMD Ryzen 7 processor, 16GB RAM, and a large FHD display perfect for development and light gaming.',
                price: 72990,
                originalPrice: 82990,
                rating: 4.3,
                reviewCount: 412,
                viewCount: 5800,
                categoryId: laptopCategory.id,
                brandId: asus.id,
                isFeatured: true,
                specifications: {
                    processor: 'AMD Ryzen 7 7730U',
                    ram: 16,
                    ramType: 'DDR4',
                    storage: 512,
                    storageType: 'SSD',
                    display: { size: 16, resolution: '1920x1200', refreshRate: 60, panelType: 'IPS' },
                    gpu: 'AMD Radeon Graphics',
                    battery: { capacity: 50, unit: 'Wh', life: 8 },
                    weight: 1.88,
                    os: 'Windows 11 Home',
                    ports: ['USB-A 3.2', 'USB-C 3.2', 'HDMI 1.4', '3.5mm Jack', 'SD Card Reader'],
                },
            },
        }),
        prisma.product.upsert({
            where: { slug: 'dell-inspiron-15-3535' },
            update: {},
            create: {
                name: 'Dell Inspiron 15 3535',
                slug: 'dell-inspiron-15-3535',
                description: 'Reliable workhorse laptop with AMD Ryzen 5, 16GB RAM. Great for development tasks and everyday use.',
                price: 67490,
                originalPrice: 74990,
                rating: 4.1,
                reviewCount: 289,
                viewCount: 4200,
                categoryId: laptopCategory.id,
                brandId: dell.id,
                specifications: {
                    processor: 'AMD Ryzen 5 7530U',
                    ram: 16,
                    ramType: 'DDR4',
                    storage: 512,
                    storageType: 'SSD',
                    display: { size: 15.6, resolution: '1920x1080', refreshRate: 120, panelType: 'IPS' },
                    gpu: 'AMD Radeon Graphics',
                    battery: { capacity: 54, unit: 'Wh', life: 9 },
                    weight: 1.76,
                    os: 'Windows 11 Home',
                    ports: ['USB-A 3.0 x2', 'USB-C 3.2', 'HDMI 2.0', '3.5mm Jack', 'SD Card Reader'],
                },
            },
        }),
        prisma.product.upsert({
            where: { slug: 'lenovo-ideapad-slim-5-2024' },
            update: {},
            create: {
                name: 'Lenovo IdeaPad Slim 5 (2024)',
                slug: 'lenovo-ideapad-slim-5-2024',
                description: 'Ultra-slim design with Intel Core i5, 16GB RAM. Excellent battery life makes it ideal for Flutter developers on the go.',
                price: 75990,
                originalPrice: 84990,
                rating: 4.4,
                reviewCount: 521,
                viewCount: 7100,
                categoryId: laptopCategory.id,
                brandId: lenovo.id,
                isFeatured: true,
                specifications: {
                    processor: 'Intel Core i5-12450H',
                    ram: 16,
                    ramType: 'LPDDR5',
                    storage: 512,
                    storageType: 'SSD',
                    display: { size: 15.6, resolution: '1920x1080', refreshRate: 60, panelType: 'IPS' },
                    gpu: 'Intel Arc A370M',
                    battery: { capacity: 60, unit: 'Wh', life: 12 },
                    weight: 1.65,
                    os: 'Windows 11 Home',
                    ports: ['USB-A 3.2 x2', 'USB-C 3.2 x2', 'HDMI 2.0', '3.5mm Jack'],
                },
            },
        }),
        prisma.product.upsert({
            where: { slug: 'apple-macbook-air-m2' },
            update: {},
            create: {
                name: 'Apple MacBook Air M2',
                slug: 'apple-macbook-air-m2',
                description: 'Industry-leading M2 chip, fanless design, exceptional battery life. Best-in-class for iOS/Flutter development.',
                price: 114900,
                originalPrice: 119900,
                rating: 4.8,
                reviewCount: 1204,
                viewCount: 18200,
                categoryId: laptopCategory.id,
                brandId: apple.id,
                isFeatured: true,
                specifications: {
                    processor: 'Apple M2',
                    ram: 16,
                    ramType: 'Unified Memory',
                    storage: 512,
                    storageType: 'SSD',
                    display: { size: 13.6, resolution: '2560x1664', refreshRate: 60, panelType: 'Liquid Retina' },
                    gpu: 'Apple M2 10-core GPU',
                    battery: { capacity: 52.6, unit: 'Wh', life: 18 },
                    weight: 1.24,
                    os: 'macOS Sonoma',
                    ports: ['USB-C/Thunderbolt 4 x2', 'MagSafe 3', '3.5mm Jack'],
                },
            },
        }),
    ]);
    console.log(`✓ ${laptops.length} laptops seeded`);
    const phones = await Promise.all([
        prisma.product.upsert({
            where: { slug: 'samsung-galaxy-s24' },
            update: {},
            create: {
                name: 'Samsung Galaxy S24',
                slug: 'samsung-galaxy-s24',
                description: 'Flagship Android with Snapdragon 8 Gen 3, AI features, and premium 50MP camera.',
                price: 74999,
                originalPrice: 79999,
                rating: 4.6,
                reviewCount: 876,
                viewCount: 12400,
                categoryId: phoneCategory.id,
                brandId: samsung.id,
                isFeatured: true,
                specifications: {
                    processor: 'Snapdragon 8 Gen 3',
                    ram: 8,
                    storage: 256,
                    display: { size: 6.2, resolution: '2340x1080', refreshRate: 120, type: 'Dynamic AMOLED 2X' },
                    camera: { main: 50, front: 12, ultraWide: 12, telephoto: 10 },
                    battery: { capacity: 4000, charging: 25 },
                    os: 'Android 14 / One UI 6.1',
                    network: ['5G', 'Wi-Fi 7', 'Bluetooth 5.3'],
                },
            },
        }),
    ]);
    console.log(`✓ ${phones.length} phones seeded`);
    const adminPassword = await bcrypt.hash('Admin@SmartShop123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@smartshop.dev' },
        update: {},
        create: {
            email: 'admin@smartshop.dev',
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
        },
    });
    console.log(`✓ Admin user seeded: ${admin.email}`);
    const userPassword = await bcrypt.hash('Demo@SmartShop123', 12);
    const demo = await prisma.user.upsert({
        where: { email: 'demo@smartshop.dev' },
        update: {},
        create: {
            email: 'demo@smartshop.dev',
            password: userPassword,
            firstName: 'Demo',
            lastName: 'User',
            role: 'USER',
        },
    });
    console.log(`✓ Demo user seeded: ${demo.email}`);
    console.log('\n✅ Seeding complete!');
}
main()
    .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map