/* =========================================
   1. MUSIC SYSTEM
========================================= */
function initMusic() {
    const musicBtn = document.getElementById("musicBtn");
    if (!musicBtn) return; // Stop if the button doesn't exist on the page

    const playlist = ["music.mp3", "music2.mp3"];
    let currentTrackIndex = 0;
    const audio = new Audio(playlist[0]);
    audio.volume = 0.2; // Decreased from 0.5 to let ambiance shine through

    // Ambient sound player
    window.ambientAudio = new Audio();
    window.ambientAudio.loop = true;
    window.ambientAudio.volume = 0.4; // Increased from 0.15 to blend better with the music

    let isPlaying = false;

    function updateMusicUI() {
        if (isPlaying) {
            musicBtn.innerHTML = "❚❚ Pause Music";
            musicBtn.style.background = "#5e008a";
        } else {
            musicBtn.innerHTML = "► Play Music";
            musicBtn.style.background = "linear-gradient(to right, #380052, #1f003b)";
        }
    }

    // Auto-advance to next track
    audio.addEventListener('ended', () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        audio.src = playlist[currentTrackIndex];
        audio.play().then(() => {
            isPlaying = true;
            updateMusicUI();
        }).catch(e => console.log("Auto-advance blocked:", e));
    });

    musicBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            if (window.ambientAudio.src) window.ambientAudio.pause();
            isPlaying = false;
        } else {
            audio.play().then(() => {
                if (window.ambientAudio.src) window.ambientAudio.play().catch(() => { });
                isPlaying = true;
            }).catch(() => {
                isPlaying = false;
            });
        }
        updateMusicUI();
    });

    // Globally track state for weather sequence delay
    audio.addEventListener('play', () => window.isMusicPlaying = true);
    audio.addEventListener('pause', () => window.isMusicPlaying = false);

    // Attempt Autoplay on first user interaction anywhere
    const tryAutoplay = () => {
        audio.play().then(() => {
            if (window.ambientAudio.src) window.ambientAudio.play().catch(() => { });
            isPlaying = true;
            updateMusicUI();
            document.removeEventListener('click', tryAutoplay);
        }).catch(() => { });
    };
    document.addEventListener('click', tryAutoplay);
}

/* =========================================
   2. GALLERY & MODAL SYSTEM
========================================= */
function initGallery() {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    const modalGlow = document.getElementById("modalGlow");
    const modalDescription = document.getElementById("modalDescription");
    const closeBtn = document.querySelector(".close");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    const galleryImagesArray = Array.from(document.querySelectorAll(".gallery img"));

    // Stop if gallery or modal elements are missing
    if (!modal || galleryImagesArray.length === 0) return;

    let currentIndex = 0;

    function closeModal() {
        modal.style.display = "none";
    }

    function openModal() {
        modal.style.display = "flex";
        updateModalImage();
    }

    function updateModalImage() {
        if (currentIndex >= galleryImagesArray.length) currentIndex = 0;
        if (currentIndex < 0) currentIndex = galleryImagesArray.length - 1;

        const img = galleryImagesArray[currentIndex];
        if (modalImage && modalDescription) {
            modalImage.src = img.src;
            if (modalGlow) modalGlow.src = img.src;
            modalDescription.innerHTML = img.title || "Image";

            // Reset animation
            modalImage.style.animation = "none";
            modalImage.offsetHeight; /* trigger reflow */
            modalImage.style.animation = "zoomIn 0.3s ease";
        }
    }

    // Event Listeners (using Optional Chaining '?' just in case buttons are missing)
    closeBtn?.addEventListener('click', closeModal);
    prevBtn?.addEventListener('click', () => { currentIndex--; updateModalImage(); });
    nextBtn?.addEventListener('click', () => { currentIndex++; updateModalImage(); });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    galleryImagesArray.forEach((img, index) => {
        img.addEventListener('click', () => {
            currentIndex = index;
            openModal();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (modal.style.display === "flex") {
            if (e.key === "ArrowLeft") { currentIndex--; updateModalImage(); }
            if (e.key === "ArrowRight") { currentIndex++; updateModalImage(); }
            if (e.key === "Escape") closeModal();
        }
    });

    // --- Magnifying Glass Setup ---
    const modalWrapper = document.querySelector(".modal-wrapper");
    const magnifier = document.createElement("div");
    magnifier.className = "magnifier";
    modalWrapper.appendChild(magnifier);

    let isZooming = false;
    const zoomLevel = 2.5; // Adjust this number to make the zoom stronger or weaker

    // 1. Start Zoom (Mouse Down & Touch Start)
    const startZoom = (e) => {
        e.preventDefault(); // Prevents "dragging" the image or default mobile actions
        if (e.type === 'mousedown' && e.button !== 0) return; // Only left-click

        isZooming = true;
        magnifier.style.display = "block";
        magnifier.style.backgroundImage = `url('${modalImage.src}')`;

        const isTouch = e.type.includes('touch');
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;
        updateMagnifier(clientX, clientY, isTouch);
    };

    modalImage.addEventListener("mousedown", startZoom);
    modalImage.addEventListener("touchstart", startZoom, { passive: false });

    // 2. Move Zoom (Mouse Move & Touch Move)
    const moveZoom = (e) => {
        if (!isZooming) return;
        e.preventDefault(); // Prevents scrolling while zooming

        const isTouch = e.type.includes('touch');
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;
        updateMagnifier(clientX, clientY, isTouch);
    };

    modalImage.addEventListener("mousemove", moveZoom);
    modalImage.addEventListener("touchmove", moveZoom, { passive: false });

    // 3. End Zoom (Mouse Up, Touch End, Touch Cancel)
    const endZoom = () => {
        isZooming = false;
        magnifier.style.display = "none";
    };

    window.addEventListener("mouseup", endZoom);
    window.addEventListener("touchend", endZoom);
    window.addEventListener("touchcancel", endZoom);

    // 4. Mouse Leave (Dragging off the image)
    modalImage.addEventListener("mouseleave", endZoom);

    function updateMagnifier(clientX, clientY, isTouch) {
        // Get the exact rendered size and position of the image on the screen
        const rect = modalImage.getBoundingClientRect();

        // Calculate cursor coordinates relative to the top-left of the image
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Scale the background image up based on the zoom level
        const bgWidth = rect.width * zoomLevel;
        const bgHeight = rect.height * zoomLevel;
        magnifier.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;

        // Calculate the center point of the magnifier circle
        const magHalfWidth = magnifier.offsetWidth / 2;
        const magHalfHeight = magnifier.offsetHeight / 2;

        // Shift the background position so the exact point clicked is in the dead-center of the circle
        const bgPosX = magHalfWidth - (x * zoomLevel);
        const bgPosY = magHalfHeight - (y * zoomLevel);
        magnifier.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;

        // Move the physical magnifier glass element out from under the thumb on mobile
        const touchOffsetY = isTouch ? 120 : 0; // Shift it up by 120px for touch

        magnifier.style.left = `${x - magHalfWidth}px`;
        magnifier.style.top = `${y - magHalfHeight - touchOffsetY}px`;
    }
    // --- End Magnifying Glass Setup ---

    document.addEventListener("contextmenu", (e) => e.preventDefault());
}

/* =========================================
   3. WEATHER SYSTEM
========================================= */
function initWeather() {
    const weatherCodes = {
        0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Fog", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
        61: "Rain", 63: "Rain", 65: "Rain", 80: "Rain Showers", 81: "Rain Showers", 82: "Rain Showers",
        71: "Snow", 73: "Snow", 75: "Snow", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm"
    };

    const weatherIcons = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
        45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 55: "🌦️",
        61: "🌧️", 63: "🌧️", 65: "🌧️", 80: "🌧️", 81: "🌧️", 82: "🌧️",
        71: "🌨️", 73: "🌨️", 75: "🌨️", 95: "⚡", 96: "⚡", 99: "⚡"
    };

    async function fetchWeather(lat, lon, suffix) {
        // Updated to Open-Meteo's modern 'current' parameter syntax
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("API Network Error");
            const data = await response.json();

            if (data.current) {
                const temp = Math.round(data.current.temperature_2m);
                const code = data.current.weather_code;
                const isDay = data.current.is_day; // 1 if it is currently day, 0 if night

                // Assign ambient audio track based on weather code
                let ambientSrc = "";
                if ([0, 1].includes(code)) {
                    ambientSrc = isDay ? "cleardaybirds.wav" : "clearcrickets.wav";
                }
                else if ([2, 3, 45, 48, 71, 73, 75].includes(code)) ambientSrc = "wind.wav";
                else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) ambientSrc = "rain.wav";
                else if ([95, 96, 99].includes(code)) ambientSrc = "rainandthunder.wav";

                if (ambientSrc && window.ambientAudio) {
                    window.ambientAudio.src = ambientSrc;
                    // If weather loads after music starts, play it immediately
                    if (window.isMusicPlaying) window.ambientAudio.play().catch(() => { });
                }

                const tempEl = document.getElementById(`temp-${suffix}`);
                const descEl = document.getElementById(`desc-${suffix}`);
                const iconEl = document.getElementById(`icon-${suffix}`);

                if (tempEl) tempEl.textContent = `${temp}°F`;
                if (descEl) descEl.textContent = weatherCodes[code] || "Unknown";
                if (iconEl) iconEl.textContent = weatherIcons[code] || "🌡️";
            }
        } catch (e) {
            console.error(`Weather failed for ${suffix}:`, e);
            const descEl = document.getElementById(`desc-${suffix}`);
            if (descEl) descEl.textContent = "Error loading";
        }
    }

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    // Try to get the city name from the coordinates
                    const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
                    const geoRes = await fetch(geoUrl);
                    if (geoRes.ok) {
                        const geoData = await geoRes.json();
                        const cityName = geoData.city || geoData.locality || "Your Location";
                        const nameEl = document.getElementById('name-local');
                        if (nameEl) nameEl.textContent = cityName;
                    }
                } catch (e) {
                    console.log("Reverse geocode failed:", e);
                }

                // Fetch weather for the user's location
                fetchWeather(lat, lon, "local");
            },
            (error) => {
                console.warn("Geolocation Error:", error.message);
                const descEl = document.getElementById('desc-local');
                if (descEl) descEl.textContent = "Location access denied";
            }
        );
    } else {
        const descEl = document.getElementById('desc-local');
        if (descEl) descEl.textContent = "Geolocation not supported";
    }
}

/* =========================================
   4. INITIALIZE EVERYTHING ON LOAD
========================================= */
document.addEventListener('DOMContentLoaded', () => {
    initMusic();
    initGallery();
    initWeather();
});