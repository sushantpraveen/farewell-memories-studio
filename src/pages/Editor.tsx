import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Users, Eye, Share, CreditCard } from "lucide-react";
import { GridPreview } from "@/components/GridPreview";
import { Suspense } from "react";
import { toast } from "sonner";
import { GridTemplate, Member, Group as CollageGroup } from "@/context/CollageContext";
import { useCollage } from "@/context/CollageContext";
import { useAuth } from "@/context/AuthContext";
import { GridProvider } from "@/components/square/context/GridContext";
import { userApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserWalkthrough, { Step } from '@/components/UserWalkthrough';

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
  const { getGroup, isLoading, groups, updateGroup, updateGroupTemplate } = useCollage();
  const { user, updateUser, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<CollageGroup | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [showCurrentMembers, setShowCurrentMembers] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isCheckoutUpdating, setIsCheckoutUpdating] = useState(false);

  const [userGroupsCount, setUserGroupsCount] = useState<number | null>(null);

  // Fetch user groups to determine if this is their first/only group
  useEffect(() => {
    const checkUserGroups = async () => {
      if (!user?.id) return;
      try {
        const res = await userApi.getUserGroups(user.id);
        setUserGroupsCount(res.items?.length || 0);
      } catch (err) {
        console.warn('Failed to load user groups count:', err);
      }
    };
    checkUserGroups();
  }, [user?.id]);

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

  // Editor Guide Logic
  const tourStorageKey = user?.id ? `editor_tour_completed_${user.id}` : 'editor_tour_anonymous';
  const [showTour, setShowTour] = useState(false);
  const tourInitialized = useRef(false);

  // Determine if tour should start - run once when data is ready
  useEffect(() => {
    if (isAuthLoading || !user?.id || tourInitialized.current) return;

    // Safety check: wait for group data if we're theoretically in "tour" mode
    if (!group) return;

    const shouldShow = sessionStorage.getItem('showEditorTour') === 'true';
    const hasSeenTour = user?.guidesSeen?.editor;

    if (shouldShow && !hasSeenTour) {
      setShowTour(true);
      sessionStorage.removeItem('showEditorTour');
    }
    tourInitialized.current = true;
  }, [isAuthLoading, user?.id, user?.guidesSeen?.editor, group]);

  const guideSteps: Step[] = useMemo(() => {
    const memberCount = group?.members?.length || 0;
    const totalMembers = group?.totalMembers || 0;
    return [
      {
        targetId: "guide-view-toggle",
        title: "Viewing Expected Grid",
        description: "Switch between viewing the current grid (with joined members) and the expected grid (full capacity). Perfect for planning!"
      },
      {
        targetId: "guide-checkout-button",
        title: memberCount === 0 ? "Checkout (Members Required)" : "Ready to Checkout?",
        description: memberCount === 0
          ? "You cannot proceed to payment until you have at least one member. Share your group link to invite friends!"
          : `Click here to proceed with payment. You have ${memberCount} member${memberCount > 1 ? 's' : ''} ready!`
      }
    ];
  }, [group?.members?.length, group?.totalMembers]);

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
  const handleGuideFinish = async () => {
    // 1. Immediate Persistence
    localStorage.setItem(tourStorageKey, 'true');
    setShowTour(false);

    // 2. Persist to Backend (Background)
    if (user) {
      try {
        await updateUser({
          guidesSeen: {
            ...user.guidesSeen,
            editor: true,
            dashboard: true // If they've seen editor, they've likely bypassed dash or seen it
          }
        });
      } catch (e) {
        console.error('Failed to persist editor tour status', e);
      }
    }
  };

  // Define Walkthrough Element
  const walkthroughElement = useMemo(() => (
    <UserWalkthrough
      steps={guideSteps}
      storageKey={tourStorageKey}
      onFinish={handleGuideFinish}
      onCancel={handleGuideFinish}
      forceStart={false}
      run={showTour}
    />
  ), [guideSteps, tourStorageKey, showTour]);

  // Show loading state while context is initializing or group is loading
  if (isLoading || loadingGroup) {
    return (
      <>
        {walkthroughElement}
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4 animate-fadeIn">
          <Card className="w-full max-w-md text-center animate-slideUp">
            <CardContent className="pt-6">
              <div className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4 animate-pulse">Loading...</h1>
              <p className="text-gray-600">{loadingGroup ? "Loading group data..." : "Initializing application..."}</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!group) {
    return (
      <>{walkthroughElement}
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
      </>
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

  const handleCheckout = async () => {
    if (!group) return;

    const current = group.members.length;
    const expected = group.totalMembers;
    const targetGroupId = groupId || group.id;

    if (!targetGroupId) return;

    if (current === 0) {
      toast.error('No members have joined yet. Share the link to start collecting photos.');
      return;
    }

    if (current === expected) {
      navigate(`/checkout/${targetGroupId}`);
      return;
    }

    setCheckoutModalOpen(true);
  };

  const proceedWithCurrentTemplate = async () => {
    if (!group) return;

    const current = group.members.length;
    const targetGroupId = groupId || group.id;

    if (!targetGroupId) return;

    setIsCheckoutUpdating(true);
    try {
      await updateGroup(group.id, { totalMembers: current });
      await updateGroupTemplate(group.id);
      const updatedGroup = await getGroup(group.id, true);
      if (updatedGroup) {
        setGroup(updatedGroup);
      }
      setCheckoutModalOpen(false);
      navigate(`/checkout/${targetGroupId}`);
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error('Failed to update group size');
    } finally {
      setIsCheckoutUpdating(false);
    }
  };

  const handleCancelCheckout = () => {
    if (isCheckoutUpdating) return;
    setCheckoutModalOpen(false);
    toast.info('Checkout postponed. Waiting for the expected member count.');
  };

  const completionPercentage = Math.round((group.members.length / group.totalMembers) * 100);
  const winningTemplate = getWinningTemplate(group.votes);
  const isGridComplete = group.members.length === group.totalMembers;

  // Determine which member count to use based on toggle
  const displayMemberCount = showCurrentMembers ? group.members.length : group.totalMembers;
  const displayMembers = showCurrentMembers ? group.members : group.members;
  const currentMembersCount = group.members.length;
  const expectedMembersCount = group.totalMembers;



  return (
    <>
      {walkthroughElement}
      <div className="min-h-screen flex flex-col relative">
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
                    className={`${isGridComplete ? 'bg-pink-500 hover:bg-pink-600' : 'bg-gray-400 cursor-not-allowed'} text-xs sm:text-sm px-3 sm:px-4 py-2`}
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

        <div className="flex-1 flex flex-col">
          <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0 py-4 sm:py-6">
            {/* Main Content Layout */}
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Image Grid Section - Takes remaining space and scrolls */}
              <div className="lg:col-span-2 flex flex-col order-2 lg:order-1">
                <Card className="shadow-xl border-0 backdrop-blur-lg bg-white/80 flex flex-col h-full">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div>
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Live Collage Preview</CardTitle>
                        <CardDescription className="text-xs sm:text-sm lg:text-base">
                          Grid template: {displayMemberCount} members • {group.gridTemplate} layout
                          {showCurrentMembers && group.members.length !== group.totalMembers && (
                            <span className="text-amber-600 ml-1">(Current view)</span>
                          )}
                        </CardDescription>
                      </div>
                      <Button
                        id="guide-view-toggle"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-xs sm:text-sm"
                        onClick={() => setShowCurrentMembers(prev => !prev)}
                        disabled={group.members.length === group.totalMembers}
                      >
                        <Eye className="h-4 w-4 text-purple-600" />
                        {group.members.length === group.totalMembers
                          ? 'Showing complete grid'
                          : showCurrentMembers
                            ? `Viewing current grid(${group.members.length})`
                            : `Viewing expected grid(${group.totalMembers})`}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div id="guide-grid-preview" className="flex justify-center items-start min-h-full">
                      <div className="relative w-full">
                        <GridPreview
                          key={`${group.id} - ${displayMemberCount} - ${showCurrentMembers}`}
                          template={group.gridTemplate}
                          memberCount={displayMemberCount}
                          members={displayMembers}
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
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Payment & Info */}
              <div className="flex-shrink-0 lg:col-span-1 order-1 lg:order-2 space-y-6 flex flex-col h-full">
                {/* Payment Card */}
                <Card className="shadow-lg border-0 backdrop-blur-lg bg-white/80">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Complete Your Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">

                    <Button variant="outline" className="w-full text-sm sm:text-base py-2 sm:py-3" onClick={handleShare}>
                      <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Share Group Link
                    </Button>

                    <Button
                      id="guide-checkout-button"
                      className={`w - full text - sm sm: text - base py - 2 sm: py - 3 ${isGridComplete ? 'bg-pink-500 hover:bg-pink-800' : 'bg-pink-500 hover:bg-pink-800'}`}
                      onClick={handleCheckout}
                      title={
                        showCurrentMembers
                          ? `Checkout with ${group.members.length} current members`
                          : `Checkout with ${group.totalMembers} expected members`
                      }
                    >
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">
                        {showCurrentMembers
                          ? `Checkout(${group.members.length} members)`
                          : isGridComplete
                            ? 'Checkout'
                            : `Checkout(${group.members.length} / ${group.totalMembers})`}
                      </span>
                      <span className="sm:hidden">
                        {showCurrentMembers
                          ? `(${group.members.length})`
                          : isGridComplete
                            ? 'Checkout'
                            : `(${group.members.length} / ${group.totalMembers})`}
                      </span>
                    </Button>

                    {/* <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-3" onClick={() => window.dispatchEvent(new Event('grid-template-download'))}>
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Download
                    </Button> */}

                  </CardContent>
                </Card>

                {/* Member List - Desktop Only */}
                <Card className="shadow-lg border-0 backdrop-blur-lg bg-white/80 hidden lg:flex flex-col flex-1 min-h-0">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Members ({group.members.length}/{group.totalMembers})</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    {group.members.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-4 sm:py-6 text-center">
                        <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm sm:text-base text-gray-500">No members yet</p>
                        <Button variant="outline" size="sm" className="mt-2 text-xs sm:text-sm" onClick={handleShare}>
                          Invite Members
                        </Button>
                      </div>
                    ) : (
                      <div className="h-full space-y-2 sm:space-y-3 overflow-y-auto pr-1">
                        {group.members.map((member: any, index: number) => (
                          <div key={member.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
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

                {/* Voting Results - Desktop Only */}
                <Card className="shadow-lg border-0 backdrop-blur-lg bg-white/80 relative hidden lg:block shrink-0">
                  <Badge className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">coming soon</Badge>
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
                                className={`h-2 rounded-full transition-all duration-300 ${template === winningTemplate
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                  : 'bg-gray-400'
                                  }`}
                                style={{
                                  width: group.members.length > 0
                                    ? `${(group.votes[template] / group.members.length) * 100}% `
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
              </div>
            </div>
          </div>
        </div>
      </div >

      <Dialog
        open={checkoutModalOpen}
        onOpenChange={(open) => {
          if (isCheckoutUpdating) return;
          setCheckoutModalOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proceed with current template?</DialogTitle>
            <DialogDescription>
              Only {currentMembersCount} of {expectedMembersCount} members have joined. You can proceed now and lock the grid at {currentMembersCount} seats, or keep waiting for everyone to join.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={handleCancelCheckout}
              disabled={isCheckoutUpdating}
              className="sm:flex-1"
            >
              Wait for members
            </Button>
            <Button
              onClick={proceedWithCurrentTemplate}
              disabled={isCheckoutUpdating}
              className="sm:flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCheckoutUpdating ? 'Updating...' : `Proceed with ${currentMembersCount} members`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Editor;