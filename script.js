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
let isPlacingShips = true; // Pelaaja asettaa ensin laivat
let currentShipIndex = 0; // Seuraa asetettavaa laivaa
let isHorizontal = true; // Oletusarvoisesti vaakasuora asetus

// Kuuntelee näppäimen painallusta suunnan vaihtamiseksi
document.addEventListener("keydown", (event) => {
    if (event.key === " ") {  // Välilyönti vaihtaa suunnan
        isHorizontal = !isHorizontal;
        messageElement.textContent = isHorizontal ? "Vaakasuuntainen laiva valittu" : "Pystysuuntainen laiva valittu";
        event.preventDefault();  // Estää sivun vierityksen välilyönnillä
    }
});


// Äänitiedostot
const hitSound = new Audio("voices/pommi.mp3");
const missSound = new Audio("voices/huti.mp3");
const winSound = new Audio("voices/win.mp3");
hitSound.preload = "auto";
missSound.preload = "auto";
winSound.preload = "auto";

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
    createGrid(false); // Pelaajan ruudukko
    createGrid(true); // Tietokoneen ruudukko
}

// Luo peliruudukko pelaajalle tai tietokoneelle
function createGrid(isComputer = false) {
    const alphabet = "ABCDEFGHIJ";
    const gridElement = isComputer ? computerGridElement : playerGridElement;

    // Tyhjennä ruudukko
    gridElement.innerHTML = "";

    // Luo ensimmäinen rivi: tyhjä kulma ja kirjaimet (A-J)
    const firstRow = document.createElement("div");
    firstRow.classList.add("row");
    gridElement.appendChild(firstRow);
    
    // Tyhjä kulma
    const emptyCorner = document.createElement("div");
    emptyCorner.classList.add("label");
    firstRow.appendChild(emptyCorner);

    // Kirjaimet yläreunaan (A-J)
    for (let i = 0; i < gridSize; i++) {
        const labelCell = document.createElement("div");
        labelCell.classList.add("label");
        labelCell.textContent = alphabet[i];
        firstRow.appendChild(labelCell);
    }

    // Luo loput ruudukosta, lisää numerot vasemmalle
    for (let row = 0; row < gridSize; row++) {
        const gridRow = document.createElement("div");
        gridRow.classList.add("row");
        
        // Numero vasempaan reunaan
        const labelCell = document.createElement("div");
        labelCell.classList.add("label");
        labelCell.textContent = row + 1;
        gridRow.appendChild(labelCell);

        // Peliruudukon solut
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (isComputer) {
                cell.addEventListener("click", handlePlayerAttack);
            } else if (isPlacingShips) {
                cell.addEventListener("click", () => placePlayerShip(row, col, cell));
            } else {
                cell.classList.add("player-cell");
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

        // Merkitään laivan paikka ruudukkoon kokonaisena
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
            placeShips(true); // Tietokoneen laivat
            isPlayerTurn = true; // Pelaaja aloittaa pelin
        }
    } else {
        messageElement.textContent = "Ei voi sijoittaa tähän! Yritä uudelleen.";
    }
}

// Tarkistaa, voiko laivan sijoittaa tiettyyn paikkaan ja ettei se ole liian lähellä toista laivaa
function canPlaceShip(row, col, size, direction, targetLocations) {
    for (let i = 0; i < size; i++) {
        const currentRow = direction === "horizontal" ? row : row + i;
        const currentCol = direction === "horizontal" ? col + i : col;

        if (currentRow >= gridSize || currentCol >= gridSize || isAdjacentToShip(currentRow, currentCol, targetLocations)) {
            return false;
        }
    }
    return true;
}

