// PASTIKAN FILE INI DIMAUI SETELAH js/firebase-config.js DENGAN KUNCI YANG VALID

// --- ELEMEN INPUT NILAI (Sekarang hanya Form Lengkap) ---
const formInputNilaiLengkap = document.getElementById('formInputNilaiLengkap');
const notifElementLengkap = document.getElementById('pesanNotifikasiLengkap');

// --- ELEMEN MAHASISWA ---
const formMahasiswa = document.getElementById('formMahasiswa');
const tabelDataMahasiswa = document.getElementById('tabelDataMahasiswa');
const notifikasiMahasiswa = document.getElementById('notifikasiMahasiswa');
const loadingStatusMahasiswa = document.getElementById('loadingStatusMahasiswa');

// --- ELEMEN MATA KULIAH ---
const formMataKuliah = document.getElementById('formMataKuliah');
const tabelDataMK = document.getElementById('tabelDataMK');
const notifikasiMK = document.getElementById('notifikasiMK');
const loadingStatusMK = document.getElementById('loadingStatusMK');


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

// Fungsi Pembantu Notifikasi untuk Mahasiswa (Re-use fungsi tampilkanNotifikasi)
function tampilkanNotifikasiMahasiswa(pesan, tipe, hapusSaja = false) {
    tampilkanNotifikasi(pesan, tipe, notifikasiMahasiswa, hapusSaja);
}

// Fungsi Pembantu Notifikasi untuk Mata Kuliah (Re-use fungsi tampilkanNotifikasi)
function tampilkanNotifikasiMK(pesan, tipe, hapusSaja = false) {
    tampilkanNotifikasi(pesan, tipe, notifikasiMK, hapusSaja);
}


/**
 * Fungsi untuk melakukan validasi input data mahasiswa (Form Lengkap).
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
        tampilkanNotifikasi('Format NIM tidak valid. Harus berupa angka dengan minimal 7 digit.', 'alert-danger', notifElementLengkap);
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
 * Menyimpan data nilai mahasiswa ke Firebase Firestore (fungsi re-usable).
 */
async function simpanDataNilai(dataObj, formElement, notifElement) {
    try {
        await dataService.simpanData(dataObj);
        
        tampilkanNotifikasi('✅ Data nilai berhasil disimpan!', 'alert-success', notifElement);

        if (formElement) formElement.reset(); // Kosongkan form
        
        // Panggil fungsi dashboard untuk refresh statistik jika form disimpan dari halaman Input Nilai
        if (document.getElementById('dataNilaiTerbaru')) {
             loadDataNilaiDashboard();
             loadStatistikDashboard();
        }

    } catch (error) {
        console.error("Error saat menyimpan data: ", error);
        tampilkanNotifikasi('❌ Gagal menyimpan data! Cek konsol.', 'alert-danger', notifElement);
    }
}


// ====================================================================
// EVENT LISTENERS NILAI
// ====================================================================

// Event Listener Form Input Nilai (Sekarang di inputnilai.html)
if (formInputNilaiLengkap) {
    formInputNilaiLengkap.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const dataValid = validasiInputLengkap();
        if (dataValid) {
            simpanDataNilai(dataValid, formInputNilaiLengkap, notifElementLengkap);
        }
    });
}


// ====================================================================
// FUNGSI LOAD DATA NILAI (Lihat Data Nilai & Dashboard)
// ====================================================================

/**
 * Mengambil dan menampilkan data nilai di halaman LIHATDATA.HTML.
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
            const docId = doc.id; 
            
            const row = tabelBody.insertRow();
            
            row.insertCell(0).textContent = noUrut++;
            row.insertCell(1).textContent = data.namaMahasiswa || 'N/A'; 
            row.insertCell(2).textContent = data.nimMahasiswa;
            row.insertCell(3).textContent = data.mataKuliah.split(' - ')[1]; 
            row.insertCell(4).textContent = data.nilaiAngka.toFixed(2);

        const cellAksi = row.insertCell(5); 
        cellAksi.innerHTML = `
            <button class="btn btn-sm btn-danger" onclick="handleHapusNilai('${docId}')">Hapus</button>
        `;
        });

        loadingStatus.textContent = `Total ${snapshot.size} data nilai ditampilkan.`;

    } catch (error) {
        console.error("Error saat mengambil data: ", error);
        loadingStatus.textContent = '❌ Gagal memuat data. Cek koneksi atau konsol.';
    }
}

/**
 * Menangani penghapusan data nilai.
 */
async function handleHapusNilai(docId) {
    if (!confirm("Apakah Anda yakin ingin menghapus data nilai ini secara permanen?")) {
        return;
    }

    const loadingStatus = document.getElementById('loadingStatus');

    try {
        await dataService.hapusDokumen(COLLECTION_NILAI, docId); 
        
        loadingStatus.textContent = `✅ Data berhasil dihapus. Memuat ulang...`;
        loadDataNilai(); 

    } catch (error) {
        console.error("Error saat menghapus data nilai: ", error);
        loadingStatus.textContent = '❌ Gagal menghapus data! Cek konsol.';
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


// ====================================================================
// FUNGSI CRUD MAHASISWA
// ====================================================================

/**
 * 1. FUNGSI READ: Mengambil dan menampilkan semua data Mahasiswa.
 */
async function loadSemuaMahasiswa() {
    if (!tabelDataMahasiswa || !loadingStatusMahasiswa) return;

    tabelDataMahasiswa.innerHTML = '<tr><td colspan="4" class="text-center text-info">Memuat data...</td></tr>';
    loadingStatusMahasiswa.textContent = 'Memuat...';

    try {
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
            
            // Tombol Aksi (Hapus)
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
            tampilkanNotifikasiMahasiswa('Format NIM tidak valid. Harus berupa angka dengan minimal 7 digit.', 'alert-danger');
            return;
        }

        const dataMahasiswa = { nim, nama, prodi };

        try {
            await dataService.simpanMahasiswa(dataMahasiswa); 
            
            tampilkanNotifikasiMahasiswa('✅ Data mahasiswa berhasil disimpan!', 'alert-success');
            formMahasiswa.reset();
            loadSemuaMahasiswa(); // Muat ulang tabel
            loadStatistikDashboard(); // Update statistik di dashboard

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
        await dataService.hapusDokumen(COLLECTION_MAHASISWA, nim); 
        
        tampilkanNotifikasiMahasiswa(`✅ Data NIM ${nim} berhasil dihapus.`, 'alert-warning');
        loadSemuaMahasiswa(); // Muat ulang tabel
        loadStatistikDashboard(); // Update statistik di dashboard

    } catch (error) {
        console.error("Error saat menghapus data mahasiswa: ", error);
        tampilkanNotifikasiMahasiswa('❌ Gagal menghapus data! Cek konsol.', 'alert-danger');
    }
}


// ====================================================================
// FUNGSI CRUD MATA KULIAH
// ====================================================================

/**
 * 1. FUNGSI READ: Mengambil dan menampilkan semua data Mata Kuliah.
 */
async function loadSemuaMK() {
    if (!tabelDataMK || !loadingStatusMK) return;

    tabelDataMK.innerHTML = '<tr><td colspan="4" class="text-center text-info">Memuat data...</td></tr>';
    loadingStatusMK.textContent = 'Memuat...';

    try {
        const snapshot = await dataService.loadSemuaMK();

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
        
        // Setelah MK dimuat, kita bisa refresh dropdown di halaman Input Nilai
        loadMataKuliahToDropdowns(); 

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
            await dataService.simpanMK(dataMK); 
            
            tampilkanNotifikasiMK('✅ Data Mata Kuliah berhasil disimpan/diperbarui!', 'alert-success');
            formMataKuliah.reset();
            loadSemuaMK(); // Muat ulang tabel (yang juga akan memuat ulang dropdown)
            loadStatistikDashboard(); // Update statistik di dashboard

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
        await dataService.hapusDokumen(COLLECTION_MK, kode_mk); 
        
        tampilkanNotifikasiMK(`✅ Mata Kuliah ${kode_mk} berhasil dihapus.`, 'alert-warning');
        loadSemuaMK(); // Muat ulang tabel (yang juga akan memuat ulang dropdown)
        loadStatistikDashboard(); // Update statistik di dashboard

    } catch (error) {
        console.error("Error saat menghapus data MK: ", error);
        tampilkanNotifikasiMK('❌ Gagal menghapus data! Cek konsol.', 'alert-danger');
    }
}

// ====================================================================
// FUNGSI DROPDOWN & STATISTIK
// ====================================================================

async function loadMataKuliahToDropdowns() {
    // Dropdown hanya ada di inputnilai.html
    const selectLengkap = document.getElementById('inputMataKuliahLengkap');
    
    if (!selectLengkap) return; // Keluar jika elemen tidak ada di halaman

    try {
        const snapshot = await dataService.loadSemuaMK();

        // Kosongkan dan reset placeholder
        selectLengkap.innerHTML = '<option value="" disabled selected>Pilih mata kuliah...</option>';

        if (snapshot.empty) return; 

        snapshot.forEach(doc => {
            const data = doc.data();
            // Format: KodeMK - NamaMK
            const optionValue = `${data.kode_mk} - ${data.nama_mk}`; 
            
            const optLengkap = new Option(optionValue, optionValue);
            selectLengkap.appendChild(optLengkap);
        });

    } catch (error) {
        console.error("Gagal memuat Mata Kuliah ke dropdown: ", error);
    }
}

/**
 * Mengambil total dokumen dari Firestore untuk mengisi kartu statistik di Dashboard (index.html).
 */
async function loadStatistikDashboard() {
    // Hanya berjalan jika ini adalah halaman index (dashboard)
    const rataRataIPKEl = document.querySelector('.stat-card:nth-child(4) .stat-value');
    if (!rataRataIPKEl) return; 

    try {
        const totalMhsEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
        const totalMkEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
        const totalNilaiEl = document.querySelector('.stat-card:nth-child(3) .stat-value'); 
        
        // Panggilan ke data-service
        const stats = await dataService.getDashboardStatistics();

        // Mengisi nilai ke elemen HTML
        if(totalMhsEl) totalMhsEl.textContent = stats.totalMahasiswa;
        if(totalMkEl) totalMkEl.textContent = stats.totalMataKuliahAktif;
        if(totalNilaiEl) totalNilaiEl.textContent = stats.totalDataNilai;
        if(rataRataIPKEl) rataRataIPKEl.textContent = stats.rataRataIPK; 
        
    } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
    }
}

// ====================================================================
// INISIALISASI SAAT DOM CONTENT LOADED
// ====================================================================
document.addEventListener("DOMContentLoaded", function() {
    // Cek apakah ini halaman Dashboard (index.html)
    if (document.getElementById('dataNilaiTerbaru')) {
        loadDataNilaiDashboard();
        loadStatistikDashboard();
    }
    
    // Cek apakah ini halaman Input Nilai (inputnilai.html)
    if (document.getElementById('inputMataKuliahLengkap')) {
        loadMataKuliahToDropdowns(); 
    }
});