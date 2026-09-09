import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { deleteProduct } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const fmt = (n) => n != null ? '₹' + parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—';

function InfoRow({ label, value, valueColor }) {
  if (!value && value !== 0) return null;
  return (
    <View style={row.wrap}>
      <Text style={row.lbl}>{label}</Text>
      <Text style={[row.val, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}
const row = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  lbl:  { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  val:  { fontSize: FontSize.sm, color: Colors.text, fontWeight: '700', flex: 1, textAlign: 'right' },
});

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const p          = route.params?.product;

  if (!p) {
    return (
      <View style={styles.root}>
        <Text style={{ padding: 20, color: Colors.danger }}>Product not found.</Text>
      </View>
    );
  }

  const isLow      = p.stock_quantity <= p.low_stock_threshold;
  const purchaseP  = p.purchase_price || p.cost_price;
  const margin     = purchaseP ? (parseFloat(p.selling_price) - parseFloat(purchaseP)).toFixed(2) : null;
  const marginPct  = purchaseP && parseFloat(purchaseP) > 0
    ? ((parseFloat(p.selling_price) - parseFloat(purchaseP)) / parseFloat(purchaseP) * 100).toFixed(1)
    : null;

  const handleDelete = () => {
    Alert.alert('Delete Product', `Remove "${p.name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(p.id);
            Alert.alert('Deleted', `"${p.name}" removed.`);
            navigation.goBack();
          } catch (e) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{p.name}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddProduct', { product: p })}>
          <Ionicons name="create-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          {p.image_url ? (
            <Image source={{ uri: p.image_url }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder]}>
              <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
            </View>
          )}

          <View style={styles.badgeRow}>
            <View style={[styles.stockBadge, isLow ? styles.stockLow : styles.stockOk]}>
              <Ionicons name={isLow ? 'warning-outline' : 'checkmark-circle-outline'} size={12} color={isLow ? Colors.warning : Colors.success} />
              <Text style={[styles.stockTxt, { color: isLow ? Colors.warning : Colors.success }]}>
                {p.stock_quantity} in stock{isLow ? ' — LOW' : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.heroName}>{p.name}</Text>
          {p.brand ? <Text style={styles.heroBrand}>{p.brand}</Text> : null}
        </View>

        {/* ── Selling Price highlight ── */}
        <View style={[styles.priceCard, Shadow.small]}>
          <View style={styles.priceMain}>
            <Text style={styles.priceLabel}>Selling Price</Text>
            <Text style={styles.priceValue}>{fmt(p.selling_price)}</Text>
          </View>
          {margin && (
            <View style={styles.marginPill}>
              <Text style={styles.marginTxt}>+₹{margin} ({marginPct}%)</Text>
            </View>
          )}
        </View>

        {/* ── Product Info ── */}
        <View style={[styles.section, Shadow.small]}>
          <Text style={styles.sectionTitle}>Product Info</Text>
          <InfoRow label="Product ID"     value={`#${p.id}`} />
          <InfoRow label="Category"       value={p.category} />
          <InfoRow label="Brand"          value={p.brand} />
          <InfoRow label="Size / Volume"  value={p.size_or_volume} />
          <InfoRow label="Barcode"        value={p.barcode} />
        </View>

        {/* ── Pricing ── */}
        <View style={[styles.section, Shadow.small]}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <InfoRow label="Selling Price"   value={fmt(p.selling_price)} valueColor={Colors.primary} />
          <InfoRow label="Purchase Price"  value={fmt(purchaseP)}       valueColor={Colors.text} />
          <InfoRow label="MRP"             value={fmt(p.mrp)}           valueColor={Colors.info} />
          <InfoRow label="MSP"             value={fmt(p.msp)}           valueColor={Colors.warning} />
          {margin && (
            <InfoRow
              label="Margin"
              value={`₹${margin} (${marginPct}%)`}
              valueColor={parseFloat(margin) >= 0 ? Colors.success : Colors.danger}
            />
          )}
        </View>

        {/* ── Stock ── */}
        <View style={[styles.section, Shadow.small]}>
          <Text style={styles.sectionTitle}>Stock</Text>
          <InfoRow label="Current Stock"    value={String(p.stock_quantity)} valueColor={isLow ? Colors.danger : Colors.success} />
          <InfoRow label="Low Stock Alert"  value={`Alert at ${p.low_stock_threshold} units`} />
          <InfoRow label="Added On"         value={new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editAction}
            onPress={() => navigation.navigate('AddProduct', { product: p })}
          >
            <Ionicons name="create-outline" size={18} color={Colors.white} />
            <Text style={styles.actionTxt}>Edit / Restock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.white} />
            <Text style={styles.actionTxt}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  backBtn:{ width: 36, height: 36, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  editBtn:{ width: 36, height: 36, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  body: { padding: Spacing.lg },

  // Hero
  hero:        { alignItems: 'center', marginBottom: Spacing.lg },
  heroImage:   { width: 120, height: 120, borderRadius: Radius.lg, marginBottom: Spacing.md },
  heroPlaceholder: { width: 120, height: 120, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  heroEmoji:   { fontSize: 52 },
  badgeRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  catBadge:    { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  catBadgeTxt: { fontSize: FontSize.sm, fontWeight: '700' },
  stockBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  stockOk:     { backgroundColor: Colors.successLight },
  stockLow:    { backgroundColor: Colors.warningLight },
  stockTxt:    { fontSize: FontSize.xs, fontWeight: '600' },
  heroName:    { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  heroBrand:   { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 3 },

  // Price card
  priceCard:  { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  priceMain:  {},
  priceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  priceValue: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.primary },
  marginPill: { backgroundColor: Colors.successLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  marginTxt:  { fontSize: FontSize.sm, fontWeight: '700', color: Colors.success },

  // Section
  section:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },

  // Actions
  actionRow:    { flexDirection: 'row', gap: Spacing.md },
  editAction:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.md },
  deleteAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.danger, borderRadius: Radius.lg, padding: Spacing.md },
  actionTxt:    { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
});
