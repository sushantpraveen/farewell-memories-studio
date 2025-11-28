import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AmbassadorStorageService } from '@/lib/ambassadorStorage';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AmbassadorDashboard() {
  const { ambassadorId } = useParams<{ ambassadorId: string }>();
  const navigate = useNavigate();

  if (!ambassadorId) {
    navigate('/ambassador/signup');
    return null;
  }

  const ambassador = AmbassadorStorageService.getAmbassadorById(ambassadorId);
  
  if (!ambassador) {
    toast.error('Ambassador not found');
    navigate('/ambassador/signup');
    return null;
  }

  const stats = AmbassadorStorageService.getAmbassadorStats(ambassadorId);
  const rewards = AmbassadorStorageService.getRewardsByAmbassador(ambassadorId);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(ambassador.referralLink);
    toast.success('Referral link copied!');
  };

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
                {ambassador.referralLink}
              </div>
              <Button onClick={copyReferralLink} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Referral Code: <span className="font-bold">{ambassador.referralCode}</span>
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
              <CardTitle className="text-lg">Total Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₹{stats.totalRewards}</div>
              <p className="text-sm text-muted-foreground mt-1">
                ₹{stats.paidRewards} paid • ₹{stats.pendingRewards} pending
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
            {rewards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rewards yet. Start sharing your referral link!</p>
                <Button onClick={copyReferralLink} className="mt-4">
                  Copy Referral Link
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
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
                            reward.status === 'Paid'
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reward Tiers Info */}
        <Card>
          <CardHeader>
            <CardTitle>Reward Tiers</CardTitle>
            <CardDescription>Earn more with bigger groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span>20-40 members</span>
                <span className="font-semibold">₹200</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span>41-60 members</span>
                <span className="font-semibold">₹400</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span>61-100 members</span>
                <span className="font-semibold">₹750</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span>100+ members</span>
                <span className="font-semibold">₹1,200</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
