const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const catalog=require('../catalog.json');
const base=process.env.SITE_URL||'http://127.0.0.1:8000/';
const published=catalog.guns.find(g=>g.id==='m4a1');
const skullId='m4a1-skull-punker';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'m4a1.html');await page.locator('.skin-card').first().waitFor();
  assert.equal(await page.locator('.skin-card').count(),40);
  const images=page.locator('.skin-card .art img');assert.equal(await images.count(),39);
  await images.evaluateAll(images=>{for(const image of images)image.loading='eager';return Promise.all(images.map(image=>image.decode()));});
  assert(await images.evaluateAll(images=>images.every(image=>image.naturalWidth>0)));
  assert.equal(await images.evaluateAll(images=>images.filter(image=>image.src.endsWith('.gif')).length),21);
  const skull=page.locator('.skin-card.unknown');assert.equal(await skull.count(),1);
  await skull.getByText('Rarity not checked',{exact:true}).waitFor();
  await skull.getByText('Attributes not added yet',{exact:true}).waitFor();
  await page.selectOption('#rarity-filter','unknown');assert.equal(await page.locator('.skin-card').count(),1);
  await page.getByRole('heading',{name:'M4A1 - Skull Punker',exact:true}).waitFor();
  await page.selectOption('#rarity-filter','all');
  for(const order of ['rare-to-common','common-to-rare']){
   await page.selectOption('#sort-filter',order);assert.match(await page.locator('.skin-card').last().getAttribute('class'),/unknown/);
  }
  await page.selectOption('#sort-filter','default');
  await page.screenshot({path:'/tmp/free-fire-m4a1-skins-desktop.png'});
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.screenshot({path:'/tmp/free-fire-m4a1-skins-mobile.png'});

  // A saved draft predating this upload gains the new skin and pictures, while
  // retaining edits, custom pictures, and deletions of older entries.
  const draft=structuredClone(catalog);delete draft.catalogRevision;
  for(const gun of draft.guns)gun.skins=gun.skins.filter(s=>!s.introducedIn);
  const gun=draft.guns.find(g=>g.id==='m4a1');gun.skins=gun.skins.filter(s=>s.id!==skullId&&s.id!=='m4a1-5');
  for(const skin of gun.skins)skin.image='';
  const edited=gun.skins.find(s=>s.id==='m4a1-2');edited.name='My edited Draco';edited.attributes=[{type:'Damage',value:1}];
  gun.skins.find(s=>s.id==='m4a1-3').image='images/guns/m4a1.png';
  await page.evaluate(draft=>localStorage.setItem('ff-skin-vault-catalog-v1',JSON.stringify(draft)),draft);
  await page.goto(base+'m4a1.html');await page.getByRole('heading',{name:'My edited Draco',exact:true}).waitFor();
  assert.equal(await page.locator('.skin-card').count(),39);
  assert.equal(await page.locator('.skin-card .art img').count(),38);
  const editedCard=page.locator('.skin-card').filter({has:page.getByRole('heading',{name:'My edited Draco',exact:true})});
  assert.match(await editedCard.locator('.art img').getAttribute('src'),/m4a1_infernal_draco.gif$/);
  assert.equal(await editedCard.locator('.plus').textContent(),'+');
  const customCard=page.locator('.skin-card').filter({has:page.getByRole('heading',{name:'M4A1 - Sunrise Realm',exact:true})});
  assert.equal(await customCard.locator('.art img').getAttribute('src'),'images/guns/m4a1.png');
  await page.getByRole('heading',{name:'M4A1 - Skull Punker',exact:true}).waitFor();

  await page.goto(base+'editor.html?gun=m4a1');
  const item=page.locator('.edit-item').filter({hasText:'M4A1 - Skull Punker'});
  await item.getByRole('button',{name:'Edit',exact:true}).click();
  assert.equal(await page.getByLabel('Rarity',{exact:true}).inputValue(),'unknown');
  await page.getByRole('button',{name:'Update skin',exact:true}).click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ff-skin-vault-catalog-v1')));
  assert.equal(saved.catalogRevision,catalog.catalogRevision);
  assert.equal(saved.guns.find(g=>g.id==='m4a1').skins.find(s=>s.id===skullId).introducedIn,1);
  page.on('dialog',dialog=>dialog.accept());
  await item.getByRole('button',{name:'Delete',exact:true}).click();
  await page.goto(base+'m4a1.html');await page.locator('.skin-card').first().waitFor();
  assert.equal(await page.locator('.skin-card').count(),38);
  assert.equal(await page.getByRole('heading',{name:'M4A1 - Skull Punker',exact:true}).count(),0);
  assert.equal(await page.getByRole('heading',{name:'M4A1 - Infernal Netherworld',exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: 40 M4A1 skins, all39 pictures decode,21 GIF references, unknown rarity/filter/sort/editor, mobile layout, old-draft updates, preserved edits/custom pictures/deletions, and new-skin deletion persistence.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
