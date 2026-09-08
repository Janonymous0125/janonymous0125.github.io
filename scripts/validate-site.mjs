import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), process.argv[2] || '.');
const issues = [];
const pages = fs.readdirSync(root).filter((name) => name.endsWith('.html') && name !== '404.html');
const canonicalUrls = new Set();

const check = (condition, message) => { if (!condition) issues.push(message); };

for (const name of pages) {
  const file = path.join(root, name);
  const source = fs.readFileSync(file, 'utf8');
  const title = source.match(/<title>[\s\S]*?<\/title>/i);
  const description = source.match(/<meta\s+name="description"\s+content="[^"]+"\s*\/?>/i);
  const canonical = source.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i);

  check(Boolean(title), `${name}: missing title`);
  check(Boolean(description), `${name}: missing meta description`);
  check(Boolean(canonical), `${name}: missing canonical URL`);
  if (canonical) {
    check(!canonicalUrls.has(canonical[1]), `${name}: duplicate canonical URL`);
    canonicalUrls.add(canonical[1]);
  }

  const images = [...source.matchAll(/<img\b[^>]*>/gi)];
  images.forEach((image, index) => check(/\salt="[^"]*"/i.test(image[0]), `${name}: image ${index + 1} has no alt text`));

  const references = [...source.matchAll(/\s(?:href|src)="([^"]+)"/gi)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|data:|#|javascript:)/i.test(reference)) continue;
    const clean = reference.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(clean));
    check(fs.existsSync(target), `${name}: missing local reference ${reference}`);
  }

  for (const block of source.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(block[1]); } catch (error) { issues.push(`${name}: invalid JSON-LD: ${error.message}`); }
  }
}

check(fs.existsSync(path.join(root, 'robots.txt')), 'missing robots.txt');
check(fs.existsSync(path.join(root, 'sitemap.xml')), 'missing sitemap.xml');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const canonical of canonicalUrls) check(sitemap.includes(`<loc>${canonical}</loc>`), `sitemap missing ${canonical}`);

for (const required of ['index.html', 'about.html']) {
  const source = fs.readFileSync(path.join(root, required), 'utf8');
  check(/application\/ld\+json/i.test(source), `${required}: missing structured data`);
}

if (issues.length) {
  console.error(`Validation failed with ${issues.length} issue(s):`);
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log(`Validated ${pages.length} portfolio pages, ${canonicalUrls.size} canonical URLs, local references, sitemap, robots, and structured data.`);
