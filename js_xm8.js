const skins = [
  {
    name: "Stormy Ascent",
    rarity: "mythic",
    image: "images/stormy_ascent.gif",
    attributes: [
      { type: "Accuracy", value: 2 },
      { type: "Armmor Penetration", value: 1 },,
      { type: "Magazine", value: -1 }
    ]
  },
  {
    name: "Scar Megalodon",
    rarity: "artifact",
    image: "images/scar-megalodon.png",
    attributes: [
      { type: "damage", value: 3 },
      { type: "reload", value: 1 }
    ]
  },
  {
    name: "SCAR - Phantom",
    rarity: "epic",
    image: "images/scar-phantom.png",
    attributes: [
      { type: "rate of fire", value: 2 },
      { type: "movement speed", value: -1 }
    ]
  }
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


