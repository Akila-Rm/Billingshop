import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getReportSummary, getSales, getProducts } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

function todayRange() {
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to   = new Date(); to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function StatCard({ label, value, icon, color }) {
  return (
    <View style={[sc.card, Shadow.small]}>
      <View style={[sc.icon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={sc.val} numberOfLines={1}>{value}</Text>
      <Text style={sc.lbl}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', margin: Spacing.xs },
  icon: { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  val:  { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  lbl:  { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
});

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary]     = useState(null);
  const [recentSales, setRecent]  = useState([]);
  const [lowStock, setLowStock]   = useState([]);
  const [prodCount, setProdCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const { from, to } = todayRange();
      const [sum, sales, prods] = await Promise.all([
        getReportSummary({ from, to }),
        getSales({ from, to }),
        getProducts(),
      ]);
      setSummary(sum);
      setRecent(sales.slice(0, 5));
      setProdCount(prods.length);
      setLowStock(prods.filter(p => p.stock_quantity <= p.low_stock_threshold));
    } catch (e) { console.warn(e.message); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.shopName}>🛍 Lavanya Shop</Text>
          <Text style={styles.date}>{new Date().toDateString()}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>Today's Overview</Text>
        <View style={styles.row}>
          <StatCard label="Revenue"  value={fmt(summary?.total_revenue)} icon="cash-outline"         color={Colors.success} />
          <StatCard label="Profit"   value={fmt(summary?.total_profit)}  icon="trending-up-outline"  color={Colors.primary} />
        </View>
        <View style={styles.row}>
          <StatCard label="Sales"    value={String(summary?.total_sales ?? 0)} icon="receipt-outline" color={Colors.info} />
          <StatCard label="Products" value={String(prodCount)}                 icon="cube-outline"    color={Colors.secondary} />
        </View>

        {lowStock.length > 0 && (
          <TouchableOpacity style={styles.alert} onPress={() => navigation.navigate('Products')}>
            <Ionicons name="warning" size={18} color={Colors.warning} />
            <Text style={styles.alertTxt}>{lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low on stock — tap to view</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.warning} />
          </TouchableOpacity>
        )}

        {lowStock.length > 0 && (
          <>
            <Text style={styles.section}>Low Stock</Text>
            {lowStock.map(p => (
              <View key={p.id} style={[styles.lowRow, Shadow.small]}>
                <Text style={styles.lowEmoji}>{p.category === 'Slippers' ? '👡' : '🌸'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lowName}>{p.name}</Text>
                  <Text style={styles.lowMeta}>{p.brand || p.size_or_volume || p.category}</Text>
                </View>
                <View style={styles.lowQtyWrap}>
                  <Text style={styles.lowQty}>{p.stock_quantity}</Text>
                  <Text style={styles.lowQtyLbl}>left</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={styles.section}>Recent Sales</Text>
        {recentSales.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={36} color={Colors.border} />
            <Text style={styles.emptyTxt}>No sales today yet</Text>
          </View>
        ) : recentSales.map(sale => (
          <View key={sale.id} style={[styles.saleRow, Shadow.small]}>
            <View>
              <Text style={styles.saleId}>Sale #{sale.id}</Text>
              <Text style={styles.saleTime}>{new Date(sale.sale_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.saleAmt}>{fmt(sale.total_amount)}</Text>
              <Text style={styles.saleMode}>{sale.payment_mode}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  shopName: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800' },
  date:     { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.xs, marginTop: 2 },
  body:     { padding: Spacing.lg },
  row:      { flexDirection: 'row', marginHorizontal: -Spacing.xs, marginBottom: Spacing.xs },
  section:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  alert:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md },
  alertTxt: { flex: 1, color: Colors.warning, fontWeight: '600', fontSize: FontSize.sm },
  lowRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  lowEmoji: { fontSize: 24 },
  lowName:  { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  lowMeta:  { fontSize: FontSize.xs, color: Colors.textMuted },
  lowQtyWrap: { alignItems: 'center' },
  lowQty:   { fontSize: FontSize.xl, fontWeight: '800', color: Colors.danger },
  lowQtyLbl:{ fontSize: FontSize.xs, color: Colors.textMuted },
  saleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  saleId:   { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  saleTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  saleAmt:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.success },
  saleMode: { fontSize: FontSize.xs, color: Colors.textMuted },
  empty:    { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyTxt: { color: Colors.textMuted, marginTop: Spacing.sm },
});
