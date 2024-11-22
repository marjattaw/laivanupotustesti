const gridSize = 10;
const playerGridElement = document.getElementById("playerGrid");
const computerGridElement = document.getElementById("computerGrid");
const messageElement = document.getElementById("message");

const ships = [
    { name: "Lentotukialus", size: 5 },
    { name: "Taistelulaiva", size: 4 },
    { name: "Risteilijä", size: 3 },
    { name: "Risteilijä", size: 3 },
    { name: "Hävittäjä", size: 2 },
    { name: "Hävittäjä", size: 2 },
    { name: "Hävittäjä", size: 2 },
    { name: "Sukellusvene", size: 1 },
    { name: "Sukellusvene", size: 1 },
    { name: "Sukellusvene", size: 1 },
    { name: "Sukellusvene", size: 1 }
];

let playerShipLocations = [];
let computerShipLocations = [];
let isPlayerTurn = true;
let isPlacingShips = true;
let currentShipIndex = 0;
let isHorizontal = true;

// Kuuntelee näppäimen painallusta suunnan vaihtamiseksi
document.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        isHorizontal = !isHorizontal;
        messageElement.textContent = isHorizontal ? "Vaakasuuntainen laiva valittu" : "Pystysuuntainen laiva valittu";
        event.preventDefault();
    }
});

// Vaihtaa laivan suunnan painikkeella
function toggleShipDirection() {
    isHorizontal = !isHorizontal;
    messageElement.textContent = isHorizontal ? "Vaakasuuntainen laiva valittu" : "Pystysuuntainen laiva valittu";
}

// Äänitiedostot
const hitSound = new Audio("voices/pommi.mp3");
const missSound = new Audio("voices/hutipommi.mp3");
const winSound = new Audio("voices/win.mp3");
const loseSound = new Audio("voices/lose.mp3");
hitSound.preload = "auto";
missSound.preload = "auto";
winSound.preload = "auto";
loseSound.preload = "auto";

// Taustaäänen päälle/pois-kytkentä
const backgroundSound = new Audio("voices/tausta.mp3");
backgroundSound.loop = true;
backgroundSound.volume = 0.5;

let isBackgroundSoundOn = true;
let isGameSoundsOn = true;

function toggleBackgroundSound() {
    if (isBackgroundSoundOn) {
        backgroundSound.pause();
        isBackgroundSoundOn = false;
        document.querySelector("button[onclick='toggleBackgroundSound()']").textContent = "Taustaäänet päälle";
    } else {
        backgroundSound.play();
        isBackgroundSoundOn = true;
        document.querySelector("button[onclick='toggleBackgroundSound()']").textContent = "Taustaäänet pois";
    }
}

// Peliäänien päälle/pois-kytkentä
function toggleGameSounds() {
    isGameSoundsOn = !isGameSoundsOn;
    document.querySelector("button[onclick='toggleGameSounds()']").textContent = isGameSoundsOn ? "Peliäänet pois" : "Peliäänet päälle";
}

// Soittaa äänen, jos peliäänet ovat päällä
function playSound(sound) {
    if (isGameSoundsOn) {
        sound.play();
    }
}
function setBackgroundVolume(volume) {
    backgroundSound.volume = volume;
}
// Funktio pelin uudelleenkäynnistykseen
function restartGame() {
    playerGridElement.innerHTML = "";
    computerGridElement.innerHTML = "";
    messageElement.textContent = "Aseta laivasi ruudukkoon klikkaamalla!";
    playerShipLocations = [];
    computerShipLocations = [];
    isPlayerTurn = true;
    isPlacingShips = true;
    currentShipIndex = 0;
    createGrid(false);
    createGrid(true);
}

