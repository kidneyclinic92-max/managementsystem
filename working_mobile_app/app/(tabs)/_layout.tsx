import { Tabs, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

function TabBarIcon({ focused, children }: { focused: boolean; children: string }) {
  return (
    <Text style={{ fontSize: 24 }}>
      {children}
    </Text>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/');
    }
  }, [isHydrated, isAuthenticated, router]);

  return (
    <Tabs>
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused}>📦</TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused}>🛒</TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused}>📋</TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused}>👤</TabBarIcon>
          ),
        }}
      />
    </Tabs>
  );
}










