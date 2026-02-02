import { Home } from "./Home.js";
import { Dashboard } from "./Dashboard.js";
import { AdminDashboard } from "./AdminDashboard.js";

const appContainer = document.getElementById("app");

export function initApp() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    appContainer.innerHTML = ""; 

     if (token) {
        if (role === "admin") {
            const adminDash = new AdminDashboard(appContainer);
            window.admin = adminDash; 
            adminDash.draw();
        } else {
            const userDash = new Dashboard(appContainer);
            window.dashboard = userDash;
            userDash.draw();
        }
    } else {
        const home = new Home(appContainer, initApp);
        home.draw();
    }
}

// Pokretanje aplikacije
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});