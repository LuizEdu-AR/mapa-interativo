import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [claims, setClaims] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile = () => {};
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            unsubscribeProfile();
            setUser(currentUser);
            setProfile(null);
            setClaims({});
            if (!currentUser) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const token = await getIdTokenResult(currentUser, true);
                setClaims(token.claims);
            } catch (error) {
                console.error("Falha ao obter permissões:", error);
            }
            unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid), (snapshot) => {
                setProfile(snapshot.exists() ? snapshot.data() : null);
                setLoading(false);
            }, () => setLoading(false));
        });
        return () => {
            unsubscribeProfile();
            unsubscribeAuth();
        };
    }, []);

    const isAdmin = claims.role === "admin" || claims.role === "owner";
    const isOwner = claims.role === "owner";

    return (
        <AuthContext.Provider value={{ user, profile, claims, loading, isAdmin, isOwner }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
