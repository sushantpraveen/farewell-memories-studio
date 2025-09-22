import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Upload, Users, Calendar, Vote, CheckCircle, AlertCircle } from "lucide-react";
import { GridTemplate } from "@/context/CollageContext";
import { lazy, Suspense } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LazyImage } from "@/components/LazyImage";
import { useJoinGroup } from "@/hooks/useJoinGroup";

// Fix the import to use named export
const GridPreview = lazy(() => 
  import("@/components/GridPreview").then(module => ({ 
    default: module.GridPreview 
  }))
);

const JoinGroup = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const {
    memberData,
    errors,
    group,
    previewTemplate,
    isSubmitting,
    loadingGroup,
    isLoading,
    formTouched,
    handleInputChange,
    handlePhotoUpload,
    handleSubmit,
    submitPhotoUrl,
    isUploadingPhoto
  } = useJoinGroup(groupId);





  // Show loading state while context is initializing or group is loading
  if (isLoading || loadingGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4 animate-fadeIn">
        { isSubmitting ?  <div className="mb-6">
              <div className="mx-auto mb-4 bg-white rounded-full flex items-center justify-center"> 
                <img src="/congrats.gif" alt="success" width={400} />
              </div>
            </div>
          : 
        <Card className="w-full max-w-md text-center animate-slideUp">
          <CardContent className="pt-6">
            <div className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 animate-pulse">Loading...</h1>
            <p className="text-gray-600">{loadingGroup ? "Loading group data..." : "Initializing application..."}</p>
          </CardContent>
        </Card>
        }
      </div>
    );
  }





  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h1>
            <p className="text-gray-600 mb-6">The group you're looking for doesn't exist or has been removed.</p>
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGroupFull = group.members.length >= group.totalMembers;
  const remainingSpots = group.totalMembers - group.members.length;
  const isCloudinaryPhoto = typeof memberData.photo === 'string' && memberData.photo.includes('/image/upload');

  return (
    <div className="min-h-screen w-full mx-auto bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-3 sm:p-4 md:p-6 animate-fadeIn" key="main-container">
      <div className="container mx-auto max-w-6xl animate-slideUp opacity-0" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }} key="content-container">
        {/* Header */}
        <div className="flex items-center mb-8" key="header">
          <Link to="/" key="back-link">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div key="group-info">
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-600">Class of {group.yearOfPassing}</p>
          </div>
        </div>

        {/* Group Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-8" key="group-info-cards">
          <Card className="text-center" key="members-card">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{group.members.length}/{group.totalMembers}</p>
              <p className="text-sm text-gray-600">Members Joined</p>
            </CardContent>
          </Card>
          <Card className="text-center" key="year-card">
            <CardContent className="pt-6">
              <Calendar className="h-8 w-8 mx-auto text-pink-600 mb-2" />
              <p className="text-2xl font-bold">{group.yearOfPassing}</p>
              <p className="text-sm text-gray-600">Graduation Year</p>
            </CardContent>
          </Card>
          <Card className="text-center" key="template-card">
            <CardContent className="pt-6">
              <Vote className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-bold capitalize">{group.gridTemplate}</p>
              <p className="text-sm text-gray-600">Current Winner</p>
            </CardContent>
          </Card>
        </div>

        {isGroupFull ? (
          <Card className="text-center shadow-xl border-0">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Group is Full!</h2>
              <p className="text-gray-600 mb-6">This group has reached its maximum capacity.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6">
          
            {/* Join Form */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Join the Group</CardTitle>
                <CardDescription>
                  Upload your photo and vote for your favorite grid template. {remainingSpots} spots remaining!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="memberName" className="flex items-center justify-between">
                      <span>Your Name</span>
                      {errors.name && <span className="text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.name}</span>}
                      {formTouched && memberData.name && !errors.name && <span className="text-xs text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Valid</span>}
                    </Label>
                    <Input
                      id="memberName"
                      placeholder="Enter your full name"
                      value={memberData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? "border-red-300 focus:border-red-500" : ""}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberRollNumber" className="flex items-center justify-between">
                      <span>Roll No.</span>
                      {errors.memberRollNumber && <span className="text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.memberRollNumber}</span>}
                      {formTouched && memberData.memberRollNumber && !errors.memberRollNumber && <span className="text-xs text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Valid</span>}
                    </Label>
                    <Input
                      id="memberRollNumber"
                      placeholder="Enter your roll number"
                      value={memberData.memberRollNumber}
                      onChange={(e) => handleInputChange('memberRollNumber', e.target.value)}
                      className={errors.memberRollNumber ? "border-red-300 focus:border-red-500" : ""}
                      aria-invalid={!!errors.memberRollNumber}
                      aria-describedby={errors.memberRollNumber ? "roll-error" : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size" className="flex items-center justify-between">
                      <span>T‑Shirt Size</span>
                      {errors.size && <span className="text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.size}</span>}
                      {formTouched && memberData.size && !errors.size && <span className="text-xs text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Selected</span>}
                    </Label>
                    <Select
                      value={memberData.size}
                      onValueChange={(val) => handleInputChange('size', val as 's' | 'm' | 'l' | 'xl' | 'xxl')}
                    >
                      <SelectTrigger id="size" className={errors.size ? "border-red-300" : ""}>
                        <SelectValue placeholder="Select your size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="size-s" value="s">S</SelectItem>
                        <SelectItem key="size-m" value="m">M</SelectItem>
                        <SelectItem key="size-l" value="l">L</SelectItem>
                        <SelectItem key="size-xl" value="xl">XL</SelectItem>
                        <SelectItem key="size-xxl" value="xxl">XXL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo" className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Your Photo
                      </span>
                      {errors.photo && <span className="text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.photo}</span>}
                      {formTouched && memberData.photo && !errors.photo && <span className="text-xs text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Uploaded</span>}
                    </Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className={errors.photo ? "border-red-300 focus:border-red-500" : ""}
                      aria-invalid={!!errors.photo}
                    />
                    {/* {memberData.photo && (
                      <div className="mt-4 flex justify-center">
                        <LazyImage
                          src={memberData.photo}
                          alt="Preview"
                          className="w-32 h-32 rounded-lg border"
                          placeholderSrc="/placeholder.svg"
                        />
                      </div>
                    )} */}
                  </div>

                  {/* <div className="space-y-4">
                    <Label>Vote for Grid Template</Label>
                    <RadioGroup
                      value={memberData.vote}
                      onValueChange={(value: GridTemplate) => setMemberData({ ...memberData, vote: value })}
                    >
                      {(['square', 'hexagonal', 'circle'] as GridTemplate[]).map((template) => (
                        <div key={template} className="flex items-center space-x-2">
                          <RadioGroupItem value={template} id={`vote-${template}`} />
                          <Label htmlFor={`vote-${template}`} className="capitalize">
                            {template} ({group.votes[template]} votes)
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div> */}

                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={
                      !memberData.name || 
                      !memberData.memberRollNumber || 
                      !memberData.size || 
                      !submitPhotoUrl ||
                      isUploadingPhoto ||
                      isSubmitting || 
                      Object.values(errors).some(error => error)
                    }
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span>
                        Joining Group...
                      </span>
                    ) : isUploadingPhoto ? (
                      <span className="flex items-center">
                        <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span>
                        Uploading photo...
                      </span>
                    ) : "Join Group"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            </div>

            {/* Grid Preview - 2/3 width */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0 relative h-full">
                 <CardHeader>
                   <CardTitle>Grid Preview</CardTitle>
                   <CardDescription>{group.gridTemplate}</CardDescription>
                 </CardHeader>
                 <CardContent className="flex justify-center items-center p-0 overflow-hidden">
                   <Suspense fallback={
                     <div className="p-8 text-center">
                       <div className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
                       <p className="text-gray-600">Loading preview...</p>
                     </div>
                   }>
                     <div className="w-full h-full flex items-center justify-center p-4">
                       {isCloudinaryPhoto ? (
                        <div className="max-w-full max-h-full w-auto h-auto">
                          <GridPreview 
                            template={group.gridTemplate}
                            memberCount={group.totalMembers}
                            members={[]} // Don't pass any members since we don't need them for preview
                            centerEmptyDefault
                            activeMember={{
                              id: 'preview',
                              name: memberData.name || 'You',
                              memberRollNumber: memberData.memberRollNumber,
                              photo: memberData.photo,
                              vote: memberData.vote,
                              joinedAt: new Date()
                            }}
                            size="large"
                          />
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          
                          <p className="text-gray-600">Upload your photo to see preview. Preview appears after Cloudinary finishes face-cropping.</p>
                        </div>
                      )}
                     </div>
                   </Suspense>
                 </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinGroup;