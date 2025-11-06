// PASTIKAN FILE INI DIMAUI SETELAH js/firebase-config.js DENGAN KUNCI YANG VALID

// Mengambil elemen formulir lengkap
const formInputNilaiLengkap = document.getElementById('formInputNilaiLengkap');
const notifElementLengkap = document.getElementById('pesanNotifikasiLengkap');

// Mengambil elemen formulir cepat
const formInputCepatNilai = document.getElementById('formInputCepatNilai');
const notifCepatElement = document.getElementById('notifikasiCepat');

/**
 * Fungsi pembantu untuk menampilkan pesan notifikasi di halaman Input Lengkap.
 */
function tampilkanNotifikasi(pesan, tipe, element, hapusSaja = false) {
    if (!element) return;

    element.className = '';
    element.innerHTML = '';

    if (hapusSaja) return;

    element.classList.add('alert', tipe);
    element.setAttribute('role', 'alert');
    element.innerHTML = pesan;
}

/**
 * Fungsi untuk melakukan validasi input data mahasiswa (Form Lengkap).
 * @returns {Object|null} Objek data input jika valid.
 * Mengikuti Activity Diagram: validasiData.
 */
function validasiInputLengkap() {
    const nama = document.getElementById('inputNamaLengkap').value.trim();
    const nim = document.getElementById('inputNIMLengkap').value.trim();
    const mataKuliah = document.getElementById('inputMataKuliahLengkap').value;
    const nilaiStr = document.getElementById('inputNilaiLengkap').value.trim();
    const nilai = parseFloat(nilaiStr);

    tampilkanNotifikasi('', 'alert-danger', notifElementLengkap, true); 

    if (!nama || !nim || !mataKuliah || !nilaiStr) {
        tampilkanNotifikasi('Semua field wajib diisi!', 'alert-danger', notifElementLengkap);
        return null;
    }

    if (!/^\d{7,}$/.test(nim)) {
        tampilkanNotifikasi('Format NIM tidak valid. Harus berupa angka.', 'alert-danger', notifElementLengkap);
        return null;
    }

    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
        tampilkanNotifikasi('Nilai harus berupa angka antara 0 hingga 100!', 'alert-danger', notifElementLengkap);
        return null;
    }

    // Mengembalikan objek data siap simpan
    return {
        namaMahasiswa: nama, 
        nimMahasiswa: nim,
        mataKuliah: mataKuliah,
        nilaiAngka: nilai,
        timestamp: new Date()
    };
}


/**
 * Fungsi untuk melakukan validasi input data mahasiswa (Form Cepat).
 * @returns {Object|null} Objek data input jika valid.
 */
function validasiInputCepat() {
    const nim = document.getElementById('inputCepatNIM').value.trim();
    const mk = document.getElementById('inputCepatMK').value;
    const nilaiStr = document.getElementById('inputCepatNilai').value.trim();
    const nilai = parseFloat(nilaiStr);

    tampilkanNotifikasi('', 'alert-danger', notifCepatElement, true); 

    if (!mk || !nim || !nilaiStr) {
        tampilkanNotifikasi('Semua field Input Cepat wajib diisi!', 'alert-danger', notifCepatElement);
        return null;
    }

    if (!/^\d{7,}$/.test(nim)) {
        tampilkanNotifikasi('Format NIM tidak valid.', 'alert-danger', notifCepatElement);
        return null;
    }

    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
        tampilkanNotifikasi('Nilai harus berupa angka antara 0 hingga 100!', 'alert-danger', notifCepatElement);
        return null;
    }

    // Mengembalikan objek data siap simpan
    return {
        // Anggap nama mahasiswa akan diisi dummy atau diabaikan di form cepat
        namaMahasiswa: "Mahasiswa X (Cepat)", 
        nimMahasiswa: nim, 
        mataKuliah: mk,
        nilaiAngka: nilai,
        timestamp: new Date()
    };
}


