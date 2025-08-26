import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Edit3, Save, Download, Package, User, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Order } from '@/types/admin';
import { mockAdminApi } from '@/services/mockAdminApi';
import { OrderGridPreview } from './OrderGridPreview';
import { EditorControls } from './EditorControls';
import { useAdminOrders } from './AdminOrdersContext';
import { toast } from 'sonner';

interface OrderDetailPanelProps {
  orderId: string;
}

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({ orderId }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const { updateOrderSettings } = useAdminOrders();

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      try {
        const orderData = await mockAdminApi.getOrder(orderId);
        setOrder(orderData);
        setDescription(orderData?.description || '');
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleSaveDescription = async () => {
    if (order) {
      try {
        await mockAdminApi.updateOrder(order.id, { description });
        setOrder({ ...order, description });
        setEditingDescription(false);
        toast.success('Description updated successfully');
      } catch (error) {
        toast.error('Failed to update description');
      }
    }
  };

  const handleDownload = () => {
    // Trigger the existing download mechanism
    window.dispatchEvent(new CustomEvent('grid-template-download'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Order not found
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.id}</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(order.createdAt), 'PPP')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={order.paid ? 'default' : 'destructive'}>
            {order.paid ? 'Paid' : 'Unpaid'}
          </Badge>
          <Badge variant="outline">{order.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Order Info */}
        <div className="space-y-6">
          {/* Customer & Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Customer Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">{order.shipping.name}</h4>
                <p className="text-sm text-muted-foreground">{order.shipping.email}</p>
                <p className="text-sm text-muted-foreground">{order.shipping.phone}</p>
              </div>
              <div>
                <h5 className="font-medium mb-1">Shipping Address</h5>
                <address className="text-sm not-italic text-muted-foreground">
                  {order.shipping.line1}<br />
                  {order.shipping.line2 && <>{order.shipping.line2}<br /></>}
                  {order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}<br />
                  {order.shipping.country}
                </address>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Payment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Payment ID:</span>
                  <span className="font-mono text-sm">{order.paymentId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid At:</span>
                  <span>{order.paidAt ? format(new Date(order.paidAt), 'PPp') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={order.paid ? 'default' : 'destructive'}>
                    {order.paid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Order Description</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingDescription(!editingDescription)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Order description..."
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingDescription(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{order.description || 'No description provided'}</p>
              )}
            </CardContent>
          </Card>

          {/* Editor Controls */}
          <EditorControls 
            order={order} 
            onSettingsChange={(settings) => updateOrderSettings(order.id, settings)} 
          />
        </div>

        {/* Right Panel - Grid Preview and Members */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grid Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Grid Preview ({order.gridTemplate})</span>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderGridPreview order={order} />
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card>
            <CardHeader>
              <CardTitle>Members ({order.members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Vote</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.memberRollNumber}</TableCell>
                      <TableCell>
                        {member.vote && (
                          <Badge variant="outline">{member.vote}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(member.joinedAt), 'MMM dd')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};