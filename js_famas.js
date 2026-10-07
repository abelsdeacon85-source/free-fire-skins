const skins = [
  {
    name: "swagger ownage",
    rarity: "epic",
    image: "famas_images/famas swagger_ownage.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Damage", value: 1 },
      { type: "Reload", value: -1 }
    ]
  },
  {
    name: "black lava",
    rarity: "mythic",
    image: "famas_images/famas_black_lava.gif",
    attributes: [
      { type: "Range", value: 2 },
      { type: "Rate of fire", value: 1 },
      { type: "Reload speed", value: -1}
    ]
  },
  {
    name: "Black widow",
    rarity: "mythic",
    image: "famas_images/famas_black_widow.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Range", value: -1 }
    ]
  },
  {
    name: "Black widow lighting",
    rarity: "mythic",
    image: "famas_images/famas_black_widow_lighting.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Range", value: -1 }
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


// JavaScript source code
