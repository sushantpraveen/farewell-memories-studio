import { useState } from 'react';
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
import { AmbassadorStorageService } from '@/lib/ambassadorStorage';
import { Search, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function AmbassadorAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ambassadors] = useState(() => AmbassadorStorageService.getAllAmbassadors());
  const [allRewards, setAllRewards] = useState(() => AmbassadorStorageService.getAllRewards());
  const [selectedAmbassador, setSelectedAmbassador] = useState<string | null>(null);

  const filteredAmbassadors = ambassadors.filter(
    (amb) =>
      amb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amb.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amb.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amb.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkAsPaid = (rewardId: string) => {
    const success = AmbassadorStorageService.updateRewardStatus(rewardId, 'Paid');
    if (success) {
      setAllRewards(AmbassadorStorageService.getAllRewards());
      toast.success('Reward marked as paid');
    } else {
      toast.error('Failed to update reward status');
    }
  };

  const handleUpdateStatus = (rewardId: string, status: 'Pending' | 'Approved' | 'Paid') => {
    const success = AmbassadorStorageService.updateRewardStatus(rewardId, status);
    if (success) {
      setAllRewards(AmbassadorStorageService.getAllRewards());
      toast.success(`Reward status updated to ${status}`);
    } else {
      toast.error('Failed to update reward status');
    }
  };

  const getAmbassadorRewards = (ambassadorId: string) => {
    return allRewards.filter((r) => r.ambassadorId === ambassadorId);
  };

  const stats = {
    totalAmbassadors: ambassadors.length,
    totalRewards: allRewards.reduce((sum, r) => sum + r.rewardAmount, 0),
    pendingPayouts: allRewards.filter((r) => r.status === 'Pending').reduce((sum, r) => sum + r.rewardAmount, 0),
    paidPayouts: allRewards.filter((r) => r.status === 'Paid').reduce((sum, r) => sum + r.rewardAmount, 0),
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
                {filteredAmbassadors.map((ambassador) => {
                  const rewards = getAmbassadorRewards(ambassador.id);
                  const stats = AmbassadorStorageService.getAmbassadorStats(ambassador.id);

                  return (
                    <TableRow key={ambassador.id}>
                      <TableCell className="font-medium">{ambassador.name}</TableCell>
                      <TableCell>{ambassador.college}</TableCell>
                      <TableCell>{ambassador.email}</TableCell>
                      <TableCell>{ambassador.whatsapp}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ambassador.referralCode}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">₹{ambassador.totalRewards}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAmbassador(ambassador.id)}
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
                                  <div className="text-2xl font-bold">{stats.totalGroups}</div>
                                  <div className="text-sm text-muted-foreground">Total Groups</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-2xl font-bold">{stats.totalMembers}</div>
                                  <div className="text-sm text-muted-foreground">Total Members</div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-2xl font-bold">₹{stats.totalRewards}</div>
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
                                {rewards.map((reward) => (
                                  <TableRow key={reward.id}>
                                    <TableCell className="font-medium">{reward.groupName}</TableCell>
                                    <TableCell>{reward.memberCount}</TableCell>
                                    <TableCell className="font-semibold">
                                      ₹{reward.rewardAmount}
                                    </TableCell>
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
                                    <TableCell>
                                      {new Date(reward.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        {reward.status === 'Pending' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleUpdateStatus(reward.id, 'Approved')}
                                          >
                                            Approve
                                          </Button>
                                        )}
                                        {reward.status !== 'Paid' && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleMarkAsPaid(reward.id)}
                                          >
                                            Mark Paid
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

        {/* All Rewards Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>All Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ambassador</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRewards
                  .filter((r) => r.status !== 'Paid')
                  .map((reward) => {
                    const ambassador = ambassadors.find((a) => a.id === reward.ambassadorId);
                    return (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ambassador?.name}</div>
                            <div className="text-sm text-muted-foreground">{ambassador?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{reward.groupName}</TableCell>
                        <TableCell>{reward.memberCount}</TableCell>
                        <TableCell className="font-semibold">₹{reward.rewardAmount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={reward.status === 'Approved' ? 'secondary' : 'outline'}
                          >
                            {reward.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(reward.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {reward.status === 'Pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(reward.id, 'Approved')}
                              >
                                Approve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsPaid(reward.id)}
                            >
                              Mark Paid
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
