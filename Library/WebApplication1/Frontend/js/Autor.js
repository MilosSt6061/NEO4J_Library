const API_URL = "https://localhost:7136/api"; 

export class AutorManager {
    constructor(host) {
        this.host = host;
    }

    async draw() {
        this.host.innerHTML = "<h2 class='section-title'>AUTORI</h2><div id='grid' class='grid-container'>Učitavanje...</div>";
        this.host.innerHTML = `
        <div class="header-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 class="section-title" style="margin:0;">AUTORI</h2>
        <button id="btn-open-add-author" class="vintage-btn">
        <i class="fas fa-plus"></i> Nov Pisac
        </button>
        </div>
        <div id="grid" class="grid-container">Učitavanje...</div>
        `;
        
        const grid = document.getElementById("grid");
        const addBtn = document.getElementById("btn-open-add-author");
        if (addBtn) {
            addBtn.onclick = () => this.drawAddAuthorModal();
        }
        
        try {
            const res = await fetch(`${API_URL}/Autor/ListaAutora`);
            if (!res.ok) throw new Error("Greška servera");

            const data = await res.json();
            grid.innerHTML = "";

            if (data.length === 0) {
                grid.innerHTML = "<p style='width:100%; text-align:center;'>Nema unetih pisaca.</p>";
                return;
            }

            data.forEach(a => {
                const card = document.createElement("div");
                card.className = "book-card-dashboard"; 
                
                card.style.padding = "20px";
                card.style.height = "auto"; 
                card.style.display = "flex";
                card.style.flexDirection = "column";
                card.style.justifyContent = "space-between";
                
                card.innerHTML = `
                    <div>
                        <h3 style="color:#3e2723; margin-top:0; text-align:center;">${a.ime} ${a.prezime}</h3>
                        <p style="font-size:0.9rem; font-style:italic; text-align:center;">${a.godinaRodjenja}. god.</p>
                        <hr style="border-color:#d7ccc8;">
                        <p style="font-size:0.85rem; margin-bottom:15px;">${a.biografija ? a.biografija.substring(0, 80)+"..." : "Nema biografije."}</p>
                    </div>
                    <div class="author-actions" style="display:flex; gap:10px; margin-top:10px;">
                        <button class="vintage-btn edit-author-btn" style="flex:1; padding:5px; font-size:0.8rem;">
                            <i class="fas fa-edit"></i> IZMENI
                        </button>
                        <button class="vintage-btn delete-author-btn" style="flex:1; padding:5px; font-size:0.8rem; background:#b71c1c; border-color:#801111;">
                            <i class="fas fa-trash-alt"></i> IZBRIŠI
                        </button>
                    </div>
                `;

                const authorId = a.id || a.Id; 

                card.querySelector(".edit-author-btn").onclick = () => {
                    console.log("Izmena autora sa ID:", authorId);
                    this.drawEditForm(a);
                };

                card.querySelector(".delete-author-btn").onclick = () => {
                    if(confirm(`Da li ste sigurni da želite da obrišete pisca: ${a.ime} ${a.prezime}?`)) {
                        this.deleteAuthor(authorId);
                    }
                };

                grid.appendChild(card);
            });
        } catch(e) { 
            console.error(e);
            grid.innerHTML = "<p style='color:#b71c1c; width:100%; text-align:center;'>Greška pri učitavanju pisaca.</p>";
        }
    }
    async deleteAuthor(id) {
        try {
            const res = await fetch(`${API_URL}/Autor/ObrisiAutora/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}` 
                }
            });

            if (res.ok) {
                const poruka = await res.text();
                alert(poruka || "Pisac je uspešno obrisan.");
                this.draw(); 
            } else {
                const greska = await res.text();
                alert("Greška pri brisanju: " + greska);
            }
        } catch (e) {
            console.error(e);
            alert("Greška na serveru prilikom brisanja.");
        }
    }
    drawEditForm(autor) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        
        const content = document.createElement("div");
        content.className = "parchment-modal";
        content.style.width = "500px";

        content.innerHTML = `
            <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
            <h3 style="margin-top:0; color:var(--wood-dark)">Izmeni podatke o piscu</h3>
            <div class="profile-paper" style="box-shadow:none; padding:0;">
                <label>Ime:</label>
                <input type="text" id="edit-a-ime" class="quill-input" value="${autor.ime}">

                <label>Prezime:</label>
                <input type="text" id="edit-a-prezime" class="quill-input" value="${autor.prezime}">

                <label>Godina Rođenja:</label>
                <input type="number" id="edit-a-godina" class="quill-input" value="${autor.godinaRodjenja}">

                <label>Biografija:</label>
                <textarea id="edit-a-bio" class="quill-input" style="height:120px; border:1px solid var(--wood-light); background:transparent;">${autor.biografija || ""}</textarea>

                <button class="vintage-btn" style="width:100%; margin-top:15px;" id="btn-save-author-changes">
                    <i class="fas fa-save"></i> Sačuvaj izmene
                </button>
            </div>
        `;

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        content.querySelector("#btn-save-author-changes").onclick = () => {
            const updatedAutor = {
                id: autor.id || autor.Id, 
                ime: document.getElementById("edit-a-ime").value,
                prezime: document.getElementById("edit-a-prezime").value,
                godinaRodjenja: document.getElementById("edit-a-godina").value,
                biografija: document.getElementById("edit-a-bio").value
            };
            this.updateAuthor(updatedAutor, overlay);
        };
    }
    async updateAuthor(autorData, overlay) {
        try {
            const res = await fetch(`${API_URL}/Autor/IzmeniAutora`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(autorData)
            });

            if (res.ok) {
                const poruka = await res.text();
                alert(poruka || "Podaci su uspešno ažurirani!");
                overlay.remove(); // Zatvori modal
                this.draw();      // Osveži listu na ekranu
            } else {
                const greska = await res.text();
                alert("Greška: " + greska);
            }
        } catch (e) {
            console.error(e);
            alert("Greška na serveru prilikom izmene.");
        }
    }
    // --- 1. METODA ZA CRTANJE MODALA ZA NOVOG PISCA ---
    drawAddAuthorModal() {
        // Kreiramo overlay (pozadinu)
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        
        // Kreiramo pergament kontejner
        const content = document.createElement("div");
        content.className = "parchment-modal";
        content.style.width = "500px";

        // Ubacujemo tvoju formu u modal
        content.innerHTML = `
            <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
            <h2 class="section-title" style="text-align: center; margin-bottom: 20px; color:var(--wood-dark);">Evidencija Novog Pisca</h2>
            
            <div class="profile-paper" style="box-shadow:none; padding:0; background:transparent;">
                <label>Ime:</label>
                <input type="text" id="a-ime" class="quill-input">

                <label>Prezime:</label>
                <input type="text" id="a-prezime" class="quill-input">

                <label>Godina Rođenja:</label>
                <input type="number" id="a-godina" class="quill-input">

                <label>Biografija:</label>
                <textarea id="a-bio" class="quill-input" style="height:100px; border:1px solid var(--wood-light); background:transparent;"></textarea>

                <button class="vintage-btn" style="width:100%; margin-top: 15px;" id="btn-submit-new-author">
                    <i class="fas fa-user-edit"></i> Upiši Pisca
                </button>
            </div>
        `;

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // Povezujemo dugme na klik (pozvaće logiku za slanje koju ćemo dodati u sledećem koraku)
        content.querySelector("#btn-submit-new-author").onclick = () => {
            this.submitAuthor(overlay);
        };
    }
    // --- 2. LOGIKA ZA SLANJE PODATAKA ---
    async submitAuthor(overlay) {
        // Kupimo podatke iz polja koja smo malopre nacrtali u modalu
        const data = {
            id: "0", // Backend generiše pravi ID, "0" je samo placeholder
            ime: document.getElementById("a-ime").value,
            prezime: document.getElementById("a-prezime").value,
            godinaRodjenja: document.getElementById("a-godina").value,
            biografija: document.getElementById("a-bio").value
        };

        // Mala provera da ne šaljemo prazno ime/prezime
        if (!data.ime || !data.prezime) {
            alert("Ime i prezime su obavezni!");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/Autor/KreirajAutora`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${localStorage.getItem("token")}` 
                },
                body: JSON.stringify(data)
            });

            if (res.ok) { 
                alert("Pisac je uspešno dodat!"); 
                overlay.remove(); // Zatvaramo popup prozor
                this.draw();      // Osvežavamo listu autora u pozadini da se vidi novi pisac
            } else { 
                const errTxt = await res.text();
                alert("Greška: " + errTxt); 
            }
        } catch (e) { 
            console.error(e); 
            alert("Greška servera pri slanju."); 
        }
    }
}
