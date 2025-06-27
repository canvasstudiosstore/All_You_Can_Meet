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
      vorname: row.c[0]?.v,  // Spalte 0: Vorname
      name: row.c[1]?.v?.toLowerCase(), // Spalte 1: Nachname (für Suche)
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
  const datalist = document.getElementById("nameList"

  );

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


const MEAL_FORM_URL = "https://script.google.com/macros/s/AKfycbzm_NoylWWA2xKSItzgO3cfnJvk2xw9L77jjCuEMDi6CxkteknBBYwivhGvYy1YHx1YCQ/exec"; // <-- anpassen!

let currentPerson = null;
let mealExists = false;

async function findPerson() {
  const inputElement = document.getElementById("nameInput");
  const resultDiv = document.getElementById("result");
  const mealSection = document.getElementById("mealSection");
  const mealHeadline = document.getElementById("mealHeadline");

  const input = inputElement.value.trim().toLowerCase();
  const person = data.find(p => p.name === input);

  showSpinner(true); // ⏳ Spinner an

  if (!person) {
    resultDiv.innerHTML = "<p style='color:red'>Nachname nicht gefunden. Bitte prüfe die Eingabe.</p>";
    mealSection.classList.remove("visible"); // ❌ Formular ausblenden
    showSpinner(false);
    return;
  }

  currentPerson = person;
  resultDiv.innerHTML = `
    <p>Hallo <strong>${person.vorname}</strong>, du sitzt:</p>
    <ul>
      <li>🥗 1. Gang – Tisch ${person.gang1 || "noch nicht zugewiesen"}</li>
      <li>🍝 2. Gang – Tisch ${person.gang2 || "noch nicht zugewiesen"}</li>
      <li>🍰 3. Gang – Tisch ${person.gang3 || "noch nicht zugewiesen"}</li>
    </ul>
  `;

  // 🧠 Übergib Vorname für personalisierte Überschrift
  await checkIfMealSubmitted(person.name, person.vorname);

  showSpinner(false); // ✅ Spinner aus
}



function checkIfMealSubmitted(name) {
  const mealSection = document.getElementById("mealSection");
  const mealMessage = document.getElementById("mealMessage");
  const editButton = document.getElementById("editButton");

  fetch(`${MEAL_FORM_URL}?action=check&name=${encodeURIComponent(name)}`)
    .then(response => response.json())
    .then(result => {
      mealSection.classList.add("visible"); // Zeige das Formular erst hier

      if (result.exists) {
        mealExists = true;
        mealMessage.innerHTML = "<p style='color:red'>Du hast deine Auswahl bereits abgeschickt.</p>";
        editButton.style.display = "inline-block";
        editButton.style.backgroundColor = "#0066cc"; // Optional: blauer Button
      } else {
        mealExists = false;
        mealMessage.innerHTML = "";
        editButton.style.display = "none";
      }
    })
    .catch(() => {
      mealSection.classList.remove("visible");
      mealMessage.innerHTML = "<p style='color:red'>Es gab ein Problem beim Abrufen deiner Essenswahl.</p>";
    });
}



function enableEdit() {
  document.getElementById("mealMessage").textContent = "";
  mealExists = false;

  const formElements = document.getElementById("mealForm").elements;
  for (let el of formElements) {
    el.disabled = false;
  }

  document.getElementById("editButton").style.display = "none";
}


document.getElementById("mealForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", currentPerson.name);
  formData.append("vorname", currentPerson.vorname);
  formData.append("main", document.getElementById("main").value);
  formData.append("dessert", document.getElementById("dessert").value);
  formData.append("zusatz", document.getElementById("zusatz").value);
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
    submitBtn.textContent = "Absenden";
  }
});

