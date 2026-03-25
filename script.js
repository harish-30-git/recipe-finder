const grid = document.getElementById('recipeGrid');
const modal = document.getElementById('recipeModal');
const modalData = document.getElementById('modalData');
let customRecipes = [];
let favorites = JSON.parse(localStorage.getItem('gourmetFavs')) || [];

async function loadLocalData() {
    try {
        const res = await fetch('recipes.json');
        const data = await res.json();
        customRecipes = data.customRecipes;
        filterByCuisine('Indian');
    } catch (e) {
        filterByCuisine('Indian');
    }
}

async function apiCall(url, isKeyword = false) {
    grid.innerHTML = "<div class='loader'>Curating your menu...</div>";
    const res = await fetch(url);
    const data = await res.json();
    let meals = data.meals || [];

    if (isKeyword) {
        const searchVal = document.getElementById('searchInput').value.toLowerCase();
        const localMatches = customRecipes.filter(r => 
            r.strMeal.toLowerCase().includes(searchVal) || r.strArea.toLowerCase().includes(searchVal)
        );
        meals = [...localMatches, ...meals];
    }
    display(meals);
}

function filterByCuisine(area) {
    if(area === 'South Indian') {
        display(customRecipes.filter(r => r.strArea === 'South Indian'));
    } else {
        apiCall(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`);
    }
}

function filterByCategory(cat) { apiCall(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`); }
function filterByKeyword(word) { apiCall(`https://www.themealdb.com/api/json/v1/1/search.php?s=${word}`, true); }

document.getElementById('searchBtn').addEventListener('click', () => filterByKeyword(document.getElementById('searchInput').value));
document.getElementById('randomBtn').addEventListener('click', () => apiCall('https://www.themealdb.com/api/json/v1/1/random.php'));

function display(meals) {
    if (!meals || meals.length === 0) {
        grid.innerHTML = "<h3>No dishes found.</h3>";
        return;
    }
    grid.innerHTML = meals.map(m => {
        const isFav = favorites.some(fav => fav.idMeal === m.idMeal);
        return `
            <div class="recipe-card">
                <button class="fav-icon ${isFav ? 'active' : ''}" onclick="toggleFavorite('${m.idMeal}', '${m.strMeal}', '${m.strMealThumb}')">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                <div onclick="openFullRecipe('${m.idMeal}')">
                    <img src="${m.strMealThumb}" alt="${m.strMeal}">
                    <div class="recipe-info">
                        <h2>${m.strMeal}</h2>
                        <span style="color:var(--gold); font-size:0.8rem; font-weight:bold;">EXPLORE RECIPE →</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleFavorite(id, name, img) {
    const index = favorites.findIndex(f => f.idMeal === id);
    if (index === -1) {
        favorites.push({ idMeal: id, strMeal: name, strMealThumb: img });
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('gourmetFavs', JSON.stringify(favorites));
    display(favorites.length > 0 ? favorites : []); // Refresh display if in favorites view
    if (favorites.length === 0) filterByCuisine('Indian'); 
}

function displayFavorites() {
    display(favorites);
}

async function openFullRecipe(id) {
    let m = customRecipes.find(r => r.idMeal === id);
    if (!m) {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        m = data.meals[0];
    }

    let ytEmbed = "";
    if (m.strYoutube && m.strYoutube !== "") {
        const vidId = m.strYoutube.includes('v=') ? m.strYoutube.split('v=')[1].split('&')[0] : m.strYoutube.split('/').pop();
        ytEmbed = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${vidId}" frameborder="0" allowfullscreen></iframe></div>`;
    }

    modalData.innerHTML = `
        <h1 style="color:var(--gold); font-family:'Playfair Display'; margin-bottom:10px;">${m.strMeal}</h1>
        <p style="color:#666; margin-bottom:20px;">${m.strArea} Cuisine • ${m.strCategory}</p>
        <img src="${m.strMealThumb}" style="width:100%; border-radius:20px; aspect-ratio:16/9; object-fit:cover; margin-bottom:30px;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:40px; text-align:left;">
            <div>
                <h3 style="border-bottom:1px solid var(--gold); padding-bottom:10px;">Ingredients</h3>
                <ul style="list-style: none; padding:0; margin-top:15px;">
                    ${m.ingredients ? m.ingredients.map(i => `<li style="padding:5px 0; color:#ccc;">• ${i}</li>`).join('') : getIng(m)}
                </ul>
            </div>
            <div>
                <h3 style="border-bottom:1px solid var(--gold); padding-bottom:10px;">Preparation</h3>
                <p style="color:#aaa; line-height:1.8; margin-top:15px; white-space:pre-line;">${m.strInstructions}</p>
            </div>
        </div>
        ${ytEmbed}
    `;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function getIng(m) {
    let html = "";
    for (let i = 1; i <= 20; i++) {
        if (m[`strIngredient${i}`]) html += `<li style="padding:5px 0; color:#ccc; border-bottom:1px solid #222;">${m[`strIngredient${i}`]} - ${m[`strMeasure${i}`]}</li>`;
    }
    return html;
}

document.querySelector('.close-btn').onclick = () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
};

loadLocalData();
