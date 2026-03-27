import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Upload, AlertCircle, CheckCircle2, Building2, Contact2, MapPin, Phone, Mail, Globe, FileUp, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProviderServices } from '../hooks/useProviderServices';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addService } = useProviderServices();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    state: '',
    city: '',
    address: '',
  });

  const categories = [
    'Plumbers',
    'Electricians',
    'Hospitals',
    'Doctors',
    'Grocery Stores',
    'Courier Services',
    'Carpenters',
    'Cleaning Services',
    'AC Repair',
    'Pest Control',
    'Moving & Transportation',
    'Cooks & Catering'
  ];

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters';
    }

    if (stepNum === 2) {
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Phone must be 10 digits';
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    if (stepNum === 3) {
      if (!uploadedFile) newErrors.document = 'Document upload is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, document: 'Only PDF, JPG, and PNG files are allowed' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, document: 'File size must be less than 5MB' }));
        return;
      }
      setUploadedFile(file);
      setErrors(prev => ({ ...prev, document: '' }));
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    
    console.log('[AddService] ========== FORM SUBMISSION START ==========');
    console.log('[AddService] User UID:', user?.uid);
    console.log('[AddService] Form data:', formData);
    console.log('[AddService] File:', uploadedFile?.name, uploadedFile?.size);
    
    // Safety timeout to prevent button from getting stuck
    const submitTimeout = setTimeout(() => {
      console.error('[AddService] ❌ TIMEOUT: Request exceeded 30 seconds');
      setIsSubmitting(false);
      setErrors({ submit: 'Request timed out. Please try again.' });
    }, 30000);

    try {
      let documentUrl = null;

      // Upload file to Cloud Storage if provided
      if (uploadedFile && user?.uid) {
        console.log('[AddService] 📁 Starting file upload...');
        try {
          const storage = getStorage();
          const fileName = `${user.uid}_${Date.now()}_${uploadedFile.name}`;
          const fileRef = ref(storage, `service-documents/${fileName}`);
          
          console.log('[AddService] Uploading to:', `service-documents/${fileName}`);
          const snapshot = await uploadBytes(fileRef, uploadedFile);
          documentUrl = await getDownloadURL(snapshot.ref);
          console.log('[AddService] ✅ File uploaded:', documentUrl);
        } catch (uploadErr) {
          console.error('[AddService] ❌ File upload failed:', uploadErr);
          throw new Error(`File upload failed: ${uploadErr.message}`);
        }
      }

      // Add service data with document URL
      const serviceDataWithDoc = {
        ...formData,
        documentUrl
      };

      console.log('[AddService] 🚀 Adding service to Firestore...');
      console.log('[AddService] Service data:', serviceDataWithDoc);
      
      const serviceId = await addService(serviceDataWithDoc);
      console.log('[AddService] ✅ Service added successfully with ID:', serviceId);
      
      // Clear timeout since operation completed
      clearTimeout(submitTimeout);
      
      // Show success screen
      setIsSuccess(true);
      console.log('[AddService] 🎉 Showing success screen');
      
      // Redirect to provider dashboard after 2 seconds
      setTimeout(() => {
        console.log('[AddService] 📍 Redirecting to provider dashboard');
        navigate('/provider-dashboard');
      }, 2000);
    } catch (err) {
      console.error('[AddService] ❌ ERROR during submission:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      clearTimeout(submitTimeout);
      setErrors({ submit: `Error: ${err.message}` });
    } finally {
      console.log('[AddService] ========== FORM SUBMISSION END ==========');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[80vh] flex flex-col items-center justify-center">
      
      <div className="text-center mb-10 w-full max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Become a Verified Provider</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Join India's most trusted local service network. Reach thousands of customers daily with zero upfront fees.</p>
      </div>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden"
          >
            {/* Progress Steps */}
            <div className="flex justify-between items-center mb-8 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 -z-10 rounded-full" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-indigo-600 transition-all duration-500 -translate-y-1/2 -z-10 rounded-full" 
                style={{ width: `${((step - 1) / 2) * 100}%` }} 
              />
              {[
                { label: 'Business Details', icon: Building2 },
                { label: 'Location & Contact', icon: MapPin },
                { label: 'Verification', icon: ShieldCheck }
              ].map((s, i) => {
                const Icon = s.icon;
                const active = step >= i + 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold relative z-10 transition-colors duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wider hidden sm:block ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Business Name *</label>
                      <input 
                        type="text" 
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${errors.businessName ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-slate-900 dark:text-white`}
                        placeholder="e.g. Sharma Plumbing"
                      />
                      {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Service Category *</label>
                      <select 
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${errors.category ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-slate-900 dark:text-white`}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description (min. 20 chars) *</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4" 
                      className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-slate-900 dark:text-white resize-none`}
                      placeholder="Briefly describe your services, experience, and what makes you unique..."
                    ></textarea>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">Tell customers what you offer</p>
                      <p className={`text-xs ${formData.description.length < 20 ? 'text-red-500' : 'text-emerald-500'}`}>{formData.description.length}/200</p>
                    </div>
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">State *</label>
                      <input 
                        type="text" 
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${errors.state ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-slate-900 dark:text-white`}
                        placeholder="Maharashtra"
                      />
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">City / District *</label>
                      <input 
                        type="text" 
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${errors.city ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-slate-900 dark:text-white`}
                        placeholder="Mumbai"
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Complete Address *</label>
                    <textarea 
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2" 
                      className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-slate-900 dark:text-white resize-none`}
                      placeholder="123 Main Street, Andheri..."
                    ></textarea>
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Contact2 size={18} />Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone (10 digits)</label>
                        <div className="flex items-center">
                          <span className="px-3 py-3 text-slate-500 text-sm">+91</span>
                          <input 
                            type="tel" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`flex-1 px-4 py-3 rounded-r-xl bg-slate-50 dark:bg-slate-950 border transition-all ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-slate-900 dark:text-white`}
                            placeholder="9876543210"
                          />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-slate-900 dark:text-white`}
                          placeholder="business@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>
                    <div className="space-y-1 mt-4">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Website (Optional)</label>
                      <input 
                        type="url" 
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex gap-3 text-blue-800 dark:text-blue-200">
                    <ShieldCheck className="shrink-0 mt-0.5" size={18} />
                    <p className="text-sm"><strong>Verification Benefits:</strong> Verified providers get prioritized in search results, a trust badge on their profile, and higher visibility to customers looking for reliable services.</p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-200">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <p className="text-sm">Upload a valid <strong>business registration</strong>, <strong>GST certificate</strong>, or <strong>government ID</strong> to verify your listing and calculate your initial Trust Score™.</p>
                  </div>

                  {!uploadedFile ? (
                    <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group">
                      <input 
                        type="file" 
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform text-indigo-500">
                        <Upload size={28} />
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white mb-1">Click to upload document</p>
                      <p className="text-xs text-slate-500">PDF, JPG or PNG (max. 5MB)</p>
                    </label>
                  ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                          <FileUp size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{uploadedFile.name}</p>
                          <p className="text-xs text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                  {errors.document && <p className="text-red-500 text-xs">{errors.document}</p>}

                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Accepted Documents:</h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <li>✓ GST Certificate</li>
                      <li>✓ Business Registration / Incorporation Certificate</li>
                      <li>✓ Trade License</li>
                      <li>✓ Aadhaar / PAN Card</li>
                      <li>✓ Passport / Driving License</li>
                    </ul>
                  </div>

                </motion.div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                {step > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setStep(step - 1)} 
                    className="px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Back
                  </button>
                ) : <div />}
                
                {step < 3 ? (
                  <button 
                    type="button" 
                    onClick={handleNext}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all flex justify-center w-32"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="px-8 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-semibold shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all w-48 flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-2xl text-center space-y-6 flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Received!</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Thank you for applying! Your business listing <strong>{formData.businessName}</strong> has been submitted to the LocalConnect verification team.
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-xs mt-3 font-medium">
                ✓ Verification typically completes in 24-48 hours<br/>
                ✓ You'll receive an email update when approved<br/>
                ✓ Your Trust Score will be calculated upon verification
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/'} 
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl mt-4 hover:shadow-lg transition-all"
            >
              Return Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