// Tarkistaa, ovatko valitut ruudut lähellä toista laivaa
function isAdjacentToShip(row, col, locations) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const adjacentRow = row + i;
            const adjacentCol = col + j;

            if (
                adjacentRow >= 0 &&
                adjacentRow < gridSize &&
                adjacentCol >= 0 &&
                adjacentCol < gridSize &&
                locations.some(loc => loc.row === adjacentRow && loc.col === adjacentCol)
            ) {
                return true;
            }
        }
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
        hitSound.play();
        checkWinCondition(); // Tarkistetaan voitto
        return; // Pelaaja jatkaa, koska osui
    } else {
        cell.classList.add("miss");
        messageElement.textContent = "Ohi meni! Nyt on tietokoneen vuoro.";
        missSound.play();
    }
    
    cell.removeEventListener("click", handlePlayerAttack); // Poistaa klikkauksen käsittelijän

    isPlayerTurn = false;
    setTimeout(computerTurn, 1000); // Viive ennen tietokoneen vuoroa
}

// Tietokoneen vuoro
function computerTurn() {
    if (isPlayerTurn) return; // Estää toimimasta pelaajan vuorolla

    let row, col, cell;
    do {
        row = Math.floor(Math.random() * gridSize);
        col = Math.floor(Math.random() * gridSize);
        cell = playerGridElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    } while (cell.classList.contains("hit") || cell.classList.contains("miss"));

    if (playerShipLocations.some(loc => loc.row === row && loc.col === col)) {
        cell.classList.add("hit");
        messageElement.textContent = "Tietokone osui laivaasi! Tietokone jatkaa vuoroaan.";
        hitSound.play();
        checkWinCondition(); // Tarkistetaan voitto

        // Odottaa hetken ja antaa tietokoneelle uuden vuoron
        setTimeout(computerTurn, 1000);
    } else {
        cell.classList.add("miss");
        messageElement.textContent = "Tietokone ampui ohi. Nyt on sinun vuorosi.";
        missSound.play();

        isPlayerTurn = true; // Vaihdetaan vuoro takaisin pelaajalle
    }
}

// Tarkistaa voittotilanteen
function checkWinCondition() {
    const playerHits = document.querySelectorAll("#computerGrid .hit").length;
    const computerHits = document.querySelectorAll("#playerGrid .hit").length;
    const totalPlayerShipCells = playerShipLocations.length;
    const totalComputerShipCells = computerShipLocations.length;

    if (playerHits === totalComputerShipCells) {
        messageElement.textContent = "Kaikki tietokoneen laivat upotettu! Voitit pelin!";
        endGame();
    } else if (computerHits === totalPlayerShipCells) {
        messageElement.textContent = "Tietokone upotti kaikki laivasi! Hävisit pelin.";
        endGame();
    }
}

// Lopettaa pelin ja poistaa klikkaukset
function endGame() {
    const cells = document.querySelectorAll("#computerGrid .cell");
    cells.forEach(cell => {
        cell.removeEventListener("click", handlePlayerAttack);
    });
    winSound.play();
}

// Sijoittaa laivan ruudukkoon
function placeShip(row, col, size, direction, targetLocations) {
    for (let i = 0; i < size; i++) {
        const currentRow = direction === "horizontal" ? row : row + i;
        const currentCol = direction === "horizontal" ? col + i : col;
        targetLocations.push({ row: currentRow, col: currentCol });
    }
}

// Tietokoneen laivojen satunnainen sijoittaminen
function placeShips(isComputer = false) {
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
function showRules() {
    window.open("rules.html", "_blank", "width=600,height=400");
}
const backgroundSound = new Audio("path/to/background-music.mp3");
backgroundSound.loop = true; // Toistaa äänen jatkuvasti
backgroundSound.volume = 0.5; // Asetetaan äänenvoimakkuus

let isBackgroundSoundOn = true;

// Funktio taustaäänen päälle/pois kytkemiseen
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

// Käynnistetään taustaääni automaattisesti pelin alussa
function startBackgroundSound() {
    backgroundSound.play();
}


// Käynnistää pelin alussa
restartGame();
startBackgroundSound();