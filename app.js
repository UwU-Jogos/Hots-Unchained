let lftCards = [];
let rgtCards = [];
let midCards = [];
let draggedCard = null;
let dragOrigin = null;
let pickRoutine = [[1, 2, 2, 1], [1, 2, 1]]
let mapRoutine = []
let currentTurn = null;
let randomMaps = [];
let reroll = [1, 1];



document.addEventListener('DOMContentLoaded', function () {
  // Prevenir comportamento padrão de arrastar em elementos não-arrastáveis
  document.addEventListener('dragstart', function (event) {
    if (!event.target.classList.contains('card')) {
      event.preventDefault();
    }
  });

  // Adicionar evento para prevenir seleção de texto no container de cards
  document.getElementById("cards-container").addEventListener("mousedown", function (event) {
    if (event.target === this) {
      event.preventDefault();
    }
  });
});

const maps = [
  "alterac-pass",
  "battlefield-of-eternity",
  // "blackhearts-bay",
  "braxis-holdout",
  "cursed-hollow",
  "dragon-shire",
  "garden-of-terror",
  "hanamura-temple",
  // "haunted-mines",
  "infernal-shrines",
  "sky-temple",
  "tomb-of-the-spider-queen",
  "towers-of-doom",
  "volskaya-foundry",
  // "warhead-junction"
];

function sortHeroesByRole(heroes) {
  const roleOrder = ["tank", "ranged", "melee", "healer", "bruiser"];
  const sortedHeroes = {
    tank: [],
    ranged: [],
    melee: [],
    healer: [],
    bruiser: [],
  };
  heroes.forEach((hero) => {
    const role = heroRoles[hero.match(/(?<=,)[^\]]+/)[0]];
    sortedHeroes[role].push(hero);
  });

  let orderedHeroes = [];
  roleOrder.forEach((role) => {
    orderedHeroes = orderedHeroes.concat(sortedHeroes[role]);
  });

  return orderedHeroes;
}



function displayTeamCards(teamCards, containerId) {
  const sortedCards = sortHeroesByRole(teamCards);
  const container = document.getElementById(containerId);

  if (containerId === "left-draft-container" || containerId === "right-draft-container") {
    // Get existing rows or create them if they don't exist
    let topRow = container.querySelector('.draft-row:first-child');
    let bottomRow = container.querySelector('.draft-row:last-child');

    if (!topRow) {
      topRow = document.createElement("div");
      topRow.className = "draft-row";
      container.appendChild(topRow);
    }

    if (!bottomRow) {
      bottomRow = document.createElement("div");
      bottomRow.className = "draft-row";
      container.appendChild(bottomRow);
    }

    // Clear existing cards, keeping placeholders
    topRow.querySelectorAll('.card').forEach(card => card.remove());
    bottomRow.querySelectorAll('.card').forEach(card => card.remove());

    // Ensure there are enough placeholders
    while (topRow.children.length < 2) {
      const placeholder = document.createElement("div");
      placeholder.className = "card-placeholder";
      topRow.appendChild(placeholder);
    }
    while (bottomRow.children.length < 3) {
      const placeholder = document.createElement("div");
      placeholder.className = "card-placeholder";
      bottomRow.appendChild(placeholder);
    }

    // Add sorted cards, replacing placeholders
    for (let i = 0; i < sortedCards.length; i++) {
      const talentCode = sortedCards[i];
      const card = createTalentCard();
      displayTalentImages(talentCode, card, containerId);
      card.classList.add('card');

      if (i < 2) {
        topRow.children[i].replaceWith(card);
      } else {
        bottomRow.children[i - 2].replaceWith(card);
      }
    }
  } else {
    // For cards-container, keep the original layout
    container.innerHTML = ""; // Clear previous cards
    for (let i = 0; i < sortedCards.length; i++) {
      const talentCode = sortedCards[i];
      const card = createTalentCard();
      displayTalentImages(talentCode, card, containerId);
      card.classList.add('card');
      container.appendChild(card);
    }
  }
}




// Function to generate a random integer between min and max
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to get a random hero from the heroes array
function getRandomHero() {
  const randomIndex = getRandomInt(0, heroes.length - 1);
  return heroes[randomIndex];
}

function remove_from_list(list, value) {
  for (var i = 0; i < list.length; i++) {
    if (list[i] === value) {
      list.splice(i, 1);
      i--;
    }
  }
  return list;
}


