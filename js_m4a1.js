const skins = [
  {
    name: "Stormy Ascent",
    rarity: "mythic",
    image: "images/stormy_ascent.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Armour Penetration", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "Infernal Draco",
    rarity: "artifact",
    image: "m4a1_images/m4a1_infernal_draco.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - Sunrise Realm",
    rarity: "mythic",
    image: "m4a1_images/m4a1_sunrise_realm.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "M4A1 - Shadow Netherworld",
    rarity: "mythic",
    image: "m4a1_images/m4a1_shadow_netherworld.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Range", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "M4A1 - Infernal Netherworld",
    rarity: "mythic",
    image: "m4a1_images/m4a1_infernal_netherworld.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - Glacier Netherworld",
    rarity: "mythic",
    image: "m4a1_images/m4a1_glacier_netherworld.gif",
    attributes: [
      { type: "Armour Penetration", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
   {
    name: "M4A1 - Venom Netherworld",
    rarity: "mythic",
    image: "m4a1_images/m4a1_venom_netherworld.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Armour Penetration", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
   {
    name: "M4A1 - Genos",
    rarity: "mythic",
    image: "m4a1_images/m4a1_genos.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
   {
    name: "M4A1 - Griffin's Fury",
    rarity: "mythic",
    image: "m4a1_images/m4a1_griffins_fury.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Range", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - Red Griffin",
    rarity: "mythic",
    image: "m4a1_images/m4a1_red_griffin.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "M4A1 - Blue Griffin",
    rarity: "mythic",
    image: "m4a1_images/m4a1_blue_griffin.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Reload Speed", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "M4A1 - Purple Griffin",
    rarity: "mythic",
    image: "m4a1_images/m4a1_purple_griffin.gif",
    attributes: [
      { type: "Magazine", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "M4A1 - Naruto Theme",
    rarity: "mythic",
    image: "m4a1_images/m4a1_naruto_theme.gif",
    attributes: [
      { type: "Armour Penetration", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "M4A1 - Zombie Attack",
    rarity: "epic",
    image: "m4a1_images/m4a1_zombie_attack.gif",
    attributes: [
      { type: "Rate of Fire", value: 1 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: 1 }
    ]
  },
  {
    name: "M4A1 - Feline's Burst",
    rarity: "epic",
    image: "m4a1_images/m4a1_felines_burst.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Movement Speed", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - FFCS",
    rarity: "epic",
    image: "m4a1_images/m4a1_ffcs.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - Flaming Skull",
    rarity: "epic",
    image: "m4a1_images/m4a1_flaming_skull.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Magazine", value: 1 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "M4A1 - Scorching Sands",
    rarity: "epic",
    image: "m4a1_images/m4a1_scorching_sands.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "M4A1 - Cataclysm",
    rarity: "epic",
    image: "m4a1_images/m4a1_cataclysm.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "M4A1 - Pink Laminate",
    rarity: "epic",
    image: "m4a1_images/m4a1_pink_laminate.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - Wild Carnival",
    rarity: "epic",
    image: "m4a1_images/m4a1_wild_carnival.gif",
    attributes: [
      { type: "Magazine", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Rate of Fire", value: -1 }
    ]
  },
  {
    name: "M4A1 - Star General",
    rarity: "epic",
    image: "m4a1_images/m4a1_star_general.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Range", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "M4A1 - S19 Exclusive: Kelly 'The Swift' ",
    rarity: "epic",
    image: "m4a1_images/m4a1_s19_exsclusive_kelly.jpg",
    attributes: [
      { type: "Range", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - Star Soul",
    rarity: "epic",
    image: "m4a1_images/m4a1_star_soul.jpg",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - Winter Warrior",
    rarity: "epic",
    image: "m4a1_images/m4a1_winter_warrior.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "M4A1 - Mamba Gnaw",
    rarity: "rare",
    image: "m4a1_images/m4a1_mamba_gnaw.jpg",
    attributes: [
      { type: "Reload Speed", value: 1 },
      { type: "Damage", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - Sterling Futurnetic",
    rarity: "rare",
    image: "m4a1_images/m4a1_sterling_future.jpg",
    attributes: [
      { type: "Range", value: 1 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "The Golden m4a1",
    rarity: "rare",
    image: "m4a1_images/the_golden_m4a1.jpg",
    attributes: [
      { type: "Accuracy", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "M4A1 - Master of minds",
    rarity: "rare",
    image: "m4a1_images/m4a1_master_of_minds.jpg",
    attributes: [
      { type: "Reload Speed", value: 1 },
      { type: "Rate of Fire", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "M4A1 - Vandal revolt",
    rarity: "rare",
    image: "m4a1_images/m4a1_vandal_revolt.jpg",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "M4A1 - deadly bat",
    rarity: "rare",
    image: "m4a1_images/m4a1_deadly_bat.jpg",
    attributes: [
      { type: "Accuracy", value: 1 },
      { type: "Damage", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "M4A1 - artificial intelligence",
    rarity: "rare",
    image: "m4a1_images/m4a1_artificial_intelligence.jpg",
    attributes: [
      { type: "Magazine", value: 2 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - scorpion",
    rarity: "rare",
    image: "m4a1_images/m4a1_scorpion.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "M4A1 - Stillness wish",
    rarity: "rare",
    image: "m4a1_images/m4a1_stillness_wish.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "M4A1 - ice blue",
    rarity: "rare",
    image: "m4a1_images/m4a1_ice_blue.jpg",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "M4A1 - Flaming wolf",
    rarity: "rare",
    image: "m4a1_images/m4a1_flaming_wolf.jpg",
    attributes: [
      { type: "Accuracy", value: 1 }
    ]
  },
  {
    name: "M4A1 - skyline: heatwave",
    rarity: "rare",
    image: "m4a1_images/skyline_heatwave.jpg",
    attributes: [
      { type: "Damege", value: 2 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "M4A1 - Pink heavens",
    rarity: "rare",
    image: "m4a1_images/pink_heavans.jpg",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "M4A1 - wagger swagger",
    rarity: "rare",
    image: "m4a1_images/m4a1_wagger_swagger.jpg",
    attributes: [
      { type: "Damage", value: 1 },
      { type: "Magazine", value: 1 },
      { type: "Movement Speed", value: -1 }
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

