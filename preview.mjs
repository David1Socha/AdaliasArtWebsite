import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {siteConfig} from './site-config.mjs';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.PORT||4173);
const content=JSON.parse(await readFile(new URL('./content.json',import.meta.url),'utf8'));
const {basePath}=siteConfig(content.site.origin);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.woff2':'font/woff2','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    if(basePath && pathname===basePath){res.writeHead(301,{Location:basePath+'/'+url.search});res.end();return;}
    if(!pathname.startsWith(basePath+'/')){res.writeHead(404);res.end();return;}
    let file=path.resolve(root,'.'+pathname.slice(basePath.length));
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    let info=await stat(file);
    if(info.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(301,{Location:url.pathname+'/'+url.search});res.end();return;}
      file=path.join(file,'index.html');
    }
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch(error){
    res.writeHead(error instanceof URIError?400:404,{'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(path.join(root,'404.html')).catch(()=>Buffer.from('Run node build.mjs first.')));
  }
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}${basePath}/`));
