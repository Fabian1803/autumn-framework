// auth.store.ts
import { Store, Bean } from 'autumn-js';
import { User } from './user.atm';

@Store({
    name: 'auth',
    persist: true // Guarda automáticamente en localStorage
})
export class AuthStore {
    @Bean currentUser: User | null = null;
    @Bean isAuthenticated: boolean = false;

    login(user: User) {
        this.currentUser = user;
        this.isAuthenticated = true;
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }
}