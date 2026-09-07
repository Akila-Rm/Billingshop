import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getReportSummary } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const SCREEN_W = Dimensions.get('window').width;
const fmt = (n) =>
  '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const PRESETS = ['Today', 'Week', 'Month'];

function getDateRange(preset) {
  const now = new Date();
  const to = new Date(now); to.setHours(23, 59, 59, 999);
  const from = new Date(now); from.setHours(0, 0, 0, 0);
  if (preset === 'Week') from.setDate(from.getDate() - 6);
  else if (preset === 'Month') from.setDate(1);
  return { from: from.toISOString(), to: to.toISOString() };
}

// ── Pure RN bar chart — no native modules ─────────────────────────────────────
function SimpleBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barAreaH = 140;
  const barW = Math.min(80, (SCREEN_W - Spacing.lg * 4) / data.length - 16);

  return (
    <View style={chartS.wrap}>
      <View style={chartS.barsRow}>
        {data.map((item) => {
          const barH = Math.max(4, (item.value / maxVal) * barAreaH);
          return (
            <View key={item.label} style={chartS.barCol}>
              <Text style={chartS.barVal}>
                {item.value > 0 ? `₹${item.value.toFixed(0)}` : '₹0'}
              </Text>
              <View style={[chartS.barAreaWrap, { height: barAreaH }]}>
                <View
                  style={[
                    chartS.bar,
                    {
                      height: barH,
                      width: barW,
                      backgroundColor: item.color || Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={chartS.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const chartS = StyleSheet.create({
  wrap: { paddingVertical: Spacing.lg, alignItems: 'center' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xl },
  barCol: { alignItems: 'center', gap: Spacing.xs },
  barAreaWrap: { justifyContent: 'flex-end', alignItems: 'center' },
  bar: { borderRadius: 6 },
  barVal: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text },
  barLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
});

// ── Stat card ─────────────────────────────────────────────────────────────────
function InfoCard({ label, value, icon, color }) {
  return (
    <View style={[cardS.card, Shadow.small]}>
      <View style={[cardS.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={cardS.value} numberOfLines={1}>{value}</Text>
      <Text style={cardS.label}>{label}</Text>
    </View>
  );
}
const cardS = StyleSheet.create({
  card: {
    flex: 1, margin: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  value: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [preset, setPreset] = useState('Today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const result = await getReportSummary(getDateRange(p));
      setData(result);
    } catch (e) {
      console.warn('Reports error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(preset); }, [load, preset]));

  const handlePreset = (p) => { setPreset(p); load(p); };

  const chartData = (data?.profit_by_category || []).map((c) => ({
    label: c.category,
    value: Math.max(0, parseFloat(c.profit) || 0),
    color: c.category === 'Slippers' ? Colors.primary : Colors.perfumes,
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      {/* Preset chips */}
      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, preset === p && styles.chipActive]}
            onPress={() => handlePreset(p)}
            accessibilityLabel={`Show ${p} report`}
          >
            <Text style={[styles.chipText, preset === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

          {/* Summary */}
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}>
            <InfoCard label="Revenue"      value={fmt(data?.total_revenue)} icon="cash-outline"              color={Colors.success} />
            <InfoCard label="Gross Profit" value={fmt(data?.total_profit)}  icon="trending-up-outline"       color={Colors.primary} />
          </View>
          <View style={styles.row}>
            <InfoCard label="Expenses"     value={fmt(data?.total_expenses)} icon="arrow-down-circle-outline" color={Colors.danger} />
            <InfoCard
              label="Net Profit"
              value={fmt(data?.net_profit)}
              icon="wallet-outline"
              color={(data?.net_profit ?? 0) >= 0 ? Colors.success : Colors.danger}
            />
          </View>
          <View style={styles.row}>
            <InfoCard label="Total Sales" value={String(data?.total_sales ?? 0)} icon="receipt-outline" color={Colors.info} />
          </View>

          {/* Bar chart */}
          <Text style={styles.sectionTitle}>Profit by Category</Text>
          {chartData.some((d) => d.value > 0) ? (
            <View style={[styles.chartBox, Shadow.small]}>
              <SimpleBarChart data={chartData} />
            </View>
          ) : (
            <View style={styles.noData}>
              <Ionicons name="bar-chart-outline" size={36} color={Colors.border} />
              <Text style={styles.noDataText}>No sales data for this period</Text>
            </View>
          )}

          {/* Category table */}
          {(data?.profit_by_category?.length ?? 0) > 0 && (
            <View style={[styles.table, Shadow.small]}>
              <View style={styles.tableHead}>
                <Text style={styles.th}>Category</Text>
                <Text style={styles.th}>Revenue</Text>
                <Text style={styles.th}>Profit</Text>
              </View>
              {data.profit_by_category.map((cat) => (
                <View key={cat.category} style={styles.tableRow}>
                  <Text style={styles.td}>{cat.category}</Text>
                  <Text style={styles.td}>{fmt(cat.revenue)}</Text>
                  <Text style={[styles.td, {
                    color: cat.profit >= 0 ? Colors.success : Colors.danger,
                    fontWeight: '700',
                  }]}>{fmt(cat.profit)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Best sellers */}
          <Text style={styles.sectionTitle}>Best Sellers</Text>
          {(data?.best_sellers?.length ?? 0) > 0 ? (
            data.best_sellers.map((item, idx) => (
              <View key={item.id} style={[styles.sellerRow, Shadow.small]}>
                <View style={styles.rank}>
                  <Text style={styles.rankTxt}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sellerName}>{item.name}</Text>
                  <Text style={styles.sellerCat}>{item.category}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sellerQty}>{item.total_qty_sold} sold</Text>
                  <Text style={styles.sellerRev}>{fmt(item.total_revenue)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>No sales recorded yet</Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },
  presetRow: {
    flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  chip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  body: { padding: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.md, fontWeight: '700', color: Colors.text,
    marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  row: { flexDirection: 'row', marginHorizontal: -Spacing.xs },
  chartBox: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    alignItems: 'center', overflow: 'hidden',
  },
  noData: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
  },
  noDataText: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.sm },
  table: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    marginTop: Spacing.sm, overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row', backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  th: { flex: 1, fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  td: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  sellerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md,
  },
  rank: {
    width: 30, height: 30, borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rankTxt: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.primary },
  sellerName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  sellerCat: { fontSize: FontSize.xs, color: Colors.textMuted },
  sellerQty: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  sellerRev: { fontSize: FontSize.xs, color: Colors.textMuted },
});
