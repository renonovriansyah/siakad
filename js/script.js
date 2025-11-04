/**
 * Fungsi setupSidebarToggle()
 * Menginisialisasi event listener untuk tombol sidebar toggle.
 */
function setupSidebarToggle() {
    const tombolToggle = document.getElementById('sidebarToggle');
    const containerUtamaAplikasi = document.getElementById('wrapper');
    
    if (tombolToggle && containerUtamaAplikasi) {
        tombolToggle.addEventListener('click', function (event) {
            event.preventDefault(); 
            
            // Toggle class 'toggled' yang memicu animasi CSS
            containerUtamaAplikasi.classList.toggle('toggled');
        });
    }
}

// Jalankan fungsi setup saat seluruh elemen HTML telah dimuat
document.addEventListener("DOMContentLoaded", setupSidebarToggle);