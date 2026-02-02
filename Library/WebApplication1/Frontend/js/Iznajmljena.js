const API_URL = "https://localhost:7136/api"; 


export class IznajmljenaManager {
    constructor(host) {
        this.host = host;
        this.username = localStorage.getItem("user");
        this.token = localStorage.getItem("token");
    }

    async draw() {
        this.host.innerHTML = "";

        // --- HEADER ---
        const headerContainer = document.createElement("div");
        headerContainer.style.textAlign = "center";
        headerContainer.style.marginBottom = "40px";
        
        const title = document.createElement("h2");
        title.className = "section-title";
        title.innerText = "Moje Pozajmice";
        
        const subtitle = document.createElement("p");
        subtitle.style.fontStyle = "italic";
        subtitle.innerHTML = `Korisnik: <strong>${this.username}</strong>`;

        headerContainer.appendChild(title);
        headerContainer.appendChild(subtitle);
        this.host.appendChild(headerContainer);

        // --- GRID ---
        const grid = document.createElement("div");
        grid.style.display = "flex";
        grid.style.flexWrap = "wrap";
        grid.style.gap = "30px";
        grid.style.justifyContent = "center";
        
        grid.innerHTML = "<p class='loader-text'>Učitavanje istorije...</p>";
        this.host.appendChild(grid);

        if (!this.username) {
            grid.innerHTML = "<p class='error-msg'>Niste prijavljeni.</p>";
            return;
        }

        try {
            const [resRentals, resBooks, resLibs] = await Promise.all([
                fetch(`${API_URL}/Iznajmljivanje/Rent_all?username=${encodeURIComponent(this.username)}`),
                fetch(`${API_URL}/Knjiga/ListaKnjiga`),
                fetch(`${API_URL}/Biblioteka/Lib_all`)
            ]);

            if (resRentals.ok && resBooks.ok && resLibs.ok) {
                const rentals = await resRentals.json();
                const books = await resBooks.json();
                const libs = await resLibs.json();

                grid.innerHTML = "";

                if (!rentals || rentals.length === 0) {
                    grid.innerHTML = "<p style='width:100%; text-align:center;'>Nemate istoriju zaduženja.</p>";
                    return;
                }

                this.renderRentals(rentals, books, libs, grid);

            } else {
                grid.innerHTML = "<p class='error-msg'>Greška pri dohvatanju podataka.</p>";
            }
        } catch (e) {
            console.error(e);
            grid.innerHTML = "<p class='error-msg'>Server nedostupan.</p>";
        }
    }

    renderRentals(rentals, allBooks, allLibs, container) {
        rentals.forEach(rent => {
            const card = document.createElement("div");
            card.className = "library-card"; 
            card.style.width = "300px";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            const rentBookID = rent.bookID || rent.BookID || rent.knjigaID;
            const foundBook = allBooks.find(b => (b.id || b.Id) == rentBookID);
            const bookName = foundBook ? (foundBook.naziv || foundBook.Naziv) : ("Knjiga ID: " + rentBookID);
            const rentLibID = rent.libID || rent.LibID || rent.bibliotekaID;
            const foundLib = allLibs.find(l => (l.id || l.Id) == rentLibID);
            const libName = foundLib ? (foundLib.name || foundLib.Name || foundLib.naziv || foundLib.Naziv) : "Nepoznata biblioteka";

            const isReturned = (rent.returned === true || rent.Returned === true);

            card.innerHTML = `
                <div>
                    <div class="lib-card-header">
                        <i class="fas fa-book-reader"></i> &nbsp; Zaduženje
                    </div>
                    <div class="lib-card-body">
                        <h3 style="margin:10px 0; color:var(--wood-dark); border-bottom:1px solid #d7ccc8; padding-bottom:5px;">
                            ${bookName}
                        </h3>
                        
                        <p style="font-size:0.9rem; margin:5px 0; color:#5d4037;">
                            <i class="fas fa-landmark"></i> <strong>Biblioteka:</strong><br> ${libName}
                        </p>
                        <p style="font-size:0.9rem; margin:5px 0; color:#5d4037;">
                            <i class="fas fa-calendar-alt"></i> <strong>Datum:</strong> ${rent.date}
                        </p>
                        <p style="font-weight:bold; color:${isReturned ? '#757575' : '#2e7d32'}">
                            Status: ${isReturned ? "VRAĆENA" : "ZADUŽENA"}
                        </p>
                    </div>
                </div>

                <div class="card-actions" style="padding:10px;">
                    ${!isReturned ? `
                        <button class="vintage-btn return-btn" style="width:100%; border-color:#b71c1c;">
                            <i class="fas fa-undo"></i> VRATI KNJIGU
                        </button>
                    ` : `
                        <div style="text-align:center; font-style:italic; color:#9e9e9e;">Razduženo</div>
                    `}
                </div>
            `;

            if (!isReturned) {
                const btn = card.querySelector(".return-btn");
                // PROMENA: Prvo proveravamo da li postoji ocena, pa onda otvaramo modal
                btn.onclick = () => this.checkRatingAndOpenModal(rent, bookName);
            }

            container.appendChild(card);
        });
    }

