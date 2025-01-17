let pokemonNames = [];

document.addEventListener("DOMContentLoaded", () => {
  loadJapaneseNames();
});

async function loadJapaneseNames() {
  const url = "https://pokeapi.co/api/v2/pokemon-species?limit=1000";
  const response = await fetch(url);
  const data = await response.json();

  pokemonNames = await Promise.all(
    data.results.map(async (pokemon) => {
      const speciesResponse = await fetch(pokemon.url);
      const speciesData = await speciesResponse.json();
      const japaneseName = speciesData.names.find(
        (name) => name.language.name === "ja"
      ).name;
      return { id: speciesData.id, name: japaneseName, url: speciesData.url };
    })
  );
}

function searchPokemon() {
  const query = document.getElementById("search-box").value.trim();
  const listDiv = document.getElementById("pokemon-list");
  const detailDiv = document.getElementById("pokemon-detail");
  listDiv.innerHTML = "検索中...";
  detailDiv.style.display = "none";

  const filtered = pokemonNames.filter((pokemon) =>
    pokemon.name.includes(query)
  );

  if (filtered.length === 0) {
    listDiv.innerHTML = `<p style="color: red;">該当するポケモンが見つかりませんでした。</p>`;
    return;
  }

  listDiv.innerHTML = "";
  filtered.forEach((pokemon) => {
    const card = document.createElement("div");
    card.className = "pokemon-card";
    card.innerHTML = `
      <p>${pokemon.name}</p>
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png" alt="${pokemon.name}">
    `;
    card.addEventListener("click", () => showDetails(pokemon.id));
    listDiv.appendChild(card);
  });
}

async function showDetails(id) {
  const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${id}`;
  const detailDiv = document.getElementById("pokemon-detail");

  try {
    const [pokemonResponse, speciesResponse] = await Promise.all([
      fetch(pokemonUrl),
      fetch(speciesUrl),
    ]);

    if (!pokemonResponse.ok || !speciesResponse.ok) {
      throw new Error("ポケモンの詳細を取得できませんでした。");
    }

    const pokemonData = await pokemonResponse.json();
    const speciesData = await speciesResponse.json();

    const japaneseName = speciesData.names.find(
      (n) => n.language.name === "ja"
    ).name;
    const flavorText = speciesData.flavor_text_entries
      .find((entry) => entry.language.name === "ja")
      .flavor_text.replace(/[\n\f]/g, " ");
    const stats = pokemonData.stats.map((stat) => ({
      name: stat.stat.name,
      value: stat.base_stat,
    }));
    const orderedStats = [
      { key: "hp", label: "HP", value: stats.find((s) => s.name === "hp").value },
      { key: "attack", label: "攻撃", value: stats.find((s) => s.name === "attack").value },
      { key: "defense", label: "防御", value: stats.find((s) => s.name === "defense").value },
      { key: "speed", label: "素早さ", value: stats.find((s) => s.name === "speed").value },
      { key: "special-defense", label: "特防", value: stats.find((s) => s.name === "special-defense").value },
      { key: "special-attack", label: "とくこう", value: stats.find((s) => s.name === "special-attack").value },
    ];

    const ctxElement = document.getElementById("stats-chart");
    const ctx = ctxElement.getContext("2d");
    new Chart(ctx, {
      type: "radar",
      data: {
        labels: orderedStats.map((stat) => stat.label),
        datasets: [
          {
            label: "種族値",
            data: orderedStats.map((stat) => stat.value),
            backgroundColor: "rgba(255, 69, 0, 0.5)",
            borderColor: "rgba(255, 69, 0, 1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
          },
        },
      },
    });

    const statValuesDiv = document.getElementById("stat-values");
    statValuesDiv.innerHTML = orderedStats
      .map((stat) => `<p><strong>${stat.label}:</strong> ${stat.value}</p>`)
      .join("");

    const typeTranslations = {
      fire: "ほのお",
      water: "みず",
      grass: "くさ",
      electric: "でんき",
      bug: "むし",
      normal: "ノーマル",
      poison: "どく",
      ground: "じめん",
      flying: "ひこう",
      psychic: "エスパー",
      rock: "いわ",
      ice: "こおり",
      dragon: "ドラゴン",
      dark: "あく",
      steel: "はがね",
      fairy: "フェアリー",
      fighting: "かくとう",
      ghost: "ゴースト",
    };
    const japaneseTypes = pokemonData.types.map(
      (type) => typeTranslations[type.type.name] || type.type.name
    );

    detailDiv.style.display = "block";
    document.getElementById("additional-info").innerHTML = `
      <h2>${japaneseName} (${pokemonData.name.toUpperCase()})</h2>
      <p><strong>タイプ:</strong> ${japaneseTypes.join(", ")}</p>
      <p><strong>説明:</strong> ${flavorText}</p>
    `;
  } catch (error) {
    detailDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}
