const API_URL = "https://localhost:7136/api"; 


export class ProfilManager {
    constructor(host, username, token, role) {
        this.host = host;
        this.username = username;
        this.token = token;
        this.role = role;
        this.currentUserData = null;
        
        window.profilManager = this; 
    }

    async draw() {
        this.host.innerHTML = "";
        
        // Loader (Samo tekst dok učitava, bez naslova)
        const loader = document.createElement("div");
        loader.className = "loader-text";
        loader.innerText = "Učitavanje podataka...";
        loader.style.marginTop = "50px"; 
        
        this.host.appendChild(loader);
        
        try {
            const res = await fetch(`${API_URL}/Korisnik/Podaci/${this.username}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                }
            });
            
            if (!res.ok) throw new Error("Neuspelo učitavanje.");
            
            const user = await res.json();
            this.currentUserData = user; 

            // Uklanjamo loader
            loader.remove();

            // HTML Struktura (BEZ "Moj Profil" naslova iznad papira)
            const content = document.createElement("div");
            content.className = "profile-paper"; 

            content.innerHTML = `
                <h3 class="profile-header-title">LIČNI PODACI</h3>
                <div class="profile-divider"></div>

                <div class="form-group">
                    <label>Korisničko ime:</label>
                    <input type="text" id="prof-username" class="quill-input" value="${user.username}" disabled title="Ne može se menjati">
                </div>
                
                <div class="form-group">
                    <label>Ime:</label>
                    <input type="text" id="prof-name" class="quill-input" value="${user.name}" disabled>
                </div>
                
                <div class="form-group">
                    <label>Prezime:</label>
                    <input type="text" id="prof-lastname" class="quill-input" value="${user.lastname}" disabled>
                </div>
                
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="prof-email" class="quill-input" value="${user.email}" disabled>
                </div>
                
                <div class="form-group">
                    <label>Telefon:</label>
                    <input type="text" id="prof-number" class="quill-input" value="${user.number}" disabled>
                </div>

                <div id="msg-box-profile" class="error-msg"></div>

                <div class="action-buttons">
                    <button id="btn-edit" class="vintage-btn" onclick="window.profilManager.enableEditMode()">
                        <i class="fas fa-feather-alt"></i> Izmeni
                    </button>

                    <div id="edit-actions" style="display:none; gap:10px;">
                        <button class="vintage-btn btn-join" onclick="window.profilManager.saveAccount()">
                            <i class="fas fa-save"></i>
                        </button>
                        <button class="vintage-btn cancel-btn" onclick="window.profilManager.cancelEditMode()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="profile-divider"></div>
                
                <button class="profile-toggle-btn" onclick="window.profilManager.togglePasswordForm()">
                    <i class="fas fa-key"></i> Promena Lozinke
                </button>

                <div id="password-section" class="password-box" style="display:none;">
                    <div class="form-group">
                        <label>Trenutna Lozinka:</label>
                        <input type="password" id="pass-old" class="quill-input" placeholder="Stara lozinka">
                    </div>
                    
                    <div class="form-group">
                        <label>Nova Lozinka:</label>
                        <input type="password" id="pass-new" class="quill-input" placeholder="Nova lozinka">
                    </div>

                    <div id="msg-box-pass" class="error-msg"></div>

                    <div style="text-align:center; margin-top:20px;">
                        <button class="vintage-btn" onclick="window.profilManager.savePassword()">
                            <i class="fas fa-check-circle"></i> Potvrdi
                        </button>
                    </div>
                </div>
            `;

            this.host.appendChild(content);

        } catch (e) {
            console.error(e);
            this.host.innerHTML = "<p class='error-msg' style='margin-top:50px;'>Greška pri učitavanju profila.</p>";
        }
    }

    // --- LOGIKA IZMENE ---

    enableEditMode() {
        document.getElementById("btn-edit").style.display = "none";
        document.getElementById("edit-actions").style.display = "flex";
        
        const inputs = document.querySelectorAll("#prof-name, #prof-lastname, #prof-email, #prof-number");
        inputs.forEach(inp => {
            inp.disabled = false;
            inp.classList.add("active-input"); 
        });
    }

    cancelEditMode() {
        document.getElementById("btn-edit").style.display = "block";
        document.getElementById("edit-actions").style.display = "none";
        
        const msgBox = document.getElementById("msg-box-profile");
        msgBox.innerText = "";
        msgBox.className = "error-msg";

        if(this.currentUserData) {
            document.getElementById("prof-name").value = this.currentUserData.name;
            document.getElementById("prof-lastname").value = this.currentUserData.lastname;
            document.getElementById("prof-email").value = this.currentUserData.email;
            document.getElementById("prof-number").value = this.currentUserData.number;
        }

        const inputs = document.querySelectorAll("#prof-name, #prof-lastname, #prof-email, #prof-number");
        inputs.forEach(inp => {
            inp.disabled = true;
            inp.classList.remove("active-input");
        });
    }

    async saveAccount() {
        const msgBox = document.getElementById("msg-box-profile");
        msgBox.innerText = "Čuvanje...";
        msgBox.className = "error-msg"; 

        const updatedData = {
            username: this.username, 
            name: document.getElementById("prof-name").value,
            lastname: document.getElementById("prof-lastname").value,
            email: document.getElementById("prof-email").value,
            number: document.getElementById("prof-number").value,
            role: this.role 
        };

        try {
            const res = await fetch(`${API_URL}/Korisnik/EditAccount`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                this.currentUserData = updatedData;
                alert("Podaci su uspešno ažurirani.");
                this.cancelEditMode();
            } else {
                const txt = await res.text();
                msgBox.innerText = "Greška: " + txt;
                msgBox.className = "error-msg stock-red";
            }
        } catch (e) {
            msgBox.innerText = "Greška servera.";
            msgBox.className = "error-msg stock-red";
        }
    }

    // --- LOGIKA LOZINKE ---

    togglePasswordForm() {
        const section = document.getElementById("password-section");
        if(section.style.display === "none") {
            section.style.display = "block";
        } else {
            section.style.display = "none";
        }
    }

    async savePassword() {
        const oldPass = document.getElementById("pass-old").value;
        const newPass = document.getElementById("pass-new").value;
        const msgBox = document.getElementById("msg-box-pass");

        msgBox.innerText = "";
        msgBox.className = "error-msg";

        if(!oldPass || !newPass) {
            msgBox.innerText = "Molimo unesite obe lozinke.";
            return;
        }

        msgBox.innerText = "Obrada...";
        
        try {
            const url = `${API_URL}/Korisnik/EditPassword?oldPassword=${encodeURIComponent(oldPass)}&newPassword=${encodeURIComponent(newPass)}`;
            
            const res = await fetch(url, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify(this.username)
            });

            if (res.ok) {
                alert("Lozinka je uspešno promenjena!");
                document.getElementById("pass-old").value = "";
                document.getElementById("pass-new").value = "";
                this.togglePasswordForm(); 
            } else {
                const txt = await res.text();
                msgBox.innerText = "Greška: " + txt;
            }
        } catch (e) {
            console.error(e);
            msgBox.innerText = "Greška servera.";
        }
    }
    
}