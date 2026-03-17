import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDk9mwSZgk9I65RpYlus7by9mB8tN_oskE",
  authDomain: "academic-allies-464901.firebaseapp.com",
  projectId: "academic-allies-464901",
  storageBucket: "academic-allies-464901.firebasestorage.app",
  messagingSenderId: "93996985456",
  appId: "1:93996985456:web:c697df7623bbceeb1d18b5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle Google Sign-In
window.handleGoogleSignIn = async function() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('Signed in:', user.email);
    
    // Check if user has a role, if not create default
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'pending', // Default role until admin assigns
        createdAt: new Date()
      });
    }
    
    window.location.reload();
  } catch (error) {
    console.error('Sign-in error:', error);
    alert('Sign-in failed: ' + error.message);
  }
}

// Check user authentication and role
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    window.currentUser = {
      uid: user.uid,
      email: user.email,
      role: userData?.role || 'pending',
      displayName: user.displayName
    };
    
    // Update UI
    updateAuthUI(user, userData?.role);
  } else {
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