function generateRandomString(usedHeroes) {
  let randomHero;

  // Generate a random hero until it is not in the usedHeroes array
  do {
    randomHero = getRandomHero();
  } while (usedHeroes.includes(randomHero));

  // Add the new hero to the usedHeroes array
  usedHeroes.push(randomHero);

  // Get the talents of the hero
  const heroTalents = heroes_talents[randomHero];

  // Generate a random number for each talent
  let randomNumbers = "";
  for (let i = 0; i < heroTalents.length; i++) {
    const maxTalentIndex = heroTalents[i].length;

    // Apply the talent limitations
    let chosenTalent;
    let invalidTalents = [];
    do {
      chosenTalent = getRandomInt(1, maxTalentIndex);
      if (i === 6) {
        const Ultimate = randomNumbers[3];

        // Check for hero-specific limitations
        switch (randomHero) {
          case "fenix":
            if (Ultimate === "1") {
              invalidTalents = [1];
            }
            break;
          case "zeratul":
            if (Ultimate === "2") {
              invalidTalents = [1];
            }
            break;
          case "varian":
            invalidTalents = remove_from_list([1, 2, 3], parseInt(randomNumbers[1]));
            break;
          case "garrosh":
            invalidTalents = remove_from_list([1, 2], parseInt(Ultimate))
            if (randomNumbers[0] !== "3") {
              invalidTalents += 4;
            }
            break;
          default:
            if (randomHero !== "deathwing" && randomHero !== "tracer" && randomHero !== "maiev") {
              invalidTalents = remove_from_list([1, 2], parseInt(Ultimate));
            }
            break;
        }
      }
    } while ((chosenTalent > maxTalentIndex) || (invalidTalents.includes(chosenTalent)));

    randomNumbers += chosenTalent;
  }

  // Return the generated string
  return `[T${randomNumbers},${randomHero}]`;
}


// Function to create a talent card element
function createTalentCard() {
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("draggable", "true");

  card.addEventListener("mousedown", function (event) {
    // Prevenir a propagação do evento para evitar seleção de texto
    event.stopPropagation();
  });

  card.addEventListener("dragstart", function (event) {
    this.classList.add('dragging');
    dragOrigin = this.closest('#left-draft-container, #right-draft-container, #cards-container').id;
    draggedCard = this.getAttribute("data-talent-code");
  });

  card.addEventListener("dragend", function (event) {
    this.classList.remove('dragging');
    draggedCard = null;
    dragOrigin = null;
  });

  return card;
}

// Functions to get the image source of a talent or hero
function getImageSrc(talent) {
  return `abilitytalents/${talent}.png`;
}

function getHeroImageSrc(heroName) {
  return `heroportraits/ui_targetportrait_hero_${heroName}.png`;
}

// Function to display the images of a talent code on a card
function displayTalentImages(talentCode, card, containerId) {
  const heroName = talentCode.match(/(?<=,)[^\]]+/)[0];
  const talents = heroes_talents[heroName];
  const talentNumbers = talentCode.match(/\d+/g)[0];

  card.innerHTML = "";

  // Create the first row of the card
  const firstRow = document.createElement("div");
  firstRow.className = "firstRow";
  card.appendChild(firstRow);

  // Add the hero image
  const heroImg = document.createElement("img");
  heroImg.src = getHeroImageSrc(heroName);
  heroImg.alt = heroName;
  heroImg.className = "hero";
  firstRow.appendChild(heroImg);

  // Add the ultimate talent image
  const ult = talents[3][(parseInt(talentNumbers[3]) - 1)];
  const ultImg = document.createElement("img");
  ultImg.src = getImageSrc(ult);
  ultImg.alt = ult;
  ultImg.className = "ult";
  firstRow.appendChild(ultImg);

  // Create the container for the other talents
  const talentsContainer = document.createElement("div");
  talentsContainer.className = "talents";
  card.appendChild(talentsContainer);

  // Add the other talent images in 2 rows of 3
  const talentOrder = [0, 1, 2, 4, 5, 6]; // Skip index 3 (ultimate)
  for (let i = 0; i < talentOrder.length; i++) {
    const talentIndex = parseInt(talentNumbers[talentOrder[i]]) - 1;
    const talent = talents[talentOrder[i]][talentIndex];
    const img = document.createElement("img");
    img.src = getImageSrc(talent);
    img.alt = talent;
    talentsContainer.appendChild(img);
  }

  card.setAttribute("data-talent-code", talentCode);

  // Add the role icon only for cards in the cards-container
  if (containerId === "cards-container") {
    const roleIconContainer = document.createElement("div");
    roleIconContainer.className = "role-icon-container";

    const roleIcon = document.createElement("img");
    roleIcon.src = getRoleImageSrc(heroName);
    roleIcon.alt = `${heroRoles[heroName]} role`;
    roleIcon.className = "role-icon";

    roleIconContainer.appendChild(roleIcon);
    card.appendChild(roleIconContainer);
  }

  // Remover os event listeners existentes, se houver
  card.removeEventListener("dragstart", card.dragStartHandler);
  card.removeEventListener("dragend", card.dragEndHandler);

  // Adicionar novos event listeners
  card.dragStartHandler = (event) => {
    dragOrigin = containerId;
    draggedCard = talentCode;
    event.target.classList.add("dragging");
  };
  card.dragEndHandler = (event) => {
    event.target.classList.remove("dragging");
    draggedCard = null;
    dragOrigin = null;
  };

  card.addEventListener("dragstart", card.dragStartHandler);
  card.addEventListener("dragend", card.dragEndHandler);
}

