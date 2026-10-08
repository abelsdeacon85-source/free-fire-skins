const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const catalog=require('../catalog.json');
const base=process.env.SITE_URL||'http://127.0.0.1:8000/';
const published=catalog.guns.find(g=>g.id==='m1887');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  assert.equal(published.skins.length,18);assert(published.skins.every(s=>s.rarity==='unknown'&&!s.attributes.length));
  await page.goto(base+'shotguns.html');
  await page.locator('.gun-card').filter({has:page.getByRole('heading',{name:'M1887',exact:true})}).click();
  await page.getByRole('heading',{name:'M1887 skins',exact:true}).waitFor();
  assert.equal(await page.locator('.skin-card').count(),18);
  assert.equal(await page.getByText('Attributes not added yet',{exact:true}).count(),18);
  assert.equal(await page.locator('.skin-card').getByText('Rarity not checked',{exact:true}).count(),18);
  assert.equal(await page.locator('.skin-card .plus, .skin-card .minus').count(),0);
  const images=page.locator('.skin-card .art img');assert.equal(await images.count(),18);
  await images.evaluateAll(images=>{for(const image of images)image.loading='eager';return Promise.all(images.map(image=>image.decode()));});
  assert(await images.evaluateAll(images=>images.every(image=>image.naturalWidth>0)));
  assert.equal(await images.evaluateAll(images=>images.filter(image=>image.src.endsWith('.gif')).length),14);
  await page.screenshot({path:'/tmp/free-fire-m1887-desktop.png'});
  await page.selectOption('#rarity-filter','rare');await page.getByRole('heading',{name:'No matching skins',exact:true}).waitFor();
  await page.selectOption('#rarity-filter','unknown');assert.equal(await page.locator('.skin-card').count(),18);
  await page.getByLabel('Search skins').fill('incendium');assert.equal(await page.locator('.skin-card').count(),1);
  await page.getByRole('heading',{name:'M1887 - Incendium Burst',exact:true}).waitFor();
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.screenshot({path:'/tmp/free-fire-m1887-mobile.png',fullPage:true});
  await page.goto(base+'m1887.html');await page.locator('.skin-card').first().waitFor();assert.equal(await page.locator('.skin-card').count(),18);

  // An older saved draft gains these skins while preserving its own entry and
  // an intentional deletion from an earlier upload.
  const draft=structuredClone(catalog);draft.catalogRevision=2;
  for(const gun of draft.guns)gun.skins=gun.skins.filter(s=>(s.introducedIn||0)<=draft.catalogRevision);
  draft.guns.find(g=>g.id==='m4a1').skins=draft.guns.find(g=>g.id==='m4a1').skins.filter(s=>s.id!=='m4a1-skull-punker');
  draft.guns.find(g=>g.id==='m1887').skins.push({id:'m1887-personal-draft',name:'My personal M1887 skin',rarity:'unknown',image:'images/guns/m1887.png',attributes:[],source:'',verified:false});
  await page.evaluate(draft=>localStorage.setItem('ff-skin-vault-catalog-v1',JSON.stringify(draft)),draft);
  await page.goto(base+'m1887.html');await page.getByRole('heading',{name:'My personal M1887 skin',exact:true}).waitFor();
  assert.equal(await page.locator('.skin-card').count(),19);
  await page.goto(base+'editor.html?gun=m1887');
  await page.locator('.edit-item').filter({hasText:'M1887 - Aqua Burst'}).getByRole('button',{name:'Edit',exact:true}).click();
  assert.equal(await page.getByLabel('Attribute',{exact:true}).count(),0);
  await page.getByRole('button',{name:'+ Add attribute',exact:true}).click();
  await page.getByLabel('Attribute',{exact:true}).selectOption('Damage');await page.getByLabel('Change',{exact:true}).selectOption('2');
  await page.getByRole('button',{name:'Update skin',exact:true}).click();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export catalog',exact:true}).click();
  const download=await downloadPromise;await download.saveAs('/tmp/free-fire-m1887-test-export.json');
  const exported=JSON.parse(fs.readFileSync('/tmp/free-fire-m1887-test-export.json','utf8'));
  const edited=exported.guns.find(g=>g.id==='m1887').skins.find(s=>s.id==='m1887-aqua-burst');
  assert.deepEqual(edited.attributes,[{type:'Damage',value:2}]);assert.equal(edited.introducedIn,3);
  assert.equal(exported.catalogRevision,catalog.catalogRevision);
  assert.equal(exported.guns.find(g=>g.id==='m4a1').skins.some(s=>s.id==='m4a1-skull-punker'),false);
  await page.goto(base+'m1887.html');
  const editedCard=page.locator('.skin-card').filter({has:page.getByRole('heading',{name:'M1887 - Aqua Burst',exact:true})});
  await editedCard.locator('.plus').waitFor();assert.equal(await editedCard.locator('.plus').textContent(),'++');
  assert.equal(await page.getByText('Attributes not added yet',{exact:true}).count(),18);
  assert(published.skins.every(s=>!s.attributes.length));
  assert.deepEqual(errors,[]);
  console.log('PASS: 18 M1887 skins with empty attributes/unchecked rarity, all18 pictures decode,14 GIF references, category/direct navigation, search/filter, mobile layout, older-draft updates, preserved personal entry/deletions, and later attribute editing/export.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
