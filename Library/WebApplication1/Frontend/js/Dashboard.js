const API_URL = "https://localhost:7136/api"; 
import { KnjigaManager } from "./Knjiga.js";
import { BibliotekaManager } from "./Biblioteka.js";
import { ProfilManager } from "./Profil.js"; 
import { IznajmljenaManager } from "./Iznajmljena.js";

export class Dashboard {
    constructor(host) {
        this.host = host;
        this.username = localStorage.getItem("user");
        this.role = localStorage.getItem("role");
        this.token = localStorage.getItem("token"); 
    }

    draw() {
        this.host.innerHTML = "";

        // --- HEADER ---
        const header = document.createElement("div");
        header.className = "library-header";
        
        const title = document.createElement("div");
        title.className = "header-title";
        title.innerHTML = `<i class="fas fa-book-reader"></i> &nbsp; ZDRAVO, ${this.username ? this.username.toUpperCase() : "KORISNIK"}`;
        
        const navDiv = document.createElement("div");
        
        // --- NAVIGACIJA ---
        const menuItems = [
            { 
                text: "Biblioteke", 
                action: () => { new BibliotekaManager(this.content).draw(); } 
            },
            { 
                text: "Knjige", 
                action: () => { new KnjigaManager(this.content).draw(); } 
            },
            { 
                text: "Moje Pozajmice", 
                action: () => { new IznajmljenaManager(this.content).draw(); } 
            },
            { 
                text: "Moj Profil", 
                action: () => { new ProfilManager(this.content, this.username, this.token, this.role).draw(); } 
            },
            { 
                text: "Odjavi se", 
                action: () => this.logout() 
            }
        ];

        menuItems.forEach(item => {
            const btn = document.createElement("button");
            btn.className = "nav-link";
            btn.innerText = item.text;
            btn.onclick = item.action;
            navDiv.appendChild(btn);
        });

        header.appendChild(title);
        header.appendChild(navDiv);
        this.host.appendChild(header);

        // --- CONTENT CONTAINER ---
        this.content = document.createElement("div");
        this.content.className = "library-main";
        this.host.appendChild(this.content);
        
        // POČETNI EKRAN
        new BibliotekaManager(this.content).draw(); 
    }

    logout() {
        localStorage.clear();
        location.reload(); 
    }
}