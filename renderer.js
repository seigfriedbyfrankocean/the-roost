const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const sessionHeading = document.getElementById('session-heading');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const saveExitBtn = document.getElementById('save-exit-btn');

const musicSelect = document.getElementById('music-select');
const musicSlider = document.getElementById('music-slider');
const rainSlider = document.getElementById('rain-slider');
const thunderSlider = document.getElementById('thunder-slider');

const focusInput = document.getElementById('focus-input');
const breakInput = document.getElementById('break-input');

const focusMinus = document.getElementById('focus-minus');
const focusPlus = document.getElementById('focus-plus');
const breakMinus = document.getElementById('break-minus');
const breakPlus = document.getElementById('break-plus');

// Toast DOM Elements
const toastElement = document.getElementById('now-playing-toast');
const toastTrackName = document.getElementById('toast-track-name');
const toastGameName = document.getElementById('toast-game-name');
const toastArtistName = document.getElementById('toast-artist-name');
const toastAlbumArt = document.getElementById('toast-album-art');
let toastTimeout = null;

// Sound Effects Players
const fxStart = new Audio('fx/start.mp3');
const fxReset = new Audio('fx/reset.mp3');
const fxSaveExit = new Audio('fx/save-n-exit.mp3');
const fxMenuPopup = new Audio('fx/settings-menu-popup.mp3');
const fxMenuNav = new Audio('fx/settings-menu-navigation.mp3');
const fxFocusFinish = new Audio('fx/focus-finish.mp3');
const fxExit = new Audio('fx/exit.mp3');

function playSound(audioObj, volume = 0.5) {
    if (audioObj) {
        audioObj.currentTime = 0;
        audioObj.volume = volume;
        audioObj.play().catch(err => console.log("Sound play error:", err));
    }
}

document.getElementById('minimize-btn').addEventListener('click', () => {
    playSound(fxMenuNav, 0.5);
    window.electronAPI.minimizeWindow();
});

document.getElementById('close-btn').addEventListener('click', () => {
    fxExit.currentTime = 0;
    fxExit.volume = 0.6;
    fxExit.play().catch(err => console.log("Sound play error:", err));

    const totalDuration = 1370;

    setTimeout(() => {
        const fadeDuration = totalDuration - 500;
        const stepTime = 30;
        const totalSteps = fadeDuration / stepTime;
        const initialVol = fxExit.volume;
        const volStep = initialVol / totalSteps;

        const fadeInterval = setInterval(() => {
            if (fxExit.volume > volStep) {
                fxExit.volume -= volStep;
            } else {
                fxExit.volume = 0;
            }
        }, stepTime);

        setTimeout(() => {
            clearInterval(fadeInterval);
        }, fadeDuration);

    }, 1000);

    setTimeout(() => {
        window.electronAPI.closeWindow();
    }, totalDuration);
});

let focusDuration = parseInt(localStorage.getItem('roost_focus')) || 25; 
let breakDuration = parseInt(localStorage.getItem('roost_break')) || 5;  
let timeLeft = focusDuration * 60; 
let timerId = null;
let isRunning = false;
let isBreakSession = false;

let fadeInInterval = null;
let fadeOutInterval = null;

focusInput.value = focusDuration;
breakInput.value = breakDuration;

const musicA = document.getElementById('bg-music-a');
const musicB = document.getElementById('bg-music-b');
let activeMusicPlayer = musicA;
let standbyMusicPlayer = musicB;

const rainA = document.getElementById('rain-audio-a');
const rainB = document.getElementById('rain-audio-b');
let activeRainPlayer = rainA;
let standbyRainPlayer = rainB;

const thunderA = document.getElementById('thunder-audio-a');
const thunderB = document.getElementById('thunder-audio-b');
let activeThunderPlayer = thunderA;
let standbyThunderPlayer = thunderB;

