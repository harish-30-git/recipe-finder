const grid = document.getElementById('recipeGrid');
const modal = document.getElementById('recipeModal');
const modalData = document.getElementById('modalData');

// NEW: Store custom recipes globally after loading
let customRecipes = [];

// NEW: Load JSON data on startup
async function loadLocalData() {
    try {
        const res = await fetch('recipes.json');
        const data = await res.json();
        customRecipes = data.customRecipes;
        // Start by showing custom Indian recipes
        filterByCuisine('Indian');
    } catch (e) {
        console.log("Local JSON not found, falling back to API.");
        filterByCuisine('Indian');
    }
}

async function apiCall(url, isKeyword = false) {
    grid.innerHTML = "<div class='loader'>Curating your menu...</div>";
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        let meals = data.meals || [];

        // NEW: If searching for Biryani/Dosa/South Indian, merge with our JSON
        if (isKeyword) {
            const searchVal = document.getElementById('searchInput').value.toLowerCase();
            const localMatches = customRecipes.filter(r => 
                r.strMeal.toLowerCase().includes(searchVal) || 
                r.strArea.toLowerCase().includes(searchVal)
            );
            meals = [...localMatches, ...meals];
        }

        display(meals);
    } catch (e) { grid.innerHTML = "Chef is busy. Try again!"; }
}

function filterByCuisine(area) {
    // If South Indian, load from JSON first
    if(area === 'South Indian') {
        const matches = customRecipes.filter(r => r.strArea === 'South Indian');
        display(matches);
    } else {
        apiCall(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`);
    }
}

function filterByCategory(cat) { apiCall(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`); }

// Updated to pass 'true' for keyword search
function filterByKeyword(word) { apiCall(`https://www.themealdb.com/api/json/v1/1/search.php?s=${word}`, true); }

document.getElementById('searchBtn').addEventListener('click', () => filterByKeyword(document.getElementById('searchInput').value));
document.getElementById('randomBtn').addEventListener('click', () => apiCall('https://www.themealdb.com/api/json/v1/1/random.php'));

function display(meals) {
    if (!meals || meals.length === 0) {
        grid.innerHTML = "<h3>Oops! No dishes found. Try 'Cake' or 'Paneer'!</h3>";
        return;
    }
    grid.innerHTML = meals.map(m => `
        <div class="recipe-card" onclick="openFullRecipe('${m.idMeal}')">
            <img src="${m.strMealThumb}" alt="${m.strMeal}">
            <div class="recipe-info">
                <h2 style="font-family:'Playfair Display'; margin:0 0 10px 0;">${m.strMeal}</h2>
                <span style="color:var(--gold); font-weight:bold;">View Secrets →</span>
            </div>
        </div>
    `).join('');
}

async function openFullRecipe(id) {
    let m;
    // Check if ID is from our custom JSON
    const customMatch = customRecipes.find(r => r.idMeal === id);
    
    if (customMatch) {
        m = customMatch;
    } else {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        m = data.meals[0];
    }

    let ytEmbed = "";
    if (m.strYoutube) {
        // Handle both full URLs and embed URLs
        const vidId = m.strYoutube.includes('v=') ? m.strYoutube.split('v=')[1].split('&')[0] : m.strYoutube.split('/').pop();
        ytEmbed = `<div class="video-wrapper">
            <iframe src="https://www.youtube.com/embed/${vidId}" frameborder="0" allowfullscreen></iframe>
        </div>`;
    }

    modalData.innerHTML = `
        <h1 style="color:var(--gold); font-family:'Playfair Display'; font-size:2.5rem; margin-top:0;">${m.strMeal}</h1>
        <div style="display:flex; justify-content:space-between; color:#888; margin-bottom:20px;">
            <span>${m.strArea} Cuisine</span>
            <span>Category: ${m.strCategory}</span>
        </div>
        <img src="${m.strMealThumb}" style="width:100%; border-radius:25px; margin-bottom:30px;">
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:40px;">
            <div>
                <h3 style="border-bottom:2px solid var(--gold); padding-bottom:10px;">Ingredients</h3>
                <ul style="list-style: none; padding:0;">${m.ingredients ? m.ingredients.map(i => `<li>${i}</li>`).join('') : getIng(m)}</ul>
            </div>
            <div>
                <h3 style="border-bottom:2px solid var(--gold); padding-bottom:10px;">Preparation</h3>
                <p style="color:#bbb; line-height:1.8; white-space: pre-line;">${m.strInstructions}</p>
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
        if (m[`strIngredient${i}`]) {
            html += `<li style="padding:8px 0; border-bottom:1px solid #222;">
                <span style="color:var(--gold)">●</span> ${m[`strIngredient${i}`]} - ${m[`strMeasure${i}`]}
            </li>`;
        }
    }
    return html;
}

document.querySelector('.close-btn').onclick = () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
};

// Initial Load
loadLocalData();