import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Users, Eye, Share, CreditCard } from "lucide-react";
import { GridPreview } from "@/components/GridPreview";
import { toast } from "sonner";
import { GridTemplate } from "@/context/CollageContext";
import { useCollage } from "@/context/CollageContext";
import { useAuth } from "@/context/AuthContext";
import { GridProvider } from "@/components/square/context/GridContext";


const Editor = () => {
  const { groupId } = useParams<{ groupId?: string }>();
  const { getGroup, isLoading, groups } = useCollage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);

  // Update group data whenever groupId, user's groupId, or groups change
  useEffect(() => {
    const targetGroupId = groupId || user?.groupId;
    
    if (targetGroupId) {
      const userGroup = getGroup(targetGroupId);
      if (userGroup) {
        setGroup(userGroup);
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  }, [groupId, user?.groupId, getGroup, navigate, groups]); // Add groups as a dependency

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

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
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
    // Adjust the path to match your routing setup
    navigate(`/checkout/${group.id}`);
  };

  const completionPercentage = Math.round((group.members.length / group.totalMembers) * 100);
  const winningTemplate = getWinningTemplate(group.votes);
  const isGridComplete = group.members.length !== group.totalMembers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">

       {/* Navigation Header */}
       <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              {/* <ArrowLeft className="h-4 w-4" /> */}
              <Link to="/">Back to Home</Link>
            </Button>
            {/* <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Checkout</span>
            </div> */}
            {/* <div className="w-[100px]" /> */}
             <div className="flex items-center space-x-4">
            {/* <span className="text-sm text-gray-600">Welcome, {user?.name}</span> */}
            {/* <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button> */}
            <div className="flex space-x-2">
            <Button 
              className={`${isGridComplete ? 'bg-pink-500 hover:bg-pink-800' : 'bg-gray-400 cursor-not-allowed'}`}
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
          </div>
          </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Group Progress</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {group.members.length} of {group.totalMembers} members have joined
            </p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Collage Preview */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Live Collage Preview</CardTitle>
                    <CardDescription>Grid template: {group.totalMembers} members • {group.gridTemplate} layout</CardDescription>
                  </div>
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="flex justify-center p-8">
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
                      <div className="text-center">
                        <p className="text-gray-500 mb-2">Waiting for members to join...</p>
                        <Button variant="outline" onClick={handleShare}>
                          <Share className="h-4 w-4 mr-2" />
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
          <div className="space-y-6">
            {/* Member List */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Members ({group.members.length}/{group.totalMembers})</CardTitle>
              </CardHeader>
              <CardContent>
                {group.members.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No members yet</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleShare}>
                      Invite Members
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {group.members.map((member: any, index: number) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className="relative">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                          />
                          <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">Roll No. {member.memberRollNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voting Results */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Template Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(['square', 'hexagonal', 'circle'] as const).map((template) => (
                    <div key={template} className="flex items-center justify-between">
                      <span className="capitalize text-gray-700">{template}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
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
                        <span className="text-sm font-medium text-gray-600">
                          {group.votes[template]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                
                <Button variant="outline" className="w-full" onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Share Group Link
                </Button>

                <Button 
                  className={`w-full ${isGridComplete ? 'bg-pink-500 hover:bg-pink-800' : 'bg-gray-400 cursor-not-allowed'}`}
                  onClick={handleCheckout}
                  disabled={!isGridComplete}
                  title={!isGridComplete ? `Need ${group.totalMembers - group.members.length} more members to complete the grid` : 'Ready to checkout'}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isGridComplete ? 'Checkout' : `Checkout (${group.members.length}/${group.totalMembers})`}
                </Button>
      
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => window.dispatchEvent(new Event('grid-template-download'))}>
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