function getRoleImageSrc(heroName) {
  const role = heroRoles[heroName];
  return `roleportraits/${role}.png`;
}

function getNeededRoles() {
  const requiredRoles = {
    'melee': 1,
    'healer': 1,
    'tank': 1,
    'bruiser': 1,
    'ranged': 2,
  };

  const rolesPresent = midCards.map(
    (card) => heroRoles[card.match(/(?<=,)[^\]]+/)[0]]
  );

  const roleCounts = rolesPresent.reduce((acc, role) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const neededRoles = Object.entries(requiredRoles).filter(([role, requiredCount]) => {
    const presentCount = roleCounts[role] || 0;
    return presentCount < requiredCount;
  }).map(([role, _]) => role);

  return neededRoles;
}


function midNewCard() {
  const usedHeroes = midCards
    .filter((card) => card)
    .map((card) => card.match(/(?<=,)[^\]]+/)[0]);
  const leftHeroes = lftCards
    .filter((card) => card)
    .map((card) => card.match(/(?<=,)[^\]]+/)[0]);
  const rightHeroes = rgtCards
    .filter((card) => card)
    .map((card) => card.match(/(?<=,)[^\]]+/)[0]);
  const allUsedHeroes = usedHeroes.concat(leftHeroes, rightHeroes);
  const neededRoles = getNeededRoles()

  let newTalentCode;
  do {
    newTalentCode = generateRandomString(allUsedHeroes);
    const newHero = newTalentCode.match(/(?<=,)[^\]]+/)[0];
    const newHeroRole = heroRoles[newHero];

    if (neededRoles.includes(newHeroRole) || (neededRoles.length === 0)) {
      midCards.push(newTalentCode);
      displayTeamCards(midCards, "cards-container");
      break;
    }
  } while ((true));
}


// Event listener for the generate button
document.getElementById("btn-lft").addEventListener("click", () => {
  if ((reroll[0] > 0) && (currentTurn !== "right")) {
    reroll[0] -= 1
    const cardsContainer = document.getElementById("cards-container");
    cardsContainer.innerHTML = ""; // Clear previous cards
    midCards.length = 0

    // Generate 5 talent codes
    rerollCards()
    updateRerollButtons()
  }
});

document.getElementById("btn-rgt").addEventListener("click", () => {
  if ((reroll[1] > 0) && (currentTurn !== "left")) {
    reroll[1] -= 1
    const cardsContainer = document.getElementById("cards-container");
    cardsContainer.innerHTML = ""; // Clear previous cards
    midCards.length = 0

    rerollCards()
    updateRerollButtons()
  }
});

function displayMapIcons(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // Clear previous content

  // Add map-container class
  container.classList.add('map-container');

  // Display the maps of that index
  randomMaps.forEach((index) => {
    const mapIcon = document.createElement("img");
    mapIcon.src = 'map_icons/' + maps[index] + '.jpg';
    mapIcon.alt = `map${index + 1}`;
    mapIcon.className = "map-icon";
    mapIcon.setAttribute("data-map-index", index);

    mapIcon.addEventListener("click", (event) => {
      handleMapBan(index);
    });

    container.appendChild(mapIcon);
  });
}

function removeElement(arr, elem) {
  return arr.filter(item => item !== elem);
}

