import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
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

  async logout() {
    return await signOut(auth);
  }
}
