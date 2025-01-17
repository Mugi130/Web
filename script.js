let pokemonNames = []; // キャッシュ用
const apiCache = {}; // APIレスポンスをキャッシュ

document.addEventListener("DOMContentLoaded", () => {
  loadPokemonData();
});

// 全ポケモンデータをキャッシュ
async function loadPokemonData() {
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
      return { 
        id: speciesData.id, 
        name: pokemon.name, 
        japaneseName, 
        url: pokemon.url 
      };
    })
  );

  console.log("全ポケモンデータがキャッシュされました:", pokemonNames);
}

// 検索機能（日本語・英語・ID対応）
function searchPokemon() {
  const query = document.getElementById("search-box").value.trim().toLowerCase();
  const listDiv = document.getElementById("pokemon-list");
  const detailDiv = document.getElementById("pokemon-detail");
  listDiv.innerHTML = "検索中...";
  detailDiv.style.display = "none";

  // 数字の場合はIDで検索
  if (!isNaN(query)) {
    const id = parseInt(query, 10);
    const pokemon = pokemonNames.find((p) => p.id === id);
    if (pokemon) {
      showDetails(pokemon.id);
      return;
    }
  }

  // 日本語または英語名で検索
  const filtered = pokemonNames.filter(
    (p) =>
      p.japaneseName.includes(query) || p.name.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    listDiv.innerHTML = `<p style="color: red;">該当するポケモンが見つかりませんでした。</p>`;
    return;
  }

  listDiv.innerHTML = filtered
    .map(
      (pokemon) => `
      <div class="pokemon-card" onclick="showDetails(${pokemon.id})">
        <p>${pokemon.japaneseName} (${pokemon.name})</p>
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png" alt="${pokemon.name}">
      </div>
    `
    )
    .join("");
}

// 詳細情報表示
async function showDetails(id) {
  const detailDiv = document.getElementById("pokemon-detail");

  // キャッシュチェック
  if (apiCache[id]) {
    renderDetails(apiCache[id]);
    return;
  }

  const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${id}`;
  try {
    const [pokemonResponse, speciesResponse] = await Promise.all([
      fetch(pokemonUrl),
      fetch(speciesUrl),
    ]);

    if (!pokemonResponse.ok || !speciesResponse.ok) {
      throw new Error("詳細データが取得できませんでした。");
    }

    const pokemonData = await pokemonResponse.json();
    const speciesData = await speciesResponse.json();

    // キャッシュに保存
    apiCache[id] = { pokemonData, speciesData };
    renderDetails(apiCache[id]);
  } catch (error) {
    detailDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}

// 詳細情報のレンダリング
function renderDetails({ pokemonData, speciesData }) {
  const detailDiv = document.getElementById("pokemon-detail");
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

  // 種族値のグラフ
  const ctx = document.getElementById("stats-chart").getContext("2d");
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: stats.map((stat) => stat.name),
      datasets: [
        {
          label: "種族値",
          data: stats.map((stat) => stat.value),
          backgroundColor: "rgba(255, 69, 0, 0.5)",
          borderColor: "rgba(255, 69, 0, 1)",
        },
      ],
    },
  });

  // 詳細情報を表示
  detailDiv.style.display = "block";
  document.getElementById("additional-info").innerHTML = `
    <h2>${japaneseName} (${pokemonData.name.toUpperCase()})</h2>
    <p>${flavorText}</p>
  `;
}
