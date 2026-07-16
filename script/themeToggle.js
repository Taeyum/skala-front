var THEME_STORAGE_KEY = "site-theme";

function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getEffectiveTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY) || getSystemTheme();
}

function updateToggleLabels(theme) {
    var buttons = document.querySelectorAll(".theme-toggle-btn");

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].textContent = theme === "dark" ? "☀️" : "🌙";
    }
}

function toggleTheme() {
    var next = getEffectiveTheme() === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    updateToggleLabels(next);
}

var storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

if (storedTheme) {
    document.documentElement.setAttribute("data-theme", storedTheme);
}

updateToggleLabels(getEffectiveTheme());

var toggleButtons = document.querySelectorAll(".theme-toggle-btn");

for (var i = 0; i < toggleButtons.length; i++) {
    toggleButtons[i].addEventListener("click", toggleTheme);
}