/**
 * Menyimpan data nilai mahasiswa ke Firebase Firestore (fungsi re-usable).
 * @param {Object} dataObj - Objek data yang sudah divalidasi.
 * Mengikuti Class Diagram: operasi inputNilai() pada class Nilai.
 */
async function simpanDataNilai(dataObj, formElement, notifElement) {
    try {
        await dataService.simpanData(dataObj);
        
        tampilkanNotifikasi('✅ Data nilai berhasil disimpan!', 'alert-success', notifElement);

        if (formElement) formElement.reset(); // Kosongkan form

        // Jika simpan dari dashboard, muat ulang tabel dashboard
        if (formElement === formInputCepatNilai) {
             loadDataNilaiDashboard();
        }

    } catch (error) {
        console.error("Error saat menyimpan data: ", error);
        tampilkanNotifikasi('❌ Gagal menyimpan data! Cek konsol.', 'alert-danger', notifElement);
    }
}


// ====================================================================
// EVENT LISTENERS 
// ====================================================================

// 1. Event Listener Form Lengkap
if (formInputNilaiLengkap) {
    formInputNilaiLengkap.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const dataValid = validasiInputLengkap();
        if (dataValid) {
            simpanDataNilai(dataValid, formInputNilaiLengkap, notifElementLengkap);
        }
    });
}

// 2. Event Listener Form Cepat
if (formInputCepatNilai) {
     formInputCepatNilai.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const dataValid = validasiInputCepat();
        if (dataValid) {
            simpanDataNilai(dataValid, formInputCepatNilai, notifCepatElement);
        }
    });
}


/**
 * Mengambil dan menampilkan data nilai di halaman LIHATDATA.HTML.
 * Dipanggil saat body load.
 * Mengikuti Class Diagram: operasi tampilNilai().
 */
async function loadDataNilai() {
    const tabelBody = document.getElementById('tabelDataNilai');
    const loadingStatus = document.getElementById('loadingStatus');

    if (!tabelBody || !loadingStatus) return; 

    loadingStatus.textContent = 'Memuat data...';
    tabelBody.innerHTML = ''; 

    try {
        // Ambil data nilai, urutkan berdasarkan waktu simpan
        const snapshot = await dataService.loadSemuaNilai();

        if (snapshot.empty) {
            loadingStatus.textContent = 'Tidak ada data nilai yang tersimpan.';
            return;
        }

        let noUrut = 1;
        snapshot.forEach(doc => {
        const data = doc.data();
        const docId = doc.id; // AMBIL ID DOKUMEN FIREBASE!
        
            const row = tabelBody.insertRow();
            
            row.insertCell(0).textContent = noUrut++;
            row.insertCell(1).textContent = data.namaMahasiswa || 'N/A'; // Handle jika nama kosong
            row.insertCell(2).textContent = data.nimMahasiswa;
            row.insertCell(3).textContent = data.mataKuliah.split(' - ')[1]; // Ambil hanya nama MK
            row.insertCell(4).textContent = data.nilaiAngka.toFixed(2);

        const cellAksi = row.insertCell(5); // Masukkan di kolom ke-5 (setelah Nilai)
        cellAksi.innerHTML = `
            <button class="btn btn-sm btn-danger" onclick="handleHapusNilai('${docId}')">Hapus</button>
        `;
        });

        loadingStatus.textContent = `Total ${snapshot.size} data nilai ditampilkan.`;

    } catch (error) {
        console.error("Error saat mengambil data: ", error);
        loadingStatus.textContent = '❌ Gagal memuat data. Pastikan Rules Firestore sudah disetel ke "allow read, write: if true;"';
    }
}

/**
 * Menangani penghapusan data nilai.
 * @param {string} docId - ID unik dokumen nilai di Firestore.
 */