// Luo peliruudukko pelaajalle tai tietokoneelle
// Lisää esikatselun hallinta (korostus vihreällä/punaisella)
function previewPlacement(row, col) {
    if (!isPlacingShips || currentShipIndex >= ships.length) return;

    const ship = ships[currentShipIndex];
    const direction = isHorizontal ? "horizontal" : "vertical";
    const isValid = canPlaceShip(row, col, ship.size, direction, playerShipLocations);

    for (let i = 0; i < ship.size; i++) {
        const currentRow = direction === "horizontal" ? row : row + i;
        const currentCol = direction === "horizontal" ? col + i : col;
        const cell = playerGridElement.querySelector(`.cell[data-row="${currentRow}"][data-col="${currentCol}"]`);

        if (cell) {
            cell.classList.add(isValid ? "highlight" : "invalid");
        }
    }
}

// Poistaa esikatselun korostukset
function clearPreview() {
    const highlightedCells = playerGridElement.querySelectorAll(".highlight, .invalid");
    highlightedCells.forEach(cell => cell.classList.remove("highlight", "invalid"));
}

// Ruudukko
function createGrid(isComputer = false) {
    const alphabet = "ABCDEFGHIJ";
    const gridElement = isComputer ? computerGridElement : playerGridElement;

    gridElement.innerHTML = "";

    const firstRow = document.createElement("div");
    firstRow.classList.add("row");
    gridElement.appendChild(firstRow);

    const emptyCorner = document.createElement("div");
    emptyCorner.classList.add("label");
    firstRow.appendChild(emptyCorner);

    for (let i = 0; i < gridSize; i++) {
        const labelCell = document.createElement("div");
        labelCell.classList.add("label");
        labelCell.textContent = alphabet[i];
        firstRow.appendChild(labelCell);
    }

    for (let row = 0; row < gridSize; row++) {
        const gridRow = document.createElement("div");
        gridRow.classList.add("row");

        const labelCell = document.createElement("div");
        labelCell.classList.add("label");
        labelCell.textContent = row + 1;
        gridRow.appendChild(labelCell);

        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (isComputer) {
                cell.addEventListener("click", handlePlayerAttack);
            } else if (isPlacingShips) {
                cell.addEventListener("mouseover", () => previewPlacement(row, col));
                cell.addEventListener("mouseout", () => clearPreview());
                cell.addEventListener("click", () => placePlayerShip(row, col, cell));
            }

            gridRow.appendChild(cell);
        }
        gridElement.appendChild(gridRow);
    }
}

// Aseta pelaajan laiva valittuun ruutuun kokonaisena
function placePlayerShip(row, col, cell) {
    if (!isPlacingShips || currentShipIndex >= ships.length) return;

    const ship = ships[currentShipIndex];
    const direction = isHorizontal ? "horizontal" : "vertical";

    if (canPlaceShip(row, col, ship.size, direction, playerShipLocations)) {
        placeShip(row, col, ship.size, direction, playerShipLocations);

        for (let i = 0; i < ship.size; i++) {
            const currentRow = direction === "horizontal" ? row : row + i;
            const currentCol = direction === "horizontal" ? col + i : col;
            const playerCell = playerGridElement.querySelector(`.cell[data-row="${currentRow}"][data-col="${currentCol}"]`);
            playerCell.classList.add("player-ship");
        }

        currentShipIndex++;
        if (currentShipIndex >= ships.length) {
            messageElement.textContent = "Kaikki laivat asetettu! Aloita pelaaminen.";
            isPlacingShips = false;
            placeShips(true); // Tietokoneen laivojen sijoittaminen
            isPlayerTurn = true;
        }
    } else {
        messageElement.textContent = "Ei voi sijoittaa tähän! Yritä uudelleen.";
    }
}

// Tarkistaa voittotilanteen
function checkWinCondition() {
    const playerHits = document.querySelectorAll("#computerGrid .hit").length;
    const computerHits = document.querySelectorAll("#playerGrid .hit").length;
    const totalPlayerShipCells = playerShipLocations.length;
    const totalComputerShipCells = computerShipLocations.length;

    if (playerHits >= totalComputerShipCells) {
        messageElement.textContent = "Kaikki tietokoneen laivat upotettu! Voitit pelin!";
        playSound(winSound);
        endGame();
        return true;
    } else if (computerHits >= totalPlayerShipCells) {
        messageElement.textContent = "Tietokone upotti kaikki laivasi! Hävisit pelin.";
        playSound(loseSound); // Häviöääni
        endGame();
        return true;
    }
    return false;
}

