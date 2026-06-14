/**
 * Seeds all portfolio content into Sanity from src/data/migration-portfolio.ts
 *
 * Usage:
 *   1. Set in `.env` or `.env.local`:
 *        NEXT_PUBLIC_SANITY_PROJECT_ID=...
 *        NEXT_PUBLIC_SANITY_DATASET=production
 *        SANITY_API_WRITE_TOKEN=...   (Editor token from sanity.io/manage → API)
 *   2. Run: npm run seed:sanity
 *   3. Open /content-hub and Publish any draft documents
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@sanity/client";
import {
  migrationPortfolio,
  slugifyId,
} from "../src/data/migration-portfolio";

// Next.js loads these automatically; standalone tsx does not.
loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN.",
  );
  console.error(
    "Add them to .env or .env.local in the project root, then rerun npm run seed:sanity.",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

async function deleteByType(type: string) {
  const ids = await client.fetch<string[]>(
    `*[_type == $type]._id`,
    { type },
  );
  if (!ids.length) return;
  const tx = client.transaction();
  ids.forEach((id) => tx.delete(id));
  await tx.commit();
  console.log(`  cleared ${ids.length} existing ${type} document(s)`);
}

async function seed() {
  console.log(`\nSeeding Sanity dataset: ${dataset}\n`);

  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    ...migrationPortfolio.siteSettings,
  });
  console.log("✓ Site settings (hero, about, social, contact, SEO)");

  await deleteByType("project");
  for (const p of migrationPortfolio.projects) {
    await client.create({
      _type: "project",
      _id: `project-${p.id}`,
      slug: { _type: "slug", current: p.id },
      title: p.title,
      description: p.description,
      technologies: p.technologies,
      category: p.category,
      ...(p.githubUrl ? { githubUrl: p.githubUrl } : {}),
      liveUrl: p.liveUrl,
      order: p.order,
      featured: p.featured,
    });
  }
  console.log(`✓ ${migrationPortfolio.projects.length} projects`);

  await deleteByType("experience");
  for (const e of migrationPortfolio.experience) {
    await client.create({
      _type: "experience",
      _id: e.id,
      company: e.company,
      role: e.role,
      period: e.period,
      detail: e.detail,
      order: e.order,
    });
  }
  console.log(`✓ ${migrationPortfolio.experience.length} experience entries`);

  await deleteByType("certificate");
  let certOrder = 0;
  for (const c of migrationPortfolio.educationCertificates) {
    await client.create({
      _type: "certificate",
      _id: `certificate-education-${slugifyId(c.name)}`,
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      category: "education",
      order: certOrder++,
    });
  }
  for (const c of migrationPortfolio.participationCertificates) {
    await client.create({
      _type: "certificate",
      _id: `certificate-participation-${slugifyId(c.name)}`,
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      category: "participation",
      order: certOrder++,
    });
  }
  console.log(
    `✓ ${migrationPortfolio.educationCertificates.length + migrationPortfolio.participationCertificates.length} certificates`,
  );

  await deleteByType("skillCategory");
  for (const cat of migrationPortfolio.skillCategories) {
    await client.create({
      _type: "skillCategory",
      _id: `skillCategory-${cat.id}`,
      categoryId: cat.id,
      label: cat.label,
      groups: cat.groups,
      order: cat.order,
    });
  }
  console.log(`✓ ${migrationPortfolio.skillCategories.length} skill categories`);

  console.log("\n✅ Migration complete.");
  console.log("→ Visit http://localhost:3000/content-hub");
  console.log("→ Review documents and click Publish on each (or bulk publish).");
  console.log("→ Refresh your site at /en or /tr\n");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
