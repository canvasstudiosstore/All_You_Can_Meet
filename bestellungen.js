const BESTELLUNGEN_URL = "https://docs.google.com/spreadsheets/d/1vTOtSPwhzF5_ckYPhaOVoSHFninJhfqqGfqYdUVcHNg/gviz/tq?sheet=Essen&tqx=out:json";

window.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayOrders();
  console.log("fetching:", BESTELLUNGEN_URL);
  console.log("response ok?", res.ok, "status", res.status);
console.log("raw text:", text.substring(0,200));


});

async function fetchAndDisplayOrders() {
  try {
    const res = await fetch(BESTELLUNGEN_URL);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows;

    const gang2 = {};  // Hauptgang nach Tisch
    const gang3 = {};  // Dessert nach Tisch

    rows.slice(1).forEach(row => {
      const [nachname, vorname, main, gang2Tisch, dessert, gang3Tisch, zusatz] = row.c.map(c => c?.v || "");

      if (gang2Tisch) {
        gang2[gang2Tisch] = gang2[gang2Tisch] || [];
        gang2[gang2Tisch].push({ vorname, nachname, gericht: main, zusatz });
      }

      if (gang3Tisch) {
        gang3[gang3Tisch] = gang3[gang3Tisch] || [];
        gang3[gang3Tisch].push({ vorname, nachname, gericht: dessert, zusatz });
      }
    });

    renderTableSection("Gang 2 – Hauptgang", gang2, "gang2Container");
    renderTableSection("Gang 3 – Dessert", gang3, "gang3Container");

  } catch (err) {
    document.body.innerHTML += `<p style="color:red;text-align:center">Fehler beim Laden der Bestellungen.</p>`;
    console.error("Fehler:", err);
  }
}

function renderTableSection(title, data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<h2>${title}</h2>`;

  Object.entries(data).forEach(([tisch, bestellungen]) => {
    const table = document.createElement("table");
    table.innerHTML = `
      <caption><strong>${tisch}</strong></caption>
      <thead>
        <tr>
          <th>Name</th>
          <th>Gericht</th>
          <th>Hinweis</th>
        </tr>
      </thead>
      <tbody>
        ${bestellungen.map(e => `
          <tr>
            <td>${e.vorname} ${e.nachname}</td>
            <td>${e.gericht}</td>
            <td>${e.zusatz || "-"}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    container.appendChild(table);
  });
}
