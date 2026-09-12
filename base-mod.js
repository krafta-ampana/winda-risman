// Konfigurasi Tanggal Countdown Baru
// Format: YYYY-MM-DDTHH:MM (Contoh: 2026-12-31T09:00)
const TARGET_COUNTDOWN_DATE = "2026-09-17T17:30";

// Konfigurasi Nomor WhatsApp Baru
// Contoh: "628123456789"
const TARGET_WA_NUMBER = "6282231461361";

// Pemetaan data grup & whatsapp ke parameter d4 pada RSVP Google Sheet
// Pilihan: "whatsapp", "grup", "gabungan", atau "1"
const RSVP_D4_MAPPING = "gabungan";

// Konfigurasi ID Client/Undangan untuk Google Sheets
// Contoh: "fulan-fulannah" (Samakan dengan ID client di database/sheet Anda)
const TARGET_CLIENT_ID = "winda-risman";


//Script modifier untuk mengubah nama tamu dari URL
(function() {
    // Tunggu sampai DOM benar-benar siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModifier);
    } else {
        initModifier();
    }

    function initModifier() {
        console.log('🔄 Base Modifier dijalankan...');

        // 0. Manipulasi Countdown jika variabel tanggal baru didefinisikan
        if (typeof TARGET_COUNTDOWN_DATE !== 'undefined' && TARGET_COUNTDOWN_DATE) {
            const countdownWrapper = document.querySelector('.countdown-wrapper');
            if (countdownWrapper) {
                console.log('⏳ Mengganti tanggal countdown lama dengan:', TARGET_COUNTDOWN_DATE);
                
                // Clone wrapper untuk memutuskan hubungan dari interval bawaan themesv2.js yang sedang berjalan
                const clonedWrapper = countdownWrapper.cloneNode(true);
                clonedWrapper.setAttribute('data-datetime', TARGET_COUNTDOWN_DATE);
                countdownWrapper.parentNode.replaceChild(clonedWrapper, countdownWrapper);
                
                // Ambil elemen angka countdown dari klon
                const countDownDate = new Date(TARGET_COUNTDOWN_DATE).getTime();
                const daysEl = clonedWrapper.querySelector('.countdown > .day > .number');
                const hoursEl = clonedWrapper.querySelector('.countdown > .hour > .number');
                const minutesEl = clonedWrapper.querySelector('.countdown > .minute > .number');
                const secondsEl = clonedWrapper.querySelector('.countdown > .second > .number');
                
                if (daysEl && hoursEl && minutesEl && secondsEl) {
                    const x = setInterval(function() {
                        const now = new Date().getTime();
                        const distance = countDownDate - now;
                        
                        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                        
                        daysEl.innerHTML = days;
                        hoursEl.innerHTML = hours;
                        minutesEl.innerHTML = minutes;
                        secondsEl.innerHTML = seconds;
                        
                        if (distance < 0) {
                            clearInterval(x);
                            daysEl.innerHTML = '00';
                            hoursEl.innerHTML = '00';
                            minutesEl.innerHTML = '00';
                            secondsEl.innerHTML = '00';
                        }
                    }, 1000);
                    console.log('✅ Countdown baru berhasil diinisialisasi.');
                } else {
                    console.warn('⚠️ Struktur elemen countdown di dalam wrapper tidak cocok!');
                }
            } else {
                console.warn('⚠️ Elemen .countdown-wrapper tidak ditemukan!');
            }
        }

        // 0.2. Manipulasi Link WhatsApp jika nomor baru didefinisikan
        if (typeof TARGET_WA_NUMBER !== 'undefined' && TARGET_WA_NUMBER) {
            const waLink = document.querySelector('a[href*="masukkannomorwaanda"]');
            if (waLink) {
                console.log('📱 Mengganti nomor WhatsApp dengan:', TARGET_WA_NUMBER);
                waLink.setAttribute('href', `https://wa.me/${TARGET_WA_NUMBER}`);
                console.log('✅ Link WhatsApp berhasil diupdate.');
            } else {
                console.warn('⚠️ Elemen Link WhatsApp masukkannomorwaanda tidak ditemukan!');
            }
        }

        // --- MANIPULASI RSVP & UCAPAN ---
        let apiUrl = "";
        
        function getClientId() {
            // Prioritaskan variabel TARGET_CLIENT_ID jika diisi
            if (typeof TARGET_CLIENT_ID !== 'undefined' && TARGET_CLIENT_ID) {
                return TARGET_CLIENT_ID;
            }
            const path = window.location.pathname;
            const segments = path.split('/').filter(Boolean);
            for (let i = segments.length - 1; i >= 0; i--) {
                const seg = segments[i].toLowerCase();
                if (seg !== 'index.html' && seg !== 'rsvp' && seg !== 'index.php') {
                    return segments[i];
                }
            }
            return 'adat-bone';
        }
        const idClient = getClientId();

        function loadConfigUndangan(callback) {
            fetch("https://raw.githubusercontent.com/krafta-visio/app_assets/main/config-undangan-web.json")
                .then(response => response.json())
                .then(config => {
                    apiUrl = config.apiUrl;
                    console.log("⚡ API URL Loaded:", apiUrl);
                    if (callback) callback();
                })
                .catch(error => console.error("❌ Error fetching config:", error));
        }

        function getDataUcapanAndRSVP() {
            if (!apiUrl) {
                console.error("❌ API URL belum tersedia!");
                return;
            }

            Promise.all([
                fetch(`${apiUrl}?action=readRSVP&idclient=${idClient}`).then(r => r.json()).catch(() => []),
                fetch(`${apiUrl}?action=readUcapan&idclient=${idClient}`).then(r => r.json()).catch(() => [])
            ]).then(([rsvpData, ucapanData]) => {
                console.log("💬 Data RSVP & Ucapan terunduh:", { rsvpCount: rsvpData.length, ucapanCount: ucapanData.length });
                
                const attendanceMap = {};
                rsvpData.forEach(row => {
                    if (row && row[2]) {
                        const name = row[2].trim().toLowerCase();
                        const attendance = row[3] || 'Hadir';
                        attendanceMap[name] = attendance;
                    }
                });

                const commentContainer = document.querySelector('.rsvp-form .comment');
                if (commentContainer) {
                    commentContainer.innerHTML = '';
                    commentContainer.style.maxHeight = '300px';
                    commentContainer.style.overflowY = 'auto';
                    commentContainer.style.paddingRight = '5px';

                    if (ucapanData.length === 0) {
                        commentContainer.innerHTML = `<p class="text-center text-muted small my-4">Belum ada ucapan. Jadilah yang pertama!</p>`;
                    } else {
                        ucapanData.slice().reverse().forEach(row => {
                            const name = row[2] || 'Tamu';
                            const wish = row[3] || '';
                            const rawDate = row[4] || '';
                            
                            const lowerName = name.trim().toLowerCase();
                            const attendanceStatus = attendanceMap[lowerName] || 'Hadir';
                            
                            const commentItem = document.createElement('div');
                            commentItem.className = 'comment-item mb-3 pb-2 border-bottom';
                            commentItem.style.borderBottomStyle = 'dotted';
                            
                            const avatarName = encodeURIComponent(name);
                            let badgeClass = 'badge badge-info alert-info';
                            if (attendanceStatus.toLowerCase().includes('tidak')) {
                                badgeClass = 'badge badge-secondary alert-secondary';
                            }
                            
                            commentItem.innerHTML = `
                                <div class="d-flex">
                                    <img src="https://ui-avatars.com/api/?size=40&amp;background=random&amp;color=random&amp;name=${avatarName}" alt="${name}" loading="lazy" class="avatar rounded-circle" style="height: 30px; width: 30px;">
                                    <div class="ml-2 text-left" style="flex: 1;">
                                        <p class="mb-0 font-weight-bold" style="font-size: 14px;">
                                            ${name}
                                            <span class="${badgeClass}" style="font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">${attendanceStatus}</span>
                                        </p>
                                        <p class="mb-0 text-dark small" style="line-height: 1.4; margin-top: 2px;">${wish}</p>
                                        <small class="text-muted" style="font-size: 10px;">${rawDate}</small>
                                    </div>
                                </div>
                            `;
                            commentContainer.appendChild(commentItem);
                        });
                    }
                }
            }).catch(err => {
                console.error("❌ Gagal merender ucapan:", err);
            });
        }

        function initRSVPForm() {
            const rsvpForm = document.querySelector('.rsvp-form form');
            if (!rsvpForm) {
                console.warn("⚠️ Elemen form RSVP tidak ditemukan!");
                return;
            }

            rsvpForm.addEventListener('submit', function(e) {
                e.preventDefault();

                if (!apiUrl) {
                    alert("API URL belum siap. Silakan coba sesaat lagi.");
                    return;
                }

                const submitBtn = rsvpForm.querySelector('button[type="submit"]');
                const submitBtnText = submitBtn ? submitBtn.querySelector('span') : null;
                const originalText = submitBtnText ? submitBtnText.innerHTML : "Kirim";

                if (submitBtn) submitBtn.disabled = true;
                if (submitBtnText) submitBtnText.innerHTML = "Mengirim...";

                const inputName = document.getElementById('inputname').value.trim();
                const inputGroup = document.getElementById('inputgroup_name').value.trim();
                const inputPhoneRaw = document.getElementById('inputphone').value.trim();
                const inputAttendance = document.getElementById('inputattendance').value;
                const inputComment = document.getElementById('inputcomment').value.trim();

                let formattedPhone = inputPhoneRaw.replace(/[-\s]/g, "");
                if (formattedPhone.startsWith('0')) {
                    formattedPhone = '62' + formattedPhone.substring(1);
                } else if (formattedPhone.startsWith('+62')) {
                    formattedPhone = formattedPhone.substring(1);
                } else if (!formattedPhone.startsWith('62') && formattedPhone) {
                    formattedPhone = '62' + formattedPhone;
                }

                let d4Value = "1";
                if (typeof RSVP_D4_MAPPING !== 'undefined') {
                    if (RSVP_D4_MAPPING === "whatsapp") {
                        d4Value = formattedPhone;
                    } else if (RSVP_D4_MAPPING === "grup") {
                        d4Value = inputGroup || "-";
                    } else if (RSVP_D4_MAPPING === "gabungan") {
                        d4Value = `Grup: ${inputGroup || '-'}, WA: ${formattedPhone || '-'}`;
                    }
                }

                const formattedDate = new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }) + ' pukul ' + new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const sendRSVP = fetch(`${apiUrl}?action=createRSVP&d1=${encodeURIComponent(idClient)}&d2=${encodeURIComponent(inputName)}&d3=${encodeURIComponent(inputAttendance)}&d4=${encodeURIComponent(d4Value)}&d5=${encodeURIComponent(formattedDate)}`).then(r => r.text());
                const sendUcapan = fetch(`${apiUrl}?action=createUcapan&d1=${encodeURIComponent(idClient)}&d2=${encodeURIComponent(inputName)}&d3=${encodeURIComponent(inputComment)}&d4=${encodeURIComponent(formattedDate)}`).then(r => r.text());

                Promise.all([sendRSVP, sendUcapan])
                    .then(() => {
                        alert("Terima kasih! RSVP dan Ucapan Anda berhasil dikirim.");
                        rsvpForm.reset();
                        getDataUcapanAndRSVP();

                        const modalEl = document.getElementById('rsvpModal');
                        if (modalEl && typeof jQuery !== 'undefined') {
                            jQuery(modalEl).modal('hide');
                        } else if (typeof closeModal === 'function' && modalEl) {
                            closeModal(modalEl);
                        }
                    })
                    .catch(err => {
                        console.error("❌ Gagal mengirim data:", err);
                        alert("Terjadi kesalahan saat mengirim data. Silakan coba lagi.");
                    })
                    .finally(() => {
                        if (submitBtn) submitBtn.disabled = false;
                        if (submitBtnText) submitBtnText.innerHTML = originalText;
                    });
            });
        }

        // Jalankan pengambilan config undangan dan inisialisasi
        loadConfigUndangan(() => {
            getDataUcapanAndRSVP();
            initRSVPForm();
        });

        // 1. Ambil parameter dari URL
        function getParameterByName(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        }

        const namaDariUrl = getParameterByName('tamu');
        console.log('📝 Nama dari URL:', namaDariUrl);

        // 2. Jika ada parameter 'tamu' di URL
        if (namaDariUrl) {
            // Bersihkan string
            let namaBersih = decodeURIComponent(namaDariUrl)
                .replace(/-/g, " ")
                .replace(/\|/g, " / ")
                .replace(/ dan /gi, " & ");
            
            console.log('✨ Nama setelah dibersihkan:', namaBersih);
            
            // 3. Cari elemen #guestNameSlot
            const guestNameSlot = document.getElementById('guestNameSlot');
            
            if (guestNameSlot) {
                // 4. CARI SPAN di dalamnya
                const spanNama = guestNameSlot.querySelector('.nama_tamu_undangan');
                
                if (spanNama) {
                    // Jika ada span, isi span tersebut
                    spanNama.textContent = namaBersih;
                    console.log('✅ Span diisi dengan:', namaBersih);
                } else {
                    // Jika tidak ada span, cari teks node atau ganti isi
                    // Tapi hati-hati, ini bisa menghapus konten lain
                    const existingText = guestNameSlot.textContent.trim();
                    if (existingText && !guestNameSlot.querySelector('*')) {
                        // Jika hanya ada teks biasa
                        guestNameSlot.textContent = namaBersih;
                    } else {
                        // Jika ada elemen lain, buat span baru
                        const newSpan = document.createElement('span');
                        newSpan.className = 'nama_tamu_undangan';
                        newSpan.textContent = namaBersih;
                        guestNameSlot.appendChild(newSpan);
                    }
                    console.log('✅ Konten diganti dengan:', namaBersih);
                }
            } else {
                console.warn('⚠️ Elemen #guestNameSlot tidak ditemukan!');
            }
        } else {
            console.log('ℹ️ Tidak ada parameter "tamu" di URL, script tidak melakukan apa-apa');
        }
    }
})();





