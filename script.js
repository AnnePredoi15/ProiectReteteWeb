const form = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const tagButtons = document.querySelectorAll('.tag-btn:not(#random-recipe-btn)');
const randomRecipeBtn = document.getElementById('random-recipe-btn');
const statsBanner = document.getElementById('stats-banner');
const resultsCounter = document.getElementById('results-counter');

const modal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

const homeTab = document.getElementById('home-tab');
const favoritesTab = document.getElementById('favorites-tab');
const favCountSpan = document.getElementById('fav-count');
const mainHeader = document.getElementById('main-header');
const toast = document.getElementById('toast');

let favorites = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
updateFavCount();

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        fetchRecipes(query);
    }
});

tagButtons.forEach(button => {
    button.addEventListener('click', () => {
        const query = button.getAttribute('data-query');
        searchInput.value = query;
        fetchRecipes(query);
    });
});

randomRecipeBtn.addEventListener('click', () => {
    resultsContainer.innerHTML = '<p class="message">Se generează rețeta aleatorie...</p>';
    statsBanner.style.display = 'none';
    searchInput.value = '';

    fetch('https://www.themealdb.com/api/json/v1/1/random.php')
        .then(response => response.json())
        .then(data => {
            displayRecipes(data.meals, 'Aleatorie');
        })
        .catch(error => {
            console.error('Eroare:', error);
            resultsContainer.innerHTML = '<p class="message" style="color:#ffcdd2;">A apărut o eroare la conexiune.</p>';
        });
});

homeTab.addEventListener('click', () => {
    homeTab.classList.add('active');
    favoritesTab.classList.remove('active');
    mainHeader.style.display = 'block';
    form.style.display = 'flex';
    document.querySelector('.suggestions').style.display = 'block';
    statsBanner.style.display = 'none';
    resultsContainer.innerHTML = '';
    searchInput.value = '';
});

favoritesTab.addEventListener('click', () => {
    favoritesTab.classList.add('active');
    homeTab.classList.remove('active');
    mainHeader.style.display = 'none';
    form.style.display = 'none';
    document.querySelector('.suggestions').style.display = 'none';
    statsBanner.style.display = 'none';
    displayFavorites();
});

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

function fetchRecipes(query) {
    resultsContainer.innerHTML = '<p class="message">Se încarcă rețetele...</p>';
    statsBanner.style.display = 'none';

    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`)
        .then(response => response.json())
        .then(data => {
            displayRecipes(data.meals, query);
        })
        .catch(error => {
            console.error('Eroare:', error);
            resultsContainer.innerHTML = '<p class="message" style="color:#ffcdd2;">A apărut o eroare la conexiune.</p>';
        });
}

function displayRecipes(meals, query) {
    if (!meals) {
        resultsContainer.innerHTML = `<p class="message">Nu am găsit rezultate pentru "${query}". Încearcă alt termen!</p>`;
        statsBanner.style.display = 'none';
        return;
    }

    resultsCounter.textContent = meals.length;
    statsBanner.style.display = 'block';

    resultsContainer.innerHTML = '';
    meals.forEach(meal => {
        renderRecipeCard(meal);
    });
}

function renderRecipeCard(meal) {
    const card = document.createElement('div');
    card.classList.add('recipe-card');

    const isFav = favorites.some(fav => fav.idMeal === meal.idMeal);

    card.innerHTML = `
        <div>
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="recipe-info">
                <h3>${meal.strMeal}</h3>
                <p><strong>Categorie:</strong> ${meal.strCategory}</p>
                <p><strong>Bucătărie:</strong> ${meal.strArea}</p>
            </div>
        </div>
        <div class="card-buttons">
            <button class="recipe-btn view-btn">Vezi Rețeta</button>
            <button class="fav-btn ${isFav ? 'active' : ''}" title="Favorite">❤</button>
        </div>
    `;

    card.querySelector('.view-btn').addEventListener('click', () => {
        showRecipeDetails(meal);
    });

    const favBtn = card.querySelector('.fav-btn');
    favBtn.addEventListener('click', () => {
        toggleFavorite(meal, favBtn);
    });

    resultsContainer.appendChild(card);
}

function toggleFavorite(meal, btn) {
    const index = favorites.findIndex(fav => fav.idMeal === meal.idMeal);

    if (index === -1) {
        favorites.push(meal);
        btn.classList.add('active');
        showToast(`"${meal.strMeal}" a fost adăugat la favorite! ❤️`);
    } else {
        favorites.splice(index, 1);
        btn.classList.remove('active');
        showToast(`"${meal.strMeal}" a fost șters de la favorite.`);
        if (favoritesTab.classList.contains('active')) {
            displayFavorites();
        }
    }

    localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
    updateFavCount();
}

function displayFavorites() {
    if (favorites.length === 0) {
        resultsContainer.innerHTML = '<p class="message">Nu ai salvat nicio rețetă la favorite momentan.</p>';
        return;
    }

    resultsContainer.innerHTML = '';
    favorites.forEach(meal => {
        renderRecipeCard(meal);
    });
}

function updateFavCount() {
    favCountSpan.textContent = favorites.length;
}

function showRecipeDetails(meal) {
    let ingredientsList = '';
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            ingredientsList += `<li>${measure ? measure : ''} ${ingredient}</li>`;
        }
    }

    modalBody.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <h2>${meal.strMeal}</h2>
        <p><strong>Categorie:</strong> ${meal.strCategory} | <strong>Bucătărie:</strong> ${meal.strArea}</p>
        
        <h4>Ingrediente:</h4>
        <ul>
            ${ingredientsList}
        </ul>

        <h4>Mod de preparare:</h4>
        <p>${meal.strInstructions}</p>
    `;

    modal.style.display = 'flex';
}