const albumFolders = {
    "ac-gc": "OSTs/Animal Crossing (GC, N64) (gamerip) (2001)",
    "ac-ww": "OSTs/Animal Crossing - Wild World (DS) (gamerip) (2005)",
    "ac-cf": "OSTs/Animal Crossing - City Folk (Wii) (gamerip) (2008)",
    "ac-nl": "OSTs/Animal Crossing - New Leaf (3DS) (gamerip) (2012)",
    "ac-nh": "OSTs/Animal Crossing New Horizons (2021)",
    "mc-alpha": "OSTs/Minecraft Volume Alpha (2015)",
    "mc-beta": "OSTs/Minecraft Volume Beta (2020)",
    "mario-galaxy": "OSTs/Super Mario Galaxy (Official Looped) (Switch, Wii) (gamerip) (2007)",
    "zelda-botw": "OSTs/THE LEGEND OF ZELDA BREATH OF THE WILD SOUND SELECTION (2017)"
};

// AUDIO CACHE TO PREVENT REPEATED DISK READS
const audioCache = {};

const gameNames = {
    "ac-gc": "Animal Crossing (GC)",
    "ac-ww": "Animal Crossing: Wild World",
    "ac-cf": "Animal Crossing: City Folk",
    "ac-nl": "Animal Crossing: New Leaf",
    "ac-nh": "Animal Crossing: New Horizons",
    "mc-alpha": "Minecraft (Volume Alpha)",
    "mc-beta": "Minecraft (Volume Beta)",
    "mario-galaxy": "Super Mario Galaxy",
    "zelda-botw": "Zelda: Breath of the Wild"
};

const albumArtMap = {
    "ac-gc": "album-covers/animal-crossing.jpg",
    "ac-ww": "album-covers/wild-world.png",
    "ac-cf": "album-covers/city-folk.png",
    "ac-nl": "album-covers/new-leaf.jpg",
    "ac-nh": "album-covers/new-horizons.jpg",
    "mc-alpha": "album-covers/alpha.jpg",
    "mc-beta": "album-covers/beta.jpg",
    "mario-galaxy": "album-covers/smg.jpg",
    "zelda-botw": "album-covers/botw.jpg"
};

let currentPlaylist = [];
let playlistIndex = 0;
let currentTrackPath = "";

let rainPlaylist = [
    "ambience/rain 1.mp3", 
    "ambience/rain 2.mp3", 
    "ambience/rain 3.mp3", 
    "ambience/rain 4.mp3"
];
let rainIndex = 0;

let thunderPlaylist = [
    "ambience/thunder-1.mp3", 
    "ambience/thunder-2.mp3", 
    "ambience/thunder-3.mp3", 
    "ambience/thunder-4.mp3"
];
let thunderIndex = 0;

function sanitizePath(filePath) {
    return filePath ? filePath.replace(/\\/g, '/') : "";
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = String(minutes).padStart(2, '0');
    secondsDisplay.textContent = String(seconds).padStart(2, '0');
}

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function parseTrackMetadata(filePath) {
    if (!filePath) return { track: "Unknown Track", artist: "Nintendo / Sound Team" };
    
    const decodedPath = decodeURIComponent(filePath);
    const sanitized = sanitizePath(decodedPath);
    const parts = sanitized.split('/');
    const fileNameWithExt = parts[parts.length - 1];
    const fileName = fileNameWithExt.substring(0, fileNameWithExt.lastIndexOf('.')) || fileNameWithExt;
    
    const cleanedName = fileName.replace(/^\d+[\s\-_\.]+/, '').trim();
    
    let artist = "Nintendo / Game Sound Team";
    if (sanitized.toLowerCase().includes('minecraft') || sanitized.toLowerCase().includes('alpha') || sanitized.toLowerCase().includes('beta')) {
        artist = "C418";
    }

    return {
        track: cleanedName || "Unknown Track",
        artist: artist
    };
}

