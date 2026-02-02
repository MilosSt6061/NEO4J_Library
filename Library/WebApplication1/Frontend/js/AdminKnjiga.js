const API_URL = "https://localhost:7136/api"; 

export class AdminKnjigaManager {
    constructor(host) {
        this.host = host; 
        this.token = localStorage.getItem("token");
        this.allBooks = []; 
    }

    // ---  GLAVNI PRIKAZ ---
    async draw() {
        this.host.innerHTML = ""; 

        const headerBar = document.createElement("div");
        headerBar.className = "header-bar";
        headerBar.style.display = "flex";
        headerBar.style.alignItems = "center";
        headerBar.style.justifyContent = "flex-start"; 
        headerBar.style.gap = "170px"; 
        headerBar.style.padding = "10px 20px";

        const title = document.createElement("h2");
        title.className = "section-title";
        title.innerHTML = "<i class='fas fa-tasks'></i> Upravljanje Knjigama";

        const filterContainer = document.createElement("div");
        filterContainer.className = "filter-container-right";

        const buttonAdd = document.createElement("button");
        buttonAdd.className = "vintage-btn";
        buttonAdd.innerHTML=`<i class="fas fa-plus"></i>DODAJ KNJIGU`;
        buttonAdd.onclick = () => this.drawAddBook();

        headerBar.appendChild(buttonAdd);
        headerBar.appendChild(title);
        headerBar.appendChild(filterContainer);
        this.host.appendChild(headerBar);

        const grid = document.createElement("div");
        grid.className = "grid-container";
        grid.id = "grid";
        grid.innerHTML = "<p class='loader-text'>Učitavanje podataka...</p>";
        this.host.appendChild(grid);

        try {
            const res = await fetch(`${API_URL}/Knjiga/ListaKnjiga`);
            if (!res.ok) throw new Error("Greška servera");
            const rawBooks = await res.json();

            // Paralelno učitavanje autora za svaku knjigu
            this.allBooks = await Promise.all(rawBooks.map(async (book) => {
                const bookId = book.id || book.Id;
                let authorsStr = "Bez autora";
                try {
                    const authRes = await fetch(`${API_URL}/Napisao/VratiAutoreKnjige/${bookId}`);
                    if (authRes.ok) {
                        const authors = await authRes.json();
                        if (authors && authors.length > 0) {
                            authorsStr = authors.map(a => `${a.ime} ${a.prezime}`).join(", ");
                        }
                    }
                } catch (err) { console.error(err); }
                return { ...book, pisac: authorsStr };
            }));

            grid.innerHTML = ""; 
            this.renderAdminFilters(filterContainer, grid);
            this.renderAdminBooks(this.allBooks, grid); 

        } catch (e) { 
            console.error(e);
            grid.innerHTML = "<p class='error-msg'>Neuspešno povezivanje sa bazom.</p>"; 
        }
    }

