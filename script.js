const grid = document.getElementById('recipeGrid');
const modal = document.getElementById('recipeModal');
const modalData = document.getElementById('modalData');
let customRecipes = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];
let shoppingList = JSON.parse(localStorage.getItem('shopList')) || [];
let currentServings = 2;

// 1. Initialize & Load
async function init() {
    try {
        const res = await fetch('recipes.json');
        const data = await res.json();
        customRecipes = data.customRecipes;
    } catch (e) { console.warn("Local JSON missing."); }
    updateCartCount();
    filterByCuisine('Indian');
}

// 2. Core API & Display
async function apiCall(url, isKeyword = false) {
    grid.innerHTML = "<div class='loader'>Chef is preparing...</div>";
    const res = await fetch(url);
    const data = await res.json();
    let meals = data.meals || [];
    if (isKeyword) {
        const val = document.getElementById('searchInput').value.toLowerCase();
        const local = customRecipes.filter(r => r.strMeal.toLowerCase().includes(val));
        meals = [...local, ...meals];
    }
    display(meals);
}

function display(meals) {
    grid.innerHTML = meals.map(m => {
        const isFav = favorites.some(f => f.idMeal === m.idMeal);
        return `
            <div class="recipe-card">
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${m.idMeal}', '${m.strMeal}', '${m.strMealThumb}')">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                <img src="${m.strMealThumb}" onclick="openFullRecipe('${m.idMeal}')">
                <div class="recipe-info">
                    <h3 style="font-family:'Playfair Display'">${m.strMeal}</h3>
                    <button class="chip" onclick="openFullRecipe('${m.idMeal}')">View Recipe</button>
                </div>
            </div>
        `;
    }).join('');
}

// 3. Servings & Ingredients Logic
function updateServings(delta, id) {
    currentServings = Math.max(1, currentServings + delta);
    document.getElementById('servingsNum').innerText = currentServings;
    const ingList = document.querySelectorAll('.ing-item');
    ingList.forEach(li => {
        const base = parseFloat(li.dataset.base);
        if (base) {
            const newQty = (base * (currentServings / 2)).toFixed(1);
            li.querySelector('.qty').innerText = newQty.endsWith('.0') ? Math.round(newQty) : newQty;
        }
    });
}

// 4. Shopping List Logic
function toggleShoppingList() { document.getElementById('shoppingSidebar').classList.toggle('active'); }

function addToCart(ing) {
    if (!shoppingList.includes(ing)) {
        shoppingList.push(ing);
        localStorage.setItem('shopList', JSON.stringify(shoppingList));
        updateCartCount();
        renderShoppingList();
    }
}

function renderShoppingList() {
    const container = document.getElementById('shoppingItems');
    container.innerHTML = shoppingList.map((item, index) => `
        <div class="shopping-item">
            <span>${item}</span>
            <span onclick="removeItem(${index})" style="cursor:pointer; color:red;">&times;</span>
        </div>
    `).join('');
}

function removeItem(i) {
    shoppingList.splice(i, 1);
    localStorage.setItem('shopList', JSON.stringify(shoppingList));
    updateCartCount();
    renderShoppingList();
}

function updateCartCount() { document.getElementById('cartCount').innerText = shoppingList.length; }
function clearList() { shoppingList = []; localStorage.clear(); updateCartCount(); renderShoppingList(); }

// 5. Recipe Modal Logic
async function openFullRecipe(id) {
    currentServings = 2; // Reset
    let m = customRecipes.find(r => r.idMeal === id);
    if (!m) {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        m = data.meals[0];
    }

    modalData.innerHTML = `
        <h1 style="color:var(--gold); font-family:'Playfair Display'">${m.strMeal}</h1>
        
        <div class="servings-controls">
            <span>Servings: </span>
            <button onclick="updateServings(-1)">-</button>
            <b id="servingsNum">2</b>
            <button onclick="updateServings(1)">+</button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:30px;">
            <div class="ing-section">
                <h3>Ingredients <small>(Click 🛒 to add)</small></h3>
                <ul id="ingUl">${getIngHTML(m)}</ul>
            </div>
            <div>
                <h3>Instructions</h3>
                <p style="white-space:pre-line; color:#ccc;">${m.strInstructions}</p>
            </div>
        </div>
        ${m.strYoutube ? `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${m.strYoutube.split('v=')[1] || m.strYoutube.split('/').pop()}" frameborder="0" allowfullscreen></iframe></div>` : ''}
    `;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function getIngHTML(m) {
    let html = "";
    for (let i = 1; i <= 20; i++) {
        const name = m[`strIngredient${i}`];
        const measure = m[`strMeasure${i}`];
        if (name && name.trim() !== "") {
            // Regex to extract numbers for the serving calculator
            const numMatch = measure ? measure.match(/(\d+(\.\d+)?)/) : null;
            const baseQty = numMatch ? numMatch[0] : null;
            const unit = measure ? measure.replace(baseQty, '') : "";
            
            html += `
                <li class="ing-item" data-base="${baseQty || ''}" style="margin-bottom:10px;">
                    <button class="chip" style="padding:2px 10px;" onclick="addToCart('${name}')">🛒</button>
                    <span class="qty">${baseQty || ''}</span>${unit} <b>${name}</b>
                </li>`;
        }
    }
    return html;
}

// 6. Favorites Logic
function toggleFav(id, name, img) {
    const index = favorites.findIndex(f => f.idMeal === id);
    if (index === -1) favorites.push({idMeal: id, strMeal: name, strMealThumb: img});
    else favorites.splice(index, 1);
    localStorage.setItem('favs', JSON.stringify(favorites));
    location.reload(); 
}

function showFavorites() { display(favorites); }
function filterByCuisine(area) { apiCall(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`); }
function filterByCategory(cat) { apiCall(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`); }
function filterByKeyword(word) { apiCall(`https://www.themealdb.com/api/json/v1/1/search.php?s=${word}`, true); }
function closeModal() { modal.style.display = "none"; document.body.style.overflow = "auto"; }

document.getElementById('searchBtn').addEventListener('click', () => filterByKeyword(document.getElementById('searchInput').value));
init();