    // ========================================================================
    // PROVERA OCENE I OTVARANJE MODALA
    // ========================================================================
    async checkRatingAndOpenModal(rentData, bookName) {
        // Overlay za loading
        const loadingOverlay = document.createElement("div");
        loadingOverlay.className = "modal-overlay";
        loadingOverlay.innerHTML = "<p style='color:white; font-size:1.5rem;'>Provera statusa ocene...</p>";
        document.body.appendChild(loadingOverlay);

        let existingRating = null;

        try {
            // Dohvatamo SVE ocene za tu knjigu
            const res = await fetch(`${API_URL}/Ocena/ListaOcena/${rentData.bookID}`);
            if (res.ok) {
                const ratings = await res.json();
                // Tražimo da li je trenutni user već ocenio
                existingRating = ratings.find(r => r.username === this.username);
            }
        } catch (e) {
            console.error("Greška pri proveri ocene", e);
        } finally {
            loadingOverlay.remove();
            // Otvaramo pravi modal sa informacijom da li ocena postoji
            this.openRateAndReturnModal(rentData, bookName, existingRating);
        }
    }

    // ========================================================================
    // MODAL ZA OCENU + VRAĆANJE
    // ========================================================================
    openRateAndReturnModal(rentData, bookName, existingRating) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        
        const content = document.createElement("div");
        content.className = "parchment-modal";
        content.style.width = "400px"; 

        // Ako postoji ocena, koristimo njene vrednosti, inače default 5
        let currentRating = existingRating ? existingRating.ocena : 5;
        const commentValue = existingRating ? existingRating.komentar : "";
        
        // Tekst na dugmetu
        const btnText = existingRating ? "IZMENI OCENU I VRATI" : "OSTAVI OCENU I VRATI";
        const btnIcon = existingRating ? "fa-edit" : "fa-star";

        content.innerHTML = `
            <h3 style="margin-top:0; color:var(--wood-dark);">Vraćanje Knjige</h3>
            <p>Vraćate: <strong>${bookName}</strong></p>
            <hr style="border-color:#d7ccc8; margin:15px 0;">

            <label style="font-weight:bold; color:var(--wood-dark);">
                ${existingRating ? "Vaša postojeća ocena:" : "Ocenite knjigu:"}
            </label>
            
            <div class="rating-stars" id="star-container">
                <i class="fas fa-star star" data-value="1"></i>
                <i class="fas fa-star star" data-value="2"></i>
                <i class="fas fa-star star" data-value="3"></i>
                <i class="fas fa-star star" data-value="4"></i>
                <i class="fas fa-star star" data-value="5"></i>
            </div>

            <label style="font-weight:bold; color:var(--wood-dark);">Komentar:</label>
            <textarea id="rating-comment" class="quill-input" style="border:1px solid var(--wood-light); height:70px; resize:none; margin-top:5px;" placeholder="Vaš utisak...">${commentValue}</textarea>

            <div style="display:flex; flex-direction:column; gap:10px; margin-top:25px;">
                
                <button id="btn-rate-return" class="vintage-btn" style="background-color:#2e7d32; border-color:#1b5e20; color:white;">
                    <i class="fas ${btnIcon}"></i> ${btnText}
                </button>

                <button id="btn-just-return" class="vintage-btn" style="opacity:0.8;">
                    <i class="fas fa-undo"></i> SAMO VRATI
                </button>

                <button id="btn-cancel" class="vintage-btn" style="background:transparent; color:#b71c1c; border-color:#b71c1c;">
                    Otkaži
                </button>
            </div>
        `;

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // --- LOGIKA ZVEZDICA ---
        const stars = content.querySelectorAll(".star");
        
        // Pomoćna funkcija za bojenje
        const updateStars = (val) => {
            stars.forEach(star => {
                const sVal = parseInt(star.getAttribute("data-value"));
                if (sVal <= val) {
                    star.classList.add("active");
                    star.style.color = "#d4af37";
                } else {
                    star.classList.remove("active");
                    star.style.color = "#ccc";
                }
            });
        };

        // Inicijalno bojenje (na osnovu stare ili default ocene)
        updateStars(currentRating);

        stars.forEach(star => {
            star.onmouseover = () => updateStars(parseInt(star.getAttribute("data-value")));
            star.onmouseout = () => updateStars(currentRating);
            star.onclick = () => {
                currentRating = parseInt(star.getAttribute("data-value"));
                updateStars(currentRating);
            };
        });

        // --- DUGMICI ---

        // 1. Ostavi/Izmeni ocenu i vrati
        content.querySelector("#btn-rate-return").onclick = async () => {
            const comment = document.getElementById("rating-comment").value;
            
            // Odlučujemo da li je POST (Kreiraj) ili PUT (Izmeni)
            const success = await this.handleRating(rentData.bookID, currentRating, comment, !!existingRating);
            
            if (success) {
                await this.returnBookLogic(rentData);
                overlay.remove();
            }
        };

        // 2. Samo vrati
        content.querySelector("#btn-just-return").onclick = async () => {
            await this.returnBookLogic(rentData);
            overlay.remove();
        };

        // 3. Otkaži
        content.querySelector("#btn-cancel").onclick = () => {
            overlay.remove();
        };
    }

    // --- API: RUKOVANJE OCENOM (POST ili PUT) ---
    async handleRating(bookId, value, comment, isUpdate) {
        const ratingData = {
            username: this.username,
            knjigaId: bookId,
            ocena: value,
            komentar: comment || ""
        };

        // Određujemo URL i Metod
        const url = isUpdate ? `${API_URL}/Ocena/IzmeniOcenu` : `${API_URL}/Ocena/KreirajOcenu`;
        const method = isUpdate ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify(ratingData)
            });

            if (res.ok) {
                // alert(isUpdate ? "Ocena izmenjena!" : "Hvala na oceni!");
                return true;
            } else {
                const txt = await res.text();
                alert("Greška: " + txt);
                return false;
            }
        } catch (e) {
            console.error(e);
            alert("Greška servera pri ocenjivanju.");
            return false;
        }
    }

    // --- API: VRAĆANJE KNJIGE (PUT) ---
    async returnBookLogic(rentData) {
        const username = encodeURIComponent(this.username);
        const libId = encodeURIComponent(rentData.libID);
        const bookId = encodeURIComponent(rentData.bookID);

        const url = `${API_URL}/Iznajmljivanje/Rent_edit?username=${username}&id=${libId}&bookid=${bookId}`;

        try {
            const res = await fetch(url, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            if (res.ok) {
                const msg = await res.text();
                alert(msg || "Knjiga je uspešno vraćena!");
                this.draw(); 
            } else {
                const err = await res.text();
                alert("Greška pri vraćanju: " + err);
            }
        } catch (e) {
            console.error(e);
            alert("Greška servera pri vraćanju.");
        }
    }
}