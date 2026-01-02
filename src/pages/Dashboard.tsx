
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Users, Share, Eye, LogOut, RefreshCw, Trash2, AlertTriangle, Copy, Check, Lock, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollage, Member } from '@/context/CollageContext'
import { MemberDetailsModal } from '@/components/MemberDetailsModal';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { LazyImage } from '@/components/LazyImage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { userApi } from '@/lib/api';

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { getGroup, getAllGroups, isLoading, groups, deleteGroup, updateGroup } = useCollage();
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId?: string }>();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [newCapacity, setNewCapacity] = useState<number | ''>('');
  const [newTemplate, setNewTemplate] = useState<'square' | 'hexagonal' | 'circle' | ''>('');
  const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);
  const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string; yearOfPassing?: string }>>([]);

  // NOTE: For /dashboard/:groupId we no longer auto-redirect to a
  // "default" group; the URL is considered the source of truth.
  // The legacy /dashboard route without :groupId is rare; if needed,
  // we can add a separate redirect there.

  // Load all groups owned by the current user so they can switch between them
  useEffect(() => {
    const loadUserGroups = async () => {
      if (!user?.id) {
        setUserGroups([]);
        return;
      }
      try {
        const res = await userApi.getUserGroups(user.id);
        setUserGroups(res.items || []);
      } catch (err) {
        console.warn('[Dashboard] Failed to load user groups for switcher:', err);
        setUserGroups([]);
      }
    };
    loadUserGroups();
  }, [user?.id]);

  // Lock scrolling for the Dashboard only
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

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
        console.log('Dashboard useEffect - fetchedGroup:', fetchedGroup);

        if (fetchedGroup) {
          setGroup(fetchedGroup);
        } else {
          console.log('No group found for groupId:', groupId);
          toast.error('Group not found');
        }
      } catch (error) {
        console.error('Error fetching group:', error);
        toast.error('Failed to load group');
      } finally {
        setLoadingGroup(false);
      }
    };

    fetchGroup();

    // Set up polling at a more frequent interval (every 5 seconds) for real-time updates
    let pollCount = 0;
    const intervalId = setInterval(() => {
      if (groupId) {
        // Force refresh every 4th poll (every 20 seconds) to ensure fresh data
        const shouldForceRefresh = pollCount % 4 === 0;
        if (shouldForceRefresh) {
          console.log('Polling with force refresh');
          getGroup(groupId, true).then(fetchedGroup => {
            if (fetchedGroup) {
              setGroup(fetchedGroup);
            }
          }).catch(error => {
            console.error('Error in polling force refresh:', error);
          });
        } else {
          fetchGroup();
        }
        pollCount++;
      }
    }, 5000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [groupId, getGroup, navigate, user?.groupId]);

  // Open the share/suggestions modal when user lands on dashboard
  useEffect(() => {
    setIsShareModalOpen(true);
  }, []);

  // Refresh data when user returns to the tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && groupId) {
        console.log('Tab became visible, refreshing group data');
        try {
          const fetchedGroup = await getGroup(groupId, true); // Force refresh
          if (fetchedGroup) {
            setGroup(fetchedGroup);
          }
        } catch (error) {
          console.error('Error refreshing group on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [groupId, getGroup]);

  // Show loading state while context is initializing or group is loading
  if (isLoading || loadingGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
            <p className="text-gray-600">{loadingGroup ? "Loading group data..." : "Initializing application..."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getWinningTemplate = (votes: { hexagonal: number; square: number; circle: number } | undefined) => {
    if (!votes) return 'square'; // Default template if votes is undefined
    return Object.entries(votes).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
  };

  const handleShare = () => {
    if (group) {
      const shareLink = `${window.location.origin}/join/${group.id}`;
      navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    }
  };

  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };


  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleRefresh = async () => {
    if (!groupId) return;

    setIsRefreshing(true);
    try {
      const fetchedGroup = await getGroup(groupId, true); // Force refresh
      console.log('Manual refresh - fetchedGroup:', fetchedGroup);
      console.log('Manual refresh - fetchedGroup.members:', fetchedGroup?.members);
      console.log('Manual refresh - fetchedGroup.members.length:', fetchedGroup?.members?.length);
      if (fetchedGroup) {
        setGroup(fetchedGroup);
        toast.success('Group data refreshed!');
      }
    } catch (error) {
      console.error('Error refreshing group:', error);
      toast.error('Failed to refresh group data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;

    setIsDeleting(true);
    console.log('Starting group deletion for:', groupId);

    try {
      // 1. Delete the group via Context
      console.log('Calling deleteGroup...');
      await deleteGroup(groupId);
      console.log('Group deleted successfully via API');

      // 2. Fetch remaining user groups
      let nextPath = '/create-group';

      if (user?.id) {
        try {
          const res = await userApi.getUserGroups(user.id);
          const remainingGroups = res.items || [];
          // Filter out the deleted group
          const validGroups = remainingGroups.filter((g: any) => g.id !== groupId);
          console.log('Remaining groups:', validGroups);

          if (validGroups.length > 0) {
            nextPath = `/dashboard/${validGroups[0].id}`;
          }
        } catch (err) {
          console.warn('Failed to fetch remaining groups', err);
        }
      }

      // 3. Update user context
      if (user?.groupId === groupId) {
        try {
          await updateUser({
            groupId: null as any,
            isLeader: false
          });
        } catch (e) {
          console.warn('Failed to update user context:', e);
        }
      }

      toast.success('Group deleted successfully');

      // 4. Update UI to "No Group" state without redirecting to /create-group
      // If we have another group, we can redirect there.
      // If no other groups, we stay on this page and let the UI handle the "missing group" state.

      if (nextPath !== '/create-group') {
        console.log('Switching to next group:', nextPath);
        navigate(nextPath, { replace: true });
      } else {
        // Stay on current page but force reload to clear cache/state
        // This will cause the component to re-render, find no group, and display the Empty State we added.
        console.log('No other groups found. Reloading to show empty state.');
        window.location.reload();
      }

    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleCopyLink = () => {
    if (group) {
      const link = `${window.location.origin}/join/${group.id}`;
      navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleOpenCapacityModal = () => {
    if (!group) return;
    setNewCapacity(Math.max(group.totalMembers + 1, group.members.length + 1));
    setNewTemplate(group.gridTemplate);
    setIsCapacityModalOpen(true);
  };

  const handleUpdateCapacity = async () => {
    if (!group || !groupId) return;
    const capacityValue = typeof newCapacity === 'number' ? newCapacity : parseInt(String(newCapacity), 10);
    if (!capacityValue || capacityValue <= group.members.length) {
      toast.error(`Capacity must be greater than current members (${group.members.length}).`);
      return;
    }

    setIsUpdatingCapacity(true);
    try {
      await updateGroup(groupId, {
        totalMembers: capacityValue as any,
        gridTemplate: (newTemplate || group.gridTemplate) as any
      });
      const refreshed = await getGroup(groupId, true);
      if (refreshed) setGroup(refreshed);
      toast.success('Group capacity updated');
      setIsCapacityModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update capacity');
    } finally {
      setIsUpdatingCapacity(false);
    }
  };


  if (!group && !isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <Trash2 className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Group Not Found or Deleted</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            The group you are looking for does not exist or has been deleted.
            You can select another group from the menu or create a new one.
          </p>
          <Link to="/create-group" className="block w-full">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-200 transition-all duration-200 py-6 text-lg">
              <Plus className="h-5 w-5 mr-2" />
              Create New Group
            </Button>
          </Link>

          {userGroups.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <p className="text-sm text-gray-500 mb-4">Or go to your other groups:</p>
              <div className="flex flex-col gap-2">
                {userGroups.map(g => (
                  <Link key={g.id} to={`/dashboard/${g.id}`}>
                    <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {g.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const winningTemplate = getWinningTemplate(group?.votes);
  const completionPercentage = Math.round(((group?.members?.length || 0) / (group?.totalMembers || 1)) * 100);
  const totalVotes = group?.votes ? Object.values(group.votes as { hexagonal: number; square: number; circle: number }).reduce((a: number, b: number) => a + b, 0) : 0;
  const shareLink = `${window.location.origin}/join/${group.id}`;

  // Debug logging
  console.log('Dashboard render - group:', group);
  console.log('Dashboard render - group.members:', group?.members);
  console.log('Dashboard render - group.members.length:', group?.members?.length);

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
    <div className="h-screen overflow-hidden relative flex flex-col">
      <BackgroundDoodle />
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <Link to="/">← Back</Link>
              </Button>
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <div className="hidden sm:flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">{group.name}</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Class of {group.yearOfPassing}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">

              {userGroups.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-xs text-gray-500">Switch group:</span>
                  <Select
                    value={groupId}
                    onValueChange={(value) => {
                      if (value && value !== groupId) {
                        navigate(`/dashboard/${value}`);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-32 sm:w-48 text-xs border-purple-200">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {userGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name} {g.yearOfPassing ? `(${g.yearOfPassing})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-700 font-medium">Live</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden md:inline text-sm font-medium text-gray-700">Welcome, {user?.name}</span>
                <Link to="/create-group">
                  <Button
                    size="sm"
                    className="flex bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:shadow-lg hover:shadow-purple-200 transition-all duration-200 sm:mr-2"
                  >
                    <Plus className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Create Group</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  title="Delete Group"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-gray-700">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-2 overflow-hidden flex flex-col">
        {/* Header & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 shrink-0">

          <div className="lg:col-span-2 h-full">
            <Card className="bg-white/90 backdrop-blur-xl border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col justify-between group">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-1">
                      {group.name}
                    </h1>
                    <p className="text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{group.members.length} of {group.totalMembers} members</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:flex items-center justify-center sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsShareModalOpen(true)}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50 px-2 sm:px-4 text-xs sm:text-sm"
                    >
                      <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                      <span>Invite Members</span>
                    </Button>
                    <Link to={`/editor/${groupId}`} className="w-full">
                      <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 px-2 sm:px-4 text-xs sm:text-sm">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                        <span>Preview & Order</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Group Progress</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{group.members.length} joined</span>
                    <span>{group.totalMembers - group.members.length} spots left</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="h-full hidden lg:block">
            <Card className="bg-white/90 backdrop-blur-xl border-white/50 shadow-xl overflow-hidden h-full relative flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                <div className="p-4 bg-white rounded-full shadow-lg mb-2 animate-in zoom-in duration-500">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 text-base shadow-lg shadow-purple-200">
                  Coming Soon
                </Badge>
              </div>

              <CardContent className="p-6 opacity-40 pointer-events-none select-none filter blur-[2px]">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <h2 className="font-semibold text-gray-900">Template Stats</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 capitalize">
                      {winningTemplate}
                    </Badge>
                    <span className="text-sm font-medium text-gray-600">Current Winner</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Votes</span>
                    <span className="text-2xl font-bold text-gray-900">{totalVotes}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {group.members.length > 0 ?
                      `${Math.round((totalVotes / group.members.length) * 100)}% participation rate` :
                      'Waiting for first vote'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Left Column - Member List */}
          <div className="lg:col-span-2 space-y-4 flex flex-col min-h-0">
            <Card className="bg-white/90 backdrop-blur-xl border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col flex-1 min-h-0">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <CardTitle>Members</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {group.members.length} of {group.totalMembers}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <div className="divide-y divide-gray-100 flex-1 overflow-y-auto scroll-smooth">
                  {group.members.map((member: Member, index: number) => (
                    <div
                      key={member.memberRollNumber || member.id || index}
                      className="flex items-center h-20 gap-4 p-4 hover:bg-white/80 hover:shadow-md transition-all duration-200 cursor-pointer rounded-xl mx-2 my-1 border border-transparent hover:border-purple-100 group shrink-0"
                      onClick={() => handleMemberClick(member)}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          {member.photo ? (
                            <LazyImage
                              src={member.photo}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={() => {
                                console.error(`Failed to load image for ${member.name}`);
                              }}
                            />
                          ) : (
                            <span className="text-sm font-medium text-purple-600">
                              {(member.name || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-100 border-2 border-white flex items-center justify-center">
                          <span className="text-[10px] font-medium text-green-700">#{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{member.name}</p>
                        <p className="text-sm text-gray-500">Roll No. {member.memberRollNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-xs text-gray-500">Active</span>
                      </div>
                    </div>
                  ))}
                  {group.members.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No members have joined yet</p>
                      <p className="text-sm text-gray-400 mt-1">Share the group link to invite members</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vote Distribution */}
            {/* <Card className="relative bg-white/80 backdrop-blur-lg border-none shadow-lg overflow-hidden hidden lg:block">
              <Badge className="absolute px-2 py-1 top-0 right-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                coming soon
              </Badge>
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <CardTitle>Vote Distribution</CardTitle>
                  </div>

                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {totalVotes} total votes
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {Object.entries(group.votes || {}).map(([template, count]) => (
                    <div key={template} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="capitalize font-medium text-gray-700">{template}</span>
                          {winningTemplate === template && (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                              Winner
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{count as number} votes</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-purple-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{
                            width: group.members.length > 0
                              ? `${((count as number) / group.members.length) * 100}%`
                              : '0%'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {group.members.length > 0
                          ? `${Math.round((count as number / group.members.length) * 100)}% of members voted for this template`
                          : 'Waiting for votes'
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-4 h-full hidden lg:flex flex-col pr-1">
            {/* Share Group Section Commented Out
            <Card className="bg-white/90 backdrop-blur-xl border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <Share className="h-5 w-5 text-purple-600" />
                  <CardTitle>Share Group</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900 font-medium mb-2">Invite Link</p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-purple-100">
                      <code className="text-xs flex-1 break-all text-gray-600 font-mono">
                        {window.location.origin}/join/{group.id}
                      </code>
                      <button
                        onClick={handleCopyLink}
                        className="p-1.5 hover:bg-purple-50 rounded-md transition-all duration-200 text-purple-600 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-500 animate-in zoom-in spin-in-50 duration-200" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Link to={`/editor/${groupId}`} className="w-full">
                      <Button
                        className="w-full bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-300 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview & Checkout
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            */}

            <Card className="bg-white/90 backdrop-blur-xl border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex-1">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <CardTitle>Quick Stats</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Completion</span>
                      <span className="text-sm font-medium text-gray-900">{completionPercentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-yellow-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-700">{group.members.length}</p>
                      <p className="text-xs text-purple-600">Members</p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-pink-700">{group.totalMembers - group.members.length}</p>
                      <p className="text-xs text-pink-600">Remaining</p>
                    </div>
                  </div>
                  {group.members.length >= group.totalMembers && (
                    <Button
                      onClick={handleOpenCapacityModal}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    >
                      Increase Capacity
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div >
        </div >
      </div >



      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto bg-white backdrop-blur-lg border-none shadow-xl p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-3 text-center sm:text-left">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Share with Your Class
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600">
              Invite your classmates to join the group and contribute their photos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Invite Link Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Share className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm sm:text-base font-medium text-gray-900">Invite Link</h3>
              </div>
              <div className="p-3 sm:p-4 bg-purple-50 rounded-lg space-y-3">
                <div className="relative">
                  <code className="text-xs sm:text-sm bg-white p-2 sm:p-3 rounded block break-all border border-purple-100">
                    {shareLink}
                  </code>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white pointer-events-none" />
                </div>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full bg-white hover:bg-purple-50 border-purple-200 text-purple-700 h-9 sm:h-10 text-sm"
                >
                  <Share className="h-4 w-4 mr-2" /> Copy Link
                </Button>
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Share className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm sm:text-base font-medium text-gray-900">Share via</h3>
              </div>
              <div className="relative">
                <Carousel className="w-full" opts={{ align: 'start' }}>
                  <CarouselContent className="-ml-2 sm:-ml-4">
                    {[
                      {
                        name: 'WhatsApp',
                        icon: '/icons/whatsapp.svg',
                        bgColor: 'bg-green-50',
                        url: `https://wa.me/?text=${encodeURIComponent(`Join our ${group.name} group! ${shareLink}`)}`
                      },
                      {
                        name: 'Telegram',
                        icon: '/icons/telegram.svg',
                        bgColor: 'bg-blue-50',
                        url: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Join our ${group.name} group!`)}`
                      },
                      {
                        name: 'Email',
                        icon: '/icons/email.svg',
                        bgColor: 'bg-red-50',
                        url: `mailto:?subject=${encodeURIComponent(`${group.name} - Join our group`)}&body=${encodeURIComponent(`Hi!\nJoin our ${group.name} group for ${group.yearOfPassing}: ${shareLink}`)}`
                      },
                      {
                        name: 'Facebook',
                        icon: '/icons/facebook.svg',
                        bgColor: 'bg-blue-50',
                        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`
                      },
                      {
                        name: 'Twitter/X',
                        icon: '/icons/x.svg',
                        bgColor: 'bg-gray-50',
                        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join our ${group.name} group!`)}&url=${encodeURIComponent(shareLink)}`
                      }
                    ].map((platform, index) => (
                      <CarouselItem key={platform.name} className="pl-2 sm:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5">
                        <div
                          onClick={() => openShare(platform.url)}
                          className="cursor-pointer p-2 sm:p-4 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-white/70 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 group"
                        >
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${platform.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <img src={platform.icon} alt={platform.name} className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-gray-700">{platform.name}</span>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1">
                    <div className="h-1 w-6 sm:w-8 rounded-full bg-purple-200" />
                    <div className="h-1 w-6 sm:w-8 rounded-full bg-purple-100" />
                    <div className="h-1 w-6 sm:w-8 rounded-full bg-purple-100" />
                  </div>
                </Carousel>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto bg-white backdrop-blur-lg border-none shadow-xl p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Delete Group
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600">
              Are you sure you want to delete <strong>{group?.name}</strong>? This action cannot be undone. All members and their data will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Increase Capacity Modal */}
      <Dialog open={isCapacityModalOpen} onOpenChange={setIsCapacityModalOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto bg-white backdrop-blur-lg border-none shadow-xl p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-3 text-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Increase Group Capacity
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600">
              Allow more members to join and optionally update the grid template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">New Total Members</Label>
              <Input
                id="capacity"
                type="number"
                min={group?.members.length ? group.members.length + 1 : 1}
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              />
              {group && (
                <p className="text-xs text-gray-500">Current: {group.members.length}/{group.totalMembers}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Grid Template</Label>
              <Select value={newTemplate} onValueChange={(v) => setNewTemplate(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="hexagonal">Hexagonal</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsCapacityModalOpen(false)}
              className="flex-1"
              disabled={isUpdatingCapacity}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCapacity}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={isUpdatingCapacity}
            >
              {isUpdatingCapacity ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MemberDetailsModal
        member={selectedMember}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div >
  );
};

export default Dashboard;