
import React, { useRef, useState, Suspense, lazy } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Users, Calendar, Hash, Layout, Type, AlertCircle } from "lucide-react";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { GridProvider } from './square/context/GridContext';
import { Link, useNavigate } from "react-router-dom";
import { useCollage, GridTemplate } from '../context/CollageContext';
import { useAuth } from '../context/AuthContext';

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
  const [totalMembers, setTotalMembers] = useState<string>("");
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
      const groupId = await createGroup({
        name: formData.name.trim(),
        yearOfPassing: formData.yearOfPassing.trim(),
        totalMembers: parseInt(formData.totalMembers),
        gridTemplate: formData.gridTemplate
      });

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
      setLoadError(`Component ${n}.tsx not found in src/components/square.`);
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
    const n = Number(totalMembers);
    if (Number.isNaN(n)) {
      setLoadError('Enter a valid number.');
      return;
    }
    loadComponentByNumber(n);
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTotalMembers(value);

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

  return (
    <div className="min-h-screen w-full mx-auto bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6">
      <div className="grid gap-4 lg:grid lg:grid-flow-col lg:auto-cols-max lg:justify-center lg:items-start">
      {/* Preview Controller */}
      <Card className="w-full max-w-md sm:max-w-lg lg:max-w-xl lg:h-[75vh] mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Component Preview Loader</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreviewSubmit} className="grid grid-cols-1 sm:grid-cols-[220px_1fr_auto] items-end gap-3">
          <div className="flex flex-col gap-2 w-full">
            <div className="space-y-2">
                  <Label htmlFor="groupName" className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Group Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="groupName"
                      placeholder="e.g., Computer Science Batch 2024"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className={`${
                        touched.name && formErrors.name 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                      required
                    />
                    {touched.name && formErrors.name && (
                      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {touched.name && formErrors.name && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
            </div>

            <div className="space-y-2">
                  <Label htmlFor="yearOfPassing" className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Year of Passing
                  </Label>
                  <div className="relative">
                    <Input
                      id="yearOfPassing"
                      type="number"
                      placeholder="e.g., 2024"
                      value={formData.yearOfPassing}
                      onChange={(e) => handleFieldChange('yearOfPassing', e.target.value)}
                      className={`${
                        touched.yearOfPassing && formErrors.yearOfPassing 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                      required
                    />
                    {touched.yearOfPassing && formErrors.yearOfPassing && (
                      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {touched.yearOfPassing && formErrors.yearOfPassing && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {formErrors.yearOfPassing}
                    </p>
                  )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview-number" className="flex items-center">
                <Hash className="mr-2 h-4 w-4" />
                Total Members
              </Label>
              <div className="relative">
                <Input
                  id="preview-number"
                  type="number"
                  inputMode="numeric"
                  value={totalMembers}
                  onChange={handleNumberInputChange}
                  placeholder="e.g. 33 or 37"
                  className={`${
                    touched.totalMembers && formErrors.totalMembers 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  required
                />
                {touched.totalMembers && formErrors.totalMembers && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {touched.totalMembers && formErrors.totalMembers && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {formErrors.totalMembers}
                </p>
              )}
            </div>

            {/* <div className="text-xs text-slate-500 sm:self-center">
              Enter a number to load a file named <code className="px-1 py-0.5 rounded bg-slate-100">{`{n}`}.tsx</code> from <code className="px-1 py-0.5 rounded bg-slate-100">src/components</code>.
            </div> */}
            {/* <Button type="submit" className="sm:justify-self-end">Load</Button> */}

            <Button
                  onClick={handleSubmit} 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  disabled={isSubmitting || !isValidForm}
                >
                  {isSubmitting ? "Creating Group..." : "Create Group"}
                </Button>
            </div>
          </form>

          <Separator className="my-4" />

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => loadComponentByNumber(33)}>
              Load 33.tsx
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadComponentByNumber(37)}>
              Load 37.tsx
            </Button>
          </div>

          {loadError && (
            <p className="mt-3 text-sm text-red-600" role="alert">{loadError}</p>
          )}

        </CardContent>
      </Card>

      {/* Preview Area */}
      <div className="mt-4 lg:mt-0 mx-auto inline-block">
        {PreviewComp ? (
          <Card className="inline-block">
            <CardContent className="p-0">
              {/* Preview actions */}
              <div className="flex justify-end p-2">
                <Button size="sm" onClick={() => window.dispatchEvent(new Event('grid-template-download'))}>
                  Download
                </Button>
              </div>
              <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading preview...</div>}>
                <GridProvider>
                  <PreviewComp />
                </GridProvider>
              </Suspense>
            </CardContent>
          </Card>
        ) : (
          <Card className="inline-block">
            <CardContent className="mt-4 lg:mt-0 text-slate-500 text-center">
              Enter a number to preview a component (e.g. 33 or 37) from src/components/square.
            </CardContent>
          </Card>
        )}
      </div>

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
