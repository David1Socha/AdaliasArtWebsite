import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(await readFile(path.join(root, 'content.json'), 'utf8'));
const out = path.join(root, 'dist');
await mkdir(out, { recursive: true });
await cp(path.join(root, 'public'), out, { recursive: true });
const {site, galleries} = data;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (url, text, cls = '') => `<a href="${esc(url)}"${cls ? ` class="${cls}"` : ''}>${text}</a>`;
const mail = subject => `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
const img = (image, {alt=image.alt, eager=false, sizes='(max-width: 480px) 100vw, (max-width: 750px) 50vw, 33vw', cls=''}={}) => `<img src="/${esc(image.src)}"${image.small&&image.smallWidth!==image.width?` srcset="/${esc(image.small)} ${image.smallWidth}w, /${esc(image.src)} ${image.width}w" sizes="${sizes}"`:''} width="${image.width}" height="${image.height}" alt="${esc(alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}${cls?` class="${cls}"`:''}>`;
const arrow = '<span aria-hidden="true">↗</span>';
const actions = (subject='Art commission inquiry') => `<div class="actions">${link(mail(subject), 'Email Adalia '+arrow, 'button')}${link('/contact/', 'What to include', 'text-link')}</div>`;
const navItems = [['/','Work'],['/commissions-1/','Commissions'],['/testimonies/','Testimonies'],['/contact/','Contact']];
function layout(title, description, route, body) {
  const active = route.startsWith('/work/') ? '/' : route;
  const nav = navItems.map(([url,label])=>`<a href="${url}"${url===active?' aria-current="page"':''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}${title===site.name?'':` — ${esc(site.name)}`}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${site.origin}${route==='/'?'':route.replace(/\/$/,'')}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${site.origin}${route}">
<meta name="theme-color" content="#e9dced"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/fonts.css"><link rel="stylesheet" href="/style.css"><script src="/site.js" defer></script></head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="header"><a class="brand" href="/">${esc(site.name)}</a><button class="menu-toggle" aria-expanded="false" aria-controls="navigation" hidden>Menu <span aria-hidden="true">☰</span></button><nav id="navigation" aria-label="Main navigation">${nav}<div class="socials">${link(site.linkedin,'<span aria-hidden="true">in</span><span class="sr-only">Adalia on LinkedIn</span>','social')}${link(site.etsy,'<span aria-hidden="true">↗</span><span class="sr-only">Shop on Etsy</span>','social')}</div></nav></header>
<main id="main">${body}</main><footer class="footer"><div><a class="footer-brand" href="/">Adalias.Art</a><p>Art & commissions · Omaha, Nebraska</p></div><nav aria-label="Footer navigation">${navItems.slice(1).map(([url,label])=>link(url,label)).join('')}</nav><div class="footer-contact">${link('mailto:'+site.email,esc(site.email))}<div class="footer-links">${link(site.etsy,'Shop on Etsy '+arrow)}${link(site.linkedin,'LinkedIn '+arrow)}</div></div></footer></body></html>`;
}
async function page(route, title, description, body) {
  const dir=path.join(out,route);await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),layout(title,description,route,body));
}
function carousel(items, label, cls='') {
  return `<section class="carousel ${cls}" aria-label="${esc(label)}" data-carousel><div class="carousel-top"><h2>${esc(label)}</h2><div class="carousel-controls" hidden><button type="button" data-prev aria-label="Previous ${esc(label.toLowerCase())}">←</button><button type="button" data-next aria-label="Next ${esc(label.toLowerCase())}">→</button></div></div><div class="carousel-track" tabindex="0" aria-label="${esc(label)}; scroll to see more">${items.join('')}</div></section>`;
}
const home = `<section class="intro"><h1 class="sr-only">Adalia’s Art — artist in Omaha, Nebraska</h1><p>${esc(data.home.intro)}</p><p class="intro-shop">Like what you see? ${link(site.etsy,'Visit my Etsy store '+arrow)}</p></section><section class="portfolio" aria-label="Explore my work" style="--watercolor:url('/${data.home.background.src}')">${galleries.map((g,i)=>`<a class="portfolio-item" href="${g.path}/">${img(data.home.covers[i],{alt:'',eager:i===0,sizes:'100vw'})}<span>${esc(g.title)}</span><span class="portfolio-arrow" aria-hidden="true">↗</span></a>`).join('')}</section>`;
await page('/',site.name,'Adalia is an artist in Omaha, Nebraska creating digital illustrations, murals, custom portraits, and flower crowns.',home);

