/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-undef
let elements = {};
let sections = {};

const ajaxList = {
  list: 'https://list-of-test-recipes.herokuapp.com/recipes',
  item: 'https://list-of-test-recipes.herokuapp.com/recipes/',
  search: 'https://list-of-test-recipes.herokuapp.com/search',
}

let selectors = {
  pageBackDropActiveClass: 'page-overlay_visible',
  $pageBackDrop: document.querySelector('.page-overlay'),
  scrollWidth: window.innerWidth - document.body.clientWidth + 'px',
  recipesContainer: '.recipes'
}

// Utility functions
let helpers = {
  debounce: (callback, wait, immediate = false) => {
    let timeout = null;

    return function() {
      const callNow = immediate && !timeout;
      const next = () => callback.apply(this, arguments);

      clearTimeout(timeout);
      timeout = setTimeout(next, wait);

      if (callNow) {
        next();
      }
    }
  },

  showPageBackdrop: () => {
    selectors.$pageBackDrop && selectors.$pageBackDrop.classList.add(selectors.pageBackDropActiveClass);
    document.body.classList.add('overflow-hidden');
    document.body.style.paddingRight = selectors.scrollWidth;
    document.querySelectorAll('.header_sticky, .footer-mobile').forEach(element => {
      element.style.paddingRight = selectors.scrollWidth;
    });
  },

  hidePageBackdrop: () => {
    selectors.$pageBackDrop && selectors.$pageBackDrop.classList.remove(selectors.pageBackDropActiveClass);
    document.body.classList.remove('overflow-hidden');
    document.body.style.paddingRight = '';
    document.querySelectorAll('.header_sticky, .footer-mobile').forEach(element => {
      element.style.paddingRight = '';
    });
  }
};

