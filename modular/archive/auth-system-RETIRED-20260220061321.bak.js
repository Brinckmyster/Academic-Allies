import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithCredential, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDk9mwSZgk9I65RpYlus7by9mB8tN_oskE",
  authDomain: "academic-allies-464901.firebaseapp.com",
  projectId: "academic-allies-464901",
  storageBucket: "academic-allies-464901.firebasestorage.app",
  messagingSenderId: "93996985456",
  appId: "1:93996985456:web:c697df7623bbceeb1d18b5"
};

// Use existing app if already initialized, otherwise create new one
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Handle Google Sign-In using an existing ID token (no popup needed)
window.handleGoogleCredential = async function(idToken) {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const user = result.user;
    console.log('[auth-system.js] signInWithCredential succeeded:', user.email);
    // onAuthStateChanged will fire and set window.currentUser automatically
  } catch (error) {
    console.error('[auth-system.js] signInWithCredential error:', error);
  }
}

// Check user authentication and role
onAuthStateChanged(auth, async (user) => {
  console.log('[auth-system.js] onAuthStateChanged fired. User:', user?.email || 'null');

  if (user) {
    console.log('[auth-system.js] User is signed in, fetching role from Firestore...');
    const q = query(collection(db, 'users'), where('email', '==', user.email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('[auth-system.js] No user record found, creating pending user...');
      await addDoc(collection(db, 'users'), { email: user.email, role: 'pending', createdAt: new Date() });
      window.location.reload();
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    window.currentUser = {
      uid: user.uid,
      email: user.email,
      role: userData?.role || 'pending',
      displayName: user.displayName
    };

    console.log('[auth-system.js] window.currentUser set:', window.currentUser);

    // Update UI
    updateAuthUI(user, userData?.role);
  } else {
    console.log('[auth-system.js] No user signed in, setting currentUser to null');
    window.currentUser = null;
    updateAuthUI(null);
  }
});

function updateAuthUI(user, role) {
  const statusCircle = document.getElementById('status-circle');
  if (!statusCircle) return;
  
  if (user) {
    statusCircle.style.background = '#4CAF50';
    statusCircle.title = `Signed in as ${user.email} (${role || 'pending'})`;
  } else {
    statusCircle.style.background = '#f44336';
    statusCircle.title = 'Not signed in';
  }
}

// Check if user has permission for a page
window.checkPermission = function(requiredRoles) {
  if (!window.currentUser) {
    window.location.href = '/Academic-Allies/';
    return false;
  }
  
  if (!requiredRoles.includes(window.currentUser.role)) {
    alert('Access denied. Your role: ' + window.currentUser.role);
    window.location.href = '/Academic-Allies/';
    return false;
  }
  
  return true;
}