const galleryCopy = {
  digital:['Digital Illustration Inquiry','Commission a logo, figure, or character for your business, website, game, signage, and more.','Digital illustration inquiry'],
  murals:['Mural Inquiries','Hire me to design and paint shapes, landscapes, or characters, and turn an interior wall into a mural.','Mural inquiry'],
  portraits:['Portrait Inquiries','Turn a favorite photo into a colorful abstract portrait. Visit my Etsy shop for custom watercolor portraits, or email me about something specific.','Portrait inquiry'],
  crowns:['Flower Crown Inquiry','Order a custom flower crown on Etsy, or hire me to host a DIY flower crown workshop for your next occasion.','Flower crown or workshop inquiry']
};
for (const [i,g] of galleries.entries()) {
  const [heading,copy,subject]=galleryCopy[g.key];
  const photos=g.images.map((image,n)=>`<figure>${link(image.href||'/'+image.src,img(image,{eager:n===0}),'artwork-link')}</figure>`).join('');
  const testimonials=g.testimonials.length?carousel(g.testimonials.map(q=>`<blockquote class="quote-slide"><p>${esc(q)}</p></blockquote>`),`${g.title} Testimonies`,'quote-carousel'):'';
  const pagination = `<nav class="project-pagination" aria-label="More artwork">${i>0?link(galleries[i-1].path+'/',`<span>← Previous</span>${esc(galleries[i-1].title)}`):'<span></span>'}${i<galleries.length-1?link(galleries[i+1].path+'/',`<span>Next →</span>${esc(galleries[i+1].title)}`):'<span></span>'}</nav>`;
  await page(g.path+'/',g.title,copy,`<header class="page-heading gallery-heading"><h1>${esc(g.title)}</h1></header><div class="gallery">${photos}</div><section class="inquiry"><div><h2>${heading}</h2><p>${copy}</p>${g.key!=='murals'?link(site.etsy,'Shop on Etsy '+arrow,'text-link'):''}</div><div><p>Have a project in mind? Tell me a little about it and attach any inspiration or reference photos to your email.</p>${actions(subject)}</div></section>${testimonials}${pagination}`);
}
const commissions = `<header class="page-heading"><h1>Commissions</h1></header><section class="commission-feature"><div class="commission-photo">${img(data.commissions.introImages[0],{eager:true,sizes:'(max-width: 700px) 100vw, 45vw'})}</div><div class="commission-copy"><h2>Dream it.</h2><p>Thank you so much for your interest in partnering with me! Visit my Etsy store to order a custom 7 × 5 or 11 × 14 watercolor portrait.</p>${link(site.etsy,'Shop on Etsy '+arrow,'button')}</div></section><section class="commission-feature reverse"><div class="commission-photo">${img(data.commissions.introImages[1],{sizes:'(max-width: 700px) 100vw, 45vw'})}</div><div class="commission-copy"><h2>Create it.</h2><p>Don’t see what you’re looking for? Email me about a specialized commission. Include inspiration photos and a description of your project, and I’ll get back to you with a quote.</p>${actions()}</div></section>${carousel(data.commissions.images.map(i=>`<figure class="commission-slide">${img(i)}<figcaption>${esc(i.title)}</figcaption></figure>`),'I’ll bring your visions to life…','commission-carousel')}`;
await page('/commissions-1/','Commissions','Commission custom artwork from Adalia: watercolor portraits, murals, illustrations, home decor, and more.',commissions);

const featuredCounts=[2,3,3,1];let offset=0;
const featured=data.testimonies.featured.map((t,i)=>{
  const photos=data.testimonies.featuredImages.slice(offset,offset+featuredCounts[i]);offset+=featuredCounts[i];
  return `<section class="testimony-feature${i%2?' reverse':''}"><div class="testimony-art">${photos.map((im,n)=>img(im,{eager:i===0&&n===0,sizes:'(max-width: 700px) 100vw, 45vw'})).join('')}</div><blockquote><p>${esc(t.quote)}</p><footer>${esc(t.credit)}${t.links.length?`<div class="credit-links">${t.links.map(l=>link(l.href,esc(l.label)+' '+arrow)).join(' ')}</div>`:''}</footer></blockquote></section>`;
}).join('');
await page('/testimonies/','Testimonies','Read what clients say about Adalia’s murals, portraits, digital illustrations, and commissioned artwork.',`<header class="page-heading"><h1>Testimonies</h1></header>${featured}<section class="more-testimonies" aria-label="More client testimonies">${data.testimonies.more.map(t=>`<figure class="testimony-card">${t.image?img(t.image):''}<blockquote><p>${esc(t.quote)}</p></blockquote></figure>`).join('')}</section>`);
await page('/contact/','Contact','Email Adalia about a custom art commission, mural, portrait, digital illustration, or flower crown workshop.',`<header class="page-heading"><h1>Get in touch…</h1></header><section class="contact-layout"><div class="contact-portrait">${img(data.contact.image,{eager:true,sizes:'(max-width: 700px) 100vw, 40vw'})}</div><div class="contact-copy"><h2>Let’s create something together.</h2><p>For commission inquiries and questions, send me an email.</p>${link('mailto:'+site.email,esc(site.email),'email-address')}${link(mail('Art commission inquiry'),'Email Adalia '+arrow,'button')}<h3>Tell me about your project</h3><ul><li>The kind of artwork you’re looking for.</li><li>The approximate size and where it will go.</li><li>Your desired timeline and budget, if you have one.</li><li>Any reference photos or inspiration — attach them to your email.</li></ul><p>For a mural or workshop, please include the location and any preferred dates.</p><p class="email-help">The email button opens your email app. You can also copy the address above into your preferred email service.</p><div class="contact-shop"><h3>Ready to order?</h3><p>Find custom portraits, illustrations, and flower crowns in my Etsy shop.</p>${link(site.etsy,'Shop on Etsy '+arrow,'text-link')}</div></div></section>`);

await writeFile(path.join(out,'404.html'),layout('Page not found','Return to Adalia’s Art.','/404/',`<section class="not-found"><h1>This page isn’t here.</h1><p>Explore my artwork, or get in touch about a commission.</p>${link('/','View my work','button')}</section>`));
const routes=['/','/commissions-1/','/testimonies/','/contact/',...galleries.map(g=>g.path+'/')];
await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r=>`<url><loc>${site.origin}${r==='/'?'':r.replace(/\/$/,'')}</loc></url>`).join('')}</urlset>`);
await writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`);
console.log(`Built ${routes.length} pages + 404 in ${out}`);
