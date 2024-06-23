let audio = new Audio();
let songs;
let currentfolder;

function convertSecondsToMinutes(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return "Invalid input";
    }

    const totalMinutes = seconds / 60;
    const formattedMinutes = totalMinutes.toFixed(2).padStart(5, '0');

    return formattedMinutes;
}

async function getsongs(folder) {
    currentfolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/musicdr/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")

    let songs = []

    for (let index = 0; index < as.length; index++) {
        const element = as[index];

        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }

    }
    let songul = document.querySelector(".playlist").getElementsByTagName("ul")[0];
    songul.innerHTML = ""
    for (const song of songs) {
        songul.innerHTML = songul.innerHTML + `<li>${song.replaceAll("%20", " ")}</li>`
    }
    Array.from(document.querySelector(".playlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.innerHTML.trim());
        })

    });

    return songs

}
const playMusic = (track, pause = false) => {

    audio.src = `/musicdr/${currentfolder}/` + track;
    if (!pause) {
        audio.play();
        play.src = "svg file/playbarsvgfile/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
}


async function displayalbums() {
    let a = await fetch(`http://127.0.0.1:5500/musicdr/songs/`)
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.querySelector("ul").getElementsByTagName("a")
    let containersecond = document.querySelector(".containersecond")
    let array = Array.from(anchors)
        for (let index = 0; index < array.length; index++) {
            const e = array[index];

        if (e.href.includes("/musicdr/songs") && !e.href.includes(".htaccess") ) {
            let folder = e.href.split("/musicdr/songs/").slice(1)[0]
            let a = await fetch(`/musicdr/songs/${folder}/info.json`)
            let response = await a.json();
            html=`<div data-folder=${folder} class="card">
            <div class="playlistimage">
                <img src="songs/${folder}/cover.png" alt=""
                    height="165px" width="165px">
                <div class="playbutton">
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                        fill="black">
                        <path
                            d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                            stroke="#141B34" stroke-width="1.5" stroke-linejoin="round" />
                    </svg>
                </div>
            </div>
            <h1>${response.title}</h1>
            <span>${response.description}</span>
        </div>`
            containersecond.innerHTML=containersecond.innerHTML + html 

        }
    }
       Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0])
        })

    });

    //previous and next button

    previous.addEventListener("click", () => {
        audio.pause()
        let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
        //console.log(index);
        if ([index - 1] >= 0) {
            playMusic(songs[index - 1]);
        }


    })

    next.addEventListener("click", () => {
        audio.pause()
        console.log(audio.src.split(`/`).slice(-1)[0]);
        let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
        if ([index + 1] < (songs.length)) {
            playMusic(songs[index + 1]);
        }
    })
}



async function main() {
    let songs = await getsongs(`songs/1`);
    playMusic(songs[0], true);

    await displayalbums()

    play.addEventListener("click", () => {
        if (audio.paused) {
            audio.play()
            play.src = "svg file/playbarsvgfile/pause.svg"
        }
        else {
            audio.pause()
            play.src = "svg file/playbarsvgfile/play.svg"
        }
    })

    //timer

    audio.addEventListener("timeupdate", () => {
        // console.log(audio.currentTime, audio.duration);
        document.querySelector(".songtime").innerHTML = `${convertSecondsToMinutes(audio.currentTime)}/${convertSecondsToMinutes(audio.duration)}`
        document.querySelector(".circle").style.left = (audio.currentTime / audio.duration) * 100 + "%";

    })

    //hamburg button

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".container2").style.left = "0"
    })

    //close button

    document.querySelector(".cancel").addEventListener("click", () => {
        document.querySelector(".container2").style.left = "-100%"
    })

    //seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        audio.currentTime = ((audio.duration) * percent) / 100
    })

}

main()