async function handleHapusNilai(docId) {
    if (!confirm("Apakah Anda yakin ingin menghapus data nilai ini secara permanen?")) {
        return;
    }

    const loadingStatus = document.getElementById('loadingStatus');

    try {
        // Menggunakan dataService.hapusDokumen()
        await dataService.hapusDokumen(COLLECTION_NILAI, docId); 
        
        // Beri feedback dan muat ulang tabel
        loadingStatus.textContent = `✅ Data berhasil dihapus. Memuat ulang...`;
        loadDataNilai(); 

    } catch (error) {
        console.error("Error saat menghapus data nilai: ", error);
        loadingStatus.textContent = '❌ Gagal menghapus data. Cek konsol.';
    }
}

/**
 * Mengambil dan menampilkan 5 data nilai terbaru di halaman DASHBOARD.
 */
async function loadDataNilaiDashboard() {
    const tabelBody = document.getElementById('dataNilaiTerbaru');
    if (!tabelBody) return; 

    tabelBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Memuat data terbaru...</td></tr>';

    try {
        // Ambil hanya 5 data terbaru (limit(5))
        const snapshot = await dataService.loadNilaiDashboard(5);

        if (snapshot.empty) {
            tabelBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada data nilai terbaru.</td></tr>';
            return;
        }
        
        tabelBody.innerHTML = ''; // Kosongkan
        snapshot.forEach(doc => {
            const data = doc.data();
            
            const row = tabelBody.insertRow();
            // Tampilan sederhana untuk dashboard
            row.insertCell(0).textContent = data.nimMahasiswa;
            row.insertCell(1).textContent = data.namaMahasiswa || 'N/A';
            row.insertCell(2).textContent = data.mataKuliah.split(' - ')[1];
            row.insertCell(3).textContent = data.nilaiAngka.toFixed(1);
            row.insertCell(4).innerHTML = '<i class="fas fa-check-circle text-success"></i>'; // Ikon Cek
        });

    } catch (error) {
        console.error("Error saat mengambil data dashboard: ", error);
        tabelBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data.</td></tr>';
    }
}

// ==========================================================
// PENTING: Untuk menggunakan 'dataService' dari data-service.js
// Pastikan Anda memuat data-service.js SEBELUM logic.js di HTML
// DAN Anda menggunakan fungsi-fungsi dari dataService BUKAN db.collection()
// ==========================================================

// ... Kode yang sudah ada untuk form nilai ...

// --- ELEMEN MAHASISWA BARU ---
const formMahasiswa = document.getElementById('formMahasiswa');
const tabelDataMahasiswa = document.getElementById('tabelDataMahasiswa');
const notifikasiMahasiswa = document.getElementById('notifikasiMahasiswa');
const loadingStatusMahasiswa = document.getElementById('loadingStatusMahasiswa');


// Fungsi Pembantu Notifikasi untuk Mahasiswa (Re-use fungsi tampilkanNotifikasi)
function tampilkanNotifikasiMahasiswa(pesan, tipe, hapusSaja = false) {
    tampilkanNotifikasi(pesan, tipe, notifikasiMahasiswa, hapusSaja);
}

/**
 * 1. FUNGSI READ: Mengambil dan menampilkan semua data Mahasiswa.
 */
