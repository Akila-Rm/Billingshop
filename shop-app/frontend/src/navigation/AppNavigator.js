import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../theme';

import DashboardScreen      from '../screens/DashboardScreen';
import ProductsScreen       from '../screens/ProductsScreen';
import AddProductScreen     from '../screens/AddProductScreen';
import ProductDetailScreen  from '../screens/ProductDetailScreen';
import SellScreen           from '../screens/SellScreen';
import ReportsScreen        from '../screens/ReportsScreen';
import ExpensesScreen       from '../screens/ExpensesScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsList"   component={ProductsScreen} />
      <Stack.Screen name="AddProduct"     component={AddProductScreen} />
      <Stack.Screen name="ProductDetail"  component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600', marginBottom: 4 },
        tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border, height: 58 },
        tabBarIcon: ({ focused, color }) => {
          const map = {
            Dashboard: focused ? 'home'      : 'home-outline',
            Products:  focused ? 'cube'      : 'cube-outline',
            Sell:      focused ? 'cart'      : 'cart-outline',
            Reports:   focused ? 'bar-chart' : 'bar-chart-outline',
            Expenses:  focused ? 'receipt'   : 'receipt-outline',
          };
          return <Ionicons name={map[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products"  component={ProductsStack} />
      <Tab.Screen name="Sell"      component={SellScreen} />
      <Tab.Screen name="Reports"   component={ReportsScreen} />
      <Tab.Screen name="Expenses"  component={ExpensesScreen} />
    </Tab.Navigator>
  );
}
