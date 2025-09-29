import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Users, Eye, Share, CreditCard } from "lucide-react";
import { GridPreview } from "@/components/GridPreview";
import { Suspense } from "react";
import { toast } from "sonner";
import { GridTemplate, Member, Group as CollageGroup } from "@/context/CollageContext";
import { useCollage } from "@/context/CollageContext";
import { useAuth } from "@/context/AuthContext";
import { GridProvider } from "@/components/square/context/GridContext";

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


const Editor = () => {
  const { groupId } = useParams<{ groupId?: string }>();
  const { getGroup, isLoading, groups } = useCollage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<CollageGroup | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  // Helper functions for group storage
  const saveLastActiveGroup = (groupId: string) => {
    localStorage.setItem('lastActiveGroupId', groupId);
  };

  const getLastActiveGroup = (): string | null => {
    return localStorage.getItem('lastActiveGroupId');
  };

  // Handle route redirection for legacy routes without groupId
  useEffect(() => {
    // If no groupId in URL params, redirect to appropriate group
    if (!groupId) {
      // First try user's current groupId
      if (user?.groupId) {
        navigate(`/editor/${user.groupId}`, { replace: true });
        return;
      }
      
      // Then try last active group from localStorage
      const lastActive = getLastActiveGroup();
      if (lastActive) {
        navigate(`/editor/${lastActive}`, { replace: true });
        return;
      }
      
      // Otherwise redirect to dashboard
      navigate('/dashboard');
    }
  }, [groupId, user?.groupId, navigate]);

  // Update group data whenever groupId changes
  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) {
        setLoadingGroup(false);
        return;
      }

      try {
        setLoadingGroup(true);
        const fetchedGroup = await getGroup(groupId);
        if (fetchedGroup) {
          setGroup(fetchedGroup);
          saveLastActiveGroup(groupId); // Save as last active group
        } else {
          toast.error('Group not found');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching group:', error);
        toast.error('Failed to load group data');
        navigate('/dashboard');
      } finally {
        setLoadingGroup(false);
      }
    };

    fetchGroup();
  }, [groupId, getGroup, navigate]);

  // Show loading state while context is initializing or group is loading
  if (isLoading || loadingGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4 animate-fadeIn">
        <Card className="w-full max-w-md text-center animate-slideUp">
          <CardContent className="pt-6">
            <div className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 animate-pulse">Loading...</h1>
            <p className="text-gray-600">{loadingGroup ? "Loading group data..." : "Initializing application..."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4 animate-fadeIn">
        <Card className="w-full max-w-md text-center animate-slideUp">
          <CardContent className="pt-6">
            <div className="w-12 h-12 border-4 border-t-red-600 border-red-200 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h1>
            <p className="text-gray-600 mb-4">The group you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getWinningTemplate = (votes: { hexagonal: number; square: number; circle: number }) => {
    return Object.entries(votes).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0] as 'hexagonal' | 'square' | 'circle';
  };

  const handleShare = () => {
    const shareLink = `${window.location.origin}/join/${group.id}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied to clipboard!");
  };

  const handleCheckout = () => {
    // Navigate to a dedicated checkout page for this group
    if (groupId) {
      navigate(`/checkout/${groupId}`);
    } else if (group?.id) {
      navigate(`/checkout/${group.id}`);
    }
  };

  const completionPercentage = Math.round((group.members.length / group.totalMembers) * 100);
  const winningTemplate = getWinningTemplate(group.votes);
  const isGridComplete = group.members.length === group.totalMembers;

  return (
    <div className="min-h-screen relative">
      <BackgroundDoodle />

       {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-0 sm:h-16 space-y-3 sm:space-y-0">
            <Button 
              variant="ghost" 
              onClick={() => navigate(groupId ? `/dashboard/${groupId}` : '/dashboard')}
              className="flex items-center gap-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </Button>
            
             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-wrap gap-2 sm:space-x-2">
            <Button 
              className={`${isGridComplete ? 'bg-pink-500 hover:bg-pink-800' : 'bg-gray-400 cursor-not-allowed'} text-xs sm:text-sm px-3 sm:px-4 py-2`}
              onClick={handleCheckout}
              disabled={!isGridComplete}
              title={!isGridComplete ? `Need ${group.totalMembers - group.members.length} more members to complete the grid` : 'Ready to checkout'}
            >
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isGridComplete ? 'Checkout' : `Checkout (${group.members.length}/${group.totalMembers})`}</span>
              <span className="sm:hidden">{isGridComplete ? 'Checkout' : `(${group.members.length}/${group.totalMembers})`}</span>
            </Button>
            <Button variant="outline" onClick={handleShare} className="text-xs sm:text-sm px-3 sm:px-4 py-2">
              <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Share
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm px-3 sm:px-4 py-2" onClick={() => window.dispatchEvent(new Event('grid-template-download'))}>
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
          </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          {/* <div className="flex items-center">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <p className="text-gray-600">Class of {group.yearOfPassing} • {winningTemplate} grid</p>
            </div>
          </div> */}
          {/* <div className="flex space-x-2">
            <Button 
              className={`${isGridComplete ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'}`}
              onClick={handleCheckout}
              disabled={!isGridComplete}
              title={!isGridComplete ? `Need ${group.totalMembers - group.members.length} more members to complete the grid` : 'Ready to checkout'}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isGridComplete ? 'Checkout' : `Checkout (${group.members.length}/${group.totalMembers})`}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => window.dispatchEvent(new Event('grid-template-download'))}>
              Download
            </Button>
          </div> */}
        </div>

        {/* Progress */}
        <Card className="mb-6 sm:mb-8 shadow-lg border-0 backdrop-blur-lg bg-white/80">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="text-sm sm:text-base font-medium">Group Progress</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-purple-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {group.members.length} of {group.totalMembers} members have joined
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Collage Preview */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <Card className="shadow-xl border-0 backdrop-blur-lg bg-white/80">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Live Collage Preview</CardTitle>
                    <CardDescription className="text-xs sm:text-sm lg:text-base">Grid template: {group.totalMembers} members • {group.gridTemplate} layout</CardDescription>
                  </div>
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="flex justify-center p-4 sm:p-6 lg:p-8">
                <div className="relative">
                  <GridPreview 
                    key={`${group.id}-${group.members.length}`}
                    template={group.gridTemplate}
                    memberCount={group.totalMembers}
                    members={group.members}
                    size="large"
                  />
                  {group.members.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-4">
                        <p className="text-sm sm:text-base text-gray-500 mb-2">Waiting for members to join...</p>
                        <Button variant="outline" onClick={handleShare} className="text-xs sm:text-sm px-3 py-2">
                          <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Invite Members
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-2">
            {/* Member List */}
            <Card className="shadow-lg border-0 backdrop-blur-lg bg-white/80">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Members ({group.members.length}/{group.totalMembers})</CardTitle>
              </CardHeader>
              <CardContent>
                {group.members.length === 0 ? (
                  <div className="text-center py-4 sm:py-6">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm sm:text-base text-gray-500">No members yet</p>
                    <Button variant="outline" size="sm" className="mt-2 text-xs sm:text-sm" onClick={handleShare}>
                      Invite Members
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                    {group.members.map((member: any, index: number) => (
                      <div key={member.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-gray-50">
                        <div className="relative">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow"
                          />
                          <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{member.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">Roll No. {member.memberRollNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voting Results */}
            <Card className="shadow-lg border-0 backdrop-blur-lg bg-white/80">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Template Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {(['square', 'hexagonal', 'circle'] as const).map((template) => (
                    <div key={template} className="flex items-center justify-between">
                      <span className="capitalize text-gray-700 text-sm sm:text-base">{template}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              template === winningTemplate 
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                                : 'bg-gray-400'
                            }`}
                            style={{ 
                              width: group.members.length > 0 
                                ? `${(group.votes[template] / group.members.length) * 100}%` 
                                : '0%' 
                            }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-600">
                          {group.votes[template]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0 backdrop-blur-lg bg-white/80">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                
                <Button variant="outline" className="w-full text-sm sm:text-base py-2 sm:py-3" onClick={handleShare}>
                  <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Share Group Link
                </Button>

                <Button 
                  className={`w-full text-sm sm:text-base py-2 sm:py-3 ${isGridComplete ? 'bg-pink-500 hover:bg-pink-800' : 'bg-gray-400 cursor-not-allowed'}`}
                  onClick={handleCheckout}
                  disabled={!isGridComplete}
                  title={!isGridComplete ? `Need ${group.totalMembers - group.members.length} more members to complete the grid` : 'Ready to checkout'}
                >
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">{isGridComplete ? 'Checkout' : `Checkout (${group.members.length}/${group.totalMembers})`}</span>
                  <span className="sm:hidden">{isGridComplete ? 'Checkout' : `(${group.members.length}/${group.totalMembers})`}</span>
                </Button>
      
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-3" onClick={() => window.dispatchEvent(new Event('grid-template-download'))}>
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Download
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;