function handleMapBan(mapIndex) {
  if (randomMaps.length === 1) {
    return;
  }
  randomMaps = removeElement(randomMaps, mapIndex);
  displayMapIcons("cards-container");
  mapRoutine[0] -= 1;
  if (mapRoutine[0] === 0) {
    mapRoutine.shift();
    currentTurn = currentTurn === 'right' ? 'left' : 'right';
    if (mapRoutine.length === 0) {
      const cardsContainer = document.getElementById("cards-container");
      cardsContainer.innerHTML = ""; // Clear previous cards
      cardsContainer.classList.remove('map-container'); // Remove map-container class
      midCards.length = 0;
      rerollCards();

      reroll = [1, 1];
      updateRerollButtons();
      console.log("finished map phase");

      // Display the chosen map
      displayChosenMap(randomMaps[0]);

      displayTeamCards(midCards, "cards-container");
    }
  }
  updateDraftHighlight();
}






function handleTeamDrop(event, targetDrop) {
  event.preventDefault();

  if (draggedCard === null) {
    return;
  }
  if (randomMaps.length > 1) {

    return;
  }
  // Check if the current turn matches the target drop container or if the current turn is null
  if ((currentTurn === null) || (currentTurn === "left" && targetDrop === "left-draft-container") || (currentTurn === "right" && targetDrop === "right-draft-container")) {
    if (targetDrop !== dragOrigin) {

      if (targetDrop === "left-draft-container") {
        lftCards.push(draggedCard);
        displayTeamCards(lftCards, targetDrop);
      } else if (targetDrop === "right-draft-container") {
        rgtCards.push(draggedCard);
        displayTeamCards(rgtCards, targetDrop);
      }

      if (dragOrigin === "cards-container") {
        midCards = midCards.filter((code) => code !== draggedCard);
        midNewCard();
        displayTeamCards(midCards, dragOrigin);
      } else if (dragOrigin === "left-draft-container") {
        lftCards = lftCards.filter((code) => code !== draggedCard);
        displayTeamCards(lftCards, dragOrigin);
      } else if (dragOrigin === "right-draft-container") {
        rgtCards = rgtCards.filter((code) => code !== draggedCard);
        displayTeamCards(rgtCards, dragOrigin);
      }

      draggedCard = null;
      dragOrigin = null;
      if ((currentTurn === null) && (targetDrop != "cards-container")) {
        currentTurn = targetDrop === "left-draft-container" ? 'left' : 'right';
      }
      pickRoutine[0][0] -= 1;
      // If current player's pick turn has ended
      if (pickRoutine[0][0] === 0) {
        // Remove current turn from turn list
        pickRoutine[0].shift();
        // Invert player turn
        currentTurn = targetDrop === "left-draft-container" ? 'right' : targetDrop === "right-draft-container" ? 'left' : currentTurn;
        // If a phase ends
        if (pickRoutine[0].length === 0) {
          // Creates 3 maps
          currentTurn = currentTurn === 'right' ? 'left' : 'right';
          reroll = [0, 0];
          pickRoutine.shift();
          if (pickRoutine.length === 0) {
            currentTurn = null;
            updateRerollButtons();
            updateDraftHighlight();
            const container = document.getElementById("cards-container");
            container.innerHTML = ""; // Clear previous content
            return;
          } else {
            // reroll = [0, 0]
            mapRoutine = [1, 1];
            while (randomMaps.length < 3) {
              let randomNumber = Math.floor(Math.random() * maps.length);
              if (!randomMaps.includes(randomNumber)) {
                randomMaps.push(randomNumber);
              }
            }
          }
          displayMapIcons("cards-container");
          console.log("finished first pick phase");
        }
      }
    }
  }
  updateDraftHighlight();
  updateRerollButtons();
}





document.getElementById("left-draft").addEventListener("dragover", (event) => {
  event.preventDefault();
});

document.getElementById("right-draft").addEventListener("dragover", (event) => {
  event.preventDefault();
});

document.getElementById("cards-container").addEventListener("dragover", (event) => {
  event.preventDefault();
});

document.getElementById("left-draft").addEventListener("drop", (event) => {
  handleTeamDrop(event, "left-draft-container");
});

document.getElementById("right-draft").addEventListener("drop", (event) => {
  handleTeamDrop(event, "right-draft-container");
});

document.getElementById("cards-container").addEventListener("drop", (event) => {
  handleTeamDrop(event, "cards-container");
});

