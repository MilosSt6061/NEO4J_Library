const API_URL = "https://localhost:7136/api";

export class KorisnikManager {
    constructor(host) {
        this.host = host;
        this.token = localStorage.getItem("token");
    }

    async draw() {
        this.host.innerHTML = `
            <div class="header-bar" style="display: flex; align-items: center; margin-bottom: 20px; padding: 10px 20px;">
                <h2 class="section-title" style="margin:0;"><i class="fas fa-users"></i> Upravljanje Korisnicima</h2>
            </div>
            <div id="user-list-container" style="display: flex; flex-direction: column; gap: 10px; width: 100%; padding: 0 20px; box-sizing: border-box;">
                <p class="loader-text">Učitavanje korisnika...</p>
            </div>
        `;

        const container = this.host.querySelector("#user-list-container");

        try {
            const res = await fetch(`${API_URL}/Korisnik/SviKorisnici`, {
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            if (!res.ok) throw new Error("Greška pri dohvatu korisnika.");

            const korisnici = await res.json();
            container.innerHTML = "";

            if (korisnici.length === 0) {
                container.innerHTML = "<p>Nema registrovanih korisnika u bazi.</p>";
                return;
            }

            korisnici.forEach(user => {
                this.renderUserRow(user, container);
            });

        } catch (e) {
            console.error(e);
            container.innerHTML = "<p class='error-msg'>Greška pri učitavanju podataka.</p>";
        }
    }

    renderUserRow(user, container) {
        const row = document.createElement("div");
        row.className = "header-bar"; 
        row.style.justifyContent="space-between";
        row.style.padding = "20px";
        row.style.border = "solid black 3px";
        row.style.borderRadius = "10px";

        // LEVA STRANA: Podaci
        const infoDiv = document.createElement("div");
         infoDiv.innerHTML = `
            <div style="color: var(--wood-dark); font-size: 1.3rem; margin-bottom: 5px;">
                <span style="font-size: 1rem; font-weight: normal;">Ime:</span> 
                <strong>${user.name}</strong> 
                &nbsp;&nbsp;
                <span style="font-size: 1rem; font-weight: normal;">Prezime:</span> 
                <strong>${user.lastname}</strong>
            </div>
            <div style="font-size: 1rem; color: #050000;">
                <i class="fas fa-id-badge" style="color: var(--wood-dark); "></i> 
                <span style=" font-size: 1rem;">Broj:</span> 
                <strong>${user.number || "N/A"}</strong> 
                <span style="margin: 0 10px;">|</span>
                <i class="fas fa-user" style="color: var(--wood-dark); "></i> 
                <span style="font-size: 1rem;">Username:</span> 
                <strong>${user.username}</strong>
            </div>
        `;

        // DESNA STRANA: Dugme
        const actionsDiv = document.createElement("div");
        const btnDelete = document.createElement("button");
        btnDelete.className = "vintage-btn";
        btnDelete.innerHTML = `<i class="fas fa-user-minus"></i> OBRIŠI`;
        
        btnDelete.onclick = () => this.deleteUser(user.username);

        actionsDiv.appendChild(btnDelete);

        row.appendChild(infoDiv);
        row.appendChild(actionsDiv);
        container.appendChild(row);
    }

    async deleteUser(username) {
        if (!confirm(`Da li ste sigurni da želite da trajno obrišete korisnika: ${username}?`)) return;

        try {
            const res = await fetch(`${API_URL}/Korisnik/DeleteAccount`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify(username) 
            });

            if (res.ok) {
                const poruka = await res.text();
                alert(poruka);
                this.draw(); 
            } else {
                const greska = await res.text();
                alert("Greška: " + greska);
            }
        } catch (e) {
            console.error(e);
            alert("Greška na serveru.");
        }
    }
}