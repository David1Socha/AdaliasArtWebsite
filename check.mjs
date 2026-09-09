import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {siteConfig} from './site-config.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,'dist');
const content=JSON.parse(await readFile(path.join(root,'content.json'),'utf8'));
const {basePath, siteUrl} = siteConfig(content.site.origin);
function localFile(value) {
  assert(value.startsWith(basePath+'/'), `URL outside site base path: ${value}`);
  return path.join(dist,value.slice(basePath.length).split(/[?#]/)[0]);
}
async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?walk(path.join(dir,x.name)):path.join(dir,x.name)))).flat();}
const files=await walk(dist);const pages=files.filter(f=>f.endsWith('.html'));
let references=0;let mailLinks=0;const errors=[];
for(const file of pages){
  const html=await readFile(file,'utf8');
  const name=path.relative(dist,file);
  const check=(ok,message)=>{if(!ok)errors.push(`${name}: ${message}`);};
  check((html.match(/<h1\b/g)||[]).length===1,'expected one h1');
  check(html.includes('name="description"'),'missing description');
  check(html.includes('rel="canonical"'),'missing canonical');
  check(html.includes(`rel="canonical" href="${siteUrl}`),'incorrect canonical site URL');
  check(html.includes(`property="og:url" content="${siteUrl}/`),'incorrect Open Graph site URL');
  check(!/<form\b|<iframe\b/.test(html),'unexpected form or iframe');
  check(!/squarespace|adaliasart\.work/i.test(html),'old platform reference');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  check(new Set(ids).size===ids.length,'duplicate element IDs');
  const urls = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)];
  for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const candidate of match[1].split(',')) urls.push(['src=', candidate.trim().split(/\s+/)[0]]);
  }
  for (const match of html.matchAll(/url\('([^']+)'\)/g)) urls.push(['src=',match[1]]);
  for(const match of urls){
    const value=match[1];
    if(value.startsWith('mailto:')){mailLinks++;check(value.startsWith('mailto:adagirl13@gmail.com'),'incorrect email recipient');continue;}
    if(/^https?:/.test(value)){if(match[0].startsWith('src='))check(false,'remote asset');continue;}
    if(value.startsWith('#')){check(ids.includes(value.slice(1)),`missing anchor ${value}`);continue;}
    try {let target=localFile(value);if((await stat(target)).isDirectory())target=path.join(target,'index.html');await stat(target);references++;}
    catch{check(false,`missing file ${value}`);}
  }
  for(const match of html.matchAll(/<img\b[^>]*>/g)){check(/\balt="/.test(match[0]),'image missing alt');check(/\bwidth="\d+"/.test(match[0])&&/\bheight="\d+"/.test(match[0]),'image missing dimensions');}
}
for(const gallery of content.galleries){
  const html=await readFile(path.join(dist,gallery.path,'index.html'),'utf8');
  for(const image of gallery.images)assert(html.includes(image.src),`Missing artwork ${image.src}`);
  for(const quote of gallery.testimonials)assert(html.includes(quote.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))),'Missing testimonial');
}
assert.equal(pages.length,9,'Expected eight main pages plus 404');
for(const route of ['/contact','/commissions-1',...content.galleries.map(g=>g.path)]){
  const html=await readFile(path.join(dist,route,'index.html'),'utf8');
  assert(html.includes('mailto:adagirl13@gmail.com?subject='),`Missing commission email action on ${route}`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`PASS: ${pages.length} pages, ${references} local references, ${mailLinks} email links, all ${content.galleries.reduce((n,g)=>n+g.images.length,0)} gallery images and gallery testimonials. No forms or remote assets.`);
