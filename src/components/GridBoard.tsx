
import React, { useRef, useState, Suspense, lazy } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ArrowLeft, Users, Calendar, Hash, Layout, Type, AlertCircle, Sparkles, Camera, Rocket, Heart, Download, Drama } from "lucide-react";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { GridProvider } from './square/context/GridContext';
import { Link, useNavigate } from "react-router-dom";
import { useCollage, GridTemplate } from '../context/CollageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from "framer-motion";
import PhoneOtpBlock from '@/components/otp/PhoneOtpBlock';
// import "./grid.css";

// Animated celebration background
const CelebrationParticle = ({ delay = 0 }) => (
  <motion.div
    className="absolute w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      y: [-10, -50],
      x: [-10, 10]
    }}
    transition={{ 
      duration: 2,
      delay,
      repeat: Infinity,
      ease: "easeOut"
    }}
  />
);

const AnimatedFriendGroup = () => (
  <>
    {/* Right group - hidden on smallest screens */}
    <motion.div 
      className="absolute bottom-0 right-0 hidden sm:block w-[150px] md:w-[200px] lg:w-[300px] h-[100px] md:h-[150px] lg:h-[200px] opacity-10"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 0.1 }}
      transition={{ duration: 1 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <motion.path
          d="M20,80 Q30,60 40,80 Q50,60 60,80 Q70,60 80,80"
          stroke="url(#gradient)"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>

    {/* Left group - hidden on smallest screens */}
    <motion.div 
      className="absolute bottom-0 left-0 hidden sm:block w-[150px] md:w-[200px] lg:w-[300px] h-[100px] md:h-[150px] lg:h-[200px] opacity-10"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 0.1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <motion.path
          d="M20,80 Q30,60 40,80 Q50,60 60,80 Q70,60 80,80"
          stroke="url(#gradient2)"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <defs>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>

    {/* Center celebration elements - responsive sizing */}
    <motion.div 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1, delay: 1 }}
    >
      <motion.div
        className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 sm:border-4 border-yellow-400/20"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>

    {/* Mobile-only center group */}
    <motion.div 
      className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 sm:hidden w-[200px] h-[100px] opacity-10"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 0.1 }}
      transition={{ duration: 1 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <motion.path
          d="M20,80 Q30,60 40,80 Q50,60 60,80 Q70,60 80,80"
          stroke="url(#gradient3)"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <defs>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  </>
);

const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    {/* Base gradient - more subtle on mobile */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 sm:from-purple-400/10 via-pink-400/5 sm:via-pink-400/10 to-yellow-400/5 sm:to-yellow-400/10 animate-gradient-xy" />
    
    {/* Celebration pattern */}
    <div className="absolute inset-0">
      <div className="relative w-full h-full">
        {/* Animated particles - fewer on mobile */}
        {Array.from({ length: window.innerWidth < 640 ? 10 : 20 }).map((_, i) => (
          <CelebrationParticle key={i} delay={i * 0.1} />
        ))}
        
        {/* Animated friend groups */}
        <AnimatedFriendGroup />

        {/* Additional decorative elements - hidden on mobile */}
        <motion.div className="absolute bottom-10 left-10 hidden sm:block opacity-10">
          <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 sm:border-4 border-purple-400"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 10, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>
    </div>

    {/* Decorative lines - adjusted for mobile */}
    <svg className="absolute inset-0 w-full h-full opacity-3 sm:opacity-5" xmlns="http://www.w3.org/2000/svg">
      <pattern 
        id="friendPattern" 
        x="0" 
        y="0" 
        width="50" 
        height="50" 
        patternUnits="userSpaceOnUse"
        className="sm:w-[100] sm:h-[100]"
      >
        <path 
          d="M10,25 Q15,10 20,25 Q25,10 30,25 Q35,10 40,25" 
          className="sm:d-[M20,50 Q30,20 40,50 Q50,20 60,50 Q70,20 80,50]"
          stroke="currentColor" 
          fill="none" 
        />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#friendPattern)" />
    </svg>

    {/* Subtle blur overlay - reduced on mobile */}
    <div className="absolute inset-0 backdrop-blur-xl sm:backdrop-blur-3xl" />
  </div>
);

interface CellImage {
  [key: string]: string;
}

interface FormErrors {
  name?: string;
  yearOfPassing?: string;
  totalMembers?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

const GridBoard = () => {
  const [cellImages, setCellImages] = useState<CellImage>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [PreviewComp, setPreviewComp] = useState<React.LazyExoticComponent<React.ComponentType> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    yearOfPassing: "",
    totalMembers: "",
    gridTemplate: "square" as GridTemplate,
    logoFile: null as File | null,
    logoPreview: "",
    customText: ""
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createGroup, isLoading } = useCollage();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);

  // Map of all TSX components in this folder
  // We will look for files like "33.tsx", "37.tsx", or any "n.tsx"
  const componentModules = import.meta.glob('./square/*.tsx');

  // Validation functions
  const validateGroupName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Group name is required";
    }
    if (name.trim().length < 3) {
      return "Group name must be at least 3 characters long";
    }
    if (name.trim().length > 100) {
      return "Group name must be less than 100 characters";
    }
    if (!/^[a-zA-Z0-9\s\-_&()]+$/.test(name.trim())) {
      return "Group name contains invalid characters";
    }
    return undefined;
  };

  const validateYearOfPassing = (year: string): string | undefined => {
    if (!year.trim()) {
      return "Year of passing is required";
    }
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum)) {
      return "Please enter a valid year";
    }
    if (yearNum < 1950) {
      return "Year must be 1950 or later";
    }
    if (yearNum > currentYear + 10) {
      return `Year cannot be more than ${currentYear + 10}`;
    }
    return undefined;
  };

  const validateTotalMembers = (members: string): string | undefined => {
    if (!members.trim()) {
      return "Total members is required";
    }
    const membersNum = parseInt(members);
    if (isNaN(membersNum)) {
      return "Please enter a valid number";
    }
    if (membersNum < 1) {
      return "Total members must be at least 1";
    }
    if (membersNum > 1000) {
      return "Total members cannot exceed 1000";
    }
    return undefined;
  };

  const validateForm = (data: typeof formData): ValidationResult => {
    const errors: FormErrors = {};
    
    errors.name = validateGroupName(data.name);
    errors.yearOfPassing = validateYearOfPassing(data.yearOfPassing);
    errors.totalMembers = validateTotalMembers(data.totalMembers);

    // Remove undefined errors
    Object.keys(errors).forEach(key => {
      if (errors[key as keyof FormErrors] === undefined) {
        delete errors[key as keyof FormErrors];
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Handle field changes with real-time validation
  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate the specific field
    let fieldError: string | undefined;
    switch (field) {
      case 'name':
        fieldError = validateGroupName(value);
        break;
      case 'yearOfPassing':
        fieldError = validateYearOfPassing(value);
        break;
      case 'totalMembers':
        fieldError = validateTotalMembers(value);
        break;
    }
    
    setFormErrors(prev => ({
      ...prev,
      [field]: fieldError
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      name: true,
      yearOfPassing: true,
      totalMembers: true
    });

    // Validate entire form
    const validation = validateForm(formData);
    setFormErrors(validation.errors);

    if (!validation.isValid) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        yearOfPassing: formData.yearOfPassing.trim(),
        totalMembers: parseInt(formData.totalMembers),
        gridTemplate: formData.gridTemplate
      };
      if (isPhoneVerified && phone) {
        payload.phone = phone;
        payload.phoneVerified = true;
      }
      const groupId = await createGroup(payload);

      // Update user data to mark as leader and set groupId
      if (user) {
        updateUser({ 
          isLeader: true, 
          groupId 
        });
      }

      toast.success("Group created successfully!");
      navigate(`/dashboard`);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCellClick = (cellType: string, position?: { row: number, col: number }) => {
    let cellKey: string;
    
    if (cellType === 'center') {
      cellKey = 'center';
      console.log('Center cell clicked');
    } else {
      cellKey = `${position?.row}-${position?.col}`;
      console.log(`Border cell clicked: row ${position?.row}, col ${position?.col}`);
    }
    
    setSelectedCell(cellKey);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCell) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setCellImages(prev => ({
        ...prev,
        [selectedCell]: imageUrl
      }));
      toast.success('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
    setSelectedCell(null);
  };

  const getCellStyle = (cellKey: string) => {
    const image = cellImages[cellKey];
    if (image) {
      return {
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return {};
  };

  const loadComponentByNumber = async (n: number) => {
    setLoadError(null);
    setPreviewComp(null);

    const path = `./square/${n}.tsx` as const;
    // Only allow files with numeric names like 33.tsx, 37.tsx, etc.
    if (!/^[0-9]+\.tsx$/.test(`${n}.tsx`)) {
      setLoadError('Please enter a valid number.');
      return;
    }

    if (componentModules[path]) {
      // Wrap the dynamic import in React.lazy
      const loader = componentModules[path] as () => Promise<{ default: React.ComponentType<any> }>;
      const LazyComp = lazy(loader);
      setPreviewComp(() => LazyComp);
    } else {
      setLoadError(`Template ${n} will be available soon.`);
    }
  };

  // const handlePreviewSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const n = Number(numberInput);
  //   if (Number.isNaN(n)) {
  //     setLoadError('Enter a valid number.');
  //     return;
  //   }
  //   loadComponentByNumber(n);
  // };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(formData.totalMembers);
    if (Number.isNaN(n)) {
      setLoadError('Enter a valid number.');
      return;
    }
    loadComponentByNumber(n);
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Update formData.totalMembers with validation
    handleFieldChange('totalMembers', value);
    
    // Auto-load component when typing
    if (value.trim()) {
      const n = Number(value);
      if (!Number.isNaN(n) && n > 0) {
        loadComponentByNumber(n);
      } else {
        setPreviewComp(null);
        setLoadError(null);
      }
    } else {
      setPreviewComp(null);
      setLoadError(null);
    }
  };

  
  // Check if form is valid for submit button
  const isValidForm = validateForm(formData).isValid;

  // Background doodle component
  const BackgroundDoodle = () => (
    <div className="absolute inset-0 -z-10">
      <div 
        className="absolute inset-0 bg-[url('/images/background-doodle-image.png')] bg-repeat opacity-[0.5]"
        style={{ backgroundSize: '400px' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-yellow-50/50 backdrop-blur-[1px]" />
    </div>
  );
  
  return (
      <div className="min-h-screen relative mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <BackgroundDoodle />

      <AnimatedBackground />

      {/* Floating Decorative Elements */}
      <motion.div
        className="absolute top-10 right-10 text-purple-500 opacity-50"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Sparkles className="w-8 h-8" />
      </motion.div>
      <motion.div
        className="absolute bottom-20 left-10 text-pink-500 opacity-50"
        animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >
        <Heart className="w-12 h-12" />
      </motion.div>
      <motion.div
        className="absolute top-1/3 left-20 text-yellow-500 opacity-50"
        animate={{ x: [0, 10, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <Rocket className="w-14 h-14" />
      </motion.div>

      <motion.div
        className="absolute top-1/3 right-20 text-red-500 opacity-50"
        animate={{ x: [0, 10, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <Drama className="w-14 h-14" />
      </motion.div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr,auto] max-w-[1400px] mx-auto">
      {/* Preview Controller */}
      <Card className="w-full max-w-[800px] mx-auto backdrop-blur-lg bg-white/80 border-none shadow-xl">
          <CardHeader className="p-3 sm:p-4 md:p-6 space-y-1 sm:space-y-2">
            <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Design Your Grid ✨
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Create your perfect photo layout and make memories together! 🎨
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="mb-3 sm:mb-4">
              <PhoneOtpBlock
                value={phone}
                onChange={(v) => setPhone(v)}
                onVerified={(std) => { setPhone(std); setIsPhoneVerified(true); }}
                source="createGroup"
              />
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 items-end gap-3 sm:gap-4 md:gap-6 min-w-[280px] w-full max-w-[600px] mx-auto">
              <div className="space-y-3">
                  <Label htmlFor="groupName" className="flex items-center text-base font-medium text-gray-700">
                    <Users className="mr-2 h-5 w-5 text-purple-500" />
                    Squad Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="groupName"
                      placeholder="e.g., CS Warriors 2024 🎓"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className={`w-full min-h-[42px] text-base bg-white/50 backdrop-blur-sm border-purple-100 focus:border-purple-300 focus:ring-purple-200 transition-all duration-300 ${
                        touched.name && formErrors.name 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                      required
                    />
                    {touched.name && formErrors.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-3"
                      >
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </motion.div>
                    )}
                  </div>
                  {touched.name && formErrors.name && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center"
                    >
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {formErrors.name}
                    </motion.p>
                  )}
            </div>

            <div className="space-y-3">
                  <Label htmlFor="yearOfPassing" className="flex items-center text-base font-medium text-gray-700">
                    <Calendar className="mr-2 h-5 w-5 text-pink-500" />
                    Graduation Year
                  </Label>
                  <div className="relative">
                    <Input
                      id="yearOfPassing"
                      type="number"
                      placeholder="When are you graduating? 🎉"
                      value={formData.yearOfPassing}
                      onChange={(e) => handleFieldChange('yearOfPassing', e.target.value)}
                      className={`w-full min-h-[42px] text-base bg-white/50 backdrop-blur-sm border-pink-100 focus:border-pink-300 focus:ring-pink-200 transition-all duration-300 ${
                        touched.yearOfPassing && formErrors.yearOfPassing 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                      required
                    />
                    {touched.yearOfPassing && formErrors.yearOfPassing && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-3"
                      >
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </motion.div>
                    )}
                  </div>
                  {touched.yearOfPassing && formErrors.yearOfPassing && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center"
                    >
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {formErrors.yearOfPassing}
                    </motion.p>
                  )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="preview-number" className="flex items-center text-base font-medium text-gray-700">
                <Users className="mr-2 h-5 w-5 text-yellow-500" />
                Squad Size
              </Label>
              <div className="relative">
                <Input
                  id="preview-number"
                  type="number"
                  inputMode="numeric"
                  value={formData.totalMembers}
                  onChange={handleNumberInputChange}
                  placeholder="How many members in your squad? 👥"
                  className={`w-full min-h-[42px] text-base bg-white/50 backdrop-blur-sm border-yellow-100 focus:border-yellow-300 focus:ring-yellow-200 transition-all duration-300 ${
                    touched.totalMembers && formErrors.totalMembers 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  required
                />
                {touched.totalMembers && formErrors.totalMembers && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-3"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </motion.div>
                )}
              </div>
              {touched.totalMembers && formErrors.totalMembers && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {formErrors.totalMembers}
                </motion.p>
              )}
            </div>

            {/* <div className="text-xs text-slate-500 sm:self-center">
              Enter a number to load a file named <code className="px-1 py-0.5 rounded bg-slate-100">{`{n}`}.tsx</code> from <code className="px-1 py-0.5 rounded bg-slate-100">src/components</code>.
            </div> */}
            {/* <Button type="submit" className="sm:justify-self-end">Load</Button> */}

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button 
                type="submit" 
                className={"w-full py-4 text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 hover:from-purple-700 hover:via-pink-700 hover:to-yellow-700"}
                disabled={isSubmitting || !isValidForm || !isPhoneVerified}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    Creating Your Squad...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Rocket className="mr-2 h-5 w-5" />
                    Launch Squad! 🚀
                  </div>
                )}
              </Button>
            </motion.div>
          </form>

          <Separator className="my-6" />

          {/* Quick actions */}
          <motion.div 
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadComponentByNumber(33)}
              className="bg-white/50 backdrop-blur-sm border-purple-100 hover:bg-purple-50 hover:text-purple-700 transition-all duration-300"
            >
              <Layout className="mr-2 h-4 w-4 text-purple-500" />
              Load 33.tsx
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadComponentByNumber(37)}
              className="bg-white/50 backdrop-blur-sm border-pink-100 hover:bg-pink-50 hover:text-pink-700 transition-all duration-300"
            >
              <Layout className="mr-2 h-4 w-4 text-pink-500" />
              Load 37.tsx
            </Button>
          </motion.div>

          {loadError && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm text-red-600 flex items-center"
              role="alert"
            >
              <AlertCircle className="mr-1 h-4 w-4" />
              {loadError}
            </motion.p>
          )}

        </CardContent>
      </Card>

      {/* Preview Area */}
      <motion.div 
        className="mt-2 sm:mt-3 md:mt-4 lg:mt-0 w-full lg:w-[40vw] min-w-[280px] sm:min-w-[400px] lg:min-w-[500px] max-w-[800px] mx-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        {PreviewComp ? (
          <Card className="w-full h-full backdrop-blur-lg bg-white/80 border-none shadow-xl overflow-hidden">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <Suspense 
                  fallback={
                    <div className="p-4 sm:p-6 md:p-8 text-center">
                      <div className="animate-spin mx-auto mb-3 sm:mb-4">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <p className="text-sm sm:text-base text-purple-600 font-medium">Creating your squad's layout...</p>
                    </div>
                  }
                >
                  <div className="w-full aspect-square">
                    <GridProvider>
                      <PreviewComp />
                    </GridProvider>
                  </div>
                </Suspense>
              </motion.div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full h-full backdrop-blur-lg bg-white/80 border-none shadow-xl">
            <CardContent className="p-4 sm:p-6 md:p-8 text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-full aspect-square flex flex-col items-center justify-center"
              >
                <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 text-purple-500 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-base sm:text-lg text-gray-600">
                  Enter your squad size to see the magic happen! ✨
                </p>
              </motion.div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Grid UI area (existing feature) */}
      <div className="flex flex-col items-center">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
      </div>
    </div>
  );
};


export default GridBoard;
