// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCgNQqmvOMJYJ8qTvz0WEKro2_cflsw9W0",
  authDomain: "inputdatamahasiswa-fafa7.firebaseapp.com",
  projectId: "inputdatamahasiswa-fafa7",
  storageBucket: "inputdatamahasiswa-fafa7.firebasestorage.app",
  messagingSenderId: "1053807096739",
  appId: "1:1053807096739:web:cdfd86635d94e72df02016",
  measurementId: "G-5WRV7LLJ93"
};

// Inisialisasi Firebase App
firebase.initializeApp(firebaseConfig);

// Dapatkan referensi ke Firestore
const db = firebase.firestore();

// Nama Koleksi
const COLLECTION_NILAI = "nilai_mahasiswa";