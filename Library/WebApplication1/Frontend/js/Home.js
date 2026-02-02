const API_URL = "https://localhost:7136/api"; 

export class Home {
    constructor(host, onLoginSuccess) {
        this.host = host;
        this.onLoginSuccess = onLoginSuccess;
        this.currentScroll = 0;
        this.autoScrollTimer = null;
    }

    async draw() {
        this.host.innerHTML = "";

        // --- 1. HEADER ---
        const header = document.createElement("div");
        header.className = "home-header"; 

        const title = document.createElement("div");
        title.className = "header-title";
        title.innerHTML = '<i class="fas fa-book-reader"></i> &nbsp; BIBLIOTEKA APP';
        
        const linksDiv = document.createElement("div");

        const btnLogin = document.createElement("button");
        btnLogin.className = "home-nav-btn";
        btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> PRIJAVA';
        btnLogin.onclick = () => this.drawModal("Prijava");

        const btnReg = document.createElement("button");
        btnReg.className = "home-nav-btn";
        btnReg.innerHTML = '<i class="fas fa-user-plus"></i> REGISTRACIJA';
        btnReg.onclick = () => this.drawModal("Registracija");

        linksDiv.appendChild(btnLogin);
        linksDiv.appendChild(btnReg);
        
        header.appendChild(title);
        header.appendChild(linksDiv);
        this.host.appendChild(header);

        // --- 2. GLAVNI SADRŽAJ ---
        const mainContent = document.createElement("div");
        mainContent.className = "library-main"; 
        mainContent.style.paddingTop = "120px"; 

        const sectionTitle = document.createElement("h2");
        sectionTitle.className = "section-title";
        sectionTitle.innerText = "IZDVAJAMO IZ PONUDE";
        sectionTitle.style.textAlign = "center";
        mainContent.appendChild(sectionTitle);

        // --- 3. POLICA ZA KNJIGE (SLAJDER) ---
        const wrapper = document.createElement("div");
        wrapper.className = "bookshelf-wrapper"; 

        const leftBtn = document.createElement("button");
        leftBtn.className = "scroll-arrow";
        leftBtn.innerHTML = "&#10094;"; 
        
        const container = document.createElement("div");
        container.className = "bookshelf-container";

        const strip = document.createElement("div");
        strip.className = "bookshelf-strip";
        container.appendChild(strip);

        const rightBtn = document.createElement("button");
        rightBtn.className = "scroll-arrow";
        rightBtn.innerHTML = "&#10095;"; 

        wrapper.appendChild(leftBtn);
        wrapper.appendChild(container);
        wrapper.appendChild(rightBtn);
        mainContent.appendChild(wrapper);
        this.host.appendChild(mainContent);

        // --- 4. FETCH KNJIGA ---
        try {
            const res = await fetch(`${API_URL}/Knjiga/ListaKnjiga`);
            if (res.ok) {
                let knjige = await res.json();
                if (knjige.length > 0) {
                    
                    const loopKnjige = [...knjige, ...knjige, ...knjige]; 

                    loopKnjige.forEach(k => {
                        const card = document.createElement("div");
                        card.className = "book-card-home"; 
                        
                        const bookDisplayElement = this.createPlaceholder(k.naziv);
                        card.appendChild(bookDisplayElement);
                        
                        card.onclick = () => this.drawDetailsModal(k);
                        strip.appendChild(card);
                    });

                    const itemWidth = 230; 
                    
                    const moveRight = () => {
                        const maxScroll = strip.scrollWidth - container.clientWidth;
                        this.currentScroll += itemWidth;
                        if (this.currentScroll > maxScroll) this.currentScroll = 0;
                        strip.style.transform = `translateX(-${this.currentScroll}px)`;
                    };

                    const moveLeft = () => {
                        this.currentScroll -= itemWidth;
                        if (this.currentScroll < 0) this.currentScroll = 0;
                        strip.style.transform = `translateX(-${this.currentScroll}px)`;
                    };

                    rightBtn.onclick = () => { clearInterval(this.autoScrollTimer); moveRight(); };
                    leftBtn.onclick = () => { clearInterval(this.autoScrollTimer); moveLeft(); };

                    this.autoScrollTimer = setInterval(moveRight, 3000);
                }
            }
        } catch (err) { console.error(err); }
    }

    createPlaceholder(bookTitle) {
        const container = document.createElement("div");
        container.className = "placeholder-container"; 
        container.style.boxShadow = "none";
        container.style.border = "none";

        const overlay = document.createElement("div");
        overlay.className = "placeholder-title-overlay";
        overlay.innerText = bookTitle; 

        container.appendChild(overlay);
        return container;
    }

