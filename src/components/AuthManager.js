import { 
  auth, 
  googleProvider,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged 
} from '../lib/firebase.js';

export class AuthManager {
  constructor(onUserChanged) {
    this.currentUser = null;
    this.onUserChanged = onUserChanged;

    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.onUserChanged(user);
    });
  }

  async signUp(email, password) {
    return await createUserWithEmailAndPassword(auth, email, password);
  }

  async login(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  async loginWithGoogle() {
    return await signInWithPopup(auth, googleProvider);
  }

  async logout() {
    return await signOut(auth);
  }
}
