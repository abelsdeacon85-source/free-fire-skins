const skins = [
  {
    name: "scar - cupid",
    rarity: "epic",
    image: "scar_images/scar_cupid.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "scar - blood moon",
    rarity: "epic",
    image: "scar_images/scar_blood_moon.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Range", value: 1 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "scar - water elemental",
    rarity: "epic",
    image: "scar_images/scar_water_elemental.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "scar - winter warrior",
    rarity: "epic",
    image: "scar_images/scar_winter_warrior.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "scar - racer",
    rarity: "epic",
    image: "scar_images/scar_racer.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "scar - cheetah: fang",
    rarity: "rare",
    image: "scar_images/scar_fang.jpg",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "scar - old fashioned",
    rarity: "rare",
    image: "scar_images/scar_old_fashioned.jpg",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "scar - futuristic",
    rarity: "epic",
    image: "scar_images/scar_futuristic.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "scar - phantom assassin",
    rarity: "epic",
    image: "scar_images/scar_phantom_assassin.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "scar - aurous dragon",
    rarity: "epic",
    image: "scar_images/scar_aurous_dragon.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "scar - pink devil",
    rarity: "rare",
    image: "scar_images/scar_pink_devil.jpg",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Rate of Fire", value: -1 }
    ]
  },
  {
    name: "scar - violet terror",
    rarity: "rare",
    image: "scar_images/scar_violet_terror.jpg",
    attributes: [
      { type: "Rate of Fire", value: 1 }
    ]
  },
  {
    name: "scar - deadly panther",
    rarity: "rare",
    image: "scar_images/scar_deadly_panther.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "scar - ultimate titan",
    rarity: "mythic",
    image: "scar_images/scar_ultimate_titan.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "scar - the beast",
    rarity: "mythic",
    image: "scar_images/scar_the_beast.gif",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Reload speed", value: -1 }
    ]
  },
  {
    name: "scar - inferno",
    rarity: "mythic",
    image: "scar_images/scar_inferno.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Reload speed", value: -1 }
    ]
  },
  {
    name: "scar - paradise",
    rarity: "mythic",
    image: "scar_images/scar_paradise.gif",
    attributes: [
      { type: "Reload speed", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "scar - golden strike",
    rarity: "mythic",
    image: "scar_images/scar_golden_strike.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "scar - royal warrior",
    rarity: "rare",
    image: "scar_images/scar_royal_warrior.jpg",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "scar - gusto freerunner",
    rarity: "rare",
    image: "scar_images/scar_gusto_freerunner.jpg",
    attributes: [
      { type: "Reload Speed", value: 1 },
      { type: "Rate of Fire", value: 1 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "the golden scar",
    rarity: "rare",
    image: "scar_images/the_golden_scar.jpg",
    attributes: [
      { type: "Damage", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "scar - megalodon aplha",
    rarity: "artifact",
    image: "scar_images/scar_magalodon_alpha.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "scar - glistening daystar",
    rarity: "mythic",
    image: "scar_images/scar_glistening_daystar.gif",
    attributes: [
      { type: "Armour Penetration", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "scar - mystic seeker",
    rarity: "epic",
    image: "scar_images/scar_mystic_seeker.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Range", value: 1 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "scar - party animal",
    rarity: "rare",
    image: "scar_images/scar_party_animal.jpg",
    attributes: [
      { type: "Magazine", value: 1 },
      { type: "Rate of Fire", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "scar - shark attack",
    rarity: "rare",
    image: "scar_images/scar_shark_attack.jpg",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Reload Speed", value: -1 }
    ]
  },
  {
    name: "scar - special forces",
    rarity: "rare",
    image: "scar_images/scar_special_forces.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "s22 exclusive:maxim",
    rarity: "rare",
    image: "scar_images/scar_s22_exclusive_maxim.jpg",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "scar - monster attack",
    rarity: "mythic",
    image: "scar_images/scar_monster_attack.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Accuracy", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "scar - haven warrior",
    rarity: "epic",
    image: "scar_images/scar_haven_warrior.gif",
    attributes: [
      { type: "Rate of Fire", value: 2 },
      { type: "Armour Penetration", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "scar - zombie attack",
    rarity: "epic",
    image: "scar_images/scar_zombie_attack.gif",
    attributes: [
      { type: "Damage", value: 1 },
      { type: "Mobility", value: 1 },
      { type: "Rate of Fire", value: 1 }
    ]
  },
  {
    name: "scar - nightfire kami",
    rarity: "epic",
    image: "scar_images/scar_nightfire_kami.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Rate of Fire", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "scar - mamba gnaw",
    rarity: "rare",
    image: "scar_images/scar_mamba_gnaw.jpg",
    attributes: [
      { type: "Reload Speed", value: 1 },
      { type: "Damage", value: 1 },
      { type: "Movement Speed", value: -1 }
    ]
  },
  {
    name: "scar - Mad Samurai",
    rarity: "rare",
    image: "scar_images/scar_mad_samura.jpg",
    attributes: [
      { type: "None", value: 0 }
    ]
  },
  {
    name: "scar - waggor's wonder",
    rarity: "uncommon",
    image: "scar_images/scar_waggors_wonder.jpg",
    attributes: [
      { type: "Range", value: 1 },
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "scar - purple quartz",
    rarity: "uncommon",
    image: "scar_images/scar_purple_quartz.jpg",
    attributes: [
      { type: "Magazine", value: 1 },
      { type: "Accuracy", value: -1 }
    ]
  },
  {
    name: "scar - yellow manes",
    rarity: "rare",
    image: "scar_images/scar_yellow_manes.jpg",
    attributes: [
      { type: "None", value: 0 }
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



