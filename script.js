// Alle Logik zur Essensbestellung auskommentiert

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1vTOtSPwhzF5_ckYPhaOVoSHFninJhfqqGfqYdUVcHNg/gviz/tq?sheet=Datenliste_All_you_can_meet&tqx=out:json";

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
      vorname: row.c[0]?.v,
      name: row.c[1]?.v?.toLowerCase(),
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
  const input = document.getElementById("nameInput");
  const datalist = document.getElementById("nameList");

  if (!input || !datalist) return;

  datalist.innerHTML = "";

  data.forEach(p => {
    if (p.name) {
      const option = document.createElement("option");
      option.value = p.name;
      datalist.appendChild(option);
    }
  });
}

function showSpinner(show) {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) spinner.style.display = show ? "block" : "none";
}

async function findPerson() {
  const inputElement = document.getElementById("nameInput");
  const resultDiv = document.getElementById("result");
  const input = inputElement.value.trim().toLowerCase();

  // Spinner AN
  showSpinner(true);

  // Result zurücksetzen
  resultDiv.innerHTML = "";
  resultDiv.style.display = "none";

  // Person suchen
  const person = data.find(p => p.name === input);

  if (!person) {
    resultDiv.innerHTML = "<p style='color:red'>Nachname nicht gefunden. Bitte prüfe die Eingabe.</p>";
    resultDiv.style.display = "block";
    showSpinner(false);
    return;
  }

  currentPerson = person; // 🔧 Das hier fehlte!

  resultDiv.innerHTML = `
    <p>Hallo <strong>${person.vorname}</strong>, du sitzt:</p>
    <ul>
      <li>🥗 1. Gang – Tisch ${person.gang1 || "noch nicht zugewiesen"}</li>
      <li>🍝 2. Gang – Tisch ${person.gang2 || "noch nicht zugewiesen"}</li>
      <li>🍰 3. Gang – Tisch ${person.gang3 || "noch nicht zugewiesen"}</li>
    </ul>
  `;
  resultDiv.style.display = "block";

  // Daten zur Essensabfrage laden
  await checkIfMealSubmitted(person.name, person.vorname);

  // Spinner AUS
  showSpinner(false);
}



const MEAL_FORM_URL = "https://script.google.com/macros/s/AKfycbzm_NoylWWA2xKSItzgO3cfnJvk2xw9L77jjCuEMDi6CxkteknBBYwivhGvYy1YHx1YCQ/exec";

let currentPerson = null;
let mealExists = false;

async function checkIfMealSubmitted(name, vorname) {
  const response = await fetch(`${MEAL_FORM_URL}?action=check&name=${encodeURIComponent(name)}`);
  const result = await response.json();

  const mealSection = document.getElementById("mealSection");
  const mealHeadline = document.getElementById("mealHeadline");
  const mealMessage = document.getElementById("mealMessage");
  const mealForm = document.getElementById("mealForm");
  const submitButton = document.getElementById("submitButton");

  mealHeadline.textContent = `${vorname}, was möchtest du essen?`;
  mealSection.style.display = "block";

  if (result.exists) {
    mealExists = true;
    document.getElementById("main").value = result.main || "";
    document.getElementById("dessert").value = result.dessert || "";
    document.getElementById("zusatzMain").value = result.zusatzMain || "";
    document.getElementById("zusatzDessert").value = result.zusatzDessert || "";
    submitButton.textContent = "Bearbeiten";
    mealMessage.innerHTML = "<p style='color:orange'>Du hast deine Auswahl bereits abgeschickt. Du kannst sie nun bearbeiten und erneut speichern.</p>";
  } else {
    mealExists = false;
    submitButton.textContent = "Absenden";
    mealMessage.innerHTML = "";
  }
}


function enableEdit() {
  const mealForm = document.getElementById("mealForm");
  const editButton = document.getElementById("editButton");
  const submitButton = mealForm.querySelector('button[type="submit"]');

  for (let el of mealForm.elements) {
    if (el.tagName !== "BUTTON") el.disabled = false;
  }

  mealExists = true;
  document.getElementById("mealMessage").textContent = "";
  editButton.style.display = "none";
  submitButton.style.display = "inline-block";
}

document.getElementById("mealForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append("name", currentPerson.name);
  formData.append("vorname", currentPerson.vorname);
  formData.append("main", document.getElementById("main").value);
  formData.append("dessert", document.getElementById("dessert").value);
  formData.append("zusatzMain", document.getElementById("zusatzMain").value);
  formData.append("zusatzDessert", document.getElementById("zusatzDessert").value);
  formData.append("action", mealExists ? "update" : "submit");

  const submitBtn = this.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Wird gesendet...";

  try {
    const res = await fetch(MEAL_FORM_URL, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.result === "success") {
      document.getElementById("mealMessage").innerHTML = "<p style='color:green'>Dein Essenswunsch wurde gespeichert.</p>";
      this.reset();
    } else {
      throw new Error();
    }
  } catch {
    document.getElementById("mealMessage").innerHTML = "<p style='color:red'>Fehler beim Senden. Bitte versuche es erneut.</p>";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = mealExists ? "Bearbeiten" : "Absenden";
  }
});

