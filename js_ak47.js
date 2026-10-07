const skins = [
  {
    name: "Skull Hunter",
    rarity: "epic",
    image: "images/skull_hunter.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Reload", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "Paradox Enforcer",
    rarity: "mythic",
    image: "images/paradox_enforcer.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Armour Penetration", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "Pigment Splash",
    rarity: "epic",
    image: "images/pigment_splash.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
   {
    name: "Private Eye",
    rarity: "rare",
    image: "images/private_eye.jpg",
    attributes: [
      { type: "Range", value: 1 },
      { type: "Accuracy", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
   {
    name: "Waggor's Wonder",
    rarity: "uncommon",
    image: "images/waggors_wonder.jpg",
    attributes: [
      { type: "Accuracy", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "Sound Crafter",
    rarity: "epic",
    image: "images/sound_crafter.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Armour Penetration", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "AK47 - S20 Exclusive: Moco",
    rarity: "epic",
    image: "images/ak47_s20_exclusive_moco.jpg",
    attributes: [
      { type: "Accuracy", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "Water Balloon",
    rarity: "epic",
    image: "images/water_baloon.gif",
    attributes: [
      { type: "Magazine", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "AK47 - Winterlands",
    rarity: "epic",
    image: "images/ak47_winterlands.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "The Flaming Dragon",
    rarity: "epic",
    image: "images/the_flaming_dragon.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "AK47 - Mamba Gnaw",
    rarity: "rare",
    image: "images/ak47_mamba_gnaw.jpg",
    attributes: [
      { type: "Damage", value: 1 },
      { type: "Reload Speed", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "The Golden AK47",
    rarity: "rare",
    image: "images/the_golden_ak47.jpg",
    attributes: [
      { type: "Rate of Fire", value: 1 },
      { type: "Magazine", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "Soloist",
    rarity: "rare",
    image: "images/soloist.jpg",
    attributes: [
      { type: "Damage", value: 1 },
      { type: "Magazine", value: 1 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "Digital Invasion",
    rarity: "rare",
    image: "images/digital_invasion.jpg",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "Pumpkin Flames",
    rarity: "epic",
    image: "images/ak47_pumpkin_flame.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "Unicorn's Rage",
    rarity: "epic",
    image: "images/unicorns_rage_ak47.gif",
    attributes: [
      { type: "Magazine", value: 2 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "Unicorn's Rage (Ice Age)",
    rarity: "mythic",
    image: "images/unicorns_rage_ice_age.gif",
    attributes: [
      { type: "Reload Speed", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "Unicorn's Rage (Violet)",
    rarity: "mythic",
    image: "images/unicorns_rage_violet.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "Unicorn's Rage",
    rarity: "mythic",
    image: "images/unicorns_rage_lava.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Magazine", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "AK47 - Justice Fighter",
    rarity: "rare",
    image: "images/ak47_justice_fighter.jpg",
    attributes: [
      { type: "Armour Penetration", value: 1 },
      { type: "Rate of Fire", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "AK47 - Legendary Cobra",
    rarity: "rare",
    image: "images/ak47_legendary_cobra.jpg",
    attributes: [
      { type: "Range", value: 1 },
      { type: "Damage", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "Storm Whisperer",
    rarity: "rare",
    image: "images/storm_whisperer.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "Digital Camouflage",
    rarity: "rare",
    image: "images/digital_camouflage.jpg",
    attributes: [
      { type: "Rate of Fire", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
   {
    name: "AK47 - Emerald Power",
    rarity: "rare",
    image: "images/ak47_emerald_power.jpg",
    attributes: [
      { type: "Damage", value: 1 },
      { type: "Range", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
   {
    name: "AK47 - Urban Rager",
    rarity: "rare",
    image: "images/ak47_urban_rager.jpg",
    attributes: [
      { type: "Reload Speed", value: 1 },
      { type: "Rate of Fire", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
   {
    name: "AK47 - Deaths Eye",
    rarity: "rare",
    image: "images/ak47_deaths_eye.jpg",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Magazine", value: -1 }
    ]
  },
   {
    name: "AK47 - Legendary Cobra",
    rarity: "rare",
    image: "images/ak47_legendary_cobra.jpg",
    attributes: [
      { type: "Range", value: 1 },
      { type: "Damage", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
   {
    name: "Bumblebee",
    rarity: "rare",
    image: "images/bumblebee.jpg",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Rabge", value: -1 }
    ]
  },
   {
    name: "AK47 - Red Samurai",
    rarity: "rare",
    image: "images/ak47_red_samurai.jpg",
    attributes: [
      { type: "Magazine", value: 2 },
      { type: "Rate of Fire", value: -1 }
    ]
  },
   {
    name: "AK47 - Zombie Attack",
    rarity: "rare",
    image: "images/ak47_zombie_attack.jpg",
    attributes: [
      { type: "Rate of Fire", value: 1 },
      { type: "Damage", value: 1 }
    ]
  },
   {
    name: "AK47 - Gold Coated",
    rarity: "rare",
    image: "images/ak47_gold_coated.jpg",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  // Add more skins here...
];

const rarityOrder = ["uncommon", "rare", "epic", "mythic", "artifact"];

function createSkinCard(skin) {
  const card = document.createElement("div");
  card.className = `skin-card ${skin.rarity}`;

  card.innerHTML = `
    <img src="${skin.image}" alt="${skin.name}">
    <div class="skin-name">${skin.name}</div>
    <div class="attributes">
      ${skin.attributes.map(attr => `
        <span class="${attr.value > 0 ? 'plus' : 'minus'}">
          ${attr.value > 0 ? '+'.repeat(attr.value) : '-' + Math.abs(attr.value)} ${attr.type}
        </span>
      `).join("")}
    </div>
  `;

  return card;
}

function displaySkins(list) {
  const container = document.getElementById("skin-list");
  container.innerHTML = "";
  list.forEach(skin => {
    container.appendChild(createSkinCard(skin));
  });
}

function filterAndSortSkins() {
  const rarity = document.getElementById("rarity-filter").value;
  const sort = document.getElementById("sort-filter").value;

  // Filter first
  let filtered = rarity === "all" ? [...skins] : skins.filter(s => s.rarity === rarity);

  // Sort only if needed
  if (sort === "common-to-rare") {
    filtered.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
  } else if (sort === "rare-to-common") {
    filtered.sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
  }
  // No sort if "default"

  displaySkins(filtered);
}

// Event Listeners
document.getElementById("rarity-filter").addEventListener("change", filterAndSortSkins);
document.getElementById("sort-filter").addEventListener("change", filterAndSortSkins);

// Initial display
displaySkins(skins);

