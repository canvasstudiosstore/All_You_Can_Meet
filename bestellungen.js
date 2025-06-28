const BESTELLUNGEN_URL = "https://docs.google.com/spreadsheets/d/1vTOtSPwhzF5_ckYPhaOVoSHFninJhfqqGfqYdUVcHNg/gviz/tq?sheet=Essen&tqx=out:json";

window.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayOrders();
});

async function fetchAndDisplayOrders() {
  const ordersContainer = document.getElementById("ordersContainer");
  ordersContainer.innerHTML = "<p>Lade Bestellungen...</p>";
  console.log("→ Starte fetch von Sheet...");

  try {
    const res = await fetch(BESTELLUNGEN_URL);
    console.log("Fetch abgeschlossen, Status:", res.status);

    if (!res.ok) {
      throw new Error("HTTP-Fehler " + res.status);
    }

    const text = await res.text();
    console.log("Sheet-Antwort (Anfang):", text.slice(0, 200));

    const json = JSON.parse(text.substr(47).slice(0, -2));
    console.log("JSON geparst:", json.table.rows.length, "Zeilen");

    const rows = json.table.rows;
    const gang2 = {}, gang3 = {};
    rows.slice(1).forEach(row => {
      const [nachname, vorname, main, gang2T, dessert, gang3T, zusatz] = row.c.map(c => c?.v || "");

      if (gang2T) {
        gang2[gang2T] = gang2[gang2T] || [];
        gang2[gang2T].push({ vorname, nachname, gericht: main, zusatz });
      }
      if (gang3T) {
        gang3[gang3T] = gang3[gang3T] || [];
        gang3[gang3T].push({ vorname, nachname, gericht: dessert, zusatz });
      }
    });

    console.log("Gruppierte Daten:", { gang2, gang3 });

    let html = "";
    html += renderTableSectionHTML("Gang 2 – Hauptgang", gang2);
    html += renderTableSectionHTML("Gang 3 – Dessert", gang3);

    ordersContainer.innerHTML = html || "<p>Keine Bestellungen vorhanden.</p>";
  } catch (err) {
    console.error("Fehler beim Laden:", err);
    ordersContainer.innerHTML = "<p style='color:red'>Fehler beim Laden der Bestellungen.</p>";
  }
}

function renderTableSectionHTML(title, data) {
  let sectionHTML = `<h2>${title}</h2>`;
  for (const [tisch, list] of Object.entries(data)) {
    sectionHTML += `<div class="table-section"><table>
      <caption>${tisch}</caption>
      <thead><tr><th>Name</th><th>Gericht</th><th>Hinweis</th></tr></thead>
      <tbody>`;
    list.forEach(e => {
      sectionHTML += `<tr>
        <td>${e.vorname} ${e.nachname}</td>
        <td>${e.gericht}</td>
        <td>${e.zusatz || "-"}</td>
      </tr>`;
    });
    sectionHTML += "</tbody></table></div>";
  }
  return sectionHTML;
}