async function loadSemuaMahasiswa() {
    if (!tabelDataMahasiswa || !loadingStatusMahasiswa) return;

    tabelDataMahasiswa.innerHTML = '<tr><td colspan="4" class="text-center text-info">Memuat data...</td></tr>';
    loadingStatusMahasiswa.textContent = 'Memuat...';

    try {
        // MENGGUNAKAN dataService.loadSemuaMahasiswa() (MODULAR)
        const snapshot = await dataService.loadSemuaMahasiswa(); 
        
        tabelDataMahasiswa.innerHTML = ''; // Kosongkan
        
        if (snapshot.empty) {
            tabelDataMahasiswa.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Tidak ada data mahasiswa.</td></tr>';
            loadingStatusMahasiswa.textContent = 'Total 0 data ditampilkan.';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const docId = doc.id; // Karena kita menggunakan NIM sebagai ID, docId = NIM
            
            const row = tabelDataMahasiswa.insertRow();
            row.insertCell(0).textContent = data.nim;
            row.insertCell(1).textContent = data.nama;
            row.insertCell(2).textContent = data.prodi;
            
            // Tombol Aksi (Edit/Hapus)
            const cellAksi = row.insertCell(3);
            cellAksi.innerHTML = `
                <button class="btn btn-sm btn-danger me-2" onclick="handleHapusMahasiswa('${docId}')">Hapus</button>
                `;
        });

        loadingStatusMahasiswa.textContent = `Total ${snapshot.size} data mahasiswa ditampilkan.`;

    } catch (error) {
        console.error("Error saat memuat data mahasiswa: ", error);
        tabelDataMahasiswa.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat data.</td></tr>';
        loadingStatusMahasiswa.textContent = 'Gagal memuat data.';
    }
}


/**
 * 2. FUNGSI CREATE/UPDATE: Menangani penyimpanan data Mahasiswa.
 */
if (formMahasiswa) {
    formMahasiswa.addEventListener('submit', async function(event) {
        event.preventDefault(); 

        const nim = document.getElementById('inputNimMahasiswa').value.trim();
        const nama = document.getElementById('inputNamaMahasiswa').value.trim();
        const prodi = document.getElementById('inputProdiMahasiswa').value.trim();

        tampilkanNotifikasiMahasiswa('', 'alert-danger', true); // Bersihkan notifikasi

        if (!nim || !nama || !prodi) {
            tampilkanNotifikasiMahasiswa('Semua field wajib diisi!', 'alert-danger');
            return;
        }

        if (!/^\d{7,}$/.test(nim)) {
            tampilkanNotifikasiMahasiswa('Format NIM tidak valid. Harus berupa angka.', 'alert-danger');
            return;
        }

        const dataMahasiswa = { nim, nama, prodi };

        try {
            // MENGGUNAKAN dataService.simpanMahasiswa() (MODULAR)
            await dataService.simpanMahasiswa(dataMahasiswa); 
            
            tampilkanNotifikasiMahasiswa('✅ Data mahasiswa berhasil disimpan!', 'alert-success');
            formMahasiswa.reset();
            loadSemuaMahasiswa(); // Muat ulang tabel

        } catch (error) {
            console.error("Error saat menyimpan data mahasiswa: ", error);
            tampilkanNotifikasiMahasiswa('❌ Gagal menyimpan data! Cek konsol.', 'alert-danger');
        }
    });
}

/**
 * 3. FUNGSI DELETE: Menangani penghapusan data Mahasiswa.
 */
