const SHEET_URL = "https://docs.google.com/spreadsheets/d/1vTOtSPwhzF5_ckYPhaOVoSHFninJhfqqGfqYdUVcHNg/gviz/tq?sheet=Datenliste_All_you_can_meet&tqx=out:json";

let data = [];

window.addEventListener("DOMContentLoaded", () => {
  fetchSheetData();
  // Neue Logik: Formular wird direkt nach Namenseingabe vorausgefüllt
  const nameInput = document.getElementById("nameInput");
  nameInput.addEventListener("change", handleNameInput);
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

// Funktion für Autocomplete bleibt erhalten
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

// Funktion für Spinner wird nicht mehr benötigt
// function showSpinner(show) {
//   const spinner = document.getElementById("loadingSpinner");
//   if (spinner) spinner.style.display = show ? "block" : "none";
// }

// findPerson wird nicht mehr benötigt, stattdessen handleNameInput
// async function findPerson() {
//   const inputElement = document.getElementById("nameInput");
//   const resultDiv = document.getElementById("result");
//   const mealSection = document.getElementById("mealSection");
//   const mealHeadline = document.getElementById("mealHeadline");
//
//   const input = inputElement.value.trim().toLowerCase();
//   const person = data.find(p => p.name === input);
//
//   showSpinner(true); // ⏳ Spinner an
//
//   if (!person) {
//     resultDiv.innerHTML = "<p style='color:red'>Nachname nicht gefunden. Bitte prüfe die Eingabe.</p>";
//     resultDiv.style.display = "block"; // jetzt erst sichtbar machen
//     mealSection.classList.remove("visible");
//     showSpinner(false);
//     return;
//   }
//
//   currentPerson = person;
//   resultDiv.innerHTML = `
//   <p>Hallo <strong>${person.vorname}</strong>, du sitzt:</p>
//   <ul>
//     <li>🥗 1. Gang – Tisch ${person.gang1 || "noch nicht zugewiesen"}</li>
//     <li>🍝 2. Gang – Tisch ${person.gang2 || "noch nicht zugewiesen"}</li>
//     <li>🍰 3. Gang – Tisch ${person.gang3 || "noch nicht zugewiesen"}</li>
//   </ul>
// `;
// resultDiv.style.display = "block";
//
//   await checkIfMealSubmitted(person.name, person.vorname);
//
//   showSpinner(false); // ✅ Spinner aus
// }

async function handleNameInput() {
  const inputElement = document.getElementById("nameInput");
  const input = inputElement.value.trim().toLowerCase();
  const person = data.find(p => p.name === input);
  const mealSection = document.getElementById("mealSection");
  const mealHeadline = document.getElementById("mealHeadline");
  const mealMessage = document.getElementById("mealMessage");

  if (!person) {
    mealHeadline.textContent = "Name nicht gefunden";
    mealMessage.innerHTML = "<p style='color:red'>Nachname nicht gefunden. Bitte prüfe die Eingabe.</p>";
    mealSection.classList.add("visible");
    currentPerson = null;
    return;
  }

  currentPerson = person;
  await checkIfMealSubmitted(person.name, person.vorname);
}

// checkIfMealSubmitted bleibt erhalten
// ...existing code...
// enableEdit wird nicht mehr benötigt
// function enableEdit() {
//   const mealForm = document.getElementById("mealForm");
//   const editButton = document.getElementById("editButton");
//   const submitButton = mealForm.querySelector('button[type="submit"]');
//
//   // 🟢 Alle Felder aktivieren
//   for (let el of mealForm.elements) {
//     if (el.tagName !== "BUTTON") el.disabled = false;
//   }
//
//   mealExists = true;
//   document.getElementById("mealMessage").textContent = "";
//
//   // Jetzt nur Speichern zeigen
//   editButton.style.display = "none";
//   submitButton.style.display = "inline-block";
// }


document.getElementById("mealForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!currentPerson) {
    document.getElementById("mealMessage").innerHTML = "<p style='color:red'>Bitte gib einen gültigen Nachnamen ein.</p>";
    return;
  }

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

