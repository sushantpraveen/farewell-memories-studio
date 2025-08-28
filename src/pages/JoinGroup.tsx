import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Upload, Users, Calendar, Vote } from "lucide-react";
import { useCollage, GridTemplate } from "@/context/CollageContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { GridPreview } from "@/components/GridPreview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const JoinGroup = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [memberData, setMemberData] = useState({
    name: "",
    memberRollNumber: "",
    photo: "",
    vote: "square" as GridTemplate,
    size: undefined as undefined | 's' | 'm' | 'l' | 'xl' | 'xxl'
  });
  const [previewTemplate, setPreviewTemplate] = useState<GridTemplate>("square");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getGroup, joinGroup, updateGroupTemplate, isLoading } = useCollage();
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const group = groupId ? getGroup(groupId) : undefined;

  useEffect(() => {
    if (groupId && group) {
      updateGroupTemplate(groupId);
      // Set preview template to match group's template
      setPreviewTemplate(group.gridTemplate);
    }
  }, [group?.votes, groupId, updateGroupTemplate]);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMemberData({ ...memberData, photo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;

    setIsSubmitting(true);

    try {
      const success = joinGroup(groupId, memberData);
      if (success) {
        // Update user data to set groupId
        updateUser({ groupId });
        
        toast.success("Successfully joined the group!");
        navigate(`/`);
      } else {
        toast.error("Unable to join group. It might be full or not exist.");
      }
    } catch (error) {
      toast.error("Failed to join group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen w-full mx-auto bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-3 sm:p-4 md:p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-600">Class of {group.yearOfPassing}</p>
          </div>
        </div>

        {/* Group Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{group.members.length}/{group.totalMembers}</p>
              <p className="text-sm text-gray-600">Members Joined</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Calendar className="h-8 w-8 mx-auto text-pink-600 mb-2" />
              <p className="text-2xl font-bold">{group.yearOfPassing}</p>
              <p className="text-sm text-gray-600">Graduation Year</p>
            </CardContent>
          </Card>
          <Card className="text-center">
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
              <Link to={`/editor/${groupId}`}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  View Collage
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6">
            {/* Current Members */}
            <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle>Current Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {group.members.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No members yet. Be the first to join!</p>
                  ) : (
                    <div className="space-y-3">
                      {group.members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-600">Voted: {member.memberRollNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
                    <Label htmlFor="memberName">Your Name</Label>
                    <Input
                      id="memberName"
                      placeholder="Enter your full name"
                      value={memberData.name}
                      onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberRollNumber">Roll No.</Label>
                      <Input
                        id="memberRollNumber"
                        placeholder="Enter your roll number"
                        value={memberData.memberRollNumber}
                        onChange={(e) => setMemberData({ ...memberData, memberRollNumber: e.target.value })}
                        required
                      />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">T‑Shirt Size</Label>
                    <Select
                      value={memberData.size}
                      onValueChange={(val) => setMemberData({ ...memberData, size: val as 's' | 'm' | 'l' | 'xl' | 'xxl' })}
                    >
                      <SelectTrigger id="size">
                        <SelectValue placeholder="Select your size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s">S</SelectItem>
                        <SelectItem value="m">M</SelectItem>
                        <SelectItem value="l">L</SelectItem>
                        <SelectItem value="xl">XL</SelectItem>
                        <SelectItem value="xxl">XXL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo" className="flex items-center">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Your Photo
                    </Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      required
                    />
                    {memberData.photo && (
                      <div className="mt-4">
                        <img
                          src={memberData.photo}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
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
                    disabled={!memberData.name || !memberData.photo || !memberData.size || isSubmitting}
                  >
                    {isSubmitting ? "Joining Group..." : "Join Group"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            </div>

            {/* Grid Preview - 2/3 width */}
            <div className="lg:col-span-2">

              <Card className="shadow-xl border-0 relative">
                 <CardHeader>
                   <CardTitle>Grid Preview</CardTitle>
                   <CardDescription>{group.gridTemplate}</CardDescription>
                 </CardHeader>
                 <CardContent className="flex justify-center">
                   <GridPreview 
                     template={group.gridTemplate}
                     memberCount={group.totalMembers}
                     members={group.members}
                     centerEmptyDefault
                     activeMember={memberData.photo ? {
                       id: 'preview',
                       name: memberData.name || 'You',
                       memberRollNumber: memberData.memberRollNumber,
                       photo: memberData.photo,
                       vote: memberData.vote,
                       joinedAt: new Date()
                     } : undefined}
                     size="large"
                   />
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