    // --- FILTRIRANJE ---
    renderAdminFilters(container, grid) {
        const genres = [...new Set(this.allBooks.map(b => b.zanr))].sort();

        const select = document.createElement("select");
        select.className = "vintage-select";
        select.innerHTML = `<option value="all">--- Svi žanrovi ---</option>`;

        genres.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g; opt.innerText = g;
            select.appendChild(opt);
        });

        select.onchange = (e) => {
            const val = e.target.value;
            const filtered = val === "all" ? this.allBooks : this.allBooks.filter(b => b.zanr === val);
            this.renderAdminBooks(filtered, grid);
        };

        container.appendChild(select);
    }

    // --- CRTANJE ADMIN KARTICA ---
     renderAdminBooks(data, targetElement) {
        targetElement.innerHTML = "";

        data.forEach(k => {
            const card = document.createElement("div");
            card.className = "book-card-dashboard"; 

            // Uzimamo ID odmah na početku petlje
            const bookId = k.id || k.Id;

            card.innerHTML = `
                <div class="placeholder-container">
                    <div class="placeholder-title-overlay">${k.naziv}</div>
                </div>
                <div class="book-title">${k.naziv}</div>
                <div style="font-size:0.75rem; text-align:center; color:#777; margin-bottom:10px;">
                    ${k.pisac}
                </div>
                <div style="display:flex; gap:5px; padding:0 10px 10px 10px;">
                    <button class="vintage-btn edit-btn" style="flex:1; font-size:0.7rem; background:#4e342e;">
                        <i class="fas fa-edit"></i> IZMENI
                    </button>
                    <button class="vintage-btn delete-btn" style="flex:1; font-size:0.7rem; background:#b71c1c;">
                        <i class="fas fa-trash"></i> IZBRIŠI
                    </button>
                </div>
            `;

            // EDIT DUGME
            card.querySelector(".edit-btn").onclick = (e) => {
                e.stopPropagation();
                this.drawEditBook(k);
                
            };

            // DELETE DUGME - Ovde je bila greška sa 'this'
            card.querySelector(".delete-btn").onclick = (e) => {
                e.stopPropagation();
                if (bookId) {
                    this.deleteBook(bookId, k.naziv);
                } else {
                    alert("Greška: ID knjige nije validan.");
                }
            };

            // Klik na karticu
            card.onclick = () => this.openAdminDetails(k);
            
            targetElement.appendChild(card);
        });
    }

    // --- DETALJI O ZALIHAMA (ADMIN VIEW) ---
    async openAdminDetails(knjiga) {
        const modal = this.createBaseModal();
        const content = modal.querySelector(".parchment-modal");
        
        content.innerHTML = `
            <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
            <h2 class="modal-title" style="text-align:center;">Logistika: ${knjiga.naziv}</h2>
            <hr>
            <div id="admin-stock-list" style="margin-top:20px; max-height:400px; overflow-y:auto;">
                <p class="loader-text">Provera stanja po svim bibliotekama...</p>
            </div>
        `;

        const list = content.querySelector("#admin-stock-list");
        
        try {
            // Admin vidi globalno stanje ove knjige
            const res = await fetch(`${API_URL}/Biblioteka/ZaKnjigu/${encodeURIComponent(knjiga.naziv)}`);
            if(res.ok) {
                const bibliotekeImena = await res.json();
                list.innerHTML = "";
                
                if(bibliotekeImena.length === 0) {
                    list.innerHTML = "<p style='text-align:center; color:red;'>Ova knjiga nije dodeljena nijednoj biblioteci!</p>";
                } else {
                    const table = document.createElement("table");
                    table.className = "vintage-table"; // Pretpostavljam da imaš ovaj stil
                    table.style.width = "100%";
                    table.innerHTML = `<thead><tr><th>Biblioteka</th><th style="text-align:center;">Status</th></tr></thead><tbody id="stock-rows"></tbody>`;
                    list.appendChild(table);
                    
                    const rows = table.querySelector("#stock-rows");
                    bibliotekeImena.forEach(bib => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `<td>${bib}</td><td style="text-align:center;"><i class="fas fa-check-circle" style="color:green;"></i> Aktivno</td>`;
                        rows.appendChild(tr);
                    });
                }
            }
        } catch(e) { list.innerHTML = "Greška pri dohvatu zaliha."; }
    }

    // --- BRISANJE KNJIGE ---
    async deleteBook(id, naziv) {
        if (!confirm(`UPOZORENJE: Trajno brišete knjigu "${naziv}" iz svih registara i biblioteka?`)) return;

        try {
            const res = await fetch(`${API_URL}/Knjiga/ObrisiKnjigu/${id}`, {
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
    drawAddBook() {
        this.host.innerHTML = `
            <h2 class="section-title" style="text-align: center; margin-bottom: 20px;">Evidencija Nove Knjige</h2>
            <div class="profile-paper" style="max-width: 600px; margin: 0 auto; position: relative;">
                <button id="btn-close-add-book" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; ">
                    <i class="fas fa-times-circle"></i>
                </button>
    
                <label>Naziv Dela:</label>
                <input type="text" id="k-naziv" class="quill-input" placeholder="Unesite naslov...">
                
                <label>Žanr:</label>
                <input type="text" id="k-zanr" class="quill-input" placeholder="npr. Roman, Drama...">
                
                <label>Godina Izdanja:</label>
                <input type="number" id="k-godina" class="quill-input" placeholder="YYYY">
                
                <label>Kratak Opis:</label>
                <textarea id="k-opis" class="quill-input" style="height:100px; border:1px solid var(--wood-light); background:transparent;" placeholder="O čemu se radi..."></textarea>
                
                <button class="vintage-btn" style="width:100%; margin-top: 15px;" id="btn-submit-book">
                    <i class="fas fa-plus-circle"></i> Upiši u Registar
                </button>
            </div>
        `;
        document.getElementById("btn-close-add-book").onclick = () => {
            this.draw();
        };

        document.getElementById("btn-submit-book").onclick = () => {
            this.submitBook();
        };
    }
        
        // --- LOGIKA ZA SLANJE ---
        async submitBook() {
            const data = {
                id: "0",
                naziv: document.getElementById("k-naziv").value,
                zanr: document.getElementById("k-zanr").value,
                godinaIzdavanja: document.getElementById("k-godina").value,
                opis: document.getElementById("k-opis").value
            };
        
            if (!data.naziv) { 
                alert("Naziv je obavezan!"); 
                return; 
            }
        
            try {
                const res = await fetch(`${API_URL}/Knjiga/KreirajKnjigu`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${this.token}` 
                    },
                    body: JSON.stringify(data)
                });
        
                if (res.ok) { 
                    alert("Knjiga je uspešno dodata!"); 
                    this.drawAddBook(); 
                } else { 
                    alert("Greška: " + await res.text()); 
                }
            } catch (e) { 
                console.error(e); 
                alert("Greška servera."); 
            }
        }
    drawEditBook(knjiga) {
        this.host.innerHTML = `
            <h2 class="section-title" style="text-align: center; margin-bottom: 20px;">Izmena Podataka o Knjizi</h2>
            <div class="profile-paper" style="max-width: 600px; margin: 0 auto; position: relative;">
                <button id="close-edit-book-btn" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #b71c1c;">
                    <i class="fas fa-times-circle"></i>
                </button>
                <label>Naziv Dela:</label>
                <input type="text" id="edit-k-naziv" class="quill-input" value="${knjiga.naziv}">
                <label>Žanr:</label>
                <input type="text" id="edit-k-zanr" class="quill-input" value="${knjiga.zanr}">
                <label>Godina Izdanja:</label>
                <input type="number" id="edit-k-godina" class="quill-input" value="${knjiga.godinaIzdavanja}">
                <label>Kratak Opis:</label>
                <textarea id="edit-k-opis" class="quill-input" style="height:100px; border:1px solid var(--wood-light); background:transparent;">${knjiga.opis || ""}</textarea>
                <button id="submit-button-knjiga" class="vintage-btn" style="width:100%; margin-top: 15px;" ('${knjiga.id || knjiga.Id}')">
                    <i class="fas fa-save"></i> Sačuvaj Izmene
                </button>
            </div>
        `;
            document.getElementById("close-edit-book-btn").onclick = () => {
                this.draw();
            };
            document.getElementById("submit-button-knjiga").onclick = () => {
                this.saveBookChanges(knjiga.id);
            };
    }

    async saveBookChanges(id) {
        const data = {
            id: id,
            naziv: document.getElementById("edit-k-naziv").value,
            zanr: document.getElementById("edit-k-zanr").value,
            godinaIzdavanja: document.getElementById("edit-k-godina").value,
            opis: document.getElementById("edit-k-opis").value
        };
        try {
            const res = await fetch(`${API_URL}/Knjiga/IzmeniKnjigu`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.token}` },
                body: JSON.stringify(data)
            });
            if(res.ok) { alert("Izmenjeno!"); this.draw(); }
            else alert("Greška: " + await res.text());
        } catch(e) { console.error(e); }
    }

    createBaseModal() {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        const content = document.createElement("div");
        content.className = "parchment-modal"; 
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        return overlay;
    }
}