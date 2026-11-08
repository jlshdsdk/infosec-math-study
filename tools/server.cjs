const http=require('node:http');
const path=require('node:path');
const fs=require('node:fs');
const root=path.resolve(__dirname,'../public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{
  let target;
  try{ const parsed=new URL(req.url,'http://localhost');target=path.resolve(root,'.'+decodeURIComponent(parsed.pathname)); }
  catch{res.writeHead(400);return res.end('Bad request');}
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  if(target===root)target=path.join(root,'index.html');
  fs.stat(target,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    fs.createReadStream(target).pipe(res);
  });
}).listen(4173,'127.0.0.1',()=>console.log('Study site ready at http://127.0.0.1:4173'));
