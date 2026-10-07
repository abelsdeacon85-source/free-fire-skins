'use strict';
const STORAGE_KEY = 'ff-skin-vault-catalog-v1';
const rarityOrder = ['uncommon', 'rare', 'epic', 'mythic', 'artifact'];
const attributeTypes = ['Damage', 'Rate Of Fire', 'Accuracy', 'Range', 'Reload Speed', 'Magazine', 'Movement Speed', 'Armour Penetration'];
let catalog, baseCatalog, localDraft = false;
const main = document.querySelector('main');
const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const link = (text, href, className) => { const node = el('a', text, className); node.href = href; return node; };
const categoryFor = gun => catalog.categories.find(c => c.id === gun.category);
const countSkins = guns => guns.reduce((n, g) => n + g.skins.length, 0);
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function safeImage(value) { return !value || /^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(value) || /^https:\/\//i.test(value) || (!/^(?:[a-z]+:|\/\/)/i.test(value) && !value.includes('..')); }
function youtubeVideo(value) {
 if (!value || typeof value !== 'string') return null;
 try {
  const url = new URL(value);
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  let id;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
   if (url.pathname === '/watch') id = url.searchParams.get('v');
   else id = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1];
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return null;
  let seconds = 0;
  const fragment = new URLSearchParams(url.hash.slice(1));
  const raw = url.searchParams.get('t') || url.searchParams.get('start') || fragment.get('t') || fragment.get('start');
  if (raw) {
   if (/^\d+$/.test(raw)) seconds = Number(raw);
   else if (/^(?:\d+h)?(?:\d+m)?(?:\d+s)?$/.test(raw)) {
    seconds = Number(raw.match(/(\d+)h/)?.[1] || 0) * 3600 + Number(raw.match(/(\d+)m/)?.[1] || 0) * 60 + Number(raw.match(/(\d+)s/)?.[1] || 0);
   } else return null;
  }
  if (!Number.isSafeInteger(seconds) || seconds > 86400) return null;
  return {id, seconds};
 } catch { return null; }
}
function parseTimestamp(value) {
 if (!value.trim()) return 0;
 if (/^\d+$/.test(value)) return Number(value);
 const parts = value.split(':');
 if (parts.length < 2 || parts.length > 3 || parts.some(p => !/^\d{1,2}$/.test(p)) || parts.slice(1).some(p => Number(p) > 59)) return NaN;
 return parts.reduce((n, p) => n * 60 + Number(p), 0);
}
function formatTimestamp(seconds) {
 const hours = Math.floor(seconds / 3600), minutes = Math.floor((seconds % 3600) / 60), remainder = seconds % 60;
 return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${minutes}:${String(remainder).padStart(2, '0')}`;
}
function videoEvidence(skin) {
 const video = youtubeVideo(skin.video || '') || youtubeVideo(skin.source);
 if (!video) return null;
 const seconds = skin.videoTimestamp ?? video.seconds;
 return {...video, seconds, url: `https://www.youtube.com/watch?v=${video.id}${seconds ? `&t=${seconds}s` : ''}`};
}
function youtubeSearch(query, text = 'Find videos on YouTube') {
 const a = link(text, `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, 'video-link');
 a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
}
function validate(data) {
 if (!data || data.version !== 1 || !Array.isArray(data.categories) || !Array.isArray(data.guns)) throw Error('Use a catalog exported by Skin Vault.');
 const string = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
 const ids = new Set();
 for (const c of data.categories) { if (!string(c.id) || !/^[a-z0-9-]+$/.test(c.id) || !string(c.name) || typeof c.description !== 'string' || ids.has(c.id)) throw Error('Invalid or duplicate category.'); ids.add(c.id); }
 const gunIds = new Set(), skinIds = new Set();
 for (const g of data.guns) {
  if (!string(g.id) || !/^[a-z0-9-]+$/.test(g.id) || !string(g.name) || !ids.has(g.category) || gunIds.has(g.id) || !Array.isArray(g.skins)) throw Error('Invalid or duplicate gun.'); gunIds.add(g.id);
  if (g.image !== undefined && (typeof g.image !== 'string' || !safeImage(g.image))) throw Error('Invalid gun image.');
  for (const s of g.skins) {
   if (!string(s.id) || skinIds.has(s.id) || !string(s.name) || !rarityOrder.includes(s.rarity) || typeof s.image !== 'string' || !safeImage(s.image) || !Array.isArray(s.attributes) || typeof s.verified !== 'boolean' || typeof s.source !== 'string' || (s.verified && !s.source) || (s.source && !/^https:\/\//i.test(s.source))) throw Error('Invalid skin, image, or source link.');
   if (s.video !== undefined && (typeof s.video !== 'string' || (s.video && !youtubeVideo(s.video)))) throw Error('Enter a valid YouTube video link.');
   if (s.videoTimestamp !== undefined && (!Number.isInteger(s.videoTimestamp) || s.videoTimestamp < 0 || s.videoTimestamp > 86400 || !youtubeVideo(s.video || s.source))) throw Error('A video timestamp needs a valid YouTube link and must be between 0 and 24 hours.');
   skinIds.add(s.id);
   for (const a of s.attributes) if (!a || !string(a.type) || !Number.isInteger(a.value) || a.value < -3 || a.value > 3) throw Error('Attributes must have a name and a value from -3 to +3.');
  }
 }
 return data;
}
function notice(text) { main.append(el('p', text, 'notice')); }
function crumbs(items) { const nav = el('nav', undefined, 'crumbs'); nav.setAttribute('aria-label', 'Breadcrumb'); items.forEach(([text, href], i) => { if (i) nav.append(el('span', '/')); nav.append(href ? link(text, href) : el('span', text)); }); main.append(nav); }
function hero(title, description, guns = catalog.guns) {
 const wrap = el('section', undefined, 'hero'), content = el('div'); content.append(el('p', 'THE COMMUNITY ARMORY', 'eyebrow'), el('h1', title), el('p', description));
 const stats = el('div', undefined, 'stats'); for (const [n, label] of [[guns.length, 'GUNS'], [countSkins(guns), 'SKIN ENTRIES']]) { const item = el('div'); item.append(el('strong', String(n)), el('span', label)); stats.append(item); } wrap.append(content, stats); main.append(wrap);
}
function sectionTitle(title, subtitle) { const heading = el('div', undefined, 'section-heading'); heading.append(el('h2', title), el('span', subtitle)); main.append(heading); }
function inputField(label, type='text', value='') { const wrapper=el('label',label), input=el('input'); input.type=type; input.value=value; wrapper.append(input); return [wrapper,input]; }
function selectField(label, choices) { const wrapper=el('label',label), select=el('select'); select.setAttribute('aria-label',label); for(const [value,text] of choices) { const option=el('option',text); option.value=value; select.append(option); } wrapper.append(select); return [wrapper,select]; }
function empty(grid, title, text, gun) { const box=el('div',undefined,'empty'); box.append(el('h2',title),el('p',text)); if(gun)box.append(link('Add the first skin',`editor.html?gun=${encodeURIComponent(gun.id)}`,'button'));grid.append(box); }
function home() {
 hero('Find your next\nfavorite skin.', 'Explore the categories, choose a weapon, and discover its skins and attribute changes.');
 sectionTitle('Choose a gun category',`${catalog.categories.length} categories`);
 const grid=el('div',undefined,'grid'); catalog.categories.forEach((c,i)=>{const guns=catalog.guns.filter(g=>g.category===c.id), card=link('',`${c.id}.html`,'category');card.append(el('span',String(i+1).padStart(2,'0'),'card-number'),el('span','↗','arrow'),el('h3',c.name),el('p',c.description),el('p',`${guns.length} guns · ${countSkins(guns)} skin entries`));grid.append(card);});main.append(grid);
}
function gunArtwork(gun) {
 const art=el('div',undefined,'gun-art');
 const fallback=()=>{art.classList.remove('has-gun-image');art.replaceChildren(el('span','Gun picture coming soon','gun-art-placeholder'));};
 fallback();
 const preview=gun.image?{image:gun.image,label:gun.name}:gun.skins.find(s=>s.image);
 if(preview){
  art.classList.add('has-gun-image');
  const image=el('img');image.src=preview.image;image.alt=gun.image?`${gun.name} gun`:`${gun.name} — ${preview.name} skin`;image.loading='lazy';image.decoding='async';image.addEventListener('error',fallback);art.replaceChildren(image);
  if(!gun.image)art.append(el('span','Skin preview','gun-image-caption'));
 }
 return art;
}
function categoryPage(category) {
 const guns=catalog.guns.filter(g=>g.category===category.id);
 crumbs([['Home','index.html'],[category.name]]);hero(category.name,'Choose a gun to explore its skins and attributes.',guns);
 const [field,search]=inputField('Search guns','search');search.placeholder='Try M4A1…';main.append(field);const grid=el('div',undefined,'grid');sectionTitle('Choose your weapon',`${guns.length} guns`);main.append(grid);
 function render(){grid.replaceChildren(); const found=guns.filter(g=>g.name.toLowerCase().includes(search.value.toLowerCase()));for(const gun of found){const card=link('',`gun.html?id=${encodeURIComponent(gun.id)}`,'gun-card');card.append(el('span',category.name.toUpperCase(),'card-number'),el('span','↗','arrow'),gunArtwork(gun),el('h3',gun.name),el('p',gun.skins.length?`${gun.skins.length} skin entries`:'No skins added yet'));grid.append(card);}if(!found.length)empty(grid,'No guns found','Try a different search.');}search.addEventListener('input',render);render();
}
function skinCard(skin,gun) {
 const card=el('article',undefined,`skin-card ${skin.rarity}`),art=el('div',undefined,'art');
 const fallback=()=>{art.replaceChildren(el('strong',gun.name),el('span','Image not added yet'));};fallback();
 if(skin.image){const image=el('img');image.src=skin.image;image.alt=`${gun.name} — ${skin.name}`;image.loading='lazy';image.addEventListener('error',fallback);art.replaceChildren(image);}
 const info=el('div',undefined,'skin-info');info.append(el('span',skin.rarity,'badge'),el('h2',skin.name,'skin-name'));
 const attrs=el('div',undefined,'attributes');for(const a of skin.attributes){const row=el('div',undefined,'attribute');row.append(el('span',a.type),el('strong',a.value>0?'+'.repeat(a.value):a.value<0?'−'.repeat(-a.value):'No change',a.value>0?'plus':a.value<0?'minus':'neutral'));attrs.append(row);}if(!skin.attributes.length)attrs.append(el('span','Attributes not added yet','neutral'));info.append(attrs);
 const verification=el('p',skin.verified?'Checked against a source':'Community entry · needs verification','verification');if(skin.source){verification.append(document.createTextNode(' · '));const source=link('Source',skin.source);source.target='_blank';source.rel='noopener noreferrer';verification.append(source);}info.append(verification);
 const video = videoEvidence(skin);
 if (video) {
  const preview = link('', video.url, 'video-preview'); preview.target = '_blank'; preview.rel = 'noopener noreferrer'; preview.setAttribute('aria-label', `Watch ${skin.name} source video at ${formatTimestamp(video.seconds)}`);
  const thumbnail = el('img'); thumbnail.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`; thumbnail.alt = `Source video preview for ${skin.name}`; thumbnail.loading = 'lazy'; thumbnail.referrerPolicy = 'no-referrer';
  const label = el('span', `Watch source · ${formatTimestamp(video.seconds)}`, 'video-caption');
  thumbnail.addEventListener('error', () => {thumbnail.remove();preview.classList.add('thumbnail-unavailable');}); preview.append(thumbnail, label); info.append(preview, el('p', 'Video preview. The skin image is shown above.', 'media-note'));
 }
 card.append(art,info);return card;
}
function gunPage(gun) {
 const category=categoryFor(gun);crumbs([['Home','index.html'],[category.name,`${category.id}.html`],[gun.name]]);hero(`${gun.name} skins`,'Compare rarity and attribute changes. + means an increase; − means a decrease.',[gun]);main.append(youtubeSearch(`Free Fire ${gun.name} all skins attributes`));
 if(gun.skins.some(s=>!s.verified))notice('These community entries have not all been checked against the game. Attributes can vary by skin level. Confirm the exact stats in Free Fire before buying.');
 const toolbar=el('div',undefined,'toolbar');const [searchLabel,search]=inputField('Search skins','search');search.placeholder='Search by skin name…';const [rarityLabel,rarity]=selectField('Rarity',[['all','All rarities'],...rarityOrder.map(r=>[r,r[0].toUpperCase()+r.slice(1)])]);rarity.id='rarity-filter';const [sortLabel,sort]=selectField('Sort by',[['default','Catalog order'],['common-to-rare','Rarity: low to high'],['rare-to-common','Rarity: high to low'],['name','Name: A–Z']]);sort.id='sort-filter';toolbar.append(searchLabel,rarityLabel,sortLabel);main.append(toolbar);
 const count=el('p',undefined,'helper');count.setAttribute('aria-live','polite');main.append(count);const grid=el('div',undefined,'skin-grid');grid.id='skin-list';main.append(grid);
 function render(){let skins=gun.skins.filter(s=>(rarity.value==='all'||s.rarity===rarity.value)&&s.name.toLowerCase().includes(search.value.toLowerCase()));if(sort.value==='name')skins.sort((a,b)=>a.name.localeCompare(b.name));else if(sort.value!=='default')skins.sort((a,b)=>(rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity))*(sort.value==='rare-to-common'?-1:1));grid.replaceChildren(...skins.map(s=>skinCard(s,gun)));count.textContent=`Showing ${skins.length} of ${gun.skins.length} skins`;if(!skins.length)empty(grid,gun.skins.length?'No matching skins':'This collection is waiting for you.',gun.skins.length?'Try another name or rarity.':'No skins have been entered for this gun yet.',gun.skins.length?null:gun);}
 for(const input of [search,rarity,sort])input.addEventListener(input===search?'input':'change',render);render();main.append(link('Add or edit skins',`editor.html?gun=${encodeURIComponent(gun.id)}`,'button secondary'));
}
function editor(){
 crumbs([['Home','index.html'],['Manage catalog']]);hero('Build the collection.','Add guns, skins, images, and attributes without editing code.');notice('Changes are saved only in this browser. Export your catalog to back it up or publish it. Other visitors see the catalog.json shipped with the site.');
 const status=el('p','','status');status.setAttribute('role','status');main.append(status);const report=(message,error=false)=>{status.textContent=message;status.className=error?'status error':'status';};
 function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(catalog));localDraft=true;report('Saved in this browser. Export a backup when you finish.');return true;}catch{report('Browser storage is unavailable or full. Your changes remain open; export the catalog now to keep them.',true);return false;}}
 const layout=el('div',undefined,'editor-layout'),panel=el('section',undefined,'panel'),side=el('section',undefined,'panel');layout.append(panel,side);main.append(layout);panel.append(el('h2','Skin details'));
 const form=el('form');panel.append(form);const fields=el('div',undefined,'fields');form.append(fields);
 const [gunLabel,gunSelect]=selectField('Gun',catalog.guns.map(g=>[g.id,`${categoryFor(g).name} / ${g.name}`]));gunLabel.className='full';gunSelect.name='gun';fields.append(gunLabel);
 const requested=new URLSearchParams(location.search).get('gun');if(catalog.guns.some(g=>g.id===requested))gunSelect.value=requested;
 const [nameLabel,name]=inputField('Skin name');name.required=true;name.maxLength=200;const [rarityLabel,rarity]=selectField('Rarity',rarityOrder.map(r=>[r,r[0].toUpperCase()+r.slice(1)]));fields.append(nameLabel,rarityLabel);
 const [imageLabel,image]=inputField('Image URL or relative path');image.placeholder='https://… or images/m4a1/skin.png';imageLabel.className='full';fields.append(imageLabel);
 const [uploadLabel,upload]=inputField('Or choose an image','file');upload.accept='image/png,image/jpeg,image/gif,image/webp';uploadLabel.className='full';fields.append(uploadLabel);
 const [sourceLabel,source]=inputField('Source link (optional)','url');source.placeholder='https://…';sourceLabel.className='full';fields.append(sourceLabel);
 const [videoLabel,videoInput]=inputField('YouTube video link (optional)','url');videoInput.placeholder='https://www.youtube.com/watch?v=…';videoLabel.className='full';fields.append(videoLabel);
 const [timestampLabel,timestampInput]=inputField('Video timestamp (optional)');timestampInput.placeholder='1:24 or 84';timestampLabel.className='full';fields.append(timestampLabel);
 fields.append(el('p','Link to the moment that shows the exact skin and its attributes. A video thumbnail is a source preview; upload a screenshot in the image field to show the skin itself.','helper full'));
 const checkedLabel=el('label',undefined,'checkbox full'),checked=el('input');checked.type='checkbox';checkedLabel.append(checked,document.createTextNode('I checked this skin and its attributes against the source'));fields.append(checkedLabel);
 form.append(el('h3','Attribute changes'),el('p','Use +1 / +2 for increases and −1 / −2 for decreases. Leave empty if the attributes are unknown.','helper'));const rows=el('div');form.append(rows);
 const addAttribute=el('button','+ Add attribute','secondary');addAttribute.type='button';form.append(addAttribute);
 function row(type='Damage',value=1){const wrap=el('div',undefined,'attr-row');const types=attributeTypes.includes(type)?attributeTypes:[type,...attributeTypes];const [typeLabel,typeInput]=selectField('Attribute',types.map(t=>[t,t]));typeInput.value=type;const [valueLabel,valueInput]=selectField('Change',[-3,-2,-1,0,1,2,3].map(n=>[String(n),n>0?`+${n}`:String(n)]));valueInput.value=String(value);const remove=el('button','×','secondary');remove.type='button';remove.setAttribute('aria-label','Remove attribute');remove.addEventListener('click',()=>wrap.remove());wrap.append(typeLabel,valueLabel,remove);rows.append(wrap);}
 addAttribute.addEventListener('click',()=>row());
 const actions=el('div',undefined,'actions'),save=el('button','Save skin'),cancel=el('button','New skin','secondary');save.type='submit';cancel.type='button';actions.append(save,cancel);form.append(actions);let editing=null;
 const getGun=()=>catalog.guns.find(g=>g.id===gunSelect.value);
 function reset(){editing=null;name.value='';rarity.value='uncommon';image.value='';upload.value='';source.value='';videoInput.value='';timestampInput.value='';checked.checked=false;rows.replaceChildren();save.textContent='Save skin';}
 cancel.addEventListener('click',reset);
 upload.addEventListener('change',async()=>{const file=upload.files[0];if(!file)return;if(!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type)||file.size>2*1024*1024){report('Choose a PNG, JPG, GIF, or WebP image smaller than 2 MB.',true);upload.value='';return;}save.disabled=true;try{image.value=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});report('Image attached. Save the skin to keep it.');}catch{report('Could not read the image.',true);}finally{save.disabled=false;}});
 side.append(el('h2','Skins in this gun'));const list=el('div',undefined,'edit-list');side.append(list);
 function renderList(){list.replaceChildren();const gun=getGun();if(!gun.skins.length)list.append(el('p','No skins yet. Add one with the form.','helper'));for(const skin of gun.skins){const item=el('div',undefined,'edit-item'),buttons=el('div',undefined,'actions'),edit=el('button','Edit','secondary'),remove=el('button','Delete','danger');edit.type=remove.type='button';edit.addEventListener('click',()=>{reset();editing=skin.id;name.value=skin.name;rarity.value=skin.rarity;image.value=skin.image;source.value=skin.source;videoInput.value=skin.video||'';timestampInput.value=skin.videoTimestamp===undefined?'':formatTimestamp(skin.videoTimestamp);checked.checked=skin.verified;for(const a of skin.attributes)row(a.type,a.value);save.textContent='Update skin';name.focus();});remove.addEventListener('click',()=>{if(!confirm(`Delete “${skin.name}”? Export a backup first if you want to keep it.`))return;gun.skins=gun.skins.filter(s=>s.id!==skin.id);if(editing===skin.id)reset();persist();renderList();});buttons.append(edit,remove);item.append(el('span',skin.name),buttons);list.append(item);}}
 gunSelect.addEventListener('change',()=>{reset();renderList();});renderList();
 form.addEventListener('submit',event=>{
  event.preventDefault();const gun=getGun();
  const skin={id:editing||`${gun.id}-${crypto.randomUUID()}`,name:name.value.trim(),rarity:rarity.value,image:image.value.trim(),source:source.value.trim(),verified:checked.checked,attributes:[...rows.children].map(r=>({type:r.querySelectorAll('select')[0].value,value:Number(r.querySelectorAll('select')[1].value)}))};
  if(!skin.name)return report('Enter a skin name.',true);
  if(!safeImage(skin.image))return report('Use an HTTPS image, a relative path, or an uploaded image.',true);
  if(skin.source&&!/^https:\/\//i.test(skin.source))return report('Source links must begin with https://.',true);
  const videoText=videoInput.value.trim(), video=youtubeVideo(videoText), timestampText=timestampInput.value.trim();
  if(videoText&&!video)return report('Enter a YouTube watch, Shorts, live, or youtu.be video link.',true);
  const sourceVideo=video||youtubeVideo(skin.source);
  if(timestampText&&!sourceVideo)return report('Add a YouTube link before entering a timestamp.',true);
  if(sourceVideo){
   const seconds=timestampText?parseTimestamp(timestampText):sourceVideo.seconds;
   if(!Number.isInteger(seconds)||seconds<0||seconds>86400)return report('Use seconds, m:ss, or h:mm:ss for a timestamp up to 24 hours.',true);
   skin.video=`https://www.youtube.com/watch?v=${sourceVideo.id}`;skin.videoTimestamp=seconds;
   const previous=editing?gun.skins.find(s=>s.id===editing):null;
   const sourceIsPreviousVideo=previous&&previous.video&&skin.source===previous.source&&youtubeVideo(previous.source)?.id===youtubeVideo(previous.video)?.id;
   if(!skin.source||youtubeVideo(skin.source)?.id===sourceVideo.id||sourceIsPreviousVideo)skin.source=`${skin.video}${seconds?`&t=${seconds}s`:''}`;
  }
  if(skin.verified&&!skin.source)return report('Add a source link before marking this entry as checked.',true);
  if(gun.skins.some(s=>s.id!==editing&&s.name.toLowerCase()===skin.name.toLowerCase()))return report('A skin with this name already exists in this gun. Edit that entry instead.',true);
  if(editing)gun.skins[gun.skins.findIndex(s=>s.id===editing)]=skin;else gun.skins.push(skin);persist();reset();renderList();
 });
 const gunPicture=el('section',undefined,'gun-picture-editor');gunPicture.append(el('h2','Gun selection picture'),el('p','This picture appears on the gun card in its category. Select the gun using the Gun field above.','helper'));
 const [gunImageLabel,gunImage]=inputField('Gun picture URL or relative path');gunImage.placeholder='images/guns/m4a1.png';
 const [gunUploadLabel,gunUpload]=inputField('Or choose a gun picture','file');gunUpload.accept='image/png,image/jpeg,image/gif,image/webp';
 const saveGunPicture=el('button','Save gun picture','secondary');saveGunPicture.type='button';
 const picturePreview=el('div');
 const showGunPicture=()=>{gunImage.value=getGun().image||'';gunUpload.value='';picturePreview.replaceChildren(gunArtwork(getGun()));};
 gunPicture.append(gunImageLabel,gunUploadLabel,picturePreview);const pictureActions=el('div',undefined,'actions');pictureActions.append(saveGunPicture);gunPicture.append(pictureActions);side.append(gunPicture);showGunPicture();
 gunSelect.addEventListener('change',showGunPicture);
 gunUpload.addEventListener('change',async()=>{
  const file=gunUpload.files[0];if(!file)return;
  if(!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type)||file.size>2*1024*1024){report('Choose a PNG, JPG, GIF, or WebP gun picture smaller than 2 MB.',true);gunUpload.value='';return;}
  saveGunPicture.disabled=true;const selectedGun=getGun().id;
  try{const value=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});if(getGun().id!==selectedGun)return;gunImage.value=value;picturePreview.replaceChildren(gunArtwork({...getGun(),image:value}));report('Gun picture attached. Click Save gun picture to keep it.');}
  catch{report('Could not read the gun picture.',true);}finally{saveGunPicture.disabled=false;}
 });
 saveGunPicture.addEventListener('click',()=>{const value=gunImage.value.trim();if(!safeImage(value))return report('Use an HTTPS image, a relative path, or an uploaded gun picture.',true);getGun().image=value;persist();showGunPicture();});
 const addGunDetails=el('details');addGunDetails.append(el('summary','Add a gun'));const gunForm=el('form');addGunDetails.append(gunForm);const [newNameLabel,newName]=inputField('Gun name');newName.required=true;newName.maxLength=200;const [newCategoryLabel,newCategory]=selectField('Category',catalog.categories.map(c=>[c.id,c.name]));const addGun=el('button','Add gun');addGun.type='submit';gunForm.append(newNameLabel,newCategoryLabel,el('div',undefined,'actions'));gunForm.lastChild.append(addGun);side.append(addGunDetails);
 gunForm.addEventListener('submit',event=>{event.preventDefault();const id=slug(newName.value.trim());if(!id||catalog.guns.some(g=>g.id===id))return report('Enter a unique gun name using letters or numbers.',true);const gun={id,name:newName.value.trim(),category:newCategory.value,skins:[]};catalog.guns.push(gun);const option=el('option',`${categoryFor(gun).name} / ${gun.name}`);option.value=id;gunSelect.append(option);gunSelect.value=id;newName.value='';persist();reset();renderList();showGunPicture();});
 const transfer=el('section',undefined,'panel');transfer.style.marginTop='24px';transfer.append(el('h2','Back up or publish your catalog'),el('p','Export downloads catalog.json, including your uploaded images. To make your changes visible to everyone, replace the site’s catalog.json with that download and publish the updated website. Import restores an exported catalog in this browser.','helper'));
 const transferActions=el('div',undefined,'actions'),exportButton=el('button','Export catalog'),resetButton=el('button','Reset browser draft','danger');transferActions.append(exportButton,resetButton);transfer.append(transferActions);const [importLabel,importInput]=inputField('Import a catalog backup','file');importInput.accept='.json,application/json';transfer.append(importLabel);main.append(transfer);
 exportButton.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(catalog,null,2)+'\n'],{type:'application/json'}));const a=link('','');a.href=url;a.download='catalog.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);report('Catalog exported. Keep this file as your backup; publishing is a separate step.');});
 importInput.addEventListener('change',async()=>{const file=importInput.files[0];if(!file)return;try{if(file.size>15*1024*1024)throw Error('Catalog files must be smaller than 15 MB.');const imported=validate(JSON.parse(await file.text()));if(!confirm('Replace your current browser catalog? Export it first if you want a backup.'))return;catalog=imported;persist();main.replaceChildren();editor();}catch(error){report(`Import failed: ${error.message}`,true);}finally{importInput.value='';}});
 resetButton.addEventListener('click',()=>{if(!confirm('Discard all browser changes and return to the published catalog? Export a backup first.'))return;try{localStorage.removeItem(STORAGE_KEY);}catch{return report('Could not clear browser storage.',true);}catalog=structuredClone(baseCatalog);localDraft=false;main.replaceChildren();editor();});
}
async function start(){try{const response=await fetch('catalog.json');if(!response.ok)throw Error(`Catalog request failed (${response.status}).`);baseCatalog=validate(await response.json());catalog=structuredClone(baseCatalog);let warning='';try{const draft=localStorage.getItem(STORAGE_KEY);if(draft){catalog=validate(JSON.parse(draft));for(const gun of catalog.guns){if(gun.image===undefined){const published=baseCatalog.guns.find(g=>g.id===gun.id);if(published?.image)gun.image=published.image;}}localDraft=true;}}catch{warning='Your browser draft could not be loaded. The published catalog is shown instead; the stored draft has not been deleted.';}
 main.replaceChildren();if(warning)notice(warning);if(localDraft)notice('You are viewing your browser draft. Export it from Manage catalog to back it up or publish it.');
 const route=location.pathname.split('/').pop().replace(/\.html$/,'')||'index';const id=new URLSearchParams(location.search).get('id');
 if(route==='editor')editor();else if(route==='index')home();else if(catalog.categories.some(c=>c.id===route))categoryPage(catalog.categories.find(c=>c.id===route));else {const gun=catalog.guns.find(g=>g.id===(route==='gun'?id:route));if(gun)gunPage(gun);else{hero('Gun not found.','Return to the catalog and choose another weapon.');main.append(link('Explore categories','index.html','button'));}}
 document.title=(main.querySelector('h1')?.textContent.replace(/\n/g,' ')||'Catalog')+' | Free Fire Skin Vault';
}catch(error){main.replaceChildren(el('h1','Unable to load the catalog'),el('p',`${error.message} Serve this site through an HTTP server, rather than opening the HTML file directly.`,'notice'));}}
start();
