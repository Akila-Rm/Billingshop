import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReportSummary, getSales, getProducts } from '../services/api';
import { globalStyles } from '../theme/styles';
import { Colors, Radius } from '../theme';

function todayRange() {
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to   = new Date(); to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [todaySummary, setTodaySummary] = useState(null);
  const [allTimeSummary, setAllTimeSummary] = useState(null);
  const [recentSales, setRecent] = useState([]);
  const [stockLeft, setStockLeft] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const { from, to } = todayRange();
      const [today, all, sales, prods] = await Promise.all([
        getReportSummary({ from, to }),
        getReportSummary({}),
        getSales({ limit: 10 }),
        getProducts(),
      ]);
      setTodaySummary(today);
      setAllTimeSummary(all);
      setRecent(sales.slice(0, 5));
      const totalStock = prods.reduce((sum, p) => sum + p.stock_quantity, 0);
      setStockLeft(totalStock);
    } catch (e) {
      console.log('Error loading dashboard', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const money = (n) => '₹' + Number(n).toLocaleString('en-IN', {maximumFractionDigits:0});

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>Dashboard</Text>
      </View>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={globalStyles.statGrid}>
        <View style={globalStyles.stat}>
          <Text style={globalStyles.statLabel}>Today's sales</Text>
          <Text style={globalStyles.statValue}>{todaySummary?.total_sales || 0}</Text>
        </View>
        <View style={globalStyles.stat}>
          <Text style={globalStyles.statLabel}>Today's revenue</Text>
          <Text style={globalStyles.statValue}>{money(todaySummary?.total_revenue || 0)}</Text>
        </View>
        <View style={globalStyles.stat}>
          <Text style={globalStyles.statLabel}>Today's profit</Text>
          <Text style={[globalStyles.statValue, globalStyles.statValueProfit]}>{money(todaySummary?.total_profit || 0)}</Text>
        </View>
        <View style={globalStyles.stat}>
          <Text style={globalStyles.statLabel}>Total stock left</Text>
          <Text style={globalStyles.statValue}>{stockLeft}</Text>
        </View>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.h2}>All-time profit</Text>
        <View style={styles.rline}>
          <Text style={styles.rlineText}>Total revenue</Text>
          <Text style={styles.rlineText}>{money(allTimeSummary?.total_revenue || 0)}</Text>
        </View>
        <View style={styles.rline}>
          <Text style={styles.rlineText}>Total profit</Text>
          <Text style={styles.rlineText}>{money(allTimeSummary?.total_profit || 0)}</Text>
        </View>
        <View style={[styles.rline, { marginBottom: 0 }]}>
          <Text style={styles.rlineText}>Pairs sold</Text>
          <Text style={styles.rlineText}>{allTimeSummary?.total_sales || 0}</Text>
        </View>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.h2}>Recent sales</Text>
        {recentSales.length === 0 ? (
          <Text style={globalStyles.empty}>No sales recorded yet.</Text>
        ) : (
          <View>
            {recentSales.map((sale, i) => (
              <View key={sale.id} style={[styles.saleRow, i === recentSales.length - 1 && styles.lastItem]}>
                <View>
                  <Text style={styles.sname}>{sale.items?.[0]?.product_name || 'Slipper'}</Text>
                  <Text style={styles.stime}>{new Date(sale.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.samt}>{money(sale.total_amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  rlineText: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 13.1,
    color: Colors.ink,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  lastItem: { borderBottomWidth: 0 },
  sname: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 13.1,
    color: Colors.ink,
  },
  stime: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 11.5,
    color: Colors.inkSoft,
    marginTop: 2,
  },
  samt: {
    fontFamily: 'WorkSans_700Bold',
    fontSize: 13.1,
    color: Colors.olive,
  },
});
