const MEAL_SHEET_URL = "https://docs.google.com/spreadsheets/d/1vTOtSPwhzF5_ckYPhaOVoSHFninJhfqqGfqYdUVcHNg/gviz/tq?sheet=Essen&tqx=out:json";

window.addEventListener("DOMContentLoaded", () => {
  fetchOrders();
});

async function fetchOrders() {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = "<p style='text-align:center;'>⏳ Lade Bestellungen...</p>";

  try {
    const res = await fetch(MEAL_SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));

    const rows = json.table.rows;
    const orders = [];

    // Alle Zeilen einlesen
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.c || !row.c[0]) continue;

      const name = row.c[0]?.v || "";
      const vorname = row.c[1]?.v || "";
      const hauptgang = row.c[2]?.v || "";
      const tisch2 = row.c[3]?.v || "";
      const dessert = row.c[4]?.v || "";
      const tisch3 = row.c[5]?.v || "";
      const zusatz = row.c[6]?.v || "";

      orders.push({ name, vorname, hauptgang, tisch2, dessert, tisch3, zusatz });
    }

    renderTables(orders);
  } catch (err) {
    container.innerHTML = "<p style='text-align:center; color:red;'>❌ Fehler beim Laden der Bestellungen.</p>";
    console.error(err);
  }
}

function renderTables(data) {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = "";

  const gang2Tische = {};
  const gang3Tische = {};

  for (const entry of data) {
    if (entry.tisch2) {
      const key = `Tisch ${entry.tisch2}`;
      if (!gang2Tische[key]) gang2Tische[key] = [];
      gang2Tische[key].push(entry);
    }
    if (entry.tisch3) {
      const key = `Tisch ${entry.tisch3}`;
      if (!gang3Tische[key]) gang3Tische[key] = [];
      gang3Tische[key].push(entry);
    }
  }

  container.appendChild(makeTableBlock("🍝 Hauptgang (Gang 2)", gang2Tische, "hauptgang"));
  container.appendChild(makeTableBlock("🍰 Dessert (Gang 3)", gang3Tische, "dessert"));
}

function makeTableBlock(title, groupedData, field) {
  const section = document.createElement("section");
  section.className = "table-section";

  const heading = document.createElement("h2");
  heading.textContent = title;
  section.appendChild(heading);

  for (const tisch in groupedData) {
    const group = groupedData[tisch];

    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = tisch;
    table.appendChild(caption);

    const thead = document.createElement("thead");
    thead.innerHTML = `<tr><th>Name</th><th>${field === "hauptgang" ? "Hauptgang" : "Dessert"}</th><th>Zusatz</th></tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    group.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.vorname} ${entry.name}</td>
        <td>${entry[field]}</td>
        <td>${entry.zusatz || ""}</td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    section.appendChild(table);
  }

  return section;
}
