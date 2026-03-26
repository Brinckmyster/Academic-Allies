import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDk9mwSZgk9I65RpYlus7by9mB8tN_oskE",
  authDomain: "academic-allies-464901.firebaseapp.com",
  projectId: "academic-allies-464901",
  storageBucket: "academic-allies-464901.firebasestorage.app",
  messagingSenderId: "93996985456",
  appId: "1:93996985456:web:c697df7623bbceeb1d18b5"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

window.uploadMealPhoto = async function(file) {
  if (!file) {
    alert('Please select a photo');
    return;
  }
  
  const timestamp = Date.now();
  const storageRef = ref(storage, `meal-photos/${timestamp}_${file.name}`);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    alert('Photo uploaded! URL: ' + downloadURL);
    return downloadURL;
  } catch (error) {
    alert('Upload failed: ' + error.message);
    console.error(error);
  }
}
