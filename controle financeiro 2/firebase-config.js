
const firebaseConfig = {
    apiKey: "AIzaSyCJr4Vl2FpMw6XSOe4WDPU1i4JdcsrmZuE",
    authDomain: "financas-c82c4.firebaseapp.com",
    projectId: "financas-c82c4",
    storageBucket: "financas-c82c4.firebasestorage.app",
    messagingSenderId: "858824680703",
    appId: "1:858824680703:web:05752ee7ea655a1bcb18ca",
    measurementId: "G-CV5KMQCEKC"
  };
  
  // Inicializa o Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const database = firebase.database(); // Referência ao Realtime Database