    // MODAL: DETALJI KNJIGE 
    async drawDetailsModal(knjiga) {
        const modalOverlay = this.createBaseModal();
        const content = modalOverlay.querySelector(".parchment-modal");
        
        content.style.maxWidth = "800px";
        content.style.width = "90%";

        const layout = document.createElement("div");
        layout.className = "modal-layout"; 

        // --- LEVO (Slika) ---
        const bigBook = document.createElement("div");
        bigBook.className = "placeholder-container modal-image-container";
        bigBook.innerHTML = `<div class="placeholder-title-overlay" style="font-size:1.3rem;">${knjiga.naziv}</div>`;

        // --- DESNO (Info) ---
        const info = document.createElement("div");
        info.className = "modal-info-container";

        let authorName = "Nepoznat autor";
        try {
            const authRes = await fetch(`${API_URL}/Napisao/VratiAutoreKnjige/${knjiga.id || knjiga.Id}`);
            if (authRes.ok) {
                const authors = await authRes.json();
                if (authors && authors.length > 0) {
                    authorName = authors.map(a => `${a.ime} ${a.prezime}`).join(", ");
                }
            }
        } catch (e) { console.log(e); }

        const safeDesc = (knjiga.opis || "Nema opisa.").replace(/`/g, "'");

        info.innerHTML = `
            <h2 class="modal-title">${knjiga.naziv}</h2>
            <div class="modal-author"><i class="fas fa-feather-alt"></i> ${authorName}</div>
            <p class="modal-meta">
                ${knjiga.zanr} | ${knjiga.godinaIzdavanja || "----"}
            </p>
            <hr style="border-color:#d7ccc8; margin:15px 0;">
            
            <h4 style="margin-bottom:5px; color:var(--wood-dark);">Opis dela:</h4>
            
            <div class="modal-description-box">
                ${safeDesc}
            </div>

            <div style="margin-top:10px; text-align:center; padding:15px; background:rgba(244, 228, 188, 0.4); border-radius:5px; border:1px dashed var(--wood-light);">
                <p style="font-style:italic; color:#5d4037; margin:0;">
                    <i class="fas fa-info-circle"></i> Prijavite se da biste videli dostupnost i iznajmili ovu knjigu.
                </p>
            </div>
        `;

        layout.appendChild(bigBook);
        layout.appendChild(info);
        content.appendChild(layout);
    }

    // --- MODAL: LOGIN/REGISTER ---
    drawModal(tip) {
        const overlay = this.createBaseModal();
        const content = overlay.querySelector(".parchment-modal");
        content.style.maxWidth = "450px"; 

        const title = document.createElement("h2");
        title.className = "profile-header-title";
        title.innerText = tip === "Prijava" ? "Članska Prijava" : "Novi Član";
        content.appendChild(title);

        // Kontejner za formu
        const formContainer = document.createElement("div");
        content.appendChild(formContainer);
        
        let imeIn, prezimeIn, emailIn, telIn;

        if (tip === "Registracija") {
            imeIn = this.createInput(formContainer, "text", "Vaše Ime");
            prezimeIn = this.createInput(formContainer, "text", "Vaše Prezime");
            emailIn = this.createInput(formContainer, "email", "Email Adresa");
            telIn = this.createInput(formContainer, "text", "Broj Telefona");
        }

        const userIn = this.createInput(formContainer, "text", "Korisničko ime");
        const passIn = this.createInput(formContainer, "password", "Lozinka");

        const msgDiv = document.createElement("div");
        msgDiv.className = "error-msg";
        content.appendChild(msgDiv);

        const btn = document.createElement("button");
        btn.innerText = "POTVRDI";
        btn.className = "vintage-btn btn-full-width";
        btn.style.marginTop = "20px";
        
        btn.onclick = async () => {
            msgDiv.innerText = "";
            if (tip === "Prijava") {
                await this.handleLogin(userIn.value, passIn.value, msgDiv, overlay);
            } else {
                await this.handleRegister({
                    name: imeIn.value,
                    lastname: prezimeIn.value,
                    email: emailIn.value,
                    number: telIn.value,
                    username: userIn.value,
                    password: passIn.value,
                    role: "user"
                }, msgDiv, overlay);
            }
        };
        content.appendChild(btn);
    }

    // --- AUTH LOGIKA ---
    async handleLogin(username, password, msgDiv, modal) {
        if (!username || !password) { msgDiv.innerText = "Molimo unesite podatke."; return; }
        try {
            const res = await fetch(`${API_URL}/Korisnik/Prijava`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Username: username, Password: password })
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", data.username);
                localStorage.setItem("role", data.role);
                modal.remove();
                if (this.onLoginSuccess) this.onLoginSuccess();
            } else {
                const err = await res.json();
                msgDiv.innerText = err.invalidMessage || "Pogrešni podaci.";
            }
        } catch (e) { msgDiv.innerText = "Greška u komunikaciji sa bibliotekom."; }
    }

    async handleRegister(data, msgDiv, modal) {
        if(!data.username || !data.password || !data.name) { msgDiv.innerText = "Sva polja su obavezna."; return; }
        try {
            const res = await fetch(`${API_URL}/Korisnik/Registracija`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                alert("Uspešno ste registrovani! Molimo prijavite se.");
                modal.remove();
                this.drawModal("Prijava");
            } else {
                const txt = await res.text();
                msgDiv.innerText = txt;
            }
        } catch (e) { msgDiv.innerText = "Greška servera."; }
    }

    // --- HELPERI ---
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
        this.host.appendChild(overlay);
        return overlay;
    }

    createInput(parent, type, placeholder) {
        const div = document.createElement("div");
        div.className = "form-group";
        div.style.marginBottom = "15px";
        
        const label = document.createElement("label");
        label.innerText = placeholder + ":";
        label.style.fontWeight = "bold";
        label.style.display = "block";
        label.style.marginBottom = "5px";
        
        const inp = document.createElement("input");
        inp.type = type;
        inp.className = "quill-input";
        
        div.appendChild(label);
        div.appendChild(inp);
        
        parent.appendChild(div); 
        
        return inp; 
    }
}