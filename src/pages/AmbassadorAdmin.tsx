import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ambassadorAdminApi } from '@/services/ambassadorAdminApi';
import { adminApi } from '@/services/adminApi';
import { getAmbassadorRewards as getAmbassadorRewardsApi, Paginated, AmbassadorRewardItem } from '@/lib/ambassadorApi';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Search, CheckCircle, Clock, DollarSign, Upload, X, Image as ImageIcon, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function AmbassadorAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ambassadors, setAmbassadors] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      college?: string;
      referralCode: string;
      referralLink: string;
      upiId?: string;
      totals: {
        rewardsPaid: number;
        rewardsPending: number;
      };
      createdAt: string;
    }>
  >([]);
  const [ambassadorsTotal, setAmbassadorsTotal] = useState(0);
  const [pendingRewards, setPendingRewards] = useState<AmbassadorRewardItem[]>([]);
  const [approvedRewards, setApprovedRewards] = useState<AmbassadorRewardItem[]>([]);
  const [allRewards, setAllRewards] = useState<AmbassadorRewardItem[]>([]);
  const [selectedAmbassador, setSelectedAmbassador] = useState<string | null>(null);
  const [selectedAmbassadorRewards, setSelectedAmbassadorRewards] = useState<AmbassadorRewardItem[]>([]);
  const [payingRewardId, setPayingRewardId] = useState<string | null>(null);
  const [rewardScreenshots, setRewardScreenshots] = useState<Record<string, string>>({});
  const [uploadingScreenshots, setUploadingScreenshots] = useState<Record<string, boolean>>({});
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [currentRewardForPayment, setCurrentRewardForPayment] = useState<{ id: string; amount: number; ambassadorName: string } | null>(null);
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);

  const loadAmbassadors = async () => {
    try {
      const res = await ambassadorAdminApi.listAmbassadors(1, 20, searchTerm.trim());
      setAmbassadors(res.items || []);
      setAmbassadorsTotal(res.total || res.items?.length || 0);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load ambassadors');
    }
  };

  const extractScreenshotUrl = (txRef: string | undefined): string | null => {
    if (!txRef) return null;
    const match = txRef.match(/SCREENSHOT:(https?:\/\/[^\s]+)/);
    return match ? match[1] : null;
  };

  const loadAdminRewards = async () => {
    try {
      // Load all rewards (pending, approved, and paid)
      const [pendingRes, approvedRes, paidRes, allRes] = await Promise.all<[
        Promise<Paginated<AmbassadorRewardItem>>,
        Promise<Paginated<AmbassadorRewardItem>>,
        Promise<Paginated<AmbassadorRewardItem>>,
        Promise<Paginated<AmbassadorRewardItem>>
      ]>([
        ambassadorAdminApi.getRewards(1, 100, 'Pending' as any).catch(() =>
          ambassadorAdminApi.getRewards(1, 100, 'pending' as any)
        ) as any,
        ambassadorAdminApi.getRewards(1, 100, 'Approved' as any) as any,
        ambassadorAdminApi.getRewards(1, 100, 'Paid' as any).catch(() =>
          ambassadorAdminApi.getRewards(1, 100, 'paid' as any)
        ) as any,
        ambassadorAdminApi.getRewards(1, 1000) as any, // Load all for stats
      ]);
      
      // Filter to only show 'pending' or 'Pending' status
      const pending = (pendingRes.items || []).filter(r =>
        r.status === 'pending' || r.status === 'Pending'
      );
      setPendingRewards(pending);
      setApprovedRewards(approvedRes.items || []);
      
      // Store all rewards for stats calculation
      const all = allRes.items || [];
      setAllRewards(all);
      
      // Extract screenshot URLs from paidTxRef
      const screenshots: Record<string, string> = {};
      all.forEach(reward => {
        if (reward.paidTxRef) {
          const screenshotUrl = extractScreenshotUrl(reward.paidTxRef);
          if (screenshotUrl) {
            screenshots[reward.id] = screenshotUrl;
          }
        }
      });
      
      // Also load from localStorage
      const stored = localStorage.getItem('ambassadorRewardScreenshots');
      if (stored) {
        try {
          const storedScreenshots = JSON.parse(stored);
          Object.assign(screenshots, storedScreenshots);
        } catch (e) {
          console.error('Failed to load screenshots from localStorage', e);
        }
      }
      
      setRewardScreenshots(screenshots);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load rewards');
    }
  };

  useEffect(() => {
    loadAmbassadors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    loadAdminRewards();
  }, []);

  // Save screenshots to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(rewardScreenshots).length > 0) {
      localStorage.setItem('ambassadorRewardScreenshots', JSON.stringify(rewardScreenshots));
    }
  }, [rewardScreenshots]);

  const openMarkPaidDialog = (rewardId: string) => {
    const reward =
      selectedAmbassadorRewards.find(r => r.id === rewardId) ||
      pendingRewards.find(r => r.id === rewardId) ||
      approvedRewards.find(r => r.id === rewardId);

    if (!reward) {
      toast.error('Reward not found in current view');
      return;
    }

    const ambassador = ambassadors.find(a => a.id === reward.ambassadorId);
    if (!ambassador || !ambassador.upiId) {
      toast.error('Ambassador has no UPI ID set. Ask them to add it on their dashboard.');
      return;
    }

    setCurrentRewardForPayment({
      id: reward.id,
      amount: reward.rewardAmount,
      ambassadorName: ambassador.name,
    });
    setPaymentScreenshotFile(null);
    setPaymentScreenshotPreview(null);
    setMarkPaidDialogOpen(true);
  };

  const handleScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setPaymentScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMarkAsPaid = async () => {
    if (!currentRewardForPayment) return;

    const rewardId = currentRewardForPayment.id;
    let screenshotUrl: string | undefined;

    // Upload screenshot if provided
    if (paymentScreenshotFile) {
      try {
        setUploadingScreenshots(prev => ({ ...prev, [rewardId]: true }));
        const result = await uploadToCloudinary(paymentScreenshotFile, 'ambassador-payments');
        screenshotUrl = result.secure_url;
        setRewardScreenshots(prev => ({ ...prev, [rewardId]: screenshotUrl! }));
        toast.success('Screenshot uploaded');
      } catch (e: any) {
        console.error('Screenshot upload error:', e);
        toast.error('Failed to upload screenshot, but continuing with payment...');
      } finally {
        setUploadingScreenshots(prev => ({ ...prev, [rewardId]: false }));
      }
    }

    try {
      setPayingRewardId(rewardId);

      // Generate a simple transaction reference (include screenshot URL if available)
      const txRef = screenshotUrl
        ? `MANUAL-${rewardId}-${Date.now()}-SCREENSHOT:${screenshotUrl}`
        : `MANUAL-${rewardId}-${Date.now()}`;

      await adminApi.markPayoutPaid(rewardId, txRef, 'manual-upi');
      toast.success('Reward marked as paid');
      await loadAdminRewards();
      setMarkPaidDialogOpen(false);
      setCurrentRewardForPayment(null);
      setPaymentScreenshotFile(null);
      setPaymentScreenshotPreview(null);
    } catch (e: any) {
      console.error('Failed to mark reward as paid:', e);
      toast.error(e?.message || 'Failed to mark reward as paid');
    } finally {
      setPayingRewardId(null);
    }
  };

  const handleUpdateStatus = async (rewardId: string, status: 'Pending' | 'Approved' | 'Paid') => {
    try {
      await ambassadorAdminApi.updateRewardStatus(rewardId, status);
      await loadAdminRewards();
      toast.success(`Reward status updated to ${status}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update reward status');
    }
  };

  const openRewardsDialog = async (ambassadorId: string) => {
    setSelectedAmbassador(ambassadorId);
    try {
      const res = await getAmbassadorRewardsApi(ambassadorId, 1, 100);
      setSelectedAmbassadorRewards(res.items || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load ambassador rewards');
      setSelectedAmbassadorRewards([]);
    }
  };

  // Calculate real stats from fetched data
  const stats = {
    totalAmbassadors: ambassadorsTotal,
    totalRewards: allRewards.reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
    pendingPayouts: allRewards
      .filter(r => r.status === 'pending' || r.status === 'Pending')
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
    paidPayouts: allRewards
      .filter(r => r.status === 'Paid' || r.status === 'paid')
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Campus Ambassador Admin</h1>
          <p className="text-muted-foreground">Manage ambassadors, rewards, and payouts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ambassadors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAmbassadors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{stats.totalRewards}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">₹{stats.pendingPayouts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{stats.paidPayouts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Ambassadors Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search ambassadors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Total Rewards</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ambassadors.map((ambassador) => {
                  return (
                    <TableRow key={ambassador.id}>
                      <TableCell className="font-medium">{ambassador.name}</TableCell>
                      <TableCell>{ambassador.college}</TableCell>
                      <TableCell>{ambassador.email}</TableCell>
                      <TableCell>{ambassador.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ambassador.referralCode}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">₹{ambassador?.totals?.rewardsPaid}</TableCell>
                      <TableCell>
                        <Dialog open={selectedAmbassador === ambassador.id} onOpenChange={(open) => !open && setSelectedAmbassador(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRewardsDialog(ambassador.id)}
                            >
                              View Rewards
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{ambassador.name} - Rewards</DialogTitle>
                              <DialogDescription>
                                {ambassador.email} • {ambassador.referralCode}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-3 gap-4 my-4">
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-2xl font-bold">{selectedAmbassadorRewards.length}</div>
                                  <div className="text-sm text-muted-foreground">Total Groups</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-2xl font-bold">{selectedAmbassadorRewards.reduce((s, r) => s + (r.memberCount || 0), 0)}</div>
                                  <div className="text-sm text-muted-foreground">Total Members</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-2xl font-bold">₹{selectedAmbassadorRewards.reduce((s, r) => s + (r.rewardAmount || 0), 0)}</div>
                                  <div className="text-sm text-muted-foreground">Total Earned</div>
                                </CardContent>
                              </Card>
                            </div>

                            {ambassador.upiId && (
                              <div className="bg-muted p-4 rounded-lg mb-4">
                                <p className="text-sm font-medium">UPI ID: {ambassador.upiId}</p>
                              </div>
                            )}

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Group Name</TableHead>
                                  <TableHead>Members</TableHead>
                                  <TableHead>Reward</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedAmbassadorRewards.map((reward) => (
                                  <TableRow key={reward.id}>
                                    <TableCell className="font-medium">{reward.groupName}</TableCell>
                                    <TableCell>{reward.memberCount}</TableCell>
                                    <TableCell className="font-semibold">₹{reward.rewardAmount}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          reward.status === 'Paid'
                                            ? 'default'
                                            : reward.status === 'Approved'
                                              ? 'secondary'
                                              : 'outline'
                                        }
                                      >
                                        {reward.status === 'Paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {reward.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                                        {reward.status === 'Approved' && <DollarSign className="w-3 h-3 mr-1" />}
                                        {reward.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(reward.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        {reward.status === 'Pending' && (
                                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(reward.id, 'Approved')}>
                                            Approve
                                          </Button>
                                        )}
                                        {reward.status !== 'Paid' && (
                                          <Button
                                            size="sm"
                                            onClick={() => openMarkPaidDialog(reward.id)}
                                            disabled={payingRewardId === reward.id}
                                          >
                                            {payingRewardId === reward.id ? 'Processing...' : 'Mark as Paid'}
                                          </Button>
                                        )}
                                        {rewardScreenshots[reward.id] && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(rewardScreenshots[reward.id], '_blank')}
                                          >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View Screenshot
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

       

        {/* Mark as Paid Dialog with Screenshot Upload */}
        <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mark Reward as Paid</DialogTitle>
              <DialogDescription>
                {currentRewardForPayment && (
                  <>
                    Mark reward of ₹{currentRewardForPayment.amount} as paid for {currentRewardForPayment.ambassadorName}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Screenshot Upload Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Screenshot (Optional)</label>
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot of the payment confirmation for record keeping
                </p>

                {paymentScreenshotPreview ? (
                  <div className="relative">
                    <img
                      src={paymentScreenshotPreview}
                      alt="Screenshot preview"
                      className="max-w-full max-h-64 rounded-md border"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPaymentScreenshotFile(null);
                        setPaymentScreenshotPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="screenshot-upload" className="cursor-pointer">
                    <input
                      id="screenshot-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshotFileChange}
                      disabled={uploadingScreenshots[currentRewardForPayment?.id || ''] || payingRewardId !== null}
                    />
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-muted transition-colors">
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload payment screenshot
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMarkPaidDialogOpen(false);
                    setCurrentRewardForPayment(null);
                    setPaymentScreenshotFile(null);
                    setPaymentScreenshotPreview(null);
                  }}
                  disabled={payingRewardId !== null}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={payingRewardId !== null || uploadingScreenshots[currentRewardForPayment?.id || '']}
                >
                  {payingRewardId !== null
                    ? 'Processing...'
                    : uploadingScreenshots[currentRewardForPayment?.id || '']
                      ? 'Uploading Screenshot...'
                      : 'Confirm & Mark as Paid'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
