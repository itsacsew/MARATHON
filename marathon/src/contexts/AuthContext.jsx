import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// HARD CODED SUPER ADMIN CREDENTIALS
const SUPER_ADMIN_EMAIL = 'superadmin@gmail.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin123';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Sign up function
  async function signup(email, password, displayName, isAdmin = false) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName });
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        isAdmin: isAdmin || false,
        isSuperAdmin: false,
        createdAt: new Date().toISOString(),
        registrations: []
      });
      
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Login function - FIXED
  async function login(email, password) {
    try {
      // Check if it's the hardcoded super admin
      if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
        try {
          // Try to sign in first
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          // Check if super admin exists in Firestore
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // Create super admin in Firestore
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: 'Super Admin',
              isAdmin: true,
              isSuperAdmin: true,
              createdAt: new Date().toISOString(),
              registrations: []
            });
          } else {
            // Update existing user to be super admin if not already
            const existingData = userSnap.data();
            if (!existingData.isSuperAdmin) {
              await setDoc(userRef, {
                isAdmin: true,
                isSuperAdmin: true
              }, { merge: true });
            }
          }
          
          return user;
        } catch (firebaseError) {
          // If user doesn't exist, create them
          if (firebaseError.code === 'auth/user-not-found') {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Set super admin in Firestore
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: 'Super Admin',
              isAdmin: true,
              isSuperAdmin: true,
              createdAt: new Date().toISOString(),
              registrations: []
            });
            
            return user;
          }
          throw firebaseError;
        }
      }
      
      // Regular login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  // Get user data from Firestore
  async function getUserData(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        try {
          const defaultData = {
            uid: uid,
            email: currentUser?.email || '',
            displayName: currentUser?.displayName || '',
            isAdmin: false,
            isSuperAdmin: false,
            createdAt: new Date().toISOString(),
            registrations: []
          };
          await setDoc(docRef, defaultData);
          return defaultData;
        } catch (createError) {
          console.error('Error creating user document:', createError);
          return null;
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // Save registration data to Firestore
  async function saveRegistration(uid, registrationData) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const registrations = userData.registrations || [];
        
        const newRegistration = {
          ...registrationData,
          registeredAt: new Date().toISOString(),
          id: Date.now().toString()
        };
        
        registrations.push(newRegistration);
        
        await setDoc(userRef, {
          ...userData,
          registrations: registrations
        }, { merge: true });
        
        return newRegistration;
      } else {
        const defaultData = {
          uid: uid,
          email: currentUser?.email || '',
          displayName: currentUser?.displayName || '',
          isAdmin: false,
          isSuperAdmin: false,
          createdAt: new Date().toISOString(),
          registrations: [registrationData]
        };
        await setDoc(userRef, defaultData);
        return registrationData;
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      throw error;
    }
  }

  // UPDATE REGISTRATION
  async function updateRegistration(uid, registrationId, updateData) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User document not found');
      }

      const userData = userSnap.data();
      const registrations = userData.registrations || [];
      
      const registrationIndex = registrations.findIndex(reg => reg.id === registrationId);
      
      if (registrationIndex === -1) {
        throw new Error('Registration not found');
      }

      registrations[registrationIndex] = {
        ...registrations[registrationIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      await setDoc(userRef, {
        ...userData,
        registrations: registrations
      }, { merge: true });

      return registrations[registrationIndex];
      
    } catch (error) {
      console.error('Error updating registration:', error);
      throw error;
    }
  }

  // DELETE REGISTRATION - SUPER ADMIN ONLY
  async function deleteRegistration(uid, registrationId) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User document not found');
      }

      const userData = userSnap.data();
      const registrations = userData.registrations || [];
      
      const registrationIndex = registrations.findIndex(reg => reg.id === registrationId);
      
      if (registrationIndex === -1) {
        throw new Error('Registration not found');
      }

      registrations.splice(registrationIndex, 1);

      await setDoc(userRef, {
        ...userData,
        registrations: registrations
      }, { merge: true });

      return true;
      
    } catch (error) {
      console.error('Error deleting registration:', error);
      throw error;
    }
  }

  // DELETE USER - SUPER ADMIN ONLY
  async function deleteUser(uid) {
    try {
      if (uid === currentUser?.uid) {
        throw new Error('Cannot delete your own account');
      }
      
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get user registrations
  async function getUserRegistrations(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.registrations || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching registrations:', error);
      return [];
    }
  }

  // Get all users
  async function getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      let allUsers = [];
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        allUsers.push({
          uid: doc.id,
          displayName: userData.displayName || 'Unknown',
          email: userData.email || 'Unknown',
          isAdmin: userData.isAdmin || false,
          isSuperAdmin: userData.isSuperAdmin || false,
          createdAt: userData.createdAt || new Date().toISOString(),
          registrations: userData.registrations || [],
          registrationCount: (userData.registrations || []).length
        });
      });
      
      allUsers.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      return allUsers;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // Get all registrations
  async function getAllRegistrations() {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      let allRegistrations = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (userData.registrations && userData.registrations.length > 0) {
          const registrationsWithUser = userData.registrations.map(reg => ({
            ...reg,
            userId: userDoc.id,
            userEmail: userData.email || 'Unknown',
            userDisplayName: userData.displayName || 'Unknown',
            isAdmin: userData.isAdmin || false,
            isSuperAdmin: userData.isSuperAdmin || false
          }));
          allRegistrations = [...allRegistrations, ...registrationsWithUser];
        }
      }
      
      allRegistrations.sort((a, b) => {
        return new Date(b.registeredAt) - new Date(a.registeredAt);
      });
      
      return allRegistrations;
    } catch (error) {
      console.error('Error fetching all registrations:', error);
      return [];
    }
  }

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error loading user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
    getUserData,
    saveRegistration,
    getUserRegistrations,
    getAllUsers,
    getAllRegistrations,
    updateRegistration,
    deleteRegistration,
    deleteUser,
    SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}