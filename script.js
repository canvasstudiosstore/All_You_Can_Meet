const SHEET_URL = "https://docs.google.com/spreadsheets/d/1vTOtSPwhzF5_ckYPhaOVoSHFninJhfqqGfqYdUVcHNg/gviz/tq?tqx=out:json";

let data = [];

window.addEventListener("DOMContentLoaded", () => {
  fetchSheetData();
});

async function fetchSheetData() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));

    data = json.table.rows.map(row => ({
      email: row.c[0]?.v?.toLowerCase(),
      name: row.c[1]?.v,
      gang1: row.c[2]?.v,
      gang2: row.c[3]?.v,
      gang3: row.c[4]?.v,
    }));

    setupAutocomplete();
  } catch (error) {
    console.error("Fehler beim Laden der Daten:", error);
  }
}

function setupAutocomplete() {
  const input = document.getElementById("emailInput");
  const datalist = document.getElementById("emailList");

  if (!input || !datalist) return;

  datalist.innerHTML = "";

  data.forEach(p => {
    if (p.email) {
      const option = document.createElement("option");
      option.value = p.email;
      datalist.appendChild(option);
    }
  });
}

function findPerson() {
  const inputElement = document.getElementById("emailInput");
  const resultDiv = document.getElementById("result");

  if (!inputElement || !resultDiv) return;

  const input = inputElement.value.trim().toLowerCase();
  const person = data.find(p => p.email === input);

  if (person) {
    resultDiv.innerHTML = `
      <p>Hallo <strong>${person.name}</strong>, du sitzt:</p>
      <ul>
        <li>🥗 1. Gang – Tisch ${person.gang1}</li>
        <li>🍝 2. Gang – Tisch ${person.gang2}</li>
        <li>🍰 3. Gang – Tisch ${person.gang3}</li>
      </ul>
    `;
  } else {
    resultDiv.innerHTML = "<p style='color:red'>E-Mail nicht gefunden. Bitte prüfe die Eingabe.</p>";
  }
}
window.addEventListener("DOMContentLoaded", fetchSheetData);
