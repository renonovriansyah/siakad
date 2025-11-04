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
        await db.collection(COLLECTION_NILAI).add(dataObj);
        
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
        const snapshot = await db.collection(COLLECTION_NILAI).orderBy('timestamp', 'desc').get();

        if (snapshot.empty) {
            loadingStatus.textContent = 'Tidak ada data nilai yang tersimpan.';
            return;
        }

        let noUrut = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            
            const row = tabelBody.insertRow();
            
            row.insertCell(0).textContent = noUrut++;
            row.insertCell(1).textContent = data.namaMahasiswa || 'N/A'; // Handle jika nama kosong
            row.insertCell(2).textContent = data.nimMahasiswa;
            row.insertCell(3).textContent = data.mataKuliah.split(' - ')[1]; // Ambil hanya nama MK
            row.insertCell(4).textContent = data.nilaiAngka.toFixed(2); 
        });

        loadingStatus.textContent = `Total ${snapshot.size} data nilai ditampilkan.`;

    } catch (error) {
        console.error("Error saat mengambil data: ", error);
        loadingStatus.textContent = '❌ Gagal memuat data. Pastikan Rules Firestore sudah disetel ke "allow read, write: if true;"';
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
        const snapshot = await db.collection(COLLECTION_NILAI).orderBy('timestamp', 'desc').limit(5).get();

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

// Panggil fungsi load data dashboard saat halaman index dimuat
document.addEventListener("DOMContentLoaded", loadDataNilaiDashboard);