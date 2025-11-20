/**
 * Fungsi pembantu untuk mengkonversi Nilai Angka (0-100) menjadi Bobot Nilai (0-4).
 */
function konversiNilaiToBobot(nilaiAngka) {
    const nilai = parseFloat(nilaiAngka); 
    
    if (isNaN(nilai)) return 0.0;
    
    // DIPERBAIKI: Menggunakan variabel 'nilai' (float) untuk perbandingan
    if (nilai >= 80) return 4.0; // A
    if (nilai >= 70) return 3.0; // B
    if (nilai >= 60) return 2.0; // C
    if (nilai >= 50) return 1.0; // D
    return 0.0; // E/F
}

// --- FUNGSI PEMBANTU UNTUK MENGAMBIL MK ---
async function getAllMatakuliahMap() {
    // MENGGUNAKAN KONSTANTA GLOBAL COLLECTION_MK
    const mkRef = db.collection(COLLECTION_MK); 
    const snapshot = await mkRef.get();
    const mkMap = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        mkMap[doc.id] = data; 
    });
    return mkMap;
}

// --- FUNGSI UTAMA IPK (MENGGUNAKAN KOLEKSI YANG BENAR) ---
async function hitungRataRataIPK() {
    try {
        const matkulMap = await getAllMatakuliahMap();
        // MENGGUNAKAN KONSTANTA GLOBAL COLLECTION_NILAI
        const nilaiSnapshot = await db.collection(COLLECTION_NILAI).get(); 

        let totalPoinKredit = 0;
        let totalSKS = 0;

        nilaiSnapshot.forEach(doc => {
            const nilaiData = doc.data();
            const nilaiAngka = nilaiData.nilaiAngka; 
            const mataKuliahString = nilaiData.mataKuliah; 
            
            // Ekstrak Kode MK:
            const parts = mataKuliahString.split(' - ');
            
            if (parts.length >= 2) { 
                const mkCode = parts[0].trim();
                const mkDetail = matkulMap[mkCode];
                
                if (mkDetail && typeof mkDetail.sks === 'number' && mkDetail.sks > 0) {
                    
                    const sks = mkDetail.sks;
                    const bobotNilai = konversiNilaiToBobot(nilaiAngka);
                    
                    totalPoinKredit += bobotNilai * sks;
                    totalSKS += sks;
                }
            }
        });

        if (totalSKS === 0) {
            // Ubah ini untuk melihat error: jika totalSKS=0, maka return 0.00
            console.warn("Perhitungan IPK: Total SKS yang valid adalah nol (0). Cek data SKS dan format string MK di data nilai."); 
            return '0.00';
        }

        const ipk = totalPoinKredit / totalSKS;
        return ipk.toFixed(2);
        
    } catch (error) {
        console.error("Error menghitung IPK:", error);
        return '0.00';
    }
}

// ==========================================================
// DEFINISI UTAMA dataService (DIJAMIN HANYA SEKALI)
// ==========================================================
const dataService = {
    // --- CRUD NILAI ---
    simpanData: async (dataObj) => {
        return await db.collection(COLLECTION_NILAI).add(dataObj);
    },
    loadSemuaNilai: async () => {
        return await db.collection(COLLECTION_NILAI).orderBy('timestamp', 'desc').get();
    },
    loadNilaiDashboard: async (limit) => {
        return await db.collection(COLLECTION_NILAI).orderBy('timestamp', 'desc').limit(limit).get();
    },
    hapusDokumen: async (collectionName, docId) => {
        return await db.collection(collectionName).doc(docId).delete();
    },
    loadMahasiswaByNim: async (nim) => { 
    const doc = await db.collection(COLLECTION_MAHASISWA).doc(nim).get(); 
    return doc.exists ? doc.data() : null; 
    },
    loadMKByKode: async (kode_mk) => { 
    // Kode MK adalah ID dokumen
    const doc = await db.collection(COLLECTION_MK).doc(kode_mk).get(); 
    return doc.exists ? doc.data() : null; 
    },

    // --- CRUD MAHASISWA & MK & STATISTIK ---
    simpanMahasiswa: async (data) => { /* ... */ return await db.collection(COLLECTION_MAHASISWA).doc(data.nim).set(data); },
    loadSemuaMahasiswa: async () => { /* ... */ return await db.collection(COLLECTION_MAHASISWA).orderBy('nama', 'asc').get(); },
    loadMahasiswaByNim: async (nim) => { /* ... */ const doc = await db.collection(COLLECTION_MAHASISWA).doc(nim).get(); return doc.exists ? doc.data() : null; },
    simpanMK: async (data) => { /* ... */ return await db.collection(COLLECTION_MK).doc(data.kode_mk).set(data); },
    loadSemuaMK: async () => { /* ... */ return await db.collection(COLLECTION_MK).orderBy('nama_mk', 'asc').get(); },
    getTotalDokumen: async (collectionName) => { /* ... */ const snapshot = await db.collection(collectionName).get(); return snapshot.size; },
    cariDataNilai: async (keyword) => { /* ... */ return dataService.loadSemuaNilai(); },

    // Fungsi baru untuk mendapatkan semua data statistik dashboard
    getDashboardStatistics: async () => {
        const totalMahasiswa = await dataService.getTotalDokumen(COLLECTION_MAHASISWA);
        const totalMataKuliahAktif = await dataService.getTotalDokumen(COLLECTION_MK);
        const totalDataNilai = await dataService.getTotalDokumen(COLLECTION_NILAI);
        const rataRataIPK = await dataService.hitungRataRataIPK(); // Menggunakan fungsi IPK yang sudah ada

        return {
            totalMahasiswa,
            totalMataKuliahAktif,
            totalDataNilai, // Menggantikan "Tugas Belum Dinilai"
            rataRataIPK
        };
    },
    
    cariDataNilai: async (keyword) => {
        // Query yang kompleks...
        return dataService.loadSemuaNilai();
    },
    
    // EKSPOR FUNGSI IPK
    hitungRataRataIPK: hitungRataRataIPK 
};