// js/google-integration.js
export function startGoogleSignIn() {
  const GOOGLE_CLIENT_ID = "93996985456-ffj2euk9i4q41v88njuhpusk73mdb31j.apps.googleusercontent.com";
  if (!window.google?.accounts?.id) {
    alert('Google Identity Services not loaded yet.');
    return;
  }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });
  google.accounts.id.prompt();
}
async function handleCredentialResponse(response) {
  try {
    console.log('Signed in:', response);
    // Integrate with Firebase or your backend here
    alert('Google Sign-In successful!');
  } catch (e) {
    console.error('Sign-In error:', e);
    alert('Sign-In failed.');
  }
}
