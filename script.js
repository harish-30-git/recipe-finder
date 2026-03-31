const grid = document.getElementById('recipeGrid');
const modal = document.getElementById('recipeModal');
const modalData = document.getElementById('modalData');

// NEW: Store custom recipes globally after loading
let customRecipes = [];
let revealObserver;

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
    grid.innerHTML = meals.map((m, index) => `
        <div class="recipe-card reveal-item" style="--reveal-delay:${Math.min(index * 70, 420)}ms" onclick="openFullRecipe('${m.idMeal}')">
            <img src="${m.strMealThumb}" alt="${m.strMeal}">
            <div class="recipe-info">
                <h2 class="recipe-title">${m.strMeal}</h2>
                <span class="recipe-cta">View Recipe →</span>
            </div>
        </div>
    `).join('');

    runReveal();
    enableCardTilt();
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
        <h1 class="modal-title">${m.strMeal}</h1>
        <div class="modal-meta">
            <span>${m.strArea} Cuisine</span>
            <span>Category: ${m.strCategory}</span>
        </div>
        <img class="modal-image" src="${m.strMealThumb}" alt="${m.strMeal}">

        <div class="modal-grid">
            <div>
                <h3 class="modal-section-title">Ingredients</h3>
                <ul class="ingredients-list">${m.ingredients ? m.ingredients.map(i => `<li class="ingredient-item">${i}</li>`).join('') : getIng(m)}</ul>
            </div>
            <div>
                <h3 class="modal-section-title">Preparation</h3>
                <p class="instructions">${m.strInstructions}</p>
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
            html += `<li class="ingredient-item">
                <span class="ingredient-dot">●</span>${m[`strIngredient${i}`]} - ${m[`strMeasure${i}`]}
            </li>`;
        }
    }
    return html;
}

document.querySelector('.close-btn').onclick = () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
};

function initExperience() {
    initCustomCursor();
    initScrollProgress();
    initMouseGlowParallax();
    initRevealObserver();
    initInteractiveStates();
    enableCardTilt();
}

function initCustomCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) {
        return;
    }

    const cursor = document.createElement('div');
    const dot = document.createElement('div');
    cursor.className = 'custom-cursor';
    dot.className = 'custom-cursor-dot';
    document.body.appendChild(cursor);
    document.body.appendChild(dot);

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;

    document.addEventListener('mousemove', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        document.body.style.setProperty('--mx', `${targetX}px`);
        document.body.style.setProperty('--my', `${targetY}px`);
        dot.style.transform = `translate(${targetX}px, ${targetY}px)`;
        document.body.classList.add('cursor-visible');
    });

    document.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-visible');
    });

    document.addEventListener('mouseover', (event) => {
        const interactive = event.target.closest('button, a, input, .recipe-card, .chip, .close-btn');
        document.body.classList.toggle('cursor-hover', Boolean(interactive));
    });

    const animate = () => {
        x += (targetX - x) * 0.18;
        y += (targetY - y) * 0.18;
        cursor.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(animate);
    };

    animate();
}

function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    const update = () => {
        const scrollTop = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? scrollTop / max : 0;
        document.body.style.setProperty('--scroll-progress', progress.toString());
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initMouseGlowParallax() {
    const glowOne = document.querySelector('.bg-glow-one');
    const glowTwo = document.querySelector('.bg-glow-two');
    if (!glowOne || !glowTwo) {
        return;
    }

    document.addEventListener('mousemove', (event) => {
        const rx = (event.clientX / window.innerWidth) - 0.5;
        const ry = (event.clientY / window.innerHeight) - 0.5;
        glowOne.style.transform = `translate(${rx * 20}px, ${ry * 18}px)`;
        glowTwo.style.transform = `translate(${rx * -22}px, ${ry * -20}px)`;
    });
}

function initRevealObserver() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal-item').forEach((el) => el.classList.add('is-visible'));
        return;
    }

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.16,
        rootMargin: '0px 0px -6% 0px'
    });

    document.querySelector('.search-hero')?.classList.add('reveal-item');
    document.querySelector('.filter-chips')?.classList.add('reveal-item');
    runReveal();
}

function runReveal() {
    const items = document.querySelectorAll('.reveal-item:not([data-reveal-bound])');
    items.forEach((item) => {
        item.setAttribute('data-reveal-bound', 'true');
        if (revealObserver) {
            revealObserver.observe(item);
        } else {
            item.classList.add('is-visible');
        }
    });
}

function enableCardTilt() {
    if (!window.matchMedia('(pointer: fine)').matches) {
        return;
    }

    const cards = document.querySelectorAll('.recipe-card');
    cards.forEach((card) => {
        if (card.dataset.tiltBound === 'true') {
            return;
        }

        card.dataset.tiltBound = 'true';
        card.addEventListener('mousemove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            const rotateY = (x - 0.5) * 8;
            const rotateX = (0.5 - y) * 8;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

function initInteractiveStates() {
    const actionable = document.querySelectorAll('.chip, .nav-btn');
    actionable.forEach((element) => {
        element.addEventListener('click', () => {
            if (element.classList.contains('chip')) {
                document.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('is-active'));
            }
            if (element.classList.contains('nav-btn')) {
                document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('is-active'));
            }
            element.classList.add('is-active');
        });
    });
}

// Initial Load
initExperience();
loadLocalData();
