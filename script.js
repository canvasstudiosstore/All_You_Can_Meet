const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTdRv8MtV5_X7uNetgybGAcxx7JZeD_3kZIot4uuJ2k4URQSlIBqfJci9tgzWnZ1BGbD98Zlq0wycW5/gviz/tq?tqx=out:json";

async function fetchSheetData() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));

  return json.table.rows.map(row => ({
    name: row.c[0]?.v,
    gang1: row.c[1]?.v,
    gang2: row.c[2]?.v,
    gang3: row.c[3]?.v,
  }));
}

async function findPerson() {
  const input = document.getElementById("nameInput").value.trim().toLowerCase();
  const data = await fetchSheetData();
  const person = data.find(p => p.name && p.name.toLowerCase() === input);
  const resultDiv = document.getElementById("result");

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
    resultDiv.innerHTML = "<p style='color:red'>Name nicht gefunden. Bitte prüfe die Schreibweise.</p>";
  }
}
