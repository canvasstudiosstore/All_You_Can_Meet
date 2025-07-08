const MEAL_SHEET_URL = "https://docs.google.com/spreadsheets/d/1vTOtSPwhzF5_ckYPhaOVoSHFninJhfqqGfqYdUVcHNg/gviz/tq?sheet=Essen&tqx=out:json";

let allOrders = [];

window.addEventListener("DOMContentLoaded", () => {
  fetchOrders();

  document.getElementById("viewTables").addEventListener("click", () => {
    toggleActiveTab("viewTables");
    renderTables(allOrders);
  });

  document.getElementById("viewMeals").addEventListener("click", () => {
    toggleActiveTab("viewMeals");
    renderGroupedMeals(allOrders);
  });
});

function toggleActiveTab(activeId) {
  document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
  document.getElementById(activeId).classList.add("active");
}


async function fetchOrders() {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = "<p style='text-align:center;'>⏳ Lade Bestellungen...</p>";

  try {
    const res = await fetch(MEAL_SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));

    const rows = json.table.rows;
    const orders = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.c) continue;

      const name = row.c[0]?.v || "";
      const vorname = row.c[1]?.v || "";
      const hauptgang = row.c[2]?.v || "";
      const tisch2 = row.c[3]?.v || "";
      const dessert = row.c[4]?.v || "";
      const tisch3 = row.c[5]?.v || "";
      const zusatzHauptgang = row.c[6]?.v || "";
        const zusatzDessert = row.c[7]?.v || "";

      // Nur hinzufügen, wenn entweder Vorname oder Nachname vorhanden ist
      if (name || vorname) {
        orders.push({
        name,
        vorname,
        hauptgang,
        tisch2,
        dessert,
        tisch3,
        zusatzHauptgang,
        zusatzDessert
        });

      }
    }

    allOrders = orders; // Speichern für spätere Umschaltung der Ansicht
    renderTables(orders); // Standardansicht laden
  } catch (err) {
    container.innerHTML = "<p style='text-align:center; color:red;'>❌ Fehler beim Laden der Bestellungen.</p>";
    console.error(err);
  }
}





function renderTables(data) {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = "";

  // Bestehende Gang 2 + Gang 3 Tabellen
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


function renderGroupedMeals(data) {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = "";

  const grouped = {
    hauptgang: {},
    dessert: {}
  };

  data.forEach(entry => {
    ["hauptgang", "dessert"].forEach(field => {
      const gericht = entry[field];
      if (!gericht) return;

      if (!grouped[field][gericht]) {
        grouped[field][gericht] = {
          count: 0,
          zusatz: []
        };
      }

      grouped[field][gericht].count++;

      const zusatztext = field === "hauptgang" ? entry.zusatzHauptgang : entry.zusatzDessert;
      if (zusatztext) {
        grouped[field][gericht].zusatz.push(`1x ${zusatztext}`);
      }
    });
  });

  const section = document.createElement("section");
  section.className = "table-section";

  const heading = document.createElement("h2");
  heading.textContent = "🍽️ Übersicht nach Gerichten";
  section.appendChild(heading);

  // 🥗 Vorspeise
  const starterTable = document.createElement("table");
  starterTable.classList.add("starter-table");

  starterTable.innerHTML = `
    <caption>🥗 Vorspeisen</caption>
    <thead><tr><th>Gericht</th><th>Anzahl</th></tr></thead>
    <tbody><tr><td>Antipasti mit Quiche</td><td>${data.length}</td></tr></tbody>
  `;

  const starterWrapper = document.createElement("div");
  starterWrapper.className = "table-wrapper";
  starterWrapper.appendChild(starterTable);
  section.appendChild(starterWrapper);

  // 🔄 Tabelle erzeugen für Hauptgang + Dessert
  ["hauptgang", "dessert"].forEach(field => {
    const title = field === "hauptgang" ? "🥘 Hauptgänge" : "🍰 Desserts";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Gericht</th><th>Anzahl</th><th>Zusatzinfos</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const gericht in grouped[field]) {
      const eintrag = grouped[field][gericht];
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${gericht}</td>
        <td>${eintrag.count}</td>
        <td>${eintrag.zusatz.length ? eintrag.zusatz.join("<br>") : ""}</td>
      `;
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    const caption = document.createElement("caption");
    caption.textContent = title;
    table.insertBefore(caption, thead);

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    wrapper.appendChild(table);
    section.appendChild(wrapper);
  });

  container.appendChild(section);
}





function makeTableBlock(title, groupedData, field) {
  const section = document.createElement("section");
  section.className = "table-section";

  const heading = document.createElement("h2");
  heading.textContent = title;
  section.appendChild(heading);

  // 🔢 Tischnamen sortieren
  const sortedKeys = Object.keys(groupedData).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    return numA - numB;
  });

  for (const tisch of sortedKeys) {
    const group = groupedData[tisch];

    // Zähle Gerichte + sammle Zusatzinfos
    const dishData = {};

    group.forEach(entry => {
      const gericht = entry[field];
      if (!gericht) return;

      if (!dishData[gericht]) {
        dishData[gericht] = {
          count: 0,
          notes: []
        };
      }

      dishData[gericht].count += 1;

      const zusatztext = field === "hauptgang" ? entry.zusatzHauptgang : entry.zusatzDessert;
        if (zusatztext) {
        dishData[gericht].notes.push(`1x ${zusatztext}`);
        }       

    });

    // Tabelle erstellen
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = tisch;
    table.appendChild(caption);

    const thead = document.createElement("thead");
    thead.innerHTML = `<tr><th>Gericht</th><th>Anzahl</th><th>Zusatzinfos</th></tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const gericht in dishData) {
      const { count, notes } = dishData[gericht];
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${gericht}</td>
        <td>${count}</td>
        <td>${notes.length > 0 ? notes.join("<br>") : ""}</td>
      `;
      tbody.appendChild(row);
    }

    table.appendChild(tbody);

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    wrapper.appendChild(table);
    section.appendChild(wrapper);
  }

  return section;
}


