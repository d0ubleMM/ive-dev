// Uses an existing Playwright installation; every HTTP request is intercepted.
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { DatabaseSync } from 'node:sqlite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import worker, { EXPORT_QUERY } from '../worker/index.mjs';
const root=resolve('.'), api='https://ive-updates.intertrans-vorschau.workers.dev';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4'};
await mkdir(resolve(root,'review'),{recursive:true});
const results=[];
for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]) {
 const browser=await browserType.launch({headless:true});
 for(const width of [375,1440]) {
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');sql.exec(await readFile('worker/schema.sql','utf8'));
  const statement=(query,args=[])=>({bind:(...v)=>statement(query,v),run:async()=>({meta:{changes:Number(sql.prepare(query).run(...args).changes)}}),first:async()=>sql.prepare(query).get(...args)??null});
  const env={DB:{prepare:q=>statement(q)},SIGNUPS_ENABLED:'true',PUBLIC_BASE_URL:api,EMAIL_ACCOUNT_ID:'1'.repeat(32),EMAIL_API_TOKEN:'test-only',SIGNUP_LIMITER:{limit:async()=>({success:true})}};
  const mails=[];
  globalThis.fetch=async(url,init)=>{const m=JSON.parse(init.body);mails.push(m);return Response.json({success:true,result:{queued:[m.to]}});};
  for(const javaScriptEnabled of [true,...(width===375?[false]:[])]) {
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',javaScriptEnabled});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===api){
     const r=await worker.fetch(new Request(req.url(),{method:req.method(),headers:await req.allHeaders(),...(req.postData()?{body:req.postData()}: {})}),env);
     return route.fulfill({status:r.status,headers:Object.fromEntries(r.headers),body:Buffer.from(await r.arrayBuffer())});
    }
    if(url.origin==='https://ive.dev'){
     const file=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
     if(!file.startsWith(root+'/'))return route.abort();
     try{return route.fulfill({status:200,body:await readFile(file),contentType:types[extname(file)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:'Not found'});}
    }
    return route.abort();
   });
   const source=width===375?'download.html':'index.html';
   await page.goto('https://ive.dev/'+source+'#updates',{waitUntil:'networkidle'});
   const form=page.locator('[data-updates-form]');await form.scrollIntoViewIfNeeded();
   await form.locator('[name=email]').fill(`${engine}${width}${javaScriptEnabled?'js':'native'}@example.com`);
   await form.locator('[name=consent]').check();
   await form.screenshot({path:`review/${engine}-${width}-${javaScriptEnabled?'js':'native'}-signup.png`});
   await form.locator('[type=submit]').click();
   await page.getByText(/Check your inbox/).first().waitFor();
   assert.equal(sql.prepare(EXPORT_QUERY).all().length,javaScriptEnabled?0:1);
   const mail=mails.at(-1),link=mail.text.match(/https:\/\/[^\s]+\/confirm\?token=[A-Za-z0-9_-]{43}/)[0];
   await page.goto(link);
   assert.equal(sql.prepare(EXPORT_QUERY).all().length,javaScriptEnabled?0:1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`review/${engine}-${width}-${javaScriptEnabled?'js':'native'}-confirm.png`,fullPage:true});
   await page.getByRole('button',{name:'Confirm my subscription'}).click();
   await page.getByText('Your email is confirmed.',{exact:false}).waitFor();
   assert.equal(sql.prepare(EXPORT_QUERY).all().length,javaScriptEnabled?1:2);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:`review/${engine}-${width}-${javaScriptEnabled?'js':'native'}-success.png`,fullPage:true});
   results.push({engine,width,javaScriptEnabled,source,result:'passed',mailProvider:'stub; no real email sent'});
   await context.close();
  }
  sql.close();
 }
 await browser.close();
}
await writeFile('review/qa-doi.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
