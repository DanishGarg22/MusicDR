let audio = new Audio();
let songs;
let currentfolder;
let currentUser = null;

// Authentication system
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('musicdr_users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('musicdr_current_user')) || null;
        this.updateUI();
    }

    signup(name, email, password) {
        if (this.users.find(user => user.email === email)) {
            throw new Error('User already exists with this email');
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('musicdr_users', JSON.stringify(this.users));
        return this.login(email, password);
    }

    login(email, password) {
        const user = this.users.find(user =>
            user.email === email && user.password === this.hashPassword(password)
        );

        if (!user) {
            throw new Error('Invalid email or password');
        }

        this.currentUser = { ...user };
        delete this.currentUser.password;
        localStorage.setItem('musicdr_current_user', JSON.stringify(this.currentUser));

        this.updateUI();
        return this.currentUser;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('musicdr_current_user');
        this.updateUI();
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        if (this.currentUser) {
            loginBtn.textContent = 'Logout';
            loginBtn.onclick = () => this.logout();
            signupBtn.textContent = `Hi, ${this.currentUser.name.split(' ')[0]}`;
            signupBtn.style.background = 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)';
            signupBtn.onclick = null;
        } else {
            loginBtn.textContent = 'Log in';
            loginBtn.onclick = () => openModal('loginModal');
            signupBtn.textContent = 'Sign up';
            signupBtn.style.background = '';
            signupBtn.onclick = () => openModal('signupModal');
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }
}

const auth = new AuthSystem();

// Utility functions
function convertSecondsToMinutes(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        ${type === 'error' ? 'background: linear-gradient(135deg, #e22134, #ff6b6b);' :
          type === 'success' ? 'background: linear-gradient(135deg, #1db954, #1ed760);' :
          'background: linear-gradient(135deg, #333, #555);'}
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => { document.body.removeChild(notification); }, 300);
    }, 3000);
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Fetch songs from real folder
async function getsongs(folder) {
    currentfolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    let songul = document.querySelector(".playlist").getElementsByTagName("ul")[0];
    songul.innerHTML = "";
    for (const song of songs) {
        songul.innerHTML += `<li>${song.replaceAll("%20", " ")}</li>`;
    }

    Array.from(document.querySelector(".playlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            if (!auth.isLoggedIn()) {
                showNotification('Please log in to play music', 'error');
                openModal('loginModal');
                return;
            }
            playMusic(e.innerHTML.trim());
        });
    });

    return songs;
}

// Play music
const playMusic = (track, pause = false) => {
    if (!auth.isLoggedIn()) {
        showNotification('Please log in to play music', 'error');
        openModal('loginModal');
        return;
    }

    audio.src = `/${currentfolder}/` + track;
    if (!pause) {
        audio.play();
        document.getElementById('play').src = "svg file/playbarsvgfile/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    showNotification(`Now playing: ${decodeURI(track)}`, 'success');
};

// Display albums (from real folders)
async function displayalbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.querySelector("ul").getElementsByTagName("a");
    let containersecond = document.querySelector(".containersecond");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/songs/").slice(1)[0];
            let a = await fetch(`/songs/${folder}/info.json`);
            let info = await a.json();
            let html = `
                <div data-folder=${folder} class="card">
                    <div class="playlistimage">
                        <img src="songs/${folder}/cover.png" alt="" height="165px" width="165px">
                        <div class="playbutton">
                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="black">
                                <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                                stroke="#141B34" stroke-width="1.5" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                    <h1>${info.title}</h1>
                    <span>${info.description}</span>
                </div>`;
            containersecond.innerHTML += html;
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            if (!auth.isLoggedIn()) {
                showNotification('Please log in to access playlists', 'error');
                openModal('loginModal');
                return;
            }
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

// Event listeners setup
function setupEventListeners() {
    // modal events
    document.getElementById('closeLogin').addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('closeSignup').addEventListener('click', () => closeModal('signupModal'));

    document.getElementById('switchToSignup').addEventListener('click', () => {
        closeModal('loginModal');
        openModal('signupModal');
    });
    document.getElementById('switchToLogin').addEventListener('click', () => {
        closeModal('signupModal');
        openModal('loginModal');
    });

    // form submits
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            auth.login(email, password);
            closeModal('loginModal');
            showNotification(`Welcome back, ${auth.currentUser.name}!`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        try {
            auth.signup(name, email, password);
            closeModal('signupModal');
            showNotification(`Welcome to MusicDR, ${name}!`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // controls
    document.getElementById('play').addEventListener("click", () => {
        if (!auth.isLoggedIn()) {
            showNotification('Please log in to control playback', 'error');
            openModal('loginModal');
            return;
        }
        if (audio.paused) {
            audio.play();
            document.getElementById('play').src = "svg file/playbarsvgfile/pause.svg";
        } else {
            audio.pause();
            document.getElementById('play').src = "svg file/playbarsvgfile/play.svg";
        }
    });

    document.getElementById('previous').addEventListener("click", () => {
        if (!auth.isLoggedIn()) return;
        if (!songs || songs.length === 0) return;
        audio.pause();
        let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) playMusic(songs[index - 1]);
    });

    document.getElementById('next').addEventListener("click", () => {
        if (!auth.isLoggedIn()) return;
        if (!songs || songs.length === 0) return;
        audio.pause();
        let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
    });

    // progress updates
    audio.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${convertSecondsToMinutes(audio.currentTime)}/${convertSecondsToMinutes(audio.duration)}`;
        document.querySelector(".circle").style.left = (audio.currentTime / audio.duration) * 100 + "%";
    });

    // sidebar
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".container2").classList.add("show");
    });
    document.querySelector(".cancel").addEventListener("click", () => {
        document.querySelector(".container2").classList.remove("show");
    });

    // seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        if (!auth.isLoggedIn()) return;
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        audio.currentTime = ((audio.duration) * percent) / 100;
    });
}

// Init
async function main() {
    setupEventListeners();
    songs = await getsongs(`songs/1`);
    await displayalbums();
    if (songs.length > 0) playMusic(songs[0], true);
}
main();
