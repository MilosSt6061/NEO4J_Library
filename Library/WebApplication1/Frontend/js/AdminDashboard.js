const API_URL = "https://localhost:7136/api"; 
import { AdminKnjigaManager } from "./AdminKnjiga.js";
import { AutorManager } from "./Autor.js";
import { AdminBibliotekaManager } from "./AdminBiblioteka.js";
import { KorisnikManager } from "./Korisnik.js";

export class AdminDashboard {
    constructor(host) {
        this.host = host;
        this.username = localStorage.getItem("user");
        this.token = localStorage.getItem("token");
        window.admin = this; 
    }

    draw() {
        this.host.innerHTML = "";

        // --- ADMIN HEADER ---
        const header = document.createElement("div");
        header.className = "library-header";
        header.style.borderBottom = "5px solid #b71c1c"; 

        const title = document.createElement("div");
        title.className = "header-title";
        title.innerHTML = `<i class="fas fa-user-shield"></i> &nbsp; ARHIVATOR: ${this.username ? this.username.toUpperCase() : "ADMIN"}`;

        this.content = document.createElement("div");
        this.content.className = "library-main";
        this.content.style.paddingTop = "120px";
        
        const navDiv = document.createElement("div");
        
        // INSTANCE MANAGERA ZA ADMINA
        const autorManager = new AutorManager(this.content);
        const adminKnjigaManager = new AdminKnjigaManager(this.content);
        const adminBibliotekaManager = new AdminBibliotekaManager(this.content);
        const korisnikManager = new KorisnikManager(this.content);

        const menuItems = [
            { text: "Biblioteke", action: () => adminBibliotekaManager.draw() }, 
            { text: "Knjige", action: () => adminKnjigaManager.draw() },       
            { text: "Autori", action: () => autorManager.draw() },
            { text: "Zalihe", action: () => this.drawInventory() }, 
            { text: "Korisnici", action: () => korisnikManager.draw() },
            { text: "Odjavi se", action: () => this.logout() }
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
        this.host.appendChild(this.content);

        adminBibliotekaManager.draw();
    }



    async drawInventory() {
        this.content.innerHTML = "<h2 class='section-title' style='text-align: center;'>Distribucija Knjiga</h2><p style='text-align:center'>Učitavanje kataloga...</p>";
        try {
            const [resK, resL, resA] = await Promise.all([
                fetch(`${API_URL}/Knjiga/ListaKnjiga`),
                fetch(`${API_URL}/Biblioteka/Lib_all`),
                fetch(`${API_URL}/Autor/ListaAutora`)
            ]);
            const knjige = await resK.json();
            const biblioteke = await resL.json();
            const autori = await resA.json();

            this.content.innerHTML = `
                <h2 class="section-title" style="margin-bottom: 20px; text-align: center;">Distribucija Knjiga</h2>
                <div class="profile-paper" style="max-width: 700px; margin: 0 auto;">
                    <p style="text-align:center; color:var(--wood-dark); font-style: italic; margin-bottom: 20px;">
                        <i class="fas fa-info-circle"></i> Dodela fizičkih primeraka knjige biblioteci i povezivanje autora.
                    </p>
                    <hr class="profile-divider" style="margin-bottom: 25px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <label style="font-weight: bold;"><i class="fas fa-landmark"></i> Izaberi Biblioteku:</label>
                            <select id="inv-lib" class="vintage-select" style="width: 100%;"></select>
                        </div>
                        <div>
                            <label style="font-weight: bold;"><i class="fas fa-book"></i> Izaberi Knjigu:</label>
                            <select id="inv-book" class="vintage-select" style="width: 100%;"></select>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <label style="font-weight: bold;"><i class="fas fa-feather-alt"></i> Izaberi Autora:</label>
                        <select id="inv-author" class="vintage-select" style="width: 100%;"></select>
                    </div>
                    <div style="margin-top: 20px;">
                        <label style="font-weight: bold;"><i class="fas fa-sort-numeric-up"></i> Broj Primeraka (Inventar):</label>
                        <input type="number" id="inv-qty" class="quill-input" value="5" min="1" style="width: 100%; box-sizing: border-box;">
                    </div>
                    <div style="margin-top: 30px;">
                        <button class="vintage-btn" style="width:100%; height: 50px; font-size: 1.1rem;" onclick="window.admin.submitInventory()">
                            <i class="fas fa-link"></i> POVEŽI I DODAJ U REGISTAR
                        </button>
                    </div>
                </div>
            `;

            const selLib = document.getElementById("inv-lib");
            biblioteke.forEach(l => {
                const opt = document.createElement("option");
                opt.value = l.id || l.Id; opt.text = `${l.naziv || l.name} (${l.adresa || l.Adresa})`;
                selLib.appendChild(opt);
            });

            const selBook = document.getElementById("inv-book");
            knjige.forEach(k => {
                const opt = document.createElement("option");
                opt.value = k.id || k.Id; opt.text = k.naziv || k.Naziv;
                selBook.appendChild(opt);
            });

            const selAuth = document.getElementById("inv-author");
            autori.forEach(a => {
                const opt = document.createElement("option");
                opt.value = `${a.ime}|${a.prezime}`; opt.text = `${a.ime} ${a.prezime}`;
                selAuth.appendChild(opt);
            });
        } catch(e) { console.error(e); }
    }

    async submitInventory() {
        const libId = document.getElementById("inv-lib").value;
        const bookId = document.getElementById("inv-book").value;
        const authorData = document.getElementById("inv-author").value; 
        const qty = parseInt(document.getElementById("inv-qty").value);

        if(!libId || !bookId || !authorData) { alert("Morate izabrati knjigu, biblioteku i autora!"); return; }

        const posedovanjeData = { bid: libId, kid: bookId, br_primeraka: qty, br_iz: 0 };
        try {
            const resPosedovanje = await fetch(`${API_URL}/Posedovanje/AddBookToLib`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.token}` },
                body: JSON.stringify(posedovanjeData)
            });
            if(!resPosedovanje.ok) throw new Error("Greška pri dodavanju knjige.");

            const [ime, prezime] = authorData.split('|');
            const resNapisao = await fetch(`${API_URL}/Napisao/KreirajNapisao/${encodeURIComponent(ime)}/${encodeURIComponent(prezime)}/${bookId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${this.token}` }
            });
            if(resNapisao.ok) { alert("Uspešno!"); this.drawInventory(); }
        } catch(e) { alert("Greška: " + e.message); }
    }

    logout() { localStorage.clear(); location.reload(); }
}