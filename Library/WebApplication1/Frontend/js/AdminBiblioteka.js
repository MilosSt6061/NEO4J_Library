const API_URL = "https://localhost:7136/api"; 
import { AdminKnjigaManager } from "./AdminKnjiga.js";

export class AdminBibliotekaManager {
    constructor(host) {
        this.host = host;
        this.allLibraries = []; 
        this.username = localStorage.getItem("user");
        this.token = localStorage.getItem("token"); 
    }

    // --- 1. POČETNI PRIKAZ (ADMIN PANEL) ---
    async draw() {
        this.host.innerHTML = ""; 

        const headerBar = document.createElement("div");
        headerBar.className = "header-bar";
        headerBar.style.display = "flex";
        headerBar.style.alignItems = "center";
        headerBar.style.justifyContent = "flex-start";
        headerBar.style.gap = "15px";
        headerBar.style.marginBottom = "20px";
        headerBar.style.padding = "10px 20px";
        headerBar.style.width = "100%";
        headerBar.style.boxSizing = "border-box";

        const btnAddLib = document.createElement("button");
        btnAddLib.className = "vintage-btn";
        btnAddLib.style.whiteSpace = "nowrap";
        btnAddLib.innerHTML = `<i class="fas fa-plus"></i> Dodaj Biblioteku`;
        btnAddLib.onclick = () => this.drawAddLibrary();

        const title = document.createElement("h2");
        title.className = "section-title";
        title.style.margin = "0";
        title.style.whiteSpace = "nowrap";
        title.innerText = "Upravljanje Bibliotekama";


        const filterContainer = document.createElement("div");
        filterContainer.className = "filter-container-right";

        headerBar.appendChild(btnAddLib);
        headerBar.appendChild(title);
        headerBar.appendChild(filterContainer);
        this.host.appendChild(headerBar);

        const grid = document.createElement("div");
        grid.className = "grid-container";
        grid.id = "grid";
        grid.innerHTML = "<p class='loader-text'>Učitavanje sistema...</p>";
        this.host.appendChild(grid);

        try {
            const res = await fetch(`${API_URL}/Biblioteka/Lib_all`);
            if (!res.ok) throw new Error("Greška servera");
            
            this.allLibraries = await res.json();
            grid.innerHTML = ""; 
            
            this.renderCityFilter(filterContainer, grid);
            this.renderLibraries(this.allLibraries, grid);

        } catch (e) {
            console.error(e);
            grid.innerHTML = "<p class='error-msg'>Greška pri dohvatu podataka.</p>";
        }
    }
    drawAddLibrary() {
        this.host.innerHTML = `
            <div class="profile-paper" style="max-width: 600px; margin: 30px auto; position: relative; padding: 30px;">
                
                <div id="close-lib-form" 
                    style="position: absolute; top: 10px; right: 15px; font-size: 25px; cursor: pointer; color: #3e2723; font-weight: bold; font-family: Arial, sans-serif;">
                    &times;
                </div>

                <h2 class="section-title" style="text-align: center; margin-bottom: 20px;">Nova Biblioteka</h2>
                
                <label>Naziv Biblioteke:</label>
                <input type="text" id="l-naziv" class="quill-input" placeholder="Unesite naziv...">
                
                <label>Adresa (Grad/Ulica):</label>
                <input type="text" id="l-adresa" class="quill-input" placeholder="Unesite adresu...">
                
                <button class="vintage-btn" style="width:100%; margin-top: 20px;" id="btn-submit-lib">
                    <i class="fas fa-landmark"></i> Otvori Biblioteku
                </button>
            </div>
        `;

    document.getElementById("close-lib-form").onclick = () => {
        this.draw(); 
    };

    document.getElementById("btn-submit-lib").onclick = () => {
        this.submitLib();
    };
}

