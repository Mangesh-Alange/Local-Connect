import { useState, useCallback } from 'react';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const useProviderServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const db = getFirestore();

  // Fetch provider's services
  const fetchServices = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'services'), where('ownerUid', '==', user.uid));
      const snapshot = await getDocs(q);
      const servicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesList);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, db]);

  // Add new service
  const addService = useCallback(async (serviceData) => {
    if (!user?.uid) {
      console.error('[useProviderServices] ❌ User not authenticated');
      setError('User not authenticated');
      return null;
    }

    console.log('[useProviderServices] 📝 Starting addService with user UID:', user.uid);
    setLoading(true);
    setError(null);
    try {
      const newService = {
        ownerUid: user.uid,
        ownerName: user.displayName || 'Unknown',
        ownerEmail: user.email,
        businessName: serviceData.businessName,
        category: serviceData.category,
        description: serviceData.description,
        phone: serviceData.phone,
        email: serviceData.email,
        website: serviceData.website,
        location: {
          state: serviceData.state,
          city: serviceData.city,
          address: serviceData.address
        },
        price: serviceData.price || '₹500/hr',
        trustScore: 80, // Default trust score for new services
        rating: 5.0,
        reviews: 0,
        verified: false,
        image: serviceData.image || `https://ui-avatars.com/api/?name=${serviceData.businessName}&background=random&color=fff&size=150`,
        documentUrl: serviceData.documentUrl || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log('[useProviderServices] 🔄 Attempting to write to Firestore:', newService);
      const docRef = await addDoc(collection(db, 'services'), newService);
      console.log('[useProviderServices] ✅ Document created with ID:', docRef.id);
      
      // Add to local state
      setServices(prev => [...prev, { id: docRef.id, ...newService }]);
      console.log('[useProviderServices] ✅ Added to local state');
      
      return docRef.id;
    } catch (err) {
      console.error('[useProviderServices] ❌ Error adding service:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.displayName, user?.email, db]);

  // Update service
  const updateService = useCallback(async (serviceId, serviceData) => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const serviceRef = doc(db, 'services', serviceId);
      const updateData = {
        businessName: serviceData.businessName,
        category: serviceData.category,
        description: serviceData.description,
        phone: serviceData.phone,
        email: serviceData.email,
        website: serviceData.website,
        location: {
          state: serviceData.state,
          city: serviceData.city,
          address: serviceData.address
        },
        price: serviceData.price,
        updatedAt: Timestamp.now()
      };

      await updateDoc(serviceRef, updateData);
      
      // Update local state
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, ...updateData } : s
      ));
    } catch (err) {
      setError(err.message);
      console.error('Error updating service:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, db]);

  // Delete service
  const deleteService = useCallback(async (serviceId) => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'services', serviceId));
      
      // Remove from local state
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting service:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, db]);

  return {
    services,
    loading,
    error,
    fetchServices,
    addService,
    updateService,
    deleteService
  };
};
