const API_URL = "https://localhost:7136/api"; 



export class KnjigaManager {
    constructor(host) {
        this.host = host; 
        this.username = localStorage.getItem("user");
        this.allLibsCache = []; 
        this.allBooks = []; 
    }

    // ---  GLAVNI PRIKAZ ---
    async draw() {
        this.host.innerHTML = ""; 

        const headerBar = document.createElement("div");
        headerBar.className = "header-bar";

        const title = document.createElement("h2");
        title.className = "section-title";
        title.innerText = "Katalog Knjiga";

        const filterContainer = document.createElement("div");
        filterContainer.className = "filter-container-right";

        headerBar.appendChild(title);
        headerBar.appendChild(filterContainer);
        this.host.appendChild(headerBar);

        const grid = document.createElement("div");
        grid.className = "grid-container";
        grid.id = "grid";
        grid.innerHTML = "<p class='loader-text'>Učitavanje knjiga i autora...</p>";
        this.host.appendChild(grid);

        try {
            const res = await fetch(`${API_URL}/Knjiga/ListaKnjiga`);
            if (!res.ok) throw new Error("Greška servera");
            const rawBooks = await res.json();

            this.allBooks = await Promise.all(rawBooks.map(async (book) => {
                const bookId = book.id || book.Id;
                let authorsStr = "Nepoznat autor";
                
                try {
                    const authRes = await fetch(`${API_URL}/Napisao/VratiAutoreKnjige/${bookId}`);
                    if (authRes.ok) {
                        const authors = await authRes.json();
                        if (authors && authors.length > 0) {
                            authorsStr = authors.map(a => `${a.ime} ${a.prezime}`).join(", ");
                        }
                    }
                } catch (err) { console.error("Greška autor:", err); }

                return { ...book, pisac: authorsStr };
            }));

            await this.loadAllLibraries();

            grid.innerHTML = ""; 
            this.renderAuthorFilter(filterContainer, grid);
            this.renderBooks(this.allBooks, grid); 

        } catch (e) { 
            console.error(e);
            grid.innerHTML = "<p class='error-msg'>Neuspešno povezivanje sa bazom.</p>"; 
        }
    }

    async loadAllLibraries() {
        try {
            const res = await fetch(`${API_URL}/Biblioteka/Lib_all`);
            if(res.ok) this.allLibsCache = await res.json();
        } catch(e) { console.error(e); }
    }

    // --- FILTER PO PISCIMA ---
    renderAuthorFilter(container, grid) {
        const authors = [...new Set(this.allBooks.map(b => b.pisac))].sort();

        const label = document.createElement("span");
        label.className = "filter-label";
        label.innerHTML = "<i class='fas fa-feather-alt'></i> Pisac:"; 

        const select = document.createElement("select");
        select.className = "vintage-select";
        
        const defOpt = document.createElement("option");
        defOpt.value = "all"; defOpt.innerText = "--- Svi pisci ---";
        select.appendChild(defOpt);

        authors.forEach(author => {
            const opt = document.createElement("option");
            opt.value = author; opt.innerText = author;
            select.appendChild(opt);
        });

        select.onchange = (e) => {
            const val = e.target.value;
            const filtered = val === "all" ? this.allBooks : this.allBooks.filter(b => b.pisac === val);
            this.renderBooks(filtered, grid);
        };

        container.appendChild(label);
        container.appendChild(select);
    }

    // --- CRTANJE KARTICA ---
    renderBooks(data, targetElement) {
        targetElement.innerHTML = "";

        if (!data || data.length === 0) {
            targetElement.innerHTML = "<p style='width:100%; text-align:center;'>Nema knjiga za prikaz.</p>";
            return;
        }
        data.forEach(k => {
            const card = document.createElement("div");
            card.className = "book-card-dashboard"; 
            
            const bookDisplayElement = this.createPlaceholder(k.naziv);
            card.appendChild(bookDisplayElement);

            const titleBelow = document.createElement("div");
            titleBelow.innerText = k.naziv;
            titleBelow.className = "book-title"; 
            card.appendChild(titleBelow);

            card.onclick = () => this.openDetails(k);
            
            targetElement.appendChild(card);
        });
    }

    createPlaceholder(bookTitle) {
        const container = document.createElement("div");
        container.className = "placeholder-container"; 
        const overlay = document.createElement("div");
        overlay.className = "placeholder-title-overlay";
        overlay.innerText = bookTitle; 
        container.appendChild(overlay);
        return container;
    }

    // MODAL DETALJI