async function handleHapusMahasiswa(nim) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data Mahasiswa dengan NIM ${nim}?`)) {
        return;
    }

    try {
        // MENGGUNAKAN dataService.hapusDokumen() (MODULAR)
        await dataService.hapusDokumen(COLLECTION_MAHASISWA, nim); 
        
        tampilkanNotifikasiMahasiswa(`✅ Data NIM ${nim} berhasil dihapus.`, 'alert-warning');
        loadSemuaMahasiswa(); // Muat ulang tabel

    } catch (error) {
        console.error("Error saat menghapus data mahasiswa: ", error);
        tampilkanNotifikasiMahasiswa('❌ Gagal menghapus data! Cek konsol.', 'alert-danger');
    }
}

// ... (Kode yang sudah ada, termasuk inisialisasi form nilai dan form mahasiswa)

// --- ELEMEN MATA KULIAH BARU ---
const formMataKuliah = document.getElementById('formMataKuliah');
const tabelDataMK = document.getElementById('tabelDataMK');
const notifikasiMK = document.getElementById('notifikasiMK');
const loadingStatusMK = document.getElementById('loadingStatusMK');


// Fungsi Pembantu Notifikasi untuk Mata Kuliah (Re-use fungsi tampilkanNotifikasi)
function tampilkanNotifikasiMK(pesan, tipe, hapusSaja = false) {
    tampilkanNotifikasi(pesan, tipe, notifikasiMK, hapusSaja);
}


/**
 * 1. FUNGSI READ: Mengambil dan menampilkan semua data Mata Kuliah.
 */
async function loadSemuaMK() {
    if (!tabelDataMK || !loadingStatusMK) return;

    tabelDataMK.innerHTML = '<tr><td colspan="4" class="text-center text-info">Memuat data...</td></tr>';
    loadingStatusMK.textContent = 'Memuat...';

    try {
        const snapshot = await dataService.loadSemuaMK(); // Menggunakan dataService

        tabelDataMK.innerHTML = ''; // Kosongkan
        
        if (snapshot.empty) {
            tabelDataMK.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Tidak ada data Mata Kuliah.</td></tr>';
            loadingStatusMK.textContent = 'Total 0 data ditampilkan.';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const docId = doc.id; // Kode MK sebagai ID
            
            const row = tabelDataMK.insertRow();
            row.insertCell(0).textContent = data.kode_mk;
            row.insertCell(1).textContent = data.nama_mk;
            row.insertCell(2).textContent = data.sks;
            
            // Tombol Aksi (Hapus)
            const cellAksi = row.insertCell(3);
            cellAksi.innerHTML = `
                <button class="btn btn-sm btn-danger me-2" onclick="handleHapusMK('${docId}')">Hapus</button>
            `;
        });

        loadingStatusMK.textContent = `Total ${snapshot.size} data mata kuliah ditampilkan.`;
        // Setelah MK dimuat, kita bisa refresh dropdown di dashboard
        if (typeof loadMataKuliahToDropdowns === 'function') {
            loadMataKuliahToDropdowns(); 
        }

    } catch (error) {
        console.error("Error saat memuat data Mata Kuliah: ", error);
        tabelDataMK.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat data.</td></tr>';
        loadingStatusMK.textContent = 'Gagal memuat data.';
    }
}


/**
 * 2. FUNGSI CREATE/UPDATE: Menangani penyimpanan data Mata Kuliah.
 */
if (formMataKuliah) {
    formMataKuliah.addEventListener('submit', async function(event) {
        event.preventDefault(); 

        const kode_mk = document.getElementById('inputKodeMK').value.trim();
        const nama_mk = document.getElementById('inputNamaMK').value.trim();
        const sksStr = document.getElementById('inputSKS').value.trim();
        const sks = parseInt(sksStr);

        tampilkanNotifikasiMK('', 'alert-danger', true); 

        if (!kode_mk || !nama_mk || isNaN(sks) || sks < 1 || sks > 6) {
            tampilkanNotifikasiMK('Kode, Nama MK, dan SKS (1-6) wajib diisi!', 'alert-danger');
            return;
        }

        const dataMK = { kode_mk, nama_mk, sks };

        try {
            await dataService.simpanMK(dataMK); // Menggunakan dataService
            
            tampilkanNotifikasiMK('✅ Data Mata Kuliah berhasil disimpan/diperbarui!', 'alert-success');
            formMataKuliah.reset();
            loadSemuaMK(); // Muat ulang tabel

        } catch (error) {
            console.error("Error saat menyimpan data MK: ", error);
            tampilkanNotifikasiMK('❌ Gagal menyimpan data! Cek konsol.', 'alert-danger');
        }
    });
}

/**
 * 3. FUNGSI DELETE: Menangani penghapusan data Mata Kuliah.
 */
async function handleHapusMK(kode_mk) {
    if (!confirm(`Apakah Anda yakin ingin menghapus Mata Kuliah ${kode_mk}? Penghapusan ini TIDAK akan menghapus data nilai yang sudah ada.`)) {
        return;
    }

    try {
        await dataService.hapusDokumen(COLLECTION_MK, kode_mk); // Menggunakan dataService
        
        tampilkanNotifikasiMK(`✅ Mata Kuliah ${kode_mk} berhasil dihapus.`, 'alert-warning');
        loadSemuaMK(); // Muat ulang tabel

    } catch (error) {
        console.error("Error saat menghapus data MK: ", error);
        tampilkanNotifikasiMK('❌ Gagal menghapus data! Cek konsol.', 'alert-danger');
    }
}

async function loadMataKuliahToDropdowns() {
    const selectCepat = document.getElementById('inputCepatMK');
    const selectLengkap = document.getElementById('inputMataKuliahLengkap');
    
    if (!selectCepat || !selectLengkap) return; 

    try {
        const snapshot = await dataService.loadSemuaMK();

        // 1. TAMBAHKAN OPSI PLACEHOLDER (Memastikan opsi statis hilang)
        selectCepat.innerHTML = '<option value="" disabled selected>Pilih Mata Kuliah...</option>';
        selectLengkap.innerHTML = '<option value="" disabled selected>Pilih mata kuliah...</option>';

        if (snapshot.empty) return; 

        snapshot.forEach(doc => {
            const data = doc.data();
            const optionValue = `${data.kode_mk} - ${data.nama_mk}`;

            // 2. LOGIKA UNTUK MEMBUAT DAN MENAMBAHKAN ELEMEN <OPTION>
            const optCepat = new Option(optionValue, optionValue);
            selectCepat.appendChild(optCepat);
            
            const optLengkap = new Option(optionValue, optionValue);
            selectLengkap.appendChild(optLengkap);
        });

    } catch (error) {
        console.error("Gagal memuat Mata Kuliah ke dropdown: ", error);
    }
}

/**
 * Mengambil total dokumen dari Firestore untuk mengisi kartu statistik di Dashboard (index.html).
 * Menggunakan CSS selector untuk menargetkan elemen.
 */
async function loadStatistikDashboard() {
    try {
        // Ambil Elemen Statistik (Pastikan ini menargetkan H3 class="stat-value")
        const totalMhsEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
        const totalMkEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
        // Kartu ke-3: Tugas Belum Dinilai/Total Nilai
        const totalNilaiEl = document.querySelector('.stat-card:nth-child(3) .stat-value'); 
        const rataRataIPKEl = document.querySelector('.stat-card:nth-child(4) .stat-value');
        
        // KRITIS: Panggil fungsi baru dari data-service
        const stats = await dataService.getDashboardStatistics();

        console.log("--- DEBUG STATS ---");
        console.log("Total Mahasiswa (DB):", stats.totalMahasiswa);
        console.log("Total Mata Kuliah (DB):", stats.totalMataKuliahAktif); // <--- LIHAT NILAI INI
        console.log("Total Data Nilai (DB):", stats.totalDataNilai);
        console.log("IPK Dihitung:", stats.rataRataIPK);
        console.log("-------------------");

        // 1. Update Kartu Total Mahasiswa
        if(totalMhsEl) totalMhsEl.textContent = stats.totalMahasiswa;
        
        // 2. Update Kartu Mata Kuliah Aktif
        if(totalMkEl) totalMkEl.textContent = stats.totalMataKuliahAktif;
        
        // 3. Update Kartu Total Data Nilai (Menggantikan Tugas Belum Dinilai)
        if(totalNilaiEl) totalNilaiEl.textContent = stats.totalDataNilai;
        
        // 4. Update Kartu Rata-rata IPK
        // Karena hitungRataRataIPK mengembalikan string 'X.XX', kita tampilkan langsung
        if(rataRataIPKEl) rataRataIPKEl.textContent = stats.rataRataIPK; 
        
    } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
    }
}

// Panggil fungsi load data dashboard saat halaman index dimuat
document.addEventListener("DOMContentLoaded", function() {
    loadDataNilaiDashboard();
    loadMataKuliahToDropdowns();
    loadStatistikDashboard();
});