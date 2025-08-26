import React from 'react';
import { format } from 'date-fns';
import { Eye, Edit3, Download, Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminOrders } from './AdminOrdersContext';
import { Order } from '@/types/admin';

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'ready': return 'bg-green-100 text-green-800';
    case 'shipped': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const OrdersTable: React.FC = () => {
  const {
    orders,
    selectedOrders,
    setSelectedOrders,
    updateOrderStatus,
    openOrderTab,
    loading
  } = useAdminOrders();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleStatusChange = (orderId: string, status: Order['status']) => {
    updateOrderStatus(orderId, status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{order.shipping.name}</div>
                  <div className="text-sm text-muted-foreground">{order.shipping.email}</div>
                </div>
              </TableCell>
              <TableCell>{order.members.length}</TableCell>
              <TableCell>
                <Select
                  value={order.status}
                  onValueChange={(value: Order['status']) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <Badge className={getStatusColor(order.status)} variant="secondary">
                      <SelectValue />
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  {order.paid ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className={order.paid ? 'text-green-600' : 'text-red-600'}>
                    {order.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(order.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openOrderTab(order.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};