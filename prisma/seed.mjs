/**
 * seed.mjs — Backend Prisma seed script
 * Run from the Airbnb backend folder:
 *   node prisma/seed.mjs
 *
 * Creates 3 demo users (GUEST, HOST, ADMIN) + 6 rich listings with photos.
 * Safe to re-run: existing emails are skipped.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const USERS = [
  {
    name: "Alice Host",
    email: "host@demo.com",
    username: "alice_host",
    phone: "+250780000001",
    password: "demo1234",
    role: "HOST",
  },
  {
    name: "Bob Guest",
    email: "guest@demo.com",
    username: "bob_guest",
    phone: "+250780000002",
    password: "demo1234",
    role: "GUEST",
  },
  {
    name: "Carol Admin",
    email: "admin@demo.com",
    username: "carol_admin",
    phone: "+250780000003",
    password: "demo1234",
    role: "ADMIN",
  },
];

const LISTINGS = [
  {
    title: "Luxury Penthouse in Kigali",
    description:
      "Stunning penthouse with panoramic city views, rooftop terrace, and full concierge service. Perfect for business travellers and couples.",
    location: "Kigali, Rwanda",
    pricePerNight: 220,
    guests: 2,
    type: "apartment",
    amenities: ["WiFi", "Air Conditioning", "Pool", "Gym", "Parking", "Concierge"],
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    ],
  },
  {
    title: "Cosy Lakeside Villa",
    description:
      "Private villa sitting right on Lake Kivu with a boat dock, infinity pool, and breathtaking sunset views every evening.",
    location: "Gisenyi, Rwanda",
    pricePerNight: 185,
    guests: 6,
    type: "villa",
    amenities: ["WiFi", "Pool", "Private Dock", "BBQ", "Kitchen", "Lake View"],
    photos: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    ],
  },
  {
    title: "Modern Studio Downtown",
    description:
      "Sleek, fully-furnished studio in the heart of downtown Kigali. Walking distance to restaurants, shops, and the convention centre.",
    location: "Kigali, Rwanda",
    pricePerNight: 65,
    guests: 2,
    type: "apartment",
    amenities: ["WiFi", "Air Conditioning", "Smart TV", "Washer", "Kitchen"],
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    ],
  },
  {
    title: "Mountain Retreat Cabin",
    description:
      "Rustic yet luxurious cabin nestled in the Virunga foothills. Wake up to misty mountain views and fresh highland air.",
    location: "Musanze, Rwanda",
    pricePerNight: 120,
    guests: 4,
    type: "cabin",
    amenities: ["WiFi", "Fireplace", "Mountain View", "Hiking Trails", "Kitchen", "BBQ"],
    photos: [
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    ],
  },
  {
    title: "Family Home with Garden",
    description:
      "Spacious 4-bedroom house with a large garden, children's play area, and secure parking. Ideal for families and group stays.",
    location: "Huye, Rwanda",
    pricePerNight: 95,
    guests: 8,
    type: "house",
    amenities: ["WiFi", "Garden", "Parking", "Kids Play Area", "Kitchen", "Washing Machine"],
    photos: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    ],
  },
  {
    title: "Boutique Apartment — Nyamirambo",
    description:
      "Charming apartment in Nyamirambo's vibrant cultural quarter. Decorated with local art, close to night markets and live music venues.",
    location: "Kigali, Rwanda",
    pricePerNight: 75,
    guests: 3,
    type: "apartment",
    amenities: ["WiFi", "Air Conditioning", "Local Art", "Kitchen", "Smart TV", "Rooftop Access"],
    photos: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
    ],
  },
];

async function main() {
  console.log("🚀  Seeding database...\n");

  // ── 1. Create users ──────────────────────────────────────────────────────────
  const userMap = {};

  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`⚠️   Already exists: ${u.email} — skipped`);
      userMap[u.role] = existing;
      continue;
    }

    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        username: u.username,
        phone: u.phone,
        password: hashed,
        role: u.role,
      },
    });
    userMap[u.role] = user;
    console.log(`✅  Created ${u.role}: ${u.email}`);
  }

  console.log();

  // ── 2. Create listings under HOST ────────────────────────────────────────────
  const host = userMap["HOST"];
  if (!host) {
    console.error("❌  HOST user not found — cannot create listings");
    return;
  }

  for (const l of LISTINGS) {
    const { photos, ...fields } = l;

    const listing = await prisma.listing.create({
      data: {
        ...fields,
        pricePerNight: parseFloat(fields.pricePerNight),
        guests: parseInt(fields.guests),
        hostId: host.id,
        photos: {
          create: photos.map((url) => ({ url })),
        },
      },
      include: { photos: true },
    });

    console.log(`🏠  "${listing.title}" — ${listing.photos.length} photo(s)`);
  }

  console.log("\n✨  Done!\n");
  console.log("📋  Demo credentials:");
  console.log("   GUEST  →  guest@demo.com  /  demo1234");
  console.log("   HOST   →  host@demo.com   /  demo1234");
  console.log("   ADMIN  →  admin@demo.com  /  demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