(function () {
  'use strict';

  // Scroll bar width
  const scrollBarWidth = window.innerWidth - document.body.clientWidth


  elements.Search = (function() {
    function Search(section_recipes) {
      // Declare variables
      this.section_recipes = section_recipes
      this.selectors = {
        inputBox: '.search-input',
      }

      this.$searchInput = document.querySelector(this.selectors.inputBox);
      this.$searchList = document.querySelector(selectors.recipesContainer);

      this._handleAjaxSearch = this._handleAjaxSearch.bind(this);
      this._updateSearchResult = this._updateSearchResult.bind(this);
      this._initAjaxSearch();
    }

    Search.prototype = Object.assign({}, Search.prototype, {
      _initAjaxSearch: function () {
        const _this = this;

        this.$searchInput.addEventListener('keyup', (event) => {
          _this._handleAjaxSearch(event, _this);
        });
      },

      _handleAjaxSearch: helpers.debounce((event, _this) => {
        const url = new URL(ajaxList.search);
        const params = { keyword: event.target.value }

        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

        fetch(url).then(function (response) {
          if (response.ok) {
            return response.json();
          } else {
            return Promise.reject(response);
          }
        }).then(function(data) {
          _this._updateSearchResult(data);
        }).catch(function (err) {
          _this._handleAjaxSearchError(err.message);
        });
      }, 180),

      _updateSearchResult: function(data) {
        this.section_recipes.updateRecipesList(data)
      },

      _handleAjaxSearchError: function (error) {
        alert("Error while filtering.\n" + error)
        console.log(error);
      }
    });

    return Search
  })();

  // Popup Popup
  elements.Popup = (function () {
    function Popup (recipeId) {
      this.recipeId = recipeId;
      this.selectors = {
        container: '.details-popup',
        activeClass: 'details-popup_active',
        loadingClass: 'details-popup_loading',
        initializedClass: 'details-popup_initialized',
        closeBtn: '.js-close-popup'
      }

      this.$container = document.querySelector(this.selectors.container);
      this.$closeBtn = this.$container.querySelector(this.selectors.closeBtn);

      this.updatePopup();
      if (!this.$container.classList.contains(this.selectors.initializedClass)) {
        this.init();
      }
    }

    Popup.prototype = Object.assign({}, Popup.prototype, {
      init: function() {
        this.$container.classList.add(this.selectors.initializedClass);
        this._initCloseActions();
        this._initBackDropClick();
      },

      updatePopup: function () {
        this._getRecipeDetails();
      },

      _getRecipeDetails: function() {
        const _this = this;
        const url = ajaxList.item + this.recipeId;

        this._showPopup();

        fetch(url, { method: 'GET' }).then(function (response) {
          if (response.ok) {
            return response.json();
          } else {
            return Promise.reject(response);
          }
        }).then(function(data) {
          _this._updateRecipeDetails(data);
          _this._hideLoading();
        }).catch(function (err) {
          _this._handleError(err.message);
        });
      },

      _updateRecipeDetails: function(data) {
        const $title = this.$container.querySelector('.title__link');
        const $description = this.$container.querySelector('.description');
        const $ingredients = this.$container.querySelector('.ingredients-list');
        const $directions = this.$container.querySelector('.directions-list');
        const $servings = this.$container.querySelector('.servings');
        const $tags = this.$container.querySelector('.tags');
        const $author = this.$container.querySelector('.author');
        const $source = this.$container.querySelector('.source');

        $title.innerText = data.title;
        $description.innerText = data.description;

        data.ingredients.forEach(function(ingredient) {
          const $ingredient = document.createElement('li');
          $ingredient.classList.add('ingredients__item')
          $ingredient.innerText = ingredient;

          $ingredients.appendChild($ingredient);
        });

        data.directions.forEach(function(direction) {
          const $direction = document.createElement('li');
          $direction.classList.add('directions__item')
          $direction.innerText = direction;

          $directions.appendChild($direction);
        });

        $servings.innerText = data.servings;
        $tags.innerText = data.tags.join(',');

        $author.innerText = data.author.name;
        $author.href = data.author.url;

        $source.href = data.source_url;
      },

      _initCloseActions: function () {
        const _this = this;
        this.$closeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          _this._closePopup();
        });
      },

      _initBackDropClick() {
        if (selectors.$pageBackDrop) {
          selectors.$pageBackDrop.addEventListener('click', () => {
            this._closePopup();
          });
        }
      },

      _closePopup: function () {
        helpers.hidePageBackdrop();
        this.$container.classList.remove(this.selectors.activeClass);
        setTimeout(() => {
          this.$container.classList.add(this.selectors.loadingClass);
        }, 450);
      },

      _showPopup: function() {
        helpers.showPageBackdrop();
        this.$container.classList.add(this.selectors.activeClass);
      },

      _hideLoading: function() {
        this.$container.classList.remove(this.selectors.loadingClass);
      },

      _handleError: function(msg) {
        alert("Sorry, unable to get details.\n" + msg)
      }
    });

    return Popup;
  })();

  sections.Recipes = (function () {
    function Recipes () {
      this.selectors = {
        loadingClass: 'recipes_loading'
      }

      this.$container = document.querySelector(selectors.recipesContainer);
      if (!this.$container) {
        return;
      }

      this.$recipesList = this.$container.querySelector('.recipes-list');

      this.getRecipesList();
    }

    Recipes.prototype = Object.assign({}, Recipes.prototype, {
      getRecipesList: function () {
        const _this = this;

        fetch(ajaxList.list, { method: 'GET' }).then(function (response) {
          if (response.ok) {
            return response.json();
          } else {
            return Promise.reject(response);
          }
        }).then(function(data) {
          _this.endLoading();
          _this.updateRecipesList(data);
        }).catch(function (err) {
          _this._handleError(err.message);
        });
      },

      updateRecipesList: function(listJson) {
        const _this = this;
        const results = listJson;

        _this._clearRecipesList();

        if (results.length > 0) {
          results.forEach(function (recipe) {
            _this._buildRecipesList(recipe);
          });
        } else {
          console.log("No products")
        }
      },

      startLoading: function() {
        this.$container.classList.add(this.selectors.loadingClass);
      },

      endLoading: function() {
        this.$container.classList.remove(this.selectors.loadingClass);
      },

      _clearRecipesList: function() {
        this.$recipesList.innerHTML = '';
      },

      _buildRecipesList: function(recipe) {
        const $newRecipe = document.createElement('li');
        $newRecipe.classList.add('recipes-list__item');
        const $newRecipeAnchor = document.createElement('a');
        $newRecipeAnchor.classList.add('recipes-list__link');
        $newRecipeAnchor.href = '#';
        $newRecipeAnchor.innerText = recipe.title;

        $newRecipe.appendChild($newRecipeAnchor);
        this.$recipesList.appendChild($newRecipe);

        $newRecipeAnchor.addEventListener('click', function() {
          new elements.Popup(recipe.id);
        });
      },

      _handleError: function(msg) {
        alert("Sorry, something unexpected happen.\nDetails: " + msg)
      }
    });

    return Recipes;
  })();

  class App {
    constructor() {
      const section_recipes = new sections.Recipes();
      new elements.Search(section_recipes);
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    // Init theme
    new App();
  });
})();
