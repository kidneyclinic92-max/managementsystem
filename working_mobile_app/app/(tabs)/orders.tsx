import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  total: number;
  createdAt: string;
  supplier?: string;
  approvalStatus?: string;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  // Refresh when returning to the tab so approvals done in the IMS are reflected
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders?type=purchase');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'processing':
        return '#007AFF';
      case 'shipped':
        return '#0ea5e9';
      case 'delivered':
        return '#16a34a';
      case 'pending':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const handleApprove = async (orderId: string) => {
    setApprovingId(orderId);
    try {
      await api.post(`/orders/${orderId}/approve`);
      await fetchOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order');
    } finally {
      setApprovingId(null);
    }
  };

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.orderLabel}>Supplier:</Text>
        <Text style={styles.orderValue}>{item.supplier || 'N/A'}</Text>
      </View>

      {(item.shippingCarrier || item.trackingNumber || item.shippedAt || item.deliveredAt) && (
        <View style={styles.trackingBox}>
          <Text style={styles.trackingTitle}>Tracking</Text>
          {item.shippingCarrier && (
            <Text style={styles.trackingText}>Carrier: {item.shippingCarrier}</Text>
          )}
          {item.trackingNumber && (
            <Text style={styles.trackingText}>Tracking #: {item.trackingNumber}</Text>
          )}
          {item.shippedAt && (
            <Text style={styles.trackingText}>
              Shipped: {new Date(item.shippedAt).toLocaleDateString()}
            </Text>
          )}
          {item.deliveredAt && (
            <Text style={styles.trackingText}>
              Delivered: {new Date(item.deliveredAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {item.approvalStatus && (
        <View style={styles.orderDetails}>
          <Text style={styles.orderLabel}>Approval:</Text>
          <Text
            style={[
              styles.orderValue,
              item.approvalStatus === 'approved' && styles.approvedText,
              item.approvalStatus === 'rejected' && styles.rejectedText,
            ]}
          >
            {item.approvalStatus === 'pending_approval'
              ? 'Pending Approval'
              : item.approvalStatus}
          </Text>
        </View>
      )}

      {item.approvalStatus === 'pending_approval' && user?.role === 'admin' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.approveButton,
              approvingId === item.id && styles.buttonDisabled,
            ]}
            onPress={() => handleApprove(item.id)}
            disabled={approvingId === item.id}
          >
            {approvingId === item.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.approveButtonText}>Approve</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              Place your first order to see it here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  orderValue: {
    fontSize: 14,
    flex: 1,
  },
  approvedText: {
    color: '#34C759',
    fontWeight: '600',
  },
  rejectedText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  trackingBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 2,
  },
  trackingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  trackingText: {
    fontSize: 12,
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  approveButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});





