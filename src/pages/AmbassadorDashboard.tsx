import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAmbassador, getAmbassadorStats, getAmbassadorSummary, getAmbassadorRewards, updateAmbassadorPayoutMethod, type AmbassadorResponse, type AmbassadorStatsResponse, type AmbassadorSummaryResponse, type AmbassadorRewardItem } from '@/lib/ambassadorApi';
import { Copy, ExternalLink, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AmbassadorDashboard() {
  const { ambassadorId } = useParams<{ ambassadorId: string }>();
  const navigate = useNavigate();

  const [ambassador, setAmbassador] = useState<AmbassadorResponse | null>(null);
  const [stats, setStats] = useState<AmbassadorStatsResponse | null>(null);
  const [summary, setSummary] = useState<AmbassadorSummaryResponse | null>(null);
  const [rewards, setRewards] = useState<AmbassadorRewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upiInput, setUpiInput] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [rewardScreenshots, setRewardScreenshots] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ambassadorId) {
      navigate('/ambassador/signup');
      return;
    }
    // If id doesn't look like a Mongo ObjectId, redirect to signup
    if (!/^[a-fA-F0-9]{24}$/.test(ambassadorId)) {
      toast.error('Ambassador not found');
      navigate('/ambassador/signup');
      return;
    }

    const run = async () => {
      try {
        const amb = await getAmbassador(ambassadorId);
        setAmbassador(amb);
        // Store ambassadorId in localStorage for quick access
        localStorage.setItem('ambassadorId', ambassadorId);
        const s = await getAmbassadorStats(ambassadorId);
        setStats(s);
        const summaryData = await getAmbassadorSummary(ambassadorId);
        setSummary(summaryData);
        const r = await getAmbassadorRewards(ambassadorId, 1, 50);
        setRewards(r.items);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load ambassador');
        navigate('/ambassador/signup');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [ambassadorId, navigate]);

  const copyReferralLink = () => {
    if (!ambassador) return;
    const fallbackLink = `${window.location.origin}/ref/${ambassador.referralCode}`;
    const linkToCopy = ambassador.referralLink || fallbackLink;
    navigator.clipboard.writeText(linkToCopy);
    toast.success('Referral link copied!');
  };

  const handleSaveUpi = async () => {
    if (!ambassador) return;

    const value = upiInput.trim();
    const upiRegex = /^[\w.-]+@[\w-]+$/;
    if (!value || !upiRegex.test(value)) {
      toast.error('Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }

    try {
      setSavingUpi(true);
      const updated = await updateAmbassadorPayoutMethod(ambassador.id, { type: 'upi', upiId: value });
      setAmbassador(updated);
      toast.success('UPI payout method saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save UPI ID');
    } finally {
      setSavingUpi(false);
    }
  };

  // Extract screenshot URLs from rewards (if stored in backend)
  useEffect(() => {
    const screenshots: Record<string, string> = {};
    rewards.forEach(reward => {
      // Check if reward has paidTxRef with screenshot URL
      // This would need to be added to the API response if not already there
      // For now, we'll check localStorage for any stored screenshots
      const stored = localStorage.getItem(`reward-screenshot-${reward.id}`);
      if (stored) {
        screenshots[reward.id] = stored;
      }
    });
    if (Object.keys(screenshots).length > 0) {
      setRewardScreenshots(screenshots);
    }
  }, [rewards]);

  const handleDownloadScreenshot = (rewardId: string, url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-screenshot-${rewardId}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Screenshot download started');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Loading...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!ambassador || !stats) return null;

  const referralUrl =
    ambassador.referralLink || `${window.location.origin}/ref/${ambassador.referralCode}`;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Campus Ambassador Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {ambassador.name}!</p>
        </div>

        {/* Referral Link Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>Share this link to earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {referralUrl}
              </div>
              <Button onClick={copyReferralLink} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Referral Code: <span className="font-bold">{ambassador.referralCode}</span>
            </div>
            {stats.referredGroups > 0 && (
              <div className="mt-3 p-3 rounded-md bg-green-50 border border-green-200 text-sm">
                ✅ <span className="font-medium">{stats.referredGroups}</span> {stats.referredGroups === 1 ? 'group has' : 'groups have'} been created using your referral link.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout settings */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Method</CardTitle>
            <CardDescription>Provide your UPI ID so the admin can pay your rewards manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">UPI ID</label>
                <input
                  type="text"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="yourname@bank"
                  value={upiInput || ambassador.upiId || ''}
                  onChange={(e) => setUpiInput(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Example: <code className="font-mono">name@icici</code>. We only store this UPI ID, not any card details.
                </p>
              </div>
              <Button onClick={handleSaveUpi} disabled={savingUpi}>
                {savingUpi ? 'Saving…' : 'Save UPI'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalGroups}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.completedOrders} completed orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
              <p className="text-sm text-muted-foreground mt-1">
                across all groups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Paid Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ₹{summary?.totalRewards.paid ?? stats.paidRewards ?? 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Transferred to you after admin approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rewards List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Rewards</CardTitle>
            <CardDescription>Track all your earnings from group referrals</CardDescription>
          </CardHeader>
          <CardContent>
            {rewards.filter(r => r.status === 'Paid' || r.status === 'paid').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rewards yet. Start sharing your referral link!</p>
                <Button onClick={copyReferralLink} className="mt-4">
                  Copy Referral Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards
                  .filter(reward => reward.status === 'Paid' || reward.status === 'paid')
                  .map((reward) => {
                    const screenshotUrl = rewardScreenshots[reward.id];
                    return (
                      <div
                        key={reward.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold">{reward.groupName}</div>
                            <div className="text-sm text-muted-foreground">
                              {reward.memberCount} members • Created {new Date(reward.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-bold text-lg">₹{reward.rewardAmount}</div>
                              <Badge
                                variant={
                                  reward.status === 'Paid' || reward.status === 'paid'
                                    ? 'default'
                                    : reward.status === 'Approved'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {reward.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Payment Screenshot Section */}
                        {screenshotUrl && (
                          <div className="border-t pt-3 space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">
                              Payment Success Screenshot
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(screenshotUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Screenshot
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadScreenshot(reward.id, screenshotUrl)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reward Rule */}
        <Card>
          <CardHeader>
            <CardTitle>Reward Rule</CardTitle>
            <CardDescription>Simple and scalable earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Each member who joins a group pays <span className="font-semibold">₹189</span> (incl. GST). You earn
                <span className="font-semibold"> 10%</span> of this, i.e., <span className="font-semibold">₹18.9 per member</span>.
              </p>
              <p className="text-xs">
                Example: If 50 members complete their join payment across your referred groups, your reward is
                <span className="font-semibold"> 50 × ₹18.9 = ₹945</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
