const skins = [
  {
    name: "Groza - booyah",
    rarity: "rare",
    image: "groza_images/groza_booyah.jpg",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "groza - golden roar",
    rarity: "epic",
    image: "groza_images/groza_golden_roar.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "groza - tagger's revolt",
    rarity: "epic",
    image: "groza_images/groza_taggers_revolt.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "groza - mamba gnaw",
    rarity: "rare",
    image: "groza_images/groza_mamba_gnaw.jpg",
    attributes: [
      { type: "Accuracy", value: 1 },
      { type: "Magazine", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "groza - s24 exclusive: wrathful",
    rarity: "rare",
    image: "groza_images/groza_s24_exclusive.jpg",
    attributes: [
      { type: "Movement Speed", value: 1 },
      { type: "Accuracy", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "groza - pharaoh's wings",
    rarity: "rare",
    image: "groza_images/pharaohs_wings.jpg",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Rate of Fire", value: -1 }
    ]
  },
  {
    name: "groza - bang! popblaster",
    rarity: "artifact",
    image: "groza_images/groza_bang_popblaster.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "groza - poppin shootin",
    rarity: "epic",
    image: "groza_images/groza_poppin_shootin.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Magazine", value: 1 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "groza - sterling futurnetic",
    rarity: "epic",
    image: "groza_images/groza_sterling_futurenetic.gif",
    attributes: [
      { type: "Armour Penetration", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
   {
    name: "groza - great plunder",
    rarity: "epic",
    image: "groza_images/groza_great_plunder.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
   {
    name: "groza - runestone sigil",
    rarity: "mythic",
    image: "groza_images/groza_runestone_sigil.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
   {
    name: "groza - bony tunes",
    rarity: "mythic",
    image: "groza_images/groza_bony_tunes.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
   {
    name: "groza - heartseeker",
    rarity: "epic",
    image: "groza_images/groza_heart_seeker.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "groza - ffcs",
    rarity: "rare",
    image: "groza_images/groza_ffcs.jpg",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "groza - operano sheng",
    rarity: "epic",
    image: "groza_images/groza_operano_sheng.gif",
    attributes: [
      { type: "Armour Penetration", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "groza - winterlands",
    rarity: "rare",
    image: "groza_images/groza_winterlands.jpg",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "groza - airbusrt entranced",
    rarity: "mythic",
    image: "groza_images/groza_airburst_entranced.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "groza - thunder electrified",
    rarity: "mythic",
    image: "groza_images/groza_thunder_electrified.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Armour Penetration", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "groza - blueflame",
    rarity: "uncommon",
    image: "groza_images/blueflame.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "groza - reel on",
    rarity: "uncommon",
    image: "groza_images/groza_reel_on.jpg",
    attributes: [
      { type: "Armour Penetration", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "groza - swagger ownage",
    rarity: "rare",
    image: "groza_images/groza_swaager_ownage.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "groza - flames enchanted",
    rarity: "mythic",
    image: "groza_images/groza_flames_enchanted.gif",
    attributes: [
      { type: "Armour Penetration", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "groza - jewel mystified",
    rarity: "mythic",
    image: "groza_images/groza_jewel_mystified.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Range", value: 1 },
      { type: "Relod Speed", value: -1 }
    ]
  },
];

const rarityOrder = ["uncommon", "rare", "epic", "mythic", "artifact"];

function createSkinCard(skin) {
  const card = document.createElement("div");
  card.className = `skin-card ${skin.rarity}`;

  card.innerHTML = `
    <img src="${skin.image}" alt="${skin.name}">
    <div class="skin-info">
      <div class="skin-name">${skin.name}</div>
      <div class="attributes">
        ${skin.attributes.map(attr => `
          <span class="${attr.value > 0 ? 'plus' : 'minus'}">
            ${attr.value > 0 ? '+'.repeat(attr.value) : '-' + Math.abs(attr.value)} ${attr.type}
          </span>
        `).join("")}
      </div>
    </div>
  `;
  return card;
}

function displaySkins(list) {
  const container = document.getElementById("skin-list");
  container.innerHTML = "";
  list.forEach(skin => container.appendChild(createSkinCard(skin)));
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


document.getElementById("rarity-filter").addEventListener("change", filterAndSortSkins);
document.getElementById("sort-filter").addEventListener("change", filterAndSortSkins);
displaySkins(skins);



