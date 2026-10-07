const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const catalog=require('../catalog.json');
const base=process.env.SITE_URL||'http://127.0.0.1:8000/';
const addedIds=['ff-knife','fgl-24','flamethrower','gatling','hand-cannon','hawk','m14','m1873','m7','rpk','shield-gun','skorp','treatment-laser','uzi','winchester'];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const id of addedIds){
   const gun=catalog.guns.find(g=>g.id===id);assert(gun,`Missing ${id}`);assert.equal(gun.skins.length,0);assert(gun.image);
   const response=await page.goto(base+gun.category+'.html');assert.equal(response.status(),200);
   const card=page.locator('.gun-card').filter({has:page.getByRole('heading',{name:gun.name,exact:true})});await card.waitFor();
   await card.locator('img').evaluate(image=>image.decode());assert(await card.locator('img').evaluate(image=>image.naturalWidth>0));
   await card.click();await page.getByRole('heading',{name:gun.name+' skins',exact:true}).waitFor();await page.getByRole('heading',{name:'This collection is waiting for you.',exact:true}).waitFor();
   const direct=await page.goto(base+gun.id+'.html');assert.equal(direct.status(),200);await page.getByRole('heading',{name:gun.name+' skins',exact:true}).waitFor();
  }
  const oldDraft=structuredClone(catalog);oldDraft.guns=oldDraft.guns.filter(g=>!addedIds.includes(g.id));oldDraft.categories=oldDraft.categories.filter(c=>c.id!=='special');oldDraft.guns.find(g=>g.id==='m4a1').skins[0].name='Preserved local skin';
  await page.evaluate(data=>localStorage.setItem('ff-skin-vault-catalog-v1',JSON.stringify(data)),oldDraft);
  for(const id of addedIds){await page.goto(base+'gun.html?id='+id);await page.getByRole('heading',{name:catalog.guns.find(g=>g.id===id).name+' skins',exact:true}).waitFor();}
  await page.goto(base+'m4a1.html');await page.getByRole('heading',{name:'Preserved local skin',exact:true}).waitFor();
  await page.goto(base+'editor.html');await page.getByLabel('Gun',{exact:true}).selectOption('m14');await page.getByLabel('Skin name',{exact:true}).fill('Local new-gun fixture');await page.getByRole('button',{name:'Save skin',exact:true}).click();await page.getByText('Local new-gun fixture',{exact:true}).waitFor();
  await page.goto(base+'m14.html');await page.getByRole('heading',{name:'Local new-gun fixture',exact:true}).waitFor();
  await page.setViewportSize({width:320,height:800});await page.goto(base+'rifles.html');await page.locator('.gun-card').first().waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log('PASS: all 15 added weapons, correct category navigation, picture loading, empty skin collections, direct URLs, older draft merging, new-gun skin editing, and mobile layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
