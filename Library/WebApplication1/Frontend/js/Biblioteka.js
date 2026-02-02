const API_URL = "https://localhost:7136/api"; 

export class BibliotekaManager {
    constructor(host) {
        this.host = host;
        this.allLibraries = []; 
        this.username = localStorage.getItem("user");
        this.token = localStorage.getItem("token"); 
    }

    // --- 1. POČETNI PRIKAZ ---
    async draw() {
        this.host.innerHTML = ""; 

        const headerBar = document.createElement("div");
        headerBar.className = "header-bar";

        const title = document.createElement("h2");
        title.className = "section-title";
        title.innerText = "Mreža Biblioteka";

        const filterContainer = document.createElement("div");
        filterContainer.className = "filter-container-right";

        headerBar.appendChild(title);
        headerBar.appendChild(filterContainer);
        this.host.appendChild(headerBar);

        const grid = document.createElement("div");
        grid.className = "grid-container";
        grid.id = "grid";
        grid.innerHTML = "<p class='loader-text'>Učitavanje...</p>";
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
            grid.innerHTML = "<p class='error-msg'>Greška pri učitavanju biblioteka.</p>";
        }
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
            container.innerHTML = "<p>Nema biblioteka.</p>";
            return;
        }

        data.forEach(lib => {
            const card = document.createElement("div");
            card.className = "library-card";
            
            const ime = lib.naziv || "Biblioteka";
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

                // --- USER DUGMIĆI ---
                const btnOffer = document.createElement("button");
                btnOffer.className = "vintage-btn btn-offer btn-full-width";
                btnOffer.innerHTML = '<i class="fas fa-book-open"></i> Pogledaj ponudu';
                btnOffer.onclick = () => this.drawLibraryPage(lib);

                const btnJoin = document.createElement("button");
                btnJoin.className = "vintage-btn btn-join btn-full-width";
                btnJoin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Provera...'; 
                
                // POZIV NOVE METODE ZA PROVERU ČLANSTVA
                this.checkMembership(lib.id || lib.Id, btnJoin, lib);

                actionsDiv.appendChild(btnOffer);
                actionsDiv.appendChild(btnJoin);

            card.appendChild(actionsDiv);
            container.appendChild(card);
        });
    }

    // --- NOVA METODA: PROVERA ČLANSTVA ---
    async checkMembership(libId, btn, libObj) {
        try {
            const res = await fetch(`${API_URL}/Uclanjen/VratiKorisnikeBiblioteke/${libId}`);
            
            if (res.ok) {
                const users = await res.json();
                const isMember = users.some(u => u.username === this.username || u.Username === this.username);

                if (isMember) {
                    // AKO JE UČLANJEN
                    btn.innerHTML = '<i class="fas fa-check-circle"></i> UČLANJEN';
                    btn.style.backgroundColor = "#388e3c"; // Zelena boja
                    btn.style.color = "white";
                    btn.style.cursor = "default";
                    btn.onclick = null; // Onemogući klik
                } else {
                    // AKO NIJE UČLANJEN
                    btn.innerHTML = '<i class="fas fa-id-card"></i> Učlani me';
                    btn.onclick = () => this.joinLibrary(libObj);
                }
            } else {
                // Fallback ako API vrati grešku
                btn.innerHTML = '<i class="fas fa-id-card"></i> Učlani me';
                btn.onclick = () => this.joinLibrary(libObj);
            }
        } catch (e) {
            console.error(e);
            btn.innerHTML = '<i class="fas fa-id-card"></i> Učlani me';
            btn.onclick = () => this.joinLibrary(libObj);
        }
    }

    // ---  STRANICA JEDNE BIBLIOTEKE ---
    async drawLibraryPage(lib) {
        const libId = lib.id || lib.Id;
        const libName = lib.naziv;

        this.host.innerHTML = ""; 

        const header = document.createElement("div");
        header.className = "header-bar";
        header.style.flexDirection = "row"; 
        header.style.justifyContent="space-between"
        
        header.innerHTML = `
            <button id="back-to-libs" class="vintage-btn">
            <i class="fas fa-arrow-left"></i> Nazad
            </button>
            <h1 class="section-title header-title-centered" style="margin-bottom:15px;">${libName}</h1>
            <button id="ispisi-se" class="vintage-btn"> 
            OTKAŽI ČLANSTVO
            </button>
        `;
        this.host.appendChild(header);
        document.getElementById("ispisi-se").onclick = () => this.obrisiUclanjenje(this.username, libId);
        document.getElementById("back-to-libs").onclick = () => this.draw(lib);

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
                            const bookId = bookDef.id || bookDef.Id;
                            const authRes = await fetch(`${API_URL}/Napisao/VratiAutoreKnjige/${bookId}`);
                            if (authRes.ok) {
                                const authors = await authRes.json();
                                if (authors && authors.length > 0) {
                                    authorsStr = authors.map(a => `${a.ime} ${a.prezime}`).join(", ");
                                }
                            }
                        } catch (err) { console.error(err); }

                        return {
                            ...bookDef,
                            stanje: available,
                            ukupno: total,
                            pisac: authorsStr 
                        };
                    }
                    return null;
                }));

                const validBooks = booksToDisplay.filter(b => b !== null);

                grid.innerHTML = "";
                if (validBooks.length === 0) {
                    grid.innerHTML = "<p style='width:100%; text-align:center;'>Trenutno nema knjiga na stanju.</p>";
                } else {
                    validBooks.forEach(k => {
                        this.renderBookCard(k, libId, grid, libName);
                    });
                }
            } else {
                grid.innerHTML = "<p class='error-msg'>Greška pri dohvatanju podataka.</p>";
            }
        } catch (e) {
            console.error(e);
            grid.innerHTML = "<p class='error-msg'>Server nedostupan.</p>";
        }
    }

    renderBookCard(book, libId, container, libName) {
        const card = document.createElement("div");
        card.className = "book-card-dashboard";
        
        card.onclick = () => this.openBookDetails(book, libId, libName);
        
        const imgContainer = document.createElement("div");
        imgContainer.className = "placeholder-container";
        imgContainer.innerHTML = `<div class="placeholder-title-overlay">${book.naziv}</div>`;
        
        const titleDiv = document.createElement("div");
        titleDiv.className = "book-title";
        titleDiv.innerText = book.naziv;

        const btnContainer = document.createElement("div");
        btnContainer.className = "book-actions-left"; 

            // User: Iznajmi
            const rentBtn = document.createElement("button");
            rentBtn.className = "vintage-btn btn-small";
            rentBtn.innerHTML = `<i class="fas fa-hand-holding"></i> Iznajmi`;
            rentBtn.onclick = (e) => {
                e.stopPropagation(); 
                this.rentBook(book, libId, libName);
            };
            btnContainer.appendChild(rentBtn);

        card.appendChild(imgContainer);
        card.appendChild(titleDiv);
        card.appendChild(btnContainer);
        container.appendChild(card);
    }

    // --- MODAL DETALJI ---
    openBookDetails(book, libId, libName) {
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

        // 5. IZMENA: Dugmići u modalu
        let buttonsHTML = "";
    
            buttonsHTML = `
                <div style="display:flex; gap:10px; width:100%;">
                    <button id="modal-rent-btn" class="vintage-btn btn-full-width">
                        ${book.stanje > 0 ? '<i class="fas fa-hand-holding"></i> IZNAJMI ODMAH' : 'NEMA NA STANJU'}
                    </button>
                    <button id="modal-reviews-btn" class="vintage-btn" style="width:40%; background:transparent; color:var(--wood-dark); border:1px solid var(--wood-dark);">
                        <i class="fas fa-star"></i> Ocene
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
                        <i class="fas fa-boxes"></i> Trenutno dostupno: 
                        <strong class="${stanjeColorClass}" style="font-size:1.3rem;">${stanjeTekst}</strong>
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

            const rentBtn = info.querySelector("#modal-rent-btn");
            if (rentBtn) {
                if (book.stanje <= 0) {
                    rentBtn.disabled = true;
                    rentBtn.style.opacity = "0.5";
                    rentBtn.style.cursor = "not-allowed";
                } else {
                    rentBtn.onclick = () => this.rentBook(book, libId, libName);
                }
                const reviewsBtn = info.querySelector("#modal-reviews-btn");
            if(reviewsBtn) {
                reviewsBtn.onclick = () => {
                    modalOverlay.remove();
                    this.showReviewsModal(book, libId, libName); 
                };
            }
        }
    }

    async showReviewsModal(book, libId, libName) {
        const modalOverlay = this.createBaseModal();
        const content = modalOverlay.querySelector(".parchment-modal");
        
        content.style.maxWidth = "600px";
        content.style.width = "90%";
        content.style.textAlign = "center";

        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 class="modal-title" style="font-size:1.5rem; margin:0;">Ocene za: "${book.naziv}"</h2>
                <button id="back-to-details" class="close-btn" style="position:static; font-size:1.5rem;" title="Nazad">
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>
            <div id="reviews-list" class="reviews-container">
                <p class="loader-text">Učitavanje ocena...</p>
            </div>
        `;

        content.querySelector("#back-to-details").onclick = () => {
            modalOverlay.remove();
            this.openBookDetails(book, libId, libName);
        };

        try {
            const bookId = book.id || book.Id;
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

    async rentBook(book, libId, libName) {
        if (!this.username) { alert("Morate biti prijavljeni da biste iznajmili knjigu!"); return; }
        if (!confirm(`Želite li da iznajmite knjigu "${book.naziv}"?`)) return;

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
                alert(`Uspešno ste iznajmili "${book.naziv}"!`);
                this.drawLibraryPage({ id: libId, naziv: libName }); 
                document.querySelector(".modal-overlay")?.remove();
            } else {
                const txt = await res.text();
                alert("Greška: " + txt);
            }
        } catch (e) {
            console.error(e);
            alert("Greška u komunikaciji sa serverom.");
        }
    }

    async deleteLibrary(libId) {
        if(!confirm("Da li ste sigurni da želite da OBRISETE ovu biblioteku? Ovo će obrisati i sav inventar.")) return;
        
        try {
            const res = await fetch(`${API_URL}/Biblioteka/ObrisiBiblioteku/${libId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${this.token}` }
            });
            if(res.ok) {
                alert("Biblioteka obrisana.");
                this.draw(); 
            } else {
                alert("Greška pri brisanju: " + await res.text());
            }
        } catch(e) { alert("Server error."); }
    }

    async joinLibrary(lib) {
        if (!this.username) { alert("Morate biti prijavljeni!"); return; }
        const libId = lib.id || lib.Id;
        const libName = lib.naziv;
        if(!confirm(`Da li želite da postanete član biblioteke "${libName}"?`)) return;

        try {
            const url = `${API_URL}/Uclanjen/KreirajUclanjen/${encodeURIComponent(this.username)}/${libId}`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json" 
                }
            });
            if (res.ok) {
                const msg = await res.text();
                alert(msg || "Uspešno ste učlanjeni!");
                this.draw();
            } else {
                const err = await res.text();
                alert("Greška: " + err);
            }
        } catch (e) {
            console.error(e);
            alert("Greška u komunikaciji sa serverom.");
        }
    }
    async obrisiUclanjenje(username, bibliotekaId) {
    if (!confirm(`Da li ste sigurni da želite da obrišete članstvo za korisnika ${username}?`)) {
        return;
    }
    try {
        const res = await fetch(`${API_URL}/Uclanjen/ObrisiUclanjen/${username}/${bibliotekaId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${this.token}` 
            }
        });

        if (res.ok) {
            const poruka = await res.text();
            alert("Uspeh: " + poruka);
            if (typeof this.draw === "function") this.draw(); 
        } else {
            const greska = await res.text();
            alert("Greška pri brisanju: " + greska);
        }
    } catch (e) {
        console.error(e);
        alert("Serverska greška prilikom brisanja članstva.");
    }
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