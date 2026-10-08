const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const catalog=require('../catalog.json');
const base=process.env.SITE_URL||'http://127.0.0.1:8000/';
const published=catalog.guns.find(g=>g.id==='groza');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'rifles.html');
  await page.locator('.gun-card').filter({has:page.getByRole('heading',{name:'GROZA',exact:true})}).click();
  await page.getByRole('heading',{name:'GROZA skins',exact:true}).waitFor();assert.equal(await page.locator('.skin-card').count(),23);
  const images=page.locator('.skin-card .art img');assert.equal(await images.count(),23);
  await images.evaluateAll(images=>{for(const image of images)image.loading='eager';return Promise.all(images.map(image=>image.decode()));});
  assert(await images.evaluateAll(images=>images.every(image=>image.naturalWidth>0)));
  assert.equal(await images.evaluateAll(images=>images.filter(image=>image.src.endsWith('.gif')).length),14);
  await page.screenshot({path:'/tmp/free-fire-groza-desktop.png'});
  await page.selectOption('#rarity-filter','epic');assert.equal(await page.locator('.skin-card').count(),published.skins.filter(s=>s.rarity==='epic').length);
  assert.equal(await page.locator('.skin-card:not(.epic)').count(),0);
  await page.selectOption('#rarity-filter','all');await page.getByLabel('Search skins').fill('airburst');assert.equal(await page.locator('.skin-card').count(),1);
  await page.getByRole('heading',{name:'groza - airburst entranced',exact:true}).waitFor();
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.screenshot({path:'/tmp/free-fire-groza-mobile.png',fullPage:true});
  await page.goto(base+'groza.html');await page.locator('.skin-card').first().waitFor();assert.equal(await page.locator('.skin-card').count(),23);

  const draft=structuredClone(catalog),gun=draft.guns.find(g=>g.id==='groza');
  gun.skins=gun.skins.filter(s=>s.id!=='groza-5');for(const skin of gun.skins)skin.image='';
  const edited=gun.skins.find(s=>s.id==='groza-1');edited.name='My edited Booyah';edited.attributes=[{type:'Damage',value:1}];
  gun.skins.find(s=>s.id==='groza-2').image='images/guns/groza.png';gun.skins.find(s=>s.id==='groza-4').imageOverride=true;
  await page.evaluate(draft=>localStorage.setItem('ff-skin-vault-catalog-v1',JSON.stringify(draft)),draft);
  await page.goto(base+'groza.html');await page.getByRole('heading',{name:'My edited Booyah',exact:true}).waitFor();
  assert.equal(await page.locator('.skin-card').count(),22);assert.equal(await page.locator('.skin-card .art img').count(),21);
  const editedCard=page.locator('.skin-card').filter({has:page.getByRole('heading',{name:'My edited Booyah',exact:true})});
  assert.match(await editedCard.locator('.art img').getAttribute('src'),/groza_booyah.jpg$/);assert.equal(await editedCard.locator('.plus').textContent(),'+');
  const custom=page.locator('.skin-card').filter({has:page.getByRole('heading',{name:'groza - golden roar',exact:true})});
  assert.equal(await custom.locator('.art img').getAttribute('src'),'images/guns/groza.png');
  const cleared=page.locator('.skin-card').filter({has:page.getByRole('heading',{name:'groza - mamba gnaw',exact:true})});
  assert.equal(await cleared.locator('.art img').count(),0);
  assert.equal(await page.getByRole('heading',{name:'groza - s24 exclusive: wrathful',exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: all23 Groza skin pictures decode,14 GIF references, category/direct navigation, rarity/name filters, mobile layout, old-draft picture updates, preserved edited attributes/custom images/explicit image removals/deletions, and no browser errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