// Pelaajan hyökkäys tietokoneen ruudukkoon
function handlePlayerAttack(event) {
    if (!isPlayerTurn || isPlacingShips) return;

    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (computerShipLocations.some(loc => loc.row === row && loc.col === col)) {
        cell.classList.add("hit");
        messageElement.textContent = "Osuit tietokoneen laivaan! Jatka vuoroasi.";
        playSound(hitSound);
        if (checkWinCondition()) return;
    } else {
        cell.classList.add("miss");
        messageElement.textContent = "Ohi meni! Nyt on tietokoneen vuoro.";
        playSound(missSound);
        isPlayerTurn = false;
        setTimeout(computerTurn, 1000);
    }
    cell.removeEventListener("click", handlePlayerAttack);
}

// Tietokoneen vuoro
function computerTurn() {
    if (isPlayerTurn) return;

    let row, col, cell;
    do {
        row = Math.floor(Math.random() * gridSize);
        col = Math.floor(Math.random() * gridSize);
        cell = playerGridElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    } while (cell.classList.contains("hit") || cell.classList.contains("miss"));

    if (playerShipLocations.some(loc => loc.row === row && loc.col === col)) {
        cell.classList.add("hit");
        messageElement.textContent = "Tietokone osui laivaasi! Tietokone jatkaa vuoroaan.";
        playSound(hitSound);
        if (checkWinCondition()) return;
        setTimeout(computerTurn, 1000);
    } else {
        cell.classList.add("miss");
        messageElement.textContent = "Tietokone ampui ohi. Nyt on sinun vuorosi.";
        playSound(missSound);
        isPlayerTurn = true;
    }
}

// Lopettaa pelin ja poistaa klikkaukset
function endGame() {
    const cells = document.querySelectorAll("#computerGrid .cell");
    cells.forEach(cell => {
        cell.removeEventListener("click", handlePlayerAttack);
    });
}

// Sijoittaa laivan ruudukkoon
function placeShip(row, col, size, direction, targetLocations) {
    for (let i = 0; i < size; i++) {
        const currentRow = direction === "horizontal" ? row : row + i;
        const currentCol = direction === "horizontal" ? col + i : col;
        targetLocations.push({ row: currentRow, col: currentCol });
    }
}

// Tietokoneen ja pelaajan laivojen sijoitus
function placeShips(isComputer) {
    const targetLocations = isComputer ? computerShipLocations : playerShipLocations;

    ships.forEach(ship => {
        let placed = false;
        while (!placed) {
            const direction = Math.random() < 0.5 ? "horizontal" : "vertical";
            const startRow = Math.floor(Math.random() * gridSize);
            const startCol = Math.floor(Math.random() * gridSize);

            if (canPlaceShip(startRow, startCol, ship.size, direction, targetLocations)) {
                placeShip(startRow, startCol, ship.size, direction, targetLocations);
                placed = true;
            }
        }
    });
}

// Tarkistaa voiko laivan sijoittaa paikkaan
function canPlaceShip(row, col, size, direction, targetLocations) {
    for (let i = 0; i < size; i++) {
        const currentRow = direction === "horizontal" ? row : row + i;
        const currentCol = direction === "horizontal" ? col + i : col;

        if (currentRow >= gridSize || currentCol >= gridSize) {
            return false;
        }

        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                const checkRow = currentRow + r;
                const checkCol = currentCol + c;
                if (
                    checkRow >= 0 &&
                    checkRow < gridSize &&
                    checkCol >= 0 &&
                    checkCol < gridSize &&
                    targetLocations.some(loc => loc.row === checkRow && loc.col === checkCol)
                ) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Lisää showRules-funktio
function showRules() {
    window.open("rules.html", "_blank", "width=600,height=400");
}

// Käynnistää pelin alussa
restartGame();
backgroundSound.play();