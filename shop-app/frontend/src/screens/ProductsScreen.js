import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, deleteProduct } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const CATS = ['All', 'Slippers', 'Perfumes'];
const fmt  = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function ProductsScreen() {
  const navigation = useNavigation();
  const [products,   setProducts]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (search.trim())      params.search   = search.trim();
      if (category !== 'All') params.category = category;
      setProducts(await getProducts(params));
    } catch (e) { Alert.alert('Error', e.message); }
  }, [search, category]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (p) => Alert.alert('Delete', `Remove "${p.name}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await deleteProduct(p.id); setProducts(prev => prev.filter(x => x.id !== p.id)); }
      catch (e) { Alert.alert('Error', e.message); }
    }},
  ]);

  const renderItem = ({ item }) => {
    const isLow = item.stock_quantity <= item.low_stock_threshold;
    const purchaseP = item.purchase_price || item.cost_price;
    return (
      <View style={[styles.card, Shadow.small]}>
        <View style={[styles.emoji, { backgroundColor: item.category === 'Slippers' ? Colors.primaryLight : '#FCE4EC' }]}>
          <Text style={{ fontSize: 26 }}>{item.category === 'Slippers' ? '👡' : '🌸'}</Text>
        </View>

        <View style={styles.details}>
          {/* Name + category tag */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.catTag, { backgroundColor: item.category === 'Slippers' ? Colors.primaryLight : '#FCE4EC' }]}>
              <Text style={[styles.catTagTxt, { color: item.category === 'Slippers' ? Colors.primary : Colors.perfumes }]}>
                {item.category}
              </Text>
            </View>
          </View>

          {/* Brand / size */}
          {item.brand         ? <Text style={styles.meta}>{item.brand}</Text> : null}
          {item.size_or_volume? <Text style={styles.meta}>Size/Vol: {item.size_or_volume}</Text> : null}

          {/* Barcode */}
          {item.barcode ? (
            <View style={styles.barcodeRow}>
              <Ionicons name="barcode-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.barcodeTxt}>{item.barcode}</Text>
            </View>
          ) : null}

          {/* Prices */}
          <View style={styles.priceRow}>
            <Text style={styles.sellPrice}>{fmt(item.selling_price)}</Text>
            <Text style={styles.purchasePrice}>Purchase: {fmt(purchaseP)}</Text>
          </View>

          {/* MRP / MSP */}
          <View style={styles.priceRow2}>
            {item.mrp ? <Text style={styles.mrpTxt}>MRP: {fmt(item.mrp)}</Text> : null}
            {item.msp ? <Text style={styles.mspTxt}>MSP: {fmt(item.msp)}</Text> : null}
          </View>

          {/* Stock badge */}
          <View style={[styles.stockBadge, isLow ? styles.stockLow : styles.stockOk]}>
            <Ionicons name={isLow ? 'warning-outline' : 'checkmark-circle-outline'} size={11} color={isLow ? Colors.warning : Colors.success} />
            <Text style={[styles.stockTxt, { color: isLow ? Colors.warning : Colors.success }]}>
              {item.stock_quantity} in stock{isLow ? ' — LOW' : ''}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actBtn} onPress={() => navigation.navigate('AddProduct', { product: item })}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: Colors.dangerLight }]} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct', { product: null })}>
          <Ionicons name="add" size={20} color={Colors.primary} />
          <Text style={styles.addBtnTxt}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, Shadow.small]}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, brand or barcode…"
            placeholderTextColor={Colors.textMuted}
            value={search} onChangeText={setSearch}
            onSubmitEditing={load}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      <View style={styles.chips}>
        {CATS.map(cat => (
          <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipOn]} onPress={() => setCategory(cat)}>
            <Text style={[styles.chipTxt, category === cat && styles.chipTxtOn]}>{cat}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>{products.length} items</Text>
      </View>

      {/* List */}
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>Tap "Add Product" to get started</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.white, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnTxt: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },

  searchRow: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 44 },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, outlineStyle: 'none' },

  chips: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  chip:  { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipOn:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt:  { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  chipTxtOn:{ color: Colors.white },
  count: { marginLeft: 'auto', fontSize: FontSize.xs, color: Colors.textMuted },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },

  card: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden' },
  emoji: { width: 70, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  details: { flex: 1, padding: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  name:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, flex: 1 },
  catTag:  { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  catTagTxt: { fontSize: FontSize.xs, fontWeight: '700' },
  meta:    { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  barcodeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  barcodeTxt: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  priceRow:  { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginTop: 4 },
  priceRow2: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
  sellPrice: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  purchasePrice: { fontSize: FontSize.xs, color: Colors.textMuted },
  mrpTxt: { fontSize: FontSize.xs, color: Colors.info, fontWeight: '600' },
  mspTxt: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '600' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 5 },
  stockOk:    { backgroundColor: Colors.successLight },
  stockLow:   { backgroundColor: Colors.warningLight },
  stockTxt:   { fontSize: FontSize.xs, fontWeight: '600' },
  actions: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  actBtn:  { width: 34, height: 34, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySub:   { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
});