    async openDetails(knjiga) {
        const modal = this.createBaseModal();
        const content = modal.querySelector(".parchment-modal");
        
        content.style.maxWidth = "800px";
        content.style.width = "90%";

        const layout = document.createElement("div");
        layout.className = "modal-layout";

        // --- LEVO ---
        const bigBook = this.createPlaceholder(knjiga.naziv);
        bigBook.className = "placeholder-container modal-image-container";
        bigBook.querySelector(".placeholder-title-overlay").style.fontSize = "1.3rem";

        // --- DESNO ---
        const info = document.createElement("div");
        info.className = "modal-info-container";
        
        const safeDesc = (knjiga.opis || "Nema opisa.").replace(/`/g, "'");
        const authorName = knjiga.pisac || "Nepoznat autor";

        info.innerHTML = `
            <h2 class="modal-title">${knjiga.naziv}</h2>
            <div class="modal-author"><i class="fas fa-feather-alt"></i> ${authorName}</div>
            <p class="modal-meta">
                ${knjiga.zanr} | ${knjiga.godinaIzdavanja || "----"}
            </p>
            <hr style="border-color:#d7ccc8; margin:15px 0;">
            
            <h4 style="margin-bottom:5px; color:var(--wood-dark);">Opis dela:</h4>
            <p style="line-height:1.6; text-align:justify; margin-bottom:25px;">
                ${safeDesc}
            </p>
            
            <div class="modal-control-box">
                <div>
                    <label style="font-weight:bold; color:var(--wood-dark); display:block; margin-bottom:5px;">
                        <i class="fas fa-map-marker-alt"></i> Proveri dostupnost:
                    </label>
                    <select id="lib-dropdown" class="vintage-select" style="width:100%;">
                        <option value="">Učitavanje...</option>
                    </select>
                </div>

                <div id="stock-info-container" class="stock-info-box" style="display:none;">
                    <span style="color:var(--wood-dark);">
                        Preostalo: <strong id="stock-number" style="font-size:1.3rem;"></strong>
                    </span>
                </div>

                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button id="rezervisi-btn" class="vintage-btn btn-full-width" disabled>
                        Izaberi biblioteku
                    </button>
                    
                    <button id="show-reviews-btn" class="vintage-btn" style="width:40%; background:transparent; color:var(--wood-dark); border:1px solid var(--wood-dark);">
                        <i class="fas fa-star"></i> Ocene
                    </button>
                </div>
            </div>
        `;

        layout.appendChild(bigBook);
        layout.appendChild(info);
        content.appendChild(layout);

        // 1. Popuni dropdown
        await this.fetchLibrariesForDropdown(knjiga.naziv);

        const select = info.querySelector("#lib-dropdown");
        const stockContainer = info.querySelector("#stock-info-container");
        const stockNum = info.querySelector("#stock-number");
        const btn = info.querySelector("#rezervisi-btn");
        const reviewsBtn = info.querySelector("#show-reviews-btn");

        // KLIK NA DUGME OCENE
        reviewsBtn.onclick = () => {
            modal.remove(); 
            this.openReviewsModal(knjiga);
        };

        // LOGIKA PROMENE
        select.onchange = async () => {
            const selectedLibId = select.value;
            stockContainer.style.display = "none";
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Provera...`;

            if (!selectedLibId) {
                btn.innerText = "Izaberi biblioteku";
                return;
            }

            try {
                const res = await fetch(`${API_URL}/Posedovanje/GetBooksFromLibrary/${selectedLibId}`);
                if (res.ok) {
                    const inventory = await res.json();
                    const item = inventory.find(x => x.kid == (knjiga.id || knjiga.Id));

                    stockContainer.style.display = "block";

                    if (item) {
                        const available = (item.br_primeraka || 0) - (item.br_iz || 0);
                        if (available > 0) {
                            stockNum.innerText = `${available} kom.`;
                            stockNum.className = "stock-green";
                            btn.disabled = false;
                            btn.style.opacity = "1";
                            btn.innerHTML = `<i class="fas fa-hand-holding"></i> REZERVIŠI`;
                        } else {
                            stockNum.innerText = "0 kom.";
                            stockNum.className = "stock-red";
                            btn.innerText = "NEMA NA STANJU";
                        }
                    } else {
                        stockNum.innerText = "0 kom.";
                        stockNum.className = "stock-red";
                        btn.innerText = "NIJE U PONUDI";
                    }
                } else {
                    btn.innerText = "Greška";
                }
            } catch (e) {
                console.error(e);
                btn.innerText = "Greška servera";
            }
        };

        btn.onclick = () => {
            const selectedLibId = select.value;
            if (selectedLibId) {
                this.rentBook(knjiga, selectedLibId);
            }
        };
    }

    // NOVI MODAL ZA OCENE
    async openReviewsModal(knjiga) {
        const modal = this.createBaseModal();
        const content = modal.querySelector(".parchment-modal");
        
        content.style.maxWidth = "600px";
        content.style.width = "90%";
        content.style.textAlign = "center";

        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 class="modal-title" style="font-size:1.5rem; margin:0;">Ocene za: "${knjiga.naziv}"</h2>
                <button id="back-to-details" class="close-btn" style="position:static; font-size:1.5rem;" title="Nazad">
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>
            
            <div id="reviews-list" class="reviews-container">
                <p class="loader-text">Učitavanje ocena...</p>
            </div>
        `;

        // Dugme Nazad
        content.querySelector("#back-to-details").onclick = () => {
            modal.remove();
            this.openDetails(knjiga); // Vrati se na detalje
        };

        try {
            const bookId = knjiga.id || knjiga.Id;
            const res = await fetch(`${API_URL}/Ocena/ListaOcena/${bookId}`);
            const listContainer = content.querySelector("#reviews-list");
            listContainer.innerHTML = "";

            if (res.ok) {
                const reviews = await res.json();
                
                if (reviews.length === 0) {
                    listContainer.innerHTML = "<p style='font-style:italic; color:#757575;'>Još uvek nema ocena za ovu knjigu.</p>";
                } else {
                    reviews.forEach(r => {
                        const ratingVal = r.ocena || 0;
                        const stars = "★".repeat(Math.floor(ratingVal)) + (ratingVal % 1 !== 0 ? "½" : "");
                        
                        const item = document.createElement("div");
                        item.className = "review-item";
                        item.innerHTML = `
                            <div class="review-header">
                                <span><i class="fas fa-user"></i> ${r.username || "Korisnik"}</span>
                                <span class="review-stars">${stars} (${ratingVal})</span>
                            </div>
                            <div class="review-comment">
                                "${r.komentar || "Bez komentara."}"
                            </div>
                        `;
                        listContainer.appendChild(item);
                    });
                }
            } else {
                listContainer.innerHTML = "<p class='error-msg'>Greška pri učitavanju ocena.</p>";
            }
        } catch (e) {
            console.error(e);
            content.querySelector("#reviews-list").innerHTML = "<p class='error-msg'>Server nedostupan.</p>";
        }
    }

    // --- DROPDOWN LOGIKA ---
    async fetchLibrariesForDropdown(nazivKnjige) {
        const select = document.getElementById("lib-dropdown");
        if(!select) return;

        try {
            const res = await fetch(`${API_URL}/Biblioteka/ZaKnjigu/${encodeURIComponent(nazivKnjige)}`);
            
            if(res.ok) {
                const bibliotekeImena = await res.json();
                select.innerHTML = ""; 

                if(bibliotekeImena.length === 0) {
                    const opt = document.createElement("option");
                    opt.text = "Nema na stanju nigde";
                    select.appendChild(opt);
                    select.disabled = true;
                    document.getElementById("rezervisi-btn").innerText = "Nije dostupno";
                } else {
                    const def = document.createElement("option");
                    def.value = ""; def.text = "--- Izaberi ---";
                    select.appendChild(def);

                    bibliotekeImena.forEach(bibNaziv => {
                        const libObj = this.allLibsCache.find(l => (l.name || l.Name || l.naziv || l.Naziv) === bibNaziv);
                        if (libObj) {
                            const opt = document.createElement("option");
                            opt.value = libObj.id || libObj.Id; 
                            opt.text = bibNaziv; 
                            select.appendChild(opt);
                        }
                    });
                }
            }
        } catch(e) { console.error(e); }
    }

    // --- REZERVACIJA ---
    async rentBook(book, libId) {
        if (!this.username) {
            alert("Morate biti prijavljeni!");
            return;
        }
        if (!confirm(`Rezervišete knjigu: "${book.naziv}"?`)) return;

        const rentalData = {
            Username: this.username,
            LibID: libId,
            BookID: book.id || book.Id,
            Date: new Date().toISOString().split('T')[0],
            Returned: false
        };

        try {
            const res = await fetch(`${API_URL}/Iznajmljivanje/Rent_add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(rentalData)
            });

            if (res.ok) {
                alert("Uspešna rezervacija!");
                document.querySelector(".modal-overlay").remove();
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