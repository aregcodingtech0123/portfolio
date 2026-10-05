/**
 * Seeds portfolio content into Sanity from src/data/migration-portfolio.ts.
 *
 * Usage:
 *   1. Set in `.env` or `.env.local`:
 *        NEXT_PUBLIC_SANITY_PROJECT_ID=...
 *        NEXT_PUBLIC_SANITY_DATASET=production
 *        SANITY_API_WRITE_TOKEN=...   (Editor token from sanity.io/manage → API)
 *   2. Run: npm run seed:sanity
 *   3. Open /content-hub, fill every [TODO], then publish.
 *
 * Re-running replaces projects, experience, certificates, skills and skill
 * categories. CTF documents and any site settings you edited are not deleted.
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
  const ids = await client.fetch<string[]>(`*[_type == $type]._id`, { type });
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
      code: p.code,
      status: p.status,
      title: p.title,
      description: p.description,
      problem: p.problem,
      approach: p.approach,
      challenge: p.challenge,
      learned: p.learned,
      technologies: p.technologies,
      category: p.category,
      ...(p.githubUrl ? { githubUrl: p.githubUrl } : {}),
      ...(p.liveUrl ? { liveUrl: p.liveUrl } : {}),
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
  const certificateSets = [
    ["education", migrationPortfolio.educationCertificates],
    ["participation", migrationPortfolio.participationCertificates],
  ] as const;
  let certOrder = 0;
  for (const [category, items] of certificateSets) {
    for (const c of items) {
      await client.create({
        _type: "certificate",
        _id: `certificate-${category}-${slugifyId(c.title.en ?? "")}`,
        title: c.title,
        issuer: c.issuer,
        date: c.date,
        category,
        order: certOrder++,
      });
    }
  }
  console.log(`✓ ${certOrder} certificates`);

  await deleteByType("skillCategory");
  for (const cat of migrationPortfolio.skillCategories) {
    await client.create({
      _type: "skillCategory",
      _id: `skillCategory-${cat.id}`,
      categoryId: cat.id,
      label: cat.label,
      order: cat.order,
    });
  }
  console.log(`✓ ${migrationPortfolio.skillCategories.length} skill categories`);

  await deleteByType("skill");
  for (const sk of migrationPortfolio.skills) {
    await client.create({
      _type: "skill",
      _id: `skill-${slugifyId(sk.name)}`,
      name: sk.name,
      categoryId: sk.categoryId,
      tier: sk.tier,
      ...(sk.level ? { level: sk.level } : {}),
      ...(sk.evidenceProjectId
        ? {
            evidence: {
              _type: "reference",
              _ref: `project-${sk.evidenceProjectId}`,
            },
          }
        : {}),
      order: sk.order,
    });
  }
  console.log(`✓ ${migrationPortfolio.skills.length} skills`);

  console.log("\n✅ Seed complete. CTF documents were not touched.");
  console.log("→ Visit http://localhost:3000/content-hub and fill every [TODO] before publishing.");
  console.log("→ Refresh your site at /en or /tr\n");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
