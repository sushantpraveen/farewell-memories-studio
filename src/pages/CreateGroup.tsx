
import { useState, useRef, Suspense, lazy, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Calendar, Hash, Layout, Type } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCollage, GridTemplate } from "@/context/CollageContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { GridPreview } from "@/components/GridPreview";
import ImageUpload from "@/components/ImageUpload";
import { GridProvider } from "@/components/square/context/GridContext";
import "./grid.css";

// Available square template numbers (all available templates from 34 to 128)
const AVAILABLE_SQUARE_TEMPLATES = Array.from({ length: 95 }, (_, i) => i + 34);

// Helper function to select the correct template number
const getSquareTemplateNumber = (memberCount: number): number => {
  if (AVAILABLE_SQUARE_TEMPLATES.includes(memberCount)) {
    return memberCount;
  }
  // Find the closest available template number
  const closest = AVAILABLE_SQUARE_TEMPLATES.reduce((prev, curr) => {
    return Math.abs(curr - memberCount) < Math.abs(prev - memberCount) ? curr : prev;
  });
  return closest;
};

interface CellImage {
  [key: string]: string;
}

const CreateGroup = () => {

  const [cellImages, setCellImages] = useState<CellImage>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [numberInput, setNumberInput] = useState<string>("");
  const [PreviewComp, setPreviewComp] = useState<React.LazyExoticComponent<React.ComponentType> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Add responsive breakpoint check for desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      setIsDesktop(matches);
    };
    setIsDesktop(mq.matches);
    mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, []);

  // Add event listener for grid template download
  useEffect(() => {
    const handleDownload = () => {
      console.log('Download requested');
      // Handle download if needed
    };

    window.addEventListener('grid-template-download', handleDownload);
    return () => window.removeEventListener('grid-template-download', handleDownload);
  }, []);

  // Map of all TSX components in this folder
  // We will look for files like "33.tsx", "37.tsx", or any "n.tsx"
  // Import all numeric-named components from the square directory
  const componentModules = import.meta.glob('@/components/square/[0-9]*.tsx', { eager: true });


  const [formData, setFormData] = useState({
    name: "",
    yearOfPassing: "",
    totalMembers: "",
    gridTemplate: "square" as GridTemplate,
    logoFile: null as File | null,
    logoPreview: "",
    customText: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createGroup, isLoading } = useCollage();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Show loading state while context is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
            <p className="text-gray-600">Initializing application...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleImageChange = (file: File | null, preview: string) => {
    setFormData(prev => ({
      ...prev,
      logoFile: file,
      logoPreview: preview
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const groupId = await createGroup({
        name: formData.name,
        yearOfPassing: formData.yearOfPassing,
        totalMembers: parseInt(formData.totalMembers),
        gridTemplate: formData.gridTemplate
      });

      if (!groupId) {
        throw new Error('Failed to create group');
      }

      // Update user data to mark as leader and set groupId
      if (user) {
        await updateUser({ 
          isLeader: true, 
          groupId 
        });
      }

      toast.success("Group created successfully!");
      navigate(`/dashboard/${groupId}`);
    } catch (error) {
      toast.error("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadComponentByNumber = async (n: number) => {
    setLoadError(null);
    setPreviewComp(null);

    console.log('Loading component number:', n);
    console.log('Available modules:', Object.keys(componentModules));

    // Only allow files with numeric names like 33.tsx, 37.tsx, etc.
    if (!/^[0-9]+$/.test(String(n))) {
      setLoadError('Please enter a valid number.');
      return;
    }

    const matchingPath = Object.keys(componentModules).find(p => p.includes(`/${n}.tsx`));
    console.log('Found matching path:', matchingPath);

    if (matchingPath) {
      try {
        const module = componentModules[matchingPath] as { default: React.ComponentType<any> };
        const LazyComp = lazy(() => Promise.resolve(module));
        console.log('Component loaded successfully');
        setPreviewComp(() => LazyComp);
      } catch (error) {
        console.error('Error loading component:', error);
        setLoadError(`Error loading component ${n}.tsx`);
      }
    } else {
      console.warn(`Component ${n}.tsx not found in available modules`);
      setLoadError(`Component ${n}.tsx not found in src/components/square.`);
    }
  };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(numberInput);
    if (Number.isNaN(n)) {
      setLoadError('Enter a valid number.');
      return;
    }
    loadComponentByNumber(n);
  };

  const isValidForm = formData.name && formData.yearOfPassing && formData.totalMembers && parseInt(formData.totalMembers) > 0;

  return (
    <div className="min-h-screen max-w-8xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6">
      <div className="grid gap-2 lg:grid lg:grid-cols-2">
        {/* Header */}
        {/* <div className="flex items-center mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Group</h1>
        </div> */}

        <Card className="w-1/2 lg:max-w-xl lg:h-[75vh]">
        <CardHeader>
          <CardTitle className="text-lg">Component Preview Loader</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreviewSubmit} className="grid grid-cols-1 sm:grid-cols-[220px_1fr_auto] items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Group Name
                  </Label>
                  <Input
                    id="groupName"
                    placeholder="e.g., Computer Science Batch 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfPassing" className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Year of Passing
                  </Label>
                  <Input
                    id="yearOfPassing"
                    placeholder="e.g., 2024"
                    value={formData.yearOfPassing}
                    onChange={(e) => setFormData({ ...formData, yearOfPassing: e.target.value })}
                    required
                  />
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="totalMembers" className="flex items-center">
                    <Hash className="mr-2 h-4 w-4" />
                    Total Number of Members
                  </Label>
                  <Input
                    id="preview-number"
                    type="number"
                    inputMode="numeric"
                    value={formData.totalMembers}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, totalMembers: value });
                      if (value && !isNaN(parseInt(value))) {
                        loadComponentByNumber(getSquareTemplateNumber(parseInt(value)));
                      }
                    }}
                    placeholder="e.g. 33 or 37"
              />
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="totalMembers" className="flex items-center">
                    <Hash className="mr-2 h-4 w-4" />
                    Total Number of Members
                  </Label>
                  <Input
                    id="preview-number"
                    type="number"
                    inputMode="numeric"
                    value={formData.totalMembers}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, totalMembers: value });
                      if (value && !isNaN(parseInt(value))) {
                        loadComponentByNumber(getSquareTemplateNumber(parseInt(value)));
                      }
                    }}
                    placeholder="e.g. 33 or 37"
              />
                </div>

                {/* Logo Upload */}
                <ImageUpload
                  onImageChange={handleImageChange}
                  currentPreview={formData.logoPreview}
                  label="Group Logo (Optional)"
                />

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!isValidForm || isSubmitting}
                >
                  {isSubmitting ? "Creating Group..." : "Create Group"}
                </Button>
              </form>
            </CardContent>
      </Card>
          
      {/* Preview Area */}
      <div className="lg:max-w-3xl mt-4 lg:mt-0">
        {PreviewComp ? (
          <Card className="-ml-4 sm:ml-0">
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
          <Card>
            <CardContent className="p-6 text-sm text-slate-500 text-center">
              Enter a number to preview a component (e.g. 33 or 37) from src/components/square.
            </CardContent>
          </Card>
        )}
      </div>

        </div>
      </div>
  );
};

export default CreateGroup;