async function copyTalents(teamSide) {
  try {
    const draftContainer = document.getElementById(`${teamSide}-draft-container`);
    const cards = Array.from(draftContainer.querySelectorAll('.card'));
    const talents = cards.map((card) => card.getAttribute("data-talent-code"));

    let message = `${teamSide.charAt(0).toUpperCase() + teamSide.slice(1)} Team - \n`;
    talents.forEach((code) => {
      if (code) {
        message += `:ghostboogie: ${code}\n`;
      }
    });

    await navigator.clipboard.writeText(message);

    // Provide visual feedback
    const icon = document.getElementById(`${teamSide}-draft-icon`);
    const originalSrc = icon.src;
    icon.src = "check.svg"; // Assume you have a check icon
    setTimeout(() => {
      icon.src = originalSrc;
    }, 2000);

    console.log(`${teamSide} team talents copied to clipboard.`);
  } catch (err) {
    console.error(`Failed to copy ${teamSide} team talents to clipboard.`, err);

    // Provide error feedback
    const icon = document.getElementById(`${teamSide}-draft-icon`);
    const originalSrc = icon.src;
    icon.src = "error.svg"; // Assume you have an error icon
    setTimeout(() => {
      icon.src = originalSrc;
    }, 2000);
  }
}

// Update event listeners for the draft icons
document.getElementById("left-draft-icon").addEventListener("click", () => copyTalents("left"));
document.getElementById("right-draft-icon").addEventListener("click", () => copyTalents("right"));


function updateRerollButtons() {
  const leftRerollButton = document.getElementById("btn-lft");
  const rightRerollButton = document.getElementById("btn-rgt");

  // Update left reroll button
  if (reroll[0] > 0 && currentTurn !== "right") {
    leftRerollButton.style.backgroundColor = "#0eaf9b";
    leftRerollButton.style.cursor = "pointer";
  } else {
    leftRerollButton.style.backgroundColor = "gray";
    leftRerollButton.style.cursor = "not-allowed";
  }
  // leftRerollButton.querySelector(".reroll-count").textContent = reroll[0];

  // Update right reroll button
  if (reroll[1] > 0 && currentTurn !== "left") {
    rightRerollButton.style.backgroundColor = "#0eaf9b";
    rightRerollButton.style.cursor = "pointer";
  } else {
    rightRerollButton.style.backgroundColor = "gray";
    rightRerollButton.style.cursor = "not-allowed";
  }
  //rightRerollButton.querySelector(".reroll-count").textContent = reroll[1];
}

// Call the updateRerollButtons function initially
updateRerollButtons();

// Generate 5 talent codes
function rerollCards() {
  for (let i = 0; i < 6; i++) {
    midNewCard()
  }
  displayTeamCards(midCards, "cards-container");
  document.getElementById("cards-container").classList.remove('map-container');
}

rerollCards()

// Substitua a função updateDraftHighlight existente por esta versão atualizada
function updateDraftHighlight() {
  const body = document.body;
  const turnMessage = document.getElementById("turn-message");

  // Remova as linhas que manipulam leftTurnText e rightTurnText, pois não serão mais usadas

  let message = "";
  if (randomMaps.length > 1) { // Fase de banimento de mapas
    if (currentTurn === "left") {
      message = "Left team turn to ban";
    } else if (currentTurn === "right") {
      message = "Right team turn to ban";
    }
  } else { // Fase de escolha de heróis
    if (currentTurn === "left") {
      message = "Left team turn to pick";
    } else if (currentTurn === "right") {
      message = "Right team turn to pick";
    }
  }

  if (message) {
    turnMessage.textContent = message;
    turnMessage.style.display = "block";
  } else {
    turnMessage.style.display = "none";
  }

  if (currentTurn === "left") {
    body.style.backgroundImage = "linear-gradient(90deg, #22262f 0%, #22262f 25%, #2e222f 35%, #2e222f 100%)";
  } else if (currentTurn === "right") {
    body.style.backgroundImage = "linear-gradient(270deg, #22262f 0%, #22262f 25%, #2e222f 35%, #2e222f 100%)";
  } else {
    body.style.backgroundImage = "linear-gradient(90deg, #22262f 0%, #22262f 25%, #2e222f 35%, #2e222f 65%, #22262f 75%, #22262f 100%)";
  }
}

// Remova ou comente as seguintes linhas no seu HTML:
// <div id="left-turn-text" style="display: none;">YOUR TURN TO PICK</div>
// <div id="right-turn-text" style="display: none;">YOUR TURN TO PICK</div>



function displayChosenMap(mapIndex) {
  const choosenMapContainer = document.getElementById("choosen-map-container");
  choosenMapContainer.innerHTML = ""; // Clear previous content

  const mapIcon = document.createElement("img");
  mapIcon.src = 'map_icons/' + maps[mapIndex] + '.jpg';
  mapIcon.alt = `Chosen Map: ${maps[mapIndex]}`;
  mapIcon.className = "map-icon";

  choosenMapContainer.appendChild(mapIcon);
}