    async submitLib() {
        const data = {
            id: "0",
            naziv: document.getElementById("l-naziv").value, 
            adresa: document.getElementById("l-adresa").value
        };
        try {
            const res = await fetch(`${API_URL}/Biblioteka/Lib_add`, { 
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${this.token}` 
                },
                body: JSON.stringify(data)
            });
            if(res.ok) { 
                alert("Biblioteka otvorena!"); 
                this.draw(); // Osvežavamo listu da se vidi nova biblioteka
            }
            else alert("Greška: " + await res.text());
        } catch(e) { alert("Server error."); }
    }

    renderCityFilter(container, grid) {
        const cities = [...new Set(this.allLibraries.map(l => l.adresa || l.Adresa || "Nepoznato"))].sort();
        
        const label = document.createElement("span");
        label.className = "filter-label";
        label.innerHTML = "<i class='fas fa-map-marker-alt'></i> Grad:";

        const select = document.createElement("select");
        select.className = "vintage-select";
        
        const defOpt = document.createElement("option");
        defOpt.value = "all"; defOpt.innerText = "--- Svi gradovi ---";
        select.appendChild(defOpt);

        cities.forEach(city => {
            const opt = document.createElement("option");
            opt.value = city; opt.innerText = city;
            select.appendChild(opt);
        });

        select.onchange = (e) => {
            const val = e.target.value;
            const filtered = val === "all" ? this.allLibraries : this.allLibraries.filter(l => (l.adresa || l.Adresa) === val);
            this.renderLibraries(filtered, grid);
        };

        container.appendChild(label);
        container.appendChild(select);
    }

     renderLibraries(data, container) {
        container.innerHTML = "";
        if (!data || data.length === 0) {
            container.innerHTML = "<p>Nema registrovanih biblioteka.</p>";
            return;
        }

        data.forEach(lib => {
            const card = document.createElement("div");
            card.className = "library-card";
            
            const currentId = lib.id || lib.Id;
            const ime = lib.naziv ||  "Biblioteka";
            const adr = lib.adresa || "Nepoznata adresa";

            card.innerHTML = `
                <div>
                    <div class="lib-card-header">
                        <i class="fas fa-building"></i> &nbsp; ${ime}
                    </div>
                    <div class="lib-card-body">
                        <i class="fas fa-map-marked-alt lib-icon-large"></i>
                        <p class="lib-address-text">${adr}</p>
                    </div>
                </div>
            `;

            const actionsDiv = document.createElement("div");
            actionsDiv.className = "card-actions";

            // PREGLED
            const btnView = document.createElement("button");
            btnView.className = "vintage-btn btn-offer btn-full-width";
            btnView.innerHTML = '<i class="fas fa-search"></i> Upravljaj knjigama';
            btnView.onclick = () => this.drawLibraryPage(lib);

            // OBRIŠI - Koristimo currentId i popravljamo naziv funkcije (deleteLibrary)
            const btnDelete = document.createElement("button");
            btnDelete.className = "vintage-btn btn-full-width";
            btnDelete.style.backgroundColor = "#b71c1c";
            btnDelete.style.color = "white";
            btnDelete.style.marginTop = "5px";
            btnDelete.innerHTML = '<i class="fas fa-trash"></i> OBRIŠI BIBLIOTEKU';
            btnDelete.onclick = () => this.deleteLibrary(currentId); 

            // IZMENI - Prosleđujemo CEO 'lib' objekat metodi drawEditLibrary
            const btnEdit = document.createElement("button");
            btnEdit.className = "vintage-btn btn-full-width";
            btnEdit.style.marginTop = "5px";
            btnEdit.innerHTML = '<i class="fas fa-feather-alt"></i> IZMENI BIBLIOTEKU';
            btnEdit.onclick = () => this.drawEditLibrary(lib); 

            actionsDiv.appendChild(btnView);
            actionsDiv.appendChild(btnEdit);
            actionsDiv.appendChild(btnDelete);

            card.appendChild(actionsDiv);
            container.appendChild(card);
        });
    }

    // --- ADMIN STRANICA BIBLIOTEKE ---
    async drawLibraryPage(lib) {
        const libId = lib.id || lib.Id;
        const libName = lib.naziv;

        this.host.innerHTML = ""; 

        const header = document.createElement("div");
        header.className = "header-bar";
        header.style.flexDirection = "column"; 
        
        header.innerHTML = `
            <h1 class="section-title header-title-centered" style="margin-bottom:15px;">Upravljanje: ${libName}</h1>
            <div style="display: flex; justify-content: space-between; width: 100%; max-width: 800px; margin: 0 auto;">
                <button id="back-to-libs" class="vintage-btn">
                    <i class="fas fa-arrow-left"></i> Nazad na listu
                </button>
            </div>
        `;
        this.host.appendChild(header);

        document.getElementById("back-to-libs").onclick = () => this.draw();


        const grid = document.createElement("div");
        grid.className = "grid-container";
        grid.id = "grid"; 
        grid.innerHTML = "<p class='loader-text'>Provera polica...</p>";
        this.host.appendChild(grid);

        try {
            const [resPosedovanje, resSveKnjige] = await Promise.all([
                fetch(`${API_URL}/Posedovanje/GetBooksFromLibrary/${libId}`),
                fetch(`${API_URL}/Knjiga/ListaKnjiga`)
            ]);

            if (resPosedovanje.ok && resSveKnjige.ok) {
                const ownershipData = await resPosedovanje.json();
                const allBooksData = await resSveKnjige.json();

                const booksToDisplay = await Promise.all(ownershipData.map(async (item) => {
                    const bookDef = allBooksData.find(b => (b.id || b.Id) == item.kid);
                    
                    if (bookDef) {
                        const total = item.br_primeraka || 0;
                        const rented = item.br_iz || 0;
                        const available = total - rented;

                        let authorsStr = "Nepoznat autor";
                        try {
                            const authRes = await fetch(`${API_URL}/Napisao/VratiAutoreKnjige/${bookDef.id || bookDef.Id}`);
                            if (authRes.ok) {
                                const authors = await authRes.json();
                                authorsStr = authors.map(a => `${a.ime} ${a.prezime}`).join(", ");
                            }
                        } catch (e) {}

                        return { ...bookDef, stanje: available, ukupno: total, iznajmljeno: rented, pisac: authorsStr };
                    }
                    return null;
                }));

                const validBooks = booksToDisplay.filter(b => b !== null);
                grid.innerHTML = "";

                if (validBooks.length === 0) {
                    grid.innerHTML = "<p>Biblioteka trenutno nema knjiga u inventaru.</p>";
                } else {
                    validBooks.forEach(k => {
                        this.renderAdminBookCard(k, libId, grid);
                    });
                }
            }
        } catch (e) { console.error(e); }
    }

    drawEditLibrary(lib) {
        this.host.innerHTML = `
            <div class="profile-paper" style="max-width: 600px; margin: 30px auto; position: relative; padding: 30px;">
                <div id="close-edit-lib" 
                     style="position: absolute; top: 10px; right: 15px; font-size: 25px; cursor: pointer; color: var(--wood-dark); font-weight: bold;">
                    &times;
                </div>

                <h2 class="section-title" style="text-align: center; margin-bottom: 20px;">Izmena Biblioteke</h2>
                
                <label>Naziv Biblioteke:</label>
                <input type="text" id="edit-l-naziv" class="quill-input" value="${lib.naziv || lib.Naziv}">
                
                <label>Adresa (Grad/Ulica):</label>
                <input type="text" id="edit-l-adresa" class="quill-input" value="${lib.adresa || lib.Adresa}">
                
                <button class="vintage-btn" style="width:100%; margin-top: 20px;" id="btn-save-lib-changes">
                    <i class="fas fa-save"></i> Sačuvaj promene
                </button>
            </div>
        `;

        document.getElementById("close-edit-lib").onclick = () => this.draw();
        document.getElementById("btn-save-lib-changes").onclick = () => {
            this.updateLibrary(lib.id || lib.Id);
        };
    }

    // KARTICA ZA KNJIGU
    renderAdminBookCard(book, libId, container, libName) {
        const card = document.createElement("div");
        card.className = "book-card-dashboard";
        
        // Otvaranje detalja na klik kartice
        card.onclick = () => this.openBookDetails(book, libId, libName);
        
        card.innerHTML = `
            <div class="placeholder-container">
                <div class="placeholder-title-overlay">${book.naziv}</div>
            </div>
            <div class="book-title">${book.naziv}</div>
            <div style="display: flex; gap: 10px; padding: 10px; justify-content: center;">
                <button class="vintage-btn delete-btn" style="flex: 1; font-size: 0.7rem; background: #b71c1c; border-color: #8e0000;">
                    <i class="fas fa-trash-alt"></i> IZBRIŠI
                </button>
            </div>
        `;

        // LOGIKA ZA DUGMIĆE NA KARTICI
        card.querySelector(".delete-btn").onclick = (e) => {
            e.stopPropagation(); 
            if (confirm(`Da li ste sigurni da želite da obrišete knjigu "${book.naziv}"?`)) {
                this.deleteBook(libId, book.id);
            }
        };

        container.appendChild(card);
    }

    // --- MODAL DETALJI ---
    openBookDetails(book, libId) {
        const modalOverlay = this.createBaseModal();
        const content = modalOverlay.querySelector(".parchment-modal");
        content.style.maxWidth = "800px";
        content.style.width = "90%";

        const layout = document.createElement("div");
        layout.className = "modal-layout";

        const bigBook = document.createElement("div");
        bigBook.className = "placeholder-container modal-image-container";
        bigBook.innerHTML = `<div class="placeholder-title-overlay" style="font-size:1.3rem;">${book.naziv}</div>`;

        const info = document.createElement("div");
        info.className = "modal-info-container";

        const stanjeColorClass = book.stanje > 0 ? "stock-green" : "stock-red";
        const stanjeTekst = book.stanje > 0 ? `${book.stanje} primeraka` : "Nema na stanju";
        const authorName = book.pisac || "Nepoznat autor";

        let buttonsHTML = `
            <div style="display:flex; gap:10px; width:100%;">
                <button id="modal-delete-btn" class="vintage-btn" style="width:40%; background:#b71c1c; color:white; border:1px solid #8e0000;">
                    <i class="fas fa-trash-alt"></i> IZBRIŠI
                </button>
            </div>
        `;

        info.innerHTML = `
            <h2 class="modal-title">${book.naziv}</h2>
            <div class="modal-author"><i class="fas fa-feather-alt"></i> ${authorName}</div>
            <p class="modal-meta">
                ${book.zanr} | ${book.godinaIzdavanja || "Nepoznata godina"}
            </p>
            <hr style="border-color:#d7ccc8; margin:15px 0;">
            
            <h4 style="margin-bottom:5px; color:var(--wood-dark);">Opis dela:</h4>
            <div class="modal-description-box">
                ${book.opis || "Za ovu knjigu trenutno nema unetog detaljnog opisa."}
            </div>
            
            <div class="modal-control-box">
                <div class="stock-info-box">
                    <p style="margin:0;">
                        <i class="fas fa-boxes"></i> Ukupno stanje u sistemu: 
                        <strong style="font-size:1.3rem; color:var(--wood-dark);">${book.stanje} kom.</strong>
                    </p>
                </div>
                
                <div style="margin-top:15px;">
                    ${buttonsHTML}
                </div>
            </div>
        `;

        
        layout.appendChild(bigBook);
        layout.appendChild(info);
        content.appendChild(layout);

        const modalDeleteBtn = info.querySelector("#modal-delete-btn");


        if (modalDeleteBtn) {
            modalDeleteBtn.onclick = () => {
                if (confirm(`Da li ste sigurni da želite da obrišete knjigu "${book.naziv}"?`)) {
                    modalOverlay.remove(); 
                    this.deleteBook(libId, book.id);
                }
            };
        };
    }

    // --- AKCIJE: BRISANJE I LOGOUT ---
    async deleteLibrary(libId) {
        if(!confirm("UPOZORENJE: Da li ste sigurni da želite da trajno obrišete ovu biblioteku? Svi podaci o zalihama će biti izgubljeni.")) return;
        
        try {
            const res = await fetch(`${API_URL}/Biblioteka/Lib_del/${libId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            if(res.ok) {
                alert("Biblioteka je uspešno uklonjena iz mreže.");
                this.draw(); 
            } else {
                alert("Greška: " + await res.text());
            }
        } catch(e) { alert("Greška u komunikaciji sa serverom."); }
    }

    async updateLibrary(libId) {
        const data = {
            id: libId,
            naziv: document.getElementById("edit-l-naziv").value,
            adresa: document.getElementById("edit-l-adresa").value
        };

        if (!data.naziv || !data.adresa) {
            alert("Sva polja su obavezna!");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/Biblioteka/Lib_edit`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const poruka = await res.text();
                alert(poruka || "Promene su uspešno sačuvane!");
                this.draw(); // Vrati na listu biblioteka
            } else {
                const greska = await res.text();
                alert("Greška: " + greska);
            }
        } catch (e) {
            console.error(e);
            alert("Greška na serveru.");
        }
    }
    // --- BRISANJE KNJIGE ---
    async deleteBook(bid, kid) {

        try {
            const res = await fetch(`${API_URL}/Posedovanje/DeleteBookInLibrary/${bid}/${kid}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            if (res.ok) {
                alert("Knjiga je uspešno obrisana.");
                this.draw(); // Osveži grid
            } else {
                alert("Greška: " + await res.text());
            }
        } catch (e) { alert("Greška servera."); }
    }


    createBaseModal() {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        const content = document.createElement("div");
        content.className = "parchment-modal";
        const close = document.createElement("button");
        close.className = "close-btn";
        close.innerHTML = "&times;";
        close.onclick = () => overlay.remove();
        content.appendChild(close);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        return overlay;
    }
}
