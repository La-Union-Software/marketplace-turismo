import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, Post, BasePost, UserRole, UserRoleAssignment, MercadoPagoCredentials, MobbexCredentials, SubscriptionPlan, UserSubscription, ServiceCategory, Pricing, Booking, BookingStatus, Notification, NotificationType } from '@/types';
import { SYSTEM_ROLES, PermissionService } from './permissionsService';

// Authentication Services
export const firebaseAuth = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      if (userData.name) {
        await updateProfile(user, { displayName: userData.name });
      }
      
      // Create user document in Firestore
      const defaultRole: UserRoleAssignment = {
        roleId: 'role_client',
        roleName: 'client',
        assignedAt: new Date(),
        isActive: true,
      };

      const newUser: User = {
        id: user.uid,
        name: userData.name || 'User',
        email: email,
        phone: userData.phone || '',
        avatar: userData.avatar || '',
        roles: [defaultRole],
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileCompleted: false,
      };
      
      await setDoc(doc(db, 'users', user.uid), newUser);
      
      return newUser;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};

// Database Services (Firestore)
export const firebaseDB = {
  // User operations
  users: {
    // Get user by ID
    async getById(userId: string): Promise<User | null> {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          return userDoc.data() as User;
        }
        return null;
      } catch (error) {
        console.error('Error getting user:', error);
        throw error;
      }
    },

    // Get all users
    async getAll(): Promise<User[]> {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users: User[] = [];
        usersSnapshot.forEach((doc) => {
          users.push(doc.data() as User);
        });
        return users;
      } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
      }
    },

    // Update user
    async update(userId: string, updates: Partial<User>): Promise<void> {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          ...updates,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },

    // Assign role to user
    async assignRole(userId: string, roleName: UserRole, assignedBy?: string): Promise<void> {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const user: User = userDoc.data() as User;
        const newRole: UserRoleAssignment = {
          roleId: `role_${roleName}`,
          roleName,
          assignedAt: new Date(),
          assignedBy: assignedBy || userId, // Use userId as fallback if assignedBy is undefined
          isActive: true,
        };

        // Validate role assignment
        const validation = PermissionService.validateRoleAssignment(user.roles, roleName);
        if (!validation.valid) {
          throw new Error(validation.message || 'Invalid role assignment');
        }

        // If adding superadmin, remove all other roles
        if (roleName === 'superadmin') {
          user.roles = user.roles.map(role => ({ ...role, isActive: false }));
        }

        // Add new role or update existing one
        const existingRoleIndex = user.roles.findIndex(role => role.roleName === roleName);
        if (existingRoleIndex >= 0) {
          user.roles[existingRoleIndex] = newRole;
        } else {
          user.roles.push(newRole);
        }

        // Ensure all role objects have required fields
        const validatedRoles = user.roles.map(role => ({
          roleId: role.roleId || `role_${role.roleName}`,
          roleName: role.roleName,
          assignedAt: role.assignedAt || new Date(),
          assignedBy: role.assignedBy || userId,
          isActive: role.isActive !== undefined ? role.isActive : true
        }));

        console.log('Updating user with roles:', validatedRoles);
        
        await updateDoc(userRef, {
          roles: validatedRoles,
          updatedAt: new Date()
        });
        
        console.log('Role assigned successfully');
      } catch (error) {
        console.error('Error assigning role:', error);
        throw error;
      }
    },

    // Remove role from user
    async removeRole(userId: string, roleName: UserRole, removedBy?: string): Promise<void> {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const user: User = userDoc.data() as User;
        const roleIndex = user.roles.findIndex(role => role.roleName === roleName);
        
        if (roleIndex >= 0) {
          user.roles[roleIndex] = {
            ...user.roles[roleIndex],
            isActive: false,
          };

          await updateDoc(userRef, {
            roles: user.roles,
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error removing role:', error);
        throw error;
      }
    },

    // Get users by role
    async getByRole(roleName: UserRole): Promise<User[]> {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users: User[] = [];
        
        usersSnapshot.forEach((doc) => {
          const user = doc.data() as User;
          if (user.roles && user.roles.some((role: UserRoleAssignment) => 
            role.roleName === roleName && role.isActive
          )) {
            users.push(user);
          }
        });
        
        return users;
      } catch (error) {
        console.error('Error getting users by role:', error);
        throw error;
      }
    },

    // Listen to user changes
    onUserChange(userId: string, callback: (user: User | null) => void) {
      const userRef = doc(db, 'users', userId);
      return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data() as User);
        } else {
          callback(null);
        }
      });
    }
  },

  // Role management operations
  roles: {
    // Get all system roles
    async getAll(): Promise<typeof SYSTEM_ROLES> {
      return SYSTEM_ROLES;
    },

    // Get role by name
    async getByName(roleName: UserRole): Promise<typeof SYSTEM_ROLES[0] | null> {
      const role = SYSTEM_ROLES.find(r => r.name === roleName);
      return role || null;
    },

    // Get users with specific role
    async getUsersWithRole(roleName: UserRole): Promise<User[]> {
      return firebaseDB.users.getByRole(roleName);
    }
  },

  // Post operations
  posts: {
    // Create new post
    async create(post: Omit<Post, 'id'>, userId: string): Promise<string> {
      try {
        const postsRef = collection(db, 'posts');
        const newPost = {
          ...post,
          userId,
          publisherId: userId,
          status: 'pending', // Posts start as pending for moderation
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const docRef = await addDoc(postsRef, newPost);
        return docRef.id;
      } catch (error) {
        console.error('Error creating post:', error);
        throw error;
      }
    },

    // Get post by ID
    async getById(postId: string): Promise<Post | null> {
      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          return { id: postDoc.id, ...postDoc.data() } as Post;
        }
        return null;
      } catch (error) {
        console.error('Error getting post:', error);
        throw error;
      }
    },

    // Get posts by user ID
    async getByUserId(userId: string): Promise<Post[]> {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        
        const posts: Post[] = [];
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() } as Post);
        });
        
        return posts;
      } catch (error) {
        console.error('Error getting user posts:', error);
        throw error;
      }
    },

    // Get posts by status
    async getByStatus(status: Post['status']): Promise<Post[]> {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('status', '==', status));
        const snapshot = await getDocs(q);
        
        const posts: Post[] = [];
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() } as Post);
        });
        
        return posts;
      } catch (error) {
        console.error('Error getting posts by status:', error);
        throw error;
      }
    },

    // Get all posts
    async getAll(): Promise<Post[]> {
      try {
        const postsRef = collection(db, 'posts');
        const snapshot = await getDocs(postsRef);
        
        const posts: Post[] = [];
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() } as Post);
        });
        
        return posts;
      } catch (error) {
        console.error('Error getting all posts:', error);
        throw error;
      }
    },

    // Update post
    async update(postId: string, updates: Partial<Post>): Promise<void> {
      try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          ...updates,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating post:', error);
        throw error;
      }
    },

    // Moderate post (approve/reject)
    async moderatePost(postId: string, status: 'approved' | 'rejected', moderatorId: string, notes?: string): Promise<void> {
      try {
        const postRef = doc(db, 'posts', postId);
        const updates: Partial<Post> = {
          status,
          moderationBy: moderatorId,
          moderationAt: new Date(),
          updatedAt: new Date()
        };

        if (notes) {
          updates.moderationNotes = notes;
        }

        if (status === 'approved') {
          updates.publishedAt = new Date();
        }

        await updateDoc(postRef, updates);
      } catch (error) {
        console.error('Error moderating post:', error);
        throw error;
      }
    },

    // Delete post
    async delete(postId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, 'posts', postId));
      } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
    },

    // Listen to posts changes
    onPostsChange(callback: (posts: Post[]) => void) {
      const postsRef = collection(db, 'posts');
      return onSnapshot(postsRef, (snapshot) => {
        const posts: Post[] = [];
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() } as Post);
        });
        callback(posts);
      });
    },

    // Listen to user posts changes
    onUserPostsChange(userId: string, callback: (posts: Post[]) => void) {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('userId', '==', userId));
      
      return onSnapshot(q, (snapshot) => {
        const posts: Post[] = [];
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() } as Post);
        });
        callback(posts);
      });
    }
  },

  // System Settings operations
  systemSettings: {
    // Get Mercado Pago credentials
    async getMercadoPagoCredentials(): Promise<MercadoPagoCredentials | null> {
      try {
        const settingsDoc = await getDoc(doc(db, 'systemSettings', 'mercadoPago'));
        if (settingsDoc.exists()) {
          return settingsDoc.data() as MercadoPagoCredentials;
        }
        return null;
      } catch (error) {
        console.error('Error getting Mercado Pago credentials:', error);
        throw error;
      }
    },

    // Save Mercado Pago credentials
    async saveMercadoPagoCredentials(credentials: Omit<MercadoPagoCredentials, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void> {
      try {
        const settingsRef = doc(db, 'systemSettings', 'mercadoPago');
        const now = new Date();
        
        const newCredentials: MercadoPagoCredentials = {
          id: 'mercadoPago',
          ...credentials,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        };

        await setDoc(settingsRef, newCredentials);
      } catch (error) {
        console.error('Error saving Mercado Pago credentials:', error);
        throw error;
      }
    },

    // Update Mercado Pago credentials
    async updateMercadoPagoCredentials(updates: Partial<Omit<MercadoPagoCredentials, 'id' | 'createdAt'>>, userId: string): Promise<void> {
      try {
        const settingsRef = doc(db, 'systemSettings', 'mercadoPago');
        await updateDoc(settingsRef, {
          ...updates,
          updatedAt: new Date(),
          updatedBy: userId,
        });
      } catch (error) {
        console.error('Error updating Mercado Pago credentials:', error);
        throw error;
      }
    },

    // Get Mobbex credentials
    async getMobbexCredentials(): Promise<MobbexCredentials | null> {
      try {
        const settingsDoc = await getDoc(doc(db, 'systemSettings', 'mobbex'));
        if (settingsDoc.exists()) {
          return settingsDoc.data() as MobbexCredentials;
        }
        return null;
      } catch (error) {
        console.error('Error getting Mobbex credentials:', error);
        throw error;
      }
    },

    // Save Mobbex credentials
    async saveMobbexCredentials(credentials: Omit<MobbexCredentials, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void> {
      try {
        const settingsRef = doc(db, 'systemSettings', 'mobbex');
        const now = new Date();
        
        const newCredentials: MobbexCredentials = {
          id: 'mobbex',
          ...credentials,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        };

        await setDoc(settingsRef, newCredentials);
      } catch (error) {
        console.error('Error saving Mobbex credentials:', error);
        throw error;
      }
    },

    // Update Mobbex credentials
    async updateMobbexCredentials(updates: Partial<Omit<MobbexCredentials, 'id' | 'createdAt'>>, userId: string): Promise<void> {
      try {
        const settingsRef = doc(db, 'systemSettings', 'mobbex');
        await updateDoc(settingsRef, {
          ...updates,
          updatedAt: new Date(),
          updatedBy: userId,
        });
      } catch (error) {
        console.error('Error updating Mobbex credentials:', error);
        throw error;
      }
    },

    // Listen to Mercado Pago credentials changes
    onMercadoPagoCredentialsChange(callback: (credentials: MercadoPagoCredentials | null) => void) {
      const settingsRef = doc(db, 'systemSettings', 'mercadoPago');
      return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data() as MercadoPagoCredentials);
        } else {
          callback(null);
        }
      });
    }
  },

  // Subscription Plans operations
  plans: {
    // Create new subscription plan
    async create(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
      try {
        const plansRef = collection(db, 'subscriptionPlans');
        const newPlan = {
          ...plan,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        };
        
        const docRef = await addDoc(plansRef, newPlan);
        return docRef.id;
      } catch (error) {
        console.error('Error creating subscription plan:', error);
        throw error;
      }
    },

    // Get all plans
    async getAll(): Promise<SubscriptionPlan[]> {
      try {
        const plansRef = collection(db, 'subscriptionPlans');
        const snapshot = await getDocs(plansRef);
        
        const plans: SubscriptionPlan[] = [];
        snapshot.forEach((doc) => {
          plans.push({ id: doc.id, ...doc.data() } as SubscriptionPlan);
        });
        
        return plans.sort((a, b) => a.price - b.price);
      } catch (error) {
        console.error('Error getting all subscription plans:', error);
        throw error;
      }
    },

    // Update plan
    async update(planId: string, updates: Partial<Omit<SubscriptionPlan, 'id' | 'createdAt' | 'createdBy'>>, userId: string): Promise<void> {
      try {
        const planRef = doc(db, 'subscriptionPlans', planId);
        await updateDoc(planRef, {
          ...updates,
          updatedAt: new Date(),
          updatedBy: userId,
        });
      } catch (error) {
        console.error('Error updating subscription plan:', error);
        throw error;
      }
    },

    // Delete plan
    async delete(planId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, 'subscriptionPlans', planId));
      } catch (error) {
        console.error('Error deleting subscription plan:', error);
        throw error;
      }
    },

    // Toggle plan active status
    async toggleActive(planId: string, isActive: boolean, userId: string): Promise<void> {
      try {
        const planRef = doc(db, 'subscriptionPlans', planId);
        await updateDoc(planRef, {
          isActive,
          updatedAt: new Date(),
          updatedBy: userId,
        });
      } catch (error) {
        console.error('Error toggling plan active status:', error);
        throw error;
      }
    }
  },

  // Posts Collection
  posts: {
    async create(postData: Omit<BasePost, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
      try {
        // Filter out undefined values to avoid Firebase errors
        const cleanData = Object.fromEntries(
          Object.entries(postData).filter(([_, value]) => value !== undefined)
        );
        
        const docRef = await addDoc(collection(db, 'posts'), {
          ...cleanData,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return docRef.id;
      } catch (error) {
        console.error('Error creating post:', error);
        throw new Error('Failed to create post');
      }
    },

    // Create post with images in subcollection
    async createWithImages(postData: Omit<BasePost, 'id' | 'createdAt' | 'updatedAt' | 'images'>, images: string[], userId: string): Promise<string> {
      try {
        // First create the post without images
        const cleanData = Object.fromEntries(
          Object.entries(postData).filter(([_, value]) => value !== undefined)
        );
        
        const docRef = await addDoc(collection(db, 'posts'), {
          ...cleanData,
          images: [], // Empty array for now, will be populated with image references
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Save images to subcollection
        if (images.length > 0) {
          const imageRefs = await firebaseDB.postImages.createMultiple(docRef.id, images);
          
          // Update the post with image references
          await updateDoc(docRef, {
            images: imageRefs,
            updatedAt: serverTimestamp(),
          });
        }

        return docRef.id;
      } catch (error) {
        console.error('Error creating post with images:', error);
        throw new Error('Failed to create post with images');
      }
    },

    async getById(postId: string): Promise<BasePost | null> {
      try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as BasePost;
        }
        return null;
      } catch (error) {
        console.error('Error getting post:', error);
        throw new Error('Failed to get post');
      }
    },

    async getByUserId(userId: string): Promise<BasePost[]> {
      try {
        const q = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as BasePost[];
      } catch (error) {
        console.error('Error getting user posts:', error);
        throw new Error('Failed to get user posts');
      }
    },

    async getAll(): Promise<BasePost[]> {
      try {
        const q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as BasePost[];
      } catch (error) {
        console.error('Error getting all posts:', error);
        throw new Error('Failed to get posts');
      }
    },

    async update(postId: string, updates: Partial<Omit<BasePost, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
      try {
        // Filter out undefined values to avoid Firebase errors
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== undefined)
        );
        
        const docRef = doc(db, 'posts', postId);
        await updateDoc(docRef, {
          ...cleanUpdates,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating post:', error);
        throw new Error('Failed to update post');
      }
    },

    async delete(postId: string): Promise<void> {
      try {
        const docRef = doc(db, 'posts', postId);
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting post:', error);
        throw new Error('Failed to delete post');
      }
    },

    async searchByLocation(location: string): Promise<BasePost[]> {
      try {
        const q = query(
          collection(db, 'posts'),
          where('location', '>=', location),
          where('location', '<=', location + '\uf8ff'),
          orderBy('location'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as BasePost[];
      } catch (error) {
        console.error('Error searching posts by location:', error);
        throw new Error('Failed to search posts by location');
      }
    },

    async getByCategory(category: ServiceCategory): Promise<BasePost[]> {
      try {
        const q = query(
          collection(db, 'posts'),
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as BasePost[];
      } catch (error) {
        console.error('Error getting posts by category:', error);
        throw new Error('Failed to get posts by category');
      }
    },
  },

  // Post Images Subcollection
  postImages: {
    async create(postId: string, imageData: string, order: number = 0): Promise<string> {
      try {
        const imageRef = await addDoc(collection(db, 'posts', postId, 'images'), {
          data: imageData,
          order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return imageRef.id;
      } catch (error) {
        console.error('Error creating post image:', error);
        throw new Error('Failed to create post image');
      }
    },

    async createMultiple(postId: string, images: string[]): Promise<string[]> {
      try {
        const imageRefs: string[] = [];
        
        for (let i = 0; i < images.length; i++) {
          const imageRef = await firebaseDB.postImages.create(postId, images[i], i);
          imageRefs.push(imageRef);
        }
        
        return imageRefs;
      } catch (error) {
        console.error('Error creating multiple post images:', error);
        throw new Error('Failed to create multiple post images');
      }
    },

    async getByPostId(postId: string): Promise<{ id: string; data: string; order: number }[]> {
      try {
        const q = query(
          collection(db, 'posts', postId, 'images'),
          orderBy('order', 'asc')
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data().data,
          order: doc.data().order,
        }));
      } catch (error) {
        console.error('Error getting post images:', error);
        throw new Error('Failed to get post images');
      }
    },

    async getById(postId: string, imageId: string): Promise<{ id: string; data: string; order: number } | null> {
      try {
        const imageDoc = await getDoc(doc(db, 'posts', postId, 'images', imageId));
        if (imageDoc.exists()) {
          return {
            id: imageDoc.id,
            data: imageDoc.data().data,
            order: imageDoc.data().order,
          };
        }
        return null;
      } catch (error) {
        console.error('Error getting post image:', error);
        throw new Error('Failed to get post image');
      }
    },

    async delete(postId: string, imageId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, 'posts', postId, 'images', imageId));
      } catch (error) {
        console.error('Error deleting post image:', error);
        throw new Error('Failed to delete post image');
      }
    },

    async deleteAll(postId: string): Promise<void> {
      try {
        const images = await firebaseDB.postImages.getByPostId(postId);
        const deletePromises = images.map(image => 
          firebaseDB.postImages.delete(postId, image.id)
        );
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error deleting all post images:', error);
        throw new Error('Failed to delete all post images');
      }
    },

    async updateOrder(postId: string, imageId: string, newOrder: number): Promise<void> {
      try {
        await updateDoc(doc(db, 'posts', postId, 'images', imageId), {
          order: newOrder,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating image order:', error);
        throw new Error('Failed to update image order');
      }
    },
  },

  // Bookings Collection
  bookings: {
    async create(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'post' | 'client' | 'owner'>): Promise<string> {
      try {
        const cleanData = Object.fromEntries(
          Object.entries(bookingData).filter(([_, value]) => value !== undefined)
        );
        
        const docRef = await addDoc(collection(db, 'bookings'), {
          ...cleanData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return docRef.id;
      } catch (error) {
        console.error('Error creating booking:', error);
        throw new Error('Failed to create booking');
      }
    },

    async getById(bookingId: string): Promise<Booking | null> {
      try {
        const docRef = doc(db, 'bookings', bookingId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const booking = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            acceptedAt: data.acceptedAt?.toDate(),
            declinedAt: data.declinedAt?.toDate(),
            paidAt: data.paidAt?.toDate(),
            cancelledAt: data.cancelledAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
          } as Booking;

          // Populate post, client, and owner data
          try {
            const [post, client, owner] = await Promise.all([
              firebaseDB.posts.getById(booking.postId),
              firebaseDB.users.getById(booking.clientId),
              firebaseDB.users.getById(booking.ownerId),
            ]);

            if (post) booking.post = post;
            if (client) booking.client = client;
            if (owner) booking.owner = owner;
          } catch (populateError) {
            console.error('Error populating booking data:', populateError);
            // Continue with booking even if population fails
          }

          return booking;
        }
        return null;
      } catch (error) {
        console.error('Error getting booking:', error);
        throw new Error('Failed to get booking');
      }
    },

    async getByUserId(userId: string): Promise<Booking[]> {
      try {
        const q = query(
          collection(db, 'bookings'),
          where('clientId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const bookings: Booking[] = [];
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const booking = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            acceptedAt: data.acceptedAt?.toDate(),
            declinedAt: data.declinedAt?.toDate(),
            paidAt: data.paidAt?.toDate(),
            cancelledAt: data.cancelledAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
          } as Booking;

          // Populate post, client, and owner data
          try {
            const [post, client, owner] = await Promise.all([
              firebaseDB.posts.getById(booking.postId),
              firebaseDB.users.getById(booking.clientId),
              firebaseDB.users.getById(booking.ownerId),
            ]);

            if (post) booking.post = post;
            if (client) booking.client = client;
            if (owner) booking.owner = owner;
          } catch (populateError) {
            console.error('Error populating booking data:', populateError);
            // Continue with booking even if population fails
          }

          bookings.push(booking);
        }
        
        return bookings;
      } catch (error) {
        console.error('Error getting user bookings:', error);
        throw new Error('Failed to get user bookings');
      }
    },

    async getByOwnerId(ownerId: string): Promise<Booking[]> {
      try {
        const q = query(
          collection(db, 'bookings'),
          where('ownerId', '==', ownerId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const bookings: Booking[] = [];
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const booking = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            acceptedAt: data.acceptedAt?.toDate(),
            declinedAt: data.declinedAt?.toDate(),
            paidAt: data.paidAt?.toDate(),
            cancelledAt: data.cancelledAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
          } as Booking;

          // Populate post, client, and owner data
          try {
            const [post, client, owner] = await Promise.all([
              firebaseDB.posts.getById(booking.postId),
              firebaseDB.users.getById(booking.clientId),
              firebaseDB.users.getById(booking.ownerId),
            ]);

            if (post) booking.post = post;
            if (client) booking.client = client;
            if (owner) booking.owner = owner;
          } catch (populateError) {
            console.error('Error populating booking data:', populateError);
            // Continue with booking even if population fails
          }

          bookings.push(booking);
        }
        
        return bookings;
      } catch (error) {
        console.error('Error getting owner bookings:', error);
        throw new Error('Failed to get owner bookings');
      }
    },

    async updateStatus(bookingId: string, status: BookingStatus, additionalData?: Record<string, unknown>): Promise<void> {
      try {
        const docRef = doc(db, 'bookings', bookingId);
        const updateData: Record<string, unknown> = {
          status,
          updatedAt: serverTimestamp(),
        };

        // Add timestamp based on status
        switch (status) {
          case 'accepted':
            updateData.acceptedAt = serverTimestamp();
            break;
          case 'declined':
            updateData.declinedAt = serverTimestamp();
            break;
          case 'paid':
            updateData.paidAt = serverTimestamp();
            break;
          case 'cancelled':
            updateData.cancelledAt = serverTimestamp();
            break;
          case 'completed':
            updateData.completedAt = serverTimestamp();
            break;
        }

        // Add additional data if provided
        if (additionalData) {
          Object.assign(updateData, additionalData);
        }

        await updateDoc(docRef, updateData);
      } catch (error) {
        console.error('Error updating booking status:', error);
        throw new Error('Failed to update booking status');
      }
    },

    async delete(bookingId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, 'bookings', bookingId));
      } catch (error) {
        console.error('Error deleting booking:', error);
        throw new Error('Failed to delete booking');
      }
    },
  },

  // Notifications Collection
  notifications: {
    async create(notificationData: Omit<Notification, 'id' | 'createdAt' | 'readAt'>): Promise<string> {
      try {
        const cleanData = Object.fromEntries(
          Object.entries(notificationData).filter(([_, value]) => value !== undefined)
        );
        
        const docRef = await addDoc(collection(db, 'notifications'), {
          ...cleanData,
          isRead: false,
          createdAt: serverTimestamp(),
        });
        return docRef.id;
      } catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
      }
    },

    async getByUserId(userId: string): Promise<Notification[]> {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          readAt: doc.data().readAt?.toDate(),
        })) as Notification[];
      } catch (error) {
        console.error('Error getting user notifications:', error);
        throw new Error('Failed to get user notifications');
      }
    },

    async markAsRead(notificationId: string): Promise<void> {
      try {
        const docRef = doc(db, 'notifications', notificationId);
        await updateDoc(docRef, {
          isRead: true,
          readAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
      }
    },

    async markAllAsRead(userId: string): Promise<void> {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('isRead', '==', false)
        );
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            isRead: true,
            readAt: serverTimestamp(),
          });
        });
        
        await batch.commit();
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error('Failed to mark all notifications as read');
      }
    },

    async getUnreadCount(userId: string): Promise<number> {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('isRead', '==', false)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
      } catch (error) {
        console.error('Error getting unread count:', error);
        throw new Error('Failed to get unread count');
      }
    },

    async delete(notificationId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, 'notifications', notificationId));
      } catch (error) {
        console.error('Error deleting notification:', error);
        throw new Error('Failed to delete notification');
      }
    },
  },

  // User Mobbex Credentials
  userMobbexCredentials: {
    async save(userId: string, credentials: Record<string, unknown>): Promise<void> {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          mobbexCredentials: {
            ...credentials,
            isConnected: true,
            connectedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error saving user Mobbex credentials:', error);
        throw new Error('Failed to save Mobbex credentials');
      }
    },

    async get(userId: string): Promise<Record<string, unknown> | null> {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return userData.mobbexCredentials || null;
        }
        return null;
      } catch (error) {
        console.error('Error getting user Mobbex credentials:', error);
        throw new Error('Failed to get Mobbex credentials');
      }
    },

    async disconnect(userId: string): Promise<void> {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          mobbexCredentials: null,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error disconnecting Mobbex:', error);
        throw new Error('Failed to disconnect Mobbex');
      }
    },
  }
};