function showNowPlayingToast(filePath) {
    if (!toastElement) return;

    const metadata = parseTrackMetadata(filePath);
    const decodedPath = decodeURIComponent(filePath || "");
    const sanitizedPath = sanitizePath(decodedPath).toLowerCase();

    let matchedKey = null;
    
    for (const key in albumFolders) {
        const folderTarget = albumFolders[key].toLowerCase();
        if (sanitizedPath.includes(folderTarget)) {
            matchedKey = key;
            break;
        }
    }

    if (!matchedKey && musicSelect.value && musicSelect.value !== "shuffle") {
        matchedKey = musicSelect.value;
    }

    toastTrackName.textContent = metadata.track;
    toastGameName.textContent = (matchedKey && gameNames[matchedKey]) ? gameNames[matchedKey] : "The Roost";
    toastArtistName.textContent = metadata.artist;

    if (matchedKey && albumArtMap[matchedKey]) {
        toastAlbumArt.style.display = 'block';
        toastAlbumArt.src = sanitizePath(albumArtMap[matchedKey]);
    } else {
        toastAlbumArt.style.display = 'block';
        toastAlbumArt.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%238c6239' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'%3E%3C/path%3E%3Ccircle cx='6' cy='18' r='3'%3E%3C/circle%3E%3Ccircle cx='18' cy='16' r='3'%3E%3C/circle%3E%3C/svg%3E";
    }

    toastElement.classList.remove('toast-hidden');
    toastElement.classList.add('toast-visible');

    if (toastTimeout) clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toastElement.classList.remove('toast-visible');
        toastElement.classList.add('toast-hidden');
    }, 10000);
}

toastAlbumArt.addEventListener('error', () => {
    console.log("Could not load album art image path.");
});

function crossfadeToTrack(newSrc) {
    if (!newSrc) return;
    currentTrackPath = newSrc;
    showNowPlayingToast(newSrc);

    const targetVol = musicSlider.value / 100;
    standbyMusicPlayer.src = sanitizePath(newSrc);
    standbyMusicPlayer.volume = 0;
    
    standbyMusicPlayer.play().catch(err => console.log("Music play error:", err));

    let fadeSteps = 30; // CHANGED FROM 50 TO 30 (~3.6 seconds)
    let stepTime = 120;
    let increment = targetVol / fadeSteps; 
    let currentStep = 0;
    
    // ... rest of the function remains the same

    let fadeInterval = setInterval(() => {
        currentStep++;
        
        if (activeMusicPlayer.volume >= increment) {
            activeMusicPlayer.volume -= increment;
        } else {
            activeMusicPlayer.volume = 0;
        }

        if (standbyMusicPlayer.volume < targetVol - increment) {
            standbyMusicPlayer.volume += increment;
        } else {
            standbyMusicPlayer.volume = targetVol;
        }

        if (currentStep >= fadeSteps) {
            clearInterval(fadeInterval);
            activeMusicPlayer.pause();
            activeMusicPlayer.currentTime = 0;

            let temp = activeMusicPlayer;
            activeMusicPlayer = standbyMusicPlayer;
            standbyMusicPlayer = temp;
        }
    }, stepTime);
}

function playNextWeatherTrack(type) {
    let playlist, activePlayer, standbyPlayer, sliderVal, normalizationFactor;

    if (type === 'rain') {
        playlist = rainPlaylist;
        activePlayer = activeRainPlayer;
        standbyPlayer = standbyRainPlayer;
        sliderVal = rainSlider.value / 100;
        normalizationFactor = 0.7; 
    } else {
        playlist = thunderPlaylist;
        activePlayer = activeThunderPlayer;
        standbyPlayer = standbyThunderPlayer;
        sliderVal = thunderSlider.value / 100;
        normalizationFactor = 0.8; 
    }

    if (sliderVal <= 0) return;

    if (type === 'rain') {
        rainIndex++;
        if (rainIndex >= rainPlaylist.length) {
            rainPlaylist = shuffleArray(rainPlaylist);
            rainIndex = 0;
        }
    } else {
        thunderIndex++;
        if (thunderIndex >= thunderPlaylist.length) {
            thunderPlaylist = shuffleArray(thunderPlaylist);
            thunderIndex = 0;
        }
    }

    const nextFile = (type === 'rain') ? rainPlaylist[rainIndex] : thunderPlaylist[thunderIndex];
    const targetNormalizedVol = sliderVal * normalizationFactor;
    
    standbyPlayer.src = sanitizePath(nextFile);
    standbyPlayer.volume = 0; 
    standbyPlayer.play().catch(err => console.log(err));

    let fadeSteps = 50; // CHANGED FROM 25 TO 50 (6 seconds)
    let stepTime = 120; 
    let increment = targetNormalizedVol / fadeSteps;
    let currentStep = 0;

    let weatherFadeInterval = setInterval(() => {
        currentStep++;
        
        if (activePlayer.volume >= increment) {
            activePlayer.volume -= increment;
        } else {
            activePlayer.volume = 0;
        }

        if (standbyPlayer.volume < targetNormalizedVol - increment) {
            standbyPlayer.volume += increment;
        } else {
            standbyPlayer.volume = targetNormalizedVol;
        }

        if (currentStep >= fadeSteps) {
            clearInterval(weatherFadeInterval);
            activePlayer.pause();
            activePlayer.currentTime = 0;

            if (type === 'rain') {
                let temp = activeRainPlayer;
                activeRainPlayer = standbyRainPlayer;
                standbyRainPlayer = temp;
            } else {
                let temp = activeThunderPlayer;
                activeThunderPlayer = standbyThunderPlayer;
                standbyThunderPlayer = temp;
            }
        }
    }, stepTime);
}

function startWeatherSystem() {
    const rainVal = rainSlider.value / 100;
    const thunderVal = thunderSlider.value / 100;

    if (rainVal > 0 && activeRainPlayer.paused) {
        activeRainPlayer.src = sanitizePath(rainPlaylist[rainIndex]);
        activeRainPlayer.volume = 0;
        activeRainPlayer.play().catch(err => console.log(err));
    }
    if (thunderVal > 0 && activeThunderPlayer.paused) {
        activeThunderPlayer.src = sanitizePath(thunderPlaylist[thunderIndex]);
        activeThunderPlayer.volume = 0;
        activeThunderPlayer.play().catch(err => console.log(err));
    }
}

function fadeInAudio() {
    if (fadeOutInterval) {
        clearInterval(fadeOutInterval);
        fadeOutInterval = null;
    }
    if (fadeInInterval) {
        clearInterval(fadeInInterval);
        fadeInInterval = null;
    }

    const musicTarget = musicSlider.value / 100;
    const rainTarget = (rainSlider.value / 100) * 0.7;    
    const thunderTarget = (thunderSlider.value / 100) * 0.8; 

    let fadeSteps = 15;
    let stepTime = 80;
    let currentStep = 0;

    if (activeMusicPlayer.src && musicTarget > 0) {
        activeMusicPlayer.volume = 0;
        activeMusicPlayer.play().catch(err => console.log(err));
        if (currentTrackPath) {
            showNowPlayingToast(currentTrackPath);
        }
    }
    startWeatherSystem();

    fadeInInterval = setInterval(() => {
        currentStep++;

        if (activeMusicPlayer.src && musicTarget > 0) {
            activeMusicPlayer.volume = Math.min(musicTarget, activeMusicPlayer.volume + (musicTarget / fadeSteps));
        }
        if (rainSlider.value > 0) {
            activeRainPlayer.volume = Math.min(rainTarget, activeRainPlayer.volume + (rainTarget / fadeSteps));
        }
        if (thunderSlider.value > 0) {
            activeThunderPlayer.volume = Math.min(thunderTarget, activeThunderPlayer.volume + (thunderTarget / fadeSteps));
        }

        if (currentStep >= fadeSteps) {
            clearInterval(fadeInInterval);
            fadeInInterval = null;
        }
    }, stepTime);
}

function fadeOutAndPause() {
    if (fadeInInterval) {
        clearInterval(fadeInInterval);
        fadeInInterval = null;
    }
    if (fadeOutInterval) {
        clearInterval(fadeOutInterval);
        fadeOutInterval = null;
    }

    let fadeSteps = 15;
    let stepTime = 80;
    let currentStep = 0;

    let musicInitialVol = activeMusicPlayer.volume;
    let rainInitialVol = activeRainPlayer.volume;
    let thunderInitialVol = activeThunderPlayer.volume;

    fadeOutInterval = setInterval(() => {
        currentStep++;

        if (activeMusicPlayer.volume > 0) {
            activeMusicPlayer.volume = Math.max(0, activeMusicPlayer.volume - (musicInitialVol / fadeSteps));
        }
        if (activeRainPlayer.volume > 0) {
            activeRainPlayer.volume = Math.max(0, activeRainPlayer.volume - (rainInitialVol / fadeSteps));
        }
        if (activeThunderPlayer.volume > 0) {
            activeThunderPlayer.volume = Math.max(0, activeThunderPlayer.volume - (thunderInitialVol / fadeSteps));
        }

        if (currentStep >= fadeSteps) {
            clearInterval(fadeOutInterval);
            fadeOutInterval = null;

            activeMusicPlayer.pause();
            standbyMusicPlayer.pause();
            activeRainPlayer.pause();
            standbyRainPlayer.pause();
            activeThunderPlayer.pause();
            standbyThunderPlayer.pause();
            
            activeRainPlayer.currentTime = 0;
            standbyRainPlayer.currentTime = 0;
            activeThunderPlayer.currentTime = 0;
            standbyThunderPlayer.currentTime = 0;
        }
    }, stepTime);
}

activeRainPlayer.addEventListener('ended', () => {
    if (isRunning && rainSlider.value > 0) playNextWeatherTrack('rain');
});
standbyRainPlayer.addEventListener('ended', () => {
    if (isRunning && rainSlider.value > 0) playNextWeatherTrack('rain');
});

activeThunderPlayer.addEventListener('ended', () => {
    if (isRunning && thunderSlider.value > 0) playNextWeatherTrack('thunder');
});
standbyThunderPlayer.addEventListener('ended', () => {
    if (isRunning && thunderSlider.value > 0) playNextWeatherTrack('thunder');
});

function startTimer() {
    if (isRunning) return;
    isRunning = true;

    playSound(fxStart, 0.6); 

    startPauseBtn.textContent = "Pause";
    startPauseBtn.style.boxShadow = "0 4px 0 #6ecb6e";

    fadeInAudio();

    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerId);
            isRunning = false;

            if (!isBreakSession) {
                playSound(fxFocusFinish, 0.7);
                isBreakSession = true;
                sessionHeading.textContent = "Take a break, Rishi! You've earned it.";
                sessionHeading.style.color = "#4a3b32";
                breakDuration = parseInt(breakInput.value) || 5;
                timeLeft = breakDuration * 60;
                updateDisplay();
                startTimer(); 
            } else {
                isBreakSession = false;
                sessionHeading.textContent = "Focusing";
                sessionHeading.style.color = "#4a3b32";
                focusDuration = parseInt(focusInput.value) || 25;
                timeLeft = focusDuration * 60;
                updateDisplay();
                startPauseBtn.textContent = "Start";
                startPauseBtn.style.boxShadow = "0 4px 0 #6ecb6e";
                pauseTimer();
            }
        }
    }, 1000);
}

function pauseTimer() {
    playSound(fxMenuNav, 0.5); 
    clearInterval(timerId);
    isRunning = false;
    startPauseBtn.textContent = "Start";
    startPauseBtn.style.boxShadow = "0 4px 0 #6ecb6e";

    fadeOutAndPause();
}

function resetTimer() {
    playSound(fxReset, 0.6); 
    pauseTimer();
    isBreakSession = false;
    sessionHeading.textContent = "Focusing";
    sessionHeading.style.color = "#4a3b32";
    focusDuration = parseInt(focusInput.value) || 25;
    timeLeft = focusDuration * 60;
    updateDisplay();
}

startPauseBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);

settingsBtn.addEventListener('click', (event) => {
    playSound(fxMenuPopup, 0.6); 
    event.stopPropagation();
    settingsMenu.classList.toggle('active');
});

saveExitBtn.addEventListener('click', () => {
    playSound(fxSaveExit, 0.6); 
    const newFocus = parseInt(focusInput.value);
    if (!isNaN(newFocus) && newFocus > 0) {
        focusDuration = newFocus;
        localStorage.setItem('roost_focus', focusDuration);
        if (!isRunning && !isBreakSession) {
            timeLeft = focusDuration * 60;
            updateDisplay();
        }
    }

    const newBreak = parseInt(breakInput.value);
    if (!isNaN(newBreak) && newBreak > 0) {
        breakDuration = newBreak;
        localStorage.setItem('roost_break', breakDuration);
    }

    settingsMenu.classList.remove('active');
});

document.addEventListener('click', (event) => {
    if (!settingsMenu.contains(event.target) && event.target !== settingsBtn) {
        settingsMenu.classList.remove('active');
    }
});

const dropdownHeaders = document.querySelectorAll('.settings-dropdown-header');
dropdownHeaders.forEach(header => {
    header.addEventListener('click', () => {
        playSound(fxMenuNav, 0.5); 
        header.classList.toggle('active');
        const targetId = header.getAttribute('data-target');
        const content = document.getElementById(targetId);
        content.classList.toggle('open');
    });
});

if (focusPlus && focusMinus && focusInput) {
    focusPlus.addEventListener('click', () => {
        let val = parseInt(focusInput.value || 0);
        if (val < 5) {
            focusInput.value = 5;
        } else {
            focusInput.value = Math.min(120, val + 5);
        }
    });
    focusMinus.addEventListener('click', () => {
        let val = parseInt(focusInput.value || 0);
        if (val <= 5) {
            focusInput.value = 1;
        } else {
            focusInput.value = Math.max(1, val - 5);
        }
    });
}

if (breakPlus && breakMinus && breakInput) {
    breakPlus.addEventListener('click', () => {
        let val = parseInt(breakInput.value || 0);
        if (val < 5) {
            breakInput.value = 5;
        } else {
            breakInput.value = Math.min(60, val + 5);
        }
    });
    breakMinus.addEventListener('click', () => {
        let val = parseInt(breakInput.value || 0);
        if (val <= 5) {
            breakInput.value = 1;
        } else {
            breakInput.value = Math.max(1, val - 5);
        }
    });
}

const clockElement = document.getElementById('real-world-clock');
const dateElement = document.getElementById('date-display');

function updateRealWorldClock() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const formattedHours = String(hours).padStart(2, '0');

    if (clockElement) {
        clockElement.textContent = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    }
}

updateRealWorldClock();
setInterval(updateRealWorldClock, 1000);

function playNextTrack() {
    if (!currentPlaylist || currentPlaylist.length === 0) return;
    
    if (playlistIndex >= currentPlaylist.length) {
        currentPlaylist = shuffleArray(currentPlaylist);
        playlistIndex = 0;
    }

    const nextTrackPath = currentPlaylist[playlistIndex];
    playlistIndex++;

    if (isRunning) {
        crossfadeToTrack(nextTrackPath);
    } else {
        currentTrackPath = nextTrackPath;
        activeMusicPlayer.src = sanitizePath(nextTrackPath);
    }
}

// OPTIMIZED CHANGE EVENT: Pulls from memory cache instead of hitting disk
musicSelect.addEventListener('change', (e) => {
    playSound(fxMenuNav, 0.5); 
    const selected = e.target.value;
    localStorage.setItem('roost_music_select', selected);
    
    if (!selected) {
        activeMusicPlayer.pause();
        currentPlaylist = [];
        playlistIndex = 0;
        currentTrackPath = "";
        return;
    }

    if (selected === "shuffle") {
        let allTracks = [];
        for (const key in audioCache) {
            allTracks = allTracks.concat(audioCache[key]);
        }
        currentPlaylist = shuffleArray(allTracks);
    } else {
        currentPlaylist = shuffleArray([...(audioCache[selected] || [])]);
    }
    playlistIndex = 0;
    playNextTrack();
});

activeMusicPlayer.addEventListener('ended', () => {
    playNextTrack();
});

standbyMusicPlayer.addEventListener('ended', () => {
    playNextTrack();
});

musicSlider.addEventListener('input', (e) => {
    const vol = e.target.value;
    localStorage.setItem('roost_vol_music', vol);
    const musicVol = vol / 100;
    activeMusicPlayer.volume = musicVol;
    standbyMusicPlayer.volume = musicVol;
});

rainSlider.addEventListener('input', (e) => {
    const vol = e.target.value;
    localStorage.setItem('roost_vol_rain', vol);
    const normalizedVal = (vol / 100) * 0.7; 
    activeRainPlayer.volume = normalizedVal;
    standbyRainPlayer.volume = normalizedVal;
    
    if (vol > 0 && isRunning && activeRainPlayer.paused) {
        activeRainPlayer.src = sanitizePath(rainPlaylist[rainIndex]);
        activeRainPlayer.play().catch(err => console.log(err));
    } else if (vol == 0) {
        activeRainPlayer.pause();
        standbyRainPlayer.pause();
    }
});

thunderSlider.addEventListener('input', (e) => {
    const vol = e.target.value;
    localStorage.setItem('roost_vol_thunder', vol);
    const normalizedVal = (vol / 100) * 0.8; 
    activeThunderPlayer.volume = normalizedVal;
    standbyThunderPlayer.volume = normalizedVal;

    if (vol > 0 && isRunning && activeThunderPlayer.paused) {
        activeThunderPlayer.src = sanitizePath(thunderPlaylist[thunderIndex]);
        activeThunderPlayer.play().catch(err => console.log(err));
    } else if (vol == 0) {
        activeThunderPlayer.pause();
        standbyThunderPlayer.pause();
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    rainPlaylist = shuffleArray(rainPlaylist);
    thunderPlaylist = shuffleArray(thunderPlaylist);

    if (localStorage.getItem('roost_vol_music') !== null) {
        musicSlider.value = localStorage.getItem('roost_vol_music');
    }
    if (localStorage.getItem('roost_vol_rain') !== null) {
        rainSlider.value = localStorage.getItem('roost_vol_rain');
    }
    if (localStorage.getItem('roost_vol_thunder') !== null) {
        thunderSlider.value = localStorage.getItem('roost_vol_thunder');
    }

    const savedMusicChoice = localStorage.getItem('roost_music_select');
    if (savedMusicChoice !== null) {
        musicSelect.value = savedMusicChoice;
    }

    // PRE-FETCH ALL AUDIO DIRECTORIES ONCE INTO CACHE
    if (window.api && window.api.getAudioFiles) {
        for (const key in albumFolders) {
            try {
                audioCache[key] = await window.api.getAudioFiles(albumFolders[key]);
            } catch (err) {
                console.log(`Failed to load folder ${key}:`, err);
                audioCache[key] = [];
            }
        }
    }

    const defaultVal = musicSelect.value; 
    if (defaultVal) {
        let allTracks = [];
        if (defaultVal === "shuffle") {
            for (const key in audioCache) {
                allTracks = allTracks.concat(audioCache[key]);
            }
        } else if (audioCache[defaultVal]) {
            allTracks = audioCache[defaultVal];
        }
        
        currentPlaylist = shuffleArray([...allTracks]);
        playlistIndex = 0;
        if (currentPlaylist.length > 0) {
            currentTrackPath = currentPlaylist[playlistIndex];
            activeMusicPlayer.src = sanitizePath(currentTrackPath);
            playlistIndex++;
        }
    }
    
    updateDisplay();
});