var path = window.location.pathname;
var segments = path.split('/').filter(Boolean);
var idClient = segments.length >= 2 ? segments[segments.length - 2] : '';
var namaClient = idClient.split('-').map(function(word) { return word.charAt(0).toUpperCase() + word.slice(1); }).join(' & ');
$("#nama-client").text(namaClient);

// Ambil URL API dari GitHub
let apiUrl = "";
function loadConfigUndangan(callback) {
    fetch("https://raw.githubusercontent.com/krafta-visio/app_assets/main/config-undangan-web.json")
        .then(response => response.json())
        .then(config => {
            apiUrl = config.apiUrl;
            console.log("API URL Loaded:", apiUrl);
            if (callback) callback();
        })
        .catch(error => console.error("Error fetching config:", error));
}

// Ambil Data Ucapan 
function getDataUcapan() {
    if (!apiUrl) {
        console.error("API URL belum tersedia!");
        return;
    }
    $.ajax({
        url: `${apiUrl}?action=readUcapan&idclient=${idClient}`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            let divUcapan = $("#div-ucapan");
            divUcapan.empty();

            if (data.length === 0) {
                divUcapan.append(
                    `<p class="text-center text-stone-500 font-sans text-sm my-8">Belum ada ucapan untuk ditampilkan</p>`
                );
            } else {
                data.forEach(row => {
                    divUcapan.append(
                        `
                        <div class="bg-stone-50 rounded-xl p-5 border border-stone-100 relative shadow-sm hover:shadow-md transition-shadow">
                            <span class="absolute top-4 right-5 text-xs text-stone-400 font-medium">${row[4]}</span>
                            <div class="mt-2 mb-4">
                                <p class="font-serif text-stone-700 italic text-lg leading-relaxed">"${row[3]}"</p>
                            </div>
                            <div class="flex items-center gap-3 border-t border-stone-200 pt-3">
                                <div class="w-8 h-8 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center font-bold font-sans text-sm">
                                    ${row[2].charAt(0).toUpperCase()}
                                </div>
                                <span class="font-sans font-semibold text-stone-800 text-sm">${row[2]}</span>
                            </div>
                        </div>
                        `
                    );
                });
            }
        },
        error: function (error) {
            console.error("Error fetching data", error);
        }
    });
}

// Ambil Data Ucapan
function getDataRSVP() {
    if (!apiUrl) {
        console.error("API URL belum tersedia!");
        return;
    }
    $.ajax({
        url: `${apiUrl}?action=readRSVP&idclient=${idClient}`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            let divRsvp = $("#div-rsvp");
            divRsvp.empty();

            if (data.length === 0) {
                divRsvp.append(
                    `<tr>
                        <td colspan="4" class="text-center py-8 text-stone-500 font-sans text-sm">Belum ada data untuk ditampilkan</td>
                    </tr>`
                );
            } else {
                data.forEach((row, index) => {
                    let badgeClass = 'bg-stone-200 text-stone-700';
                    let status = row[3] ? row[3].toLowerCase() : '';
                    if (status === 'hadir' || status.includes('iya') || status.includes('ya')) {
                        badgeClass = 'bg-green-100 text-green-700';
                    } else if (status === 'tidak hadir' || status.includes('tidak')) {
                        badgeClass = 'bg-red-100 text-red-700';
                    }
                    divRsvp.append(
                        `<tr class="hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0">
                            <td class="px-5 py-4 font-medium text-stone-500">${index + 1}</td>
                            <td class="px-5 py-4 font-semibold text-stone-800">${row[2]}</td>
                            <td class="px-5 py-4">
                                <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${badgeClass}">
                                    ${row[3]}
                                </span>
                            </td>
                            <td class="px-5 py-4 text-center font-medium">${row[4]}</td>
                        </tr>`
                    );
                });
            }
        },
        error: function (error) {
            console.error("Error fetching data", error);
        }
    });
}


function copyTableToClipboard() {
    const table = document.querySelector("#rsvp-table");
    if (!table) return;

    const range = document.createRange();
    range.selectNode(table);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        const successful = document.execCommand("copy");
        if (successful) {
            alert("Tabel berhasil disalin ke clipboard!");
        } else {
            alert("Gagal menyalin tabel.");
        }
    } catch (err) {
        alert("Terjadi kesalahan saat menyalin.");
        console.error(err);
    }

    selection.removeAllRanges();
}


// Jalankan Saat Dokumen Siap
$(document).ready(function () {
    loadConfigUndangan(() => {
        getDataUcapan();
        getDataRSVP();
    });
});