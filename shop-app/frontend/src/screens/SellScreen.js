import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, completeSale } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];

export default function SellScreen() {
  const [allProducts, setAll]    = useState([]);
  const [query,       setQuery]  = useState('');
  const [results,     setResults]= useState([]);
  const [cart,        setCart]   = useState([]);
  const [discType,    setDiscType]= useState('percent');
  const [discVal,     setDiscVal] = useState('');
  const [payment,     setPayment] = useState('Cash');
  const [loading,     setLoading] = useState(false);
  const [success,     setSuccess] = useState(false);
  const [lastSale,    setLastSale]= useState(null);

  useFocusEffect(useCallback(() => {
    getProducts().then(setAll).catch(() => {});
  }, []));

  const search = (text) => {
    setQuery(text);
    if (!text.trim()) { setResults([]); return; }
    const q = text.toLowerCase();
    setResults(allProducts.filter(p => p.stock_quantity > 0 && (p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q))).slice(0, 8));
  };

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === p.id);
      if (ex) {
        if (ex.quantity >= p.stock_quantity) { Alert.alert('Stock limit', `Only ${p.stock_quantity} available`); return prev; }
        return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: p.id, name: p.name, category: p.category, price: parseFloat(p.selling_price), stock: p.stock_quantity, quantity: 1 }];
    });
    setQuery(''); setResults([]);
  };

  const changeQty = (id, d) => setCart(prev =>
    prev.map(i => {
      if (i.product_id !== id) return i;
      const nq = i.quantity + d;
      if (nq > i.stock) { Alert.alert('Stock limit', `Only ${i.stock} available`); return i; }
      return { ...i, quantity: Math.max(0, nq) };
    }).filter(i => i.quantity > 0)
  );

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.product_id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discAmt  = (() => {
    const v = parseFloat(discVal) || 0;
    if (discType === 'percent') return Math.round(subtotal * v / 100 * 100) / 100;
    if (discType === 'flat')    return Math.min(v, subtotal);
    return 0;
  })();
  const total = Math.max(0, subtotal - discAmt);

  const handleSale = async () => {
    if (!cart.length) { Alert.alert('Empty cart', 'Add at least one product.'); return; }
    setLoading(true);
    try {
      const sale = await completeSale({
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        discount_type:  discVal ? discType : undefined,
        discount_value: parseFloat(discVal) || 0,
        payment_mode:   payment,
      });
      setLastSale(sale);
      setSuccess(true);
      setCart([]); setDiscVal(''); setPayment('Cash');
      getProducts().then(setAll).catch(() => {});
    } catch (e) { Alert.alert('Sale failed', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Sale</Text>
        {cart.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{cart.length}</Text></View>}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Search */}
        <Text style={styles.sec}>Add Products to Cart</Text>
        <View style={[styles.searchBox, Shadow.small]}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search product…" placeholderTextColor={Colors.textMuted} value={query} onChangeText={search} />
          {query.length > 0 && <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}><Ionicons name="close-circle" size={16} color={Colors.textMuted} /></TouchableOpacity>}
        </View>

        {results.length > 0 && (
          <View style={[styles.dropdown, Shadow.small]}>
            {results.map(p => (
              <TouchableOpacity key={p.id} style={styles.dropItem} onPress={() => addToCart(p)}>
                <Text style={styles.dropName}>{p.category === 'Slippers' ? '👡' : '🌸'} {p.name}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.dropPrice}>{fmt(p.selling_price)}</Text>
                  <Text style={styles.dropStock}>Stock: {p.stock_quantity}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Cart */}
        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTxt}>Cart is empty — search above to add products</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sec}>Cart ({cart.length} item{cart.length > 1 ? 's' : ''})</Text>
            {cart.map(item => (
              <View key={item.product_id} style={[styles.cartItem, Shadow.small]}>
                <Text style={styles.cartEmoji}>{item.category === 'Slippers' ? '👡' : '🌸'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cartPrice}>{fmt(item.price)} each</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.product_id, -1)}><Ionicons name="remove" size={14} color={Colors.primary} /></TouchableOpacity>
                  <Text style={styles.qtyTxt}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.product_id, 1)}><Ionicons name="add" size={14} color={Colors.primary} /></TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>{fmt(item.price * item.quantity)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.product_id)} style={{ marginLeft: 4 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Discount */}
        <Text style={styles.sec}>Discount</Text>
        <View style={[styles.discBox, Shadow.small]}>
          <View style={styles.discTypeRow}>
            {['percent', 'flat'].map(t => (
              <TouchableOpacity key={t} style={[styles.typeChip, discType === t && styles.typeChipOn]} onPress={() => setDiscType(t)}>
                <Text style={[styles.typeChipTxt, discType === t && styles.typeChipTxtOn]}>{t === 'percent' ? '% Percent' : '₹ Flat'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.discInput} value={discVal} onChangeText={setDiscVal} keyboardType="decimal-pad" placeholder={discType === 'percent' ? 'Enter % (0–100)' : 'Enter ₹ amount'} placeholderTextColor={Colors.textMuted} />
        </View>

        {/* Payment */}
        <Text style={styles.sec}>Payment Mode</Text>
        <View style={styles.payRow}>
          {PAYMENT_MODES.map(m => (
            <TouchableOpacity key={m} style={[styles.payChip, payment === m && styles.payChipOn]} onPress={() => setPayment(m)}>
              <Ionicons name={m === 'Cash' ? 'cash-outline' : m === 'UPI' ? 'phone-portrait-outline' : 'card-outline'} size={16} color={payment === m ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.payTxt, payment === m && styles.payTxtOn]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bill */}
        <View style={[styles.bill, Shadow.medium]}>
          <Text style={styles.billTitle}>Bill Summary</Text>
          <View style={styles.billRow}><Text style={styles.billLbl}>Subtotal</Text><Text style={styles.billVal}>{fmt(subtotal)}</Text></View>
          {discAmt > 0 && <View style={styles.billRow}><Text style={[styles.billLbl, { color: Colors.danger }]}>Discount ({discType === 'percent' ? `${discVal}%` : 'flat'})</Text><Text style={[styles.billVal, { color: Colors.danger }]}>− {fmt(discAmt)}</Text></View>}
          <View style={styles.billDivider} />
          <View style={styles.billRow}><Text style={styles.billTotalLbl}>Total</Text><Text style={styles.billTotalVal}>{fmt(total)}</Text></View>
        </View>

        {/* Complete */}
        <TouchableOpacity
          style={[styles.completeBtn, (!cart.length || loading) && styles.completeBtnOff]}
          onPress={handleSale} disabled={!cart.length || loading}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color={Colors.white} />
          <Text style={styles.completeTxt}>{loading ? 'Processing…' : `Complete Sale  ${fmt(total)}`}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Success modal */}
      <Modal transparent animationType="fade" visible={success}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.successIcon}><Ionicons name="checkmark-circle" size={56} color={Colors.success} /></View>
            <Text style={styles.modalTitle}>Sale Complete!</Text>
            {lastSale && <>
              <Text style={styles.modalAmt}>{fmt(lastSale.total_amount)}</Text>
              <Text style={styles.modalSub}>Profit: {fmt(lastSale.total_profit)}  ·  {lastSale.payment_mode}</Text>
            </>}
            <TouchableOpacity style={styles.modalBtn} onPress={() => setSuccess(false)}>
              <Text style={styles.modalBtnTxt}>New Sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800', flex: 1 },
  badge: { backgroundColor: Colors.secondary, borderRadius: Radius.full, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '700' },
  body: { padding: Spacing.lg },
  sec:  { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.lg },

  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 46 },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, outlineStyle: 'none' },

  dropdown:  { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xs },
  dropItem:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropName:  { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, flex: 1 },
  dropPrice: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  dropStock: { fontSize: FontSize.xs, color: Colors.textMuted },

  emptyCart: { alignItems: 'center', paddingVertical: 32 },
  emptyTxt:  { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.sm, textAlign: 'center' },

  cartItem:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  cartEmoji: { fontSize: 22 },
  cartName:  { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  cartPrice: { fontSize: FontSize.xs, color: Colors.textMuted },
  qtyRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  qtyBtn:    { width: 26, height: 26, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qtyTxt:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, minWidth: 60, textAlign: 'right' },

  discBox:      { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md },
  discTypeRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeChip:     { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  typeChipOn:   { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeChipTxt:  { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  typeChipTxtOn:{ color: Colors.primary },
  discInput:    { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text, outlineStyle: 'none' },

  payRow:    { flexDirection: 'row', gap: Spacing.sm },
  payChip:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  payChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  payTxt:    { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  payTxtOn:  { color: Colors.white },

  bill:         { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg },
  billTitle:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  billRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  billLbl:      { fontSize: FontSize.sm, color: Colors.textSecondary },
  billVal:      { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  billDivider:  { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  billTotalLbl: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  billTotalVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },

  completeBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg },
  completeBtnOff: { backgroundColor: Colors.border },
  completeTxt:    { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },

  modalBg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalBox:    { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', width: 300 },
  successIcon: { width: 80, height: 80, borderRadius: Radius.full, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  modalTitle:  { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  modalAmt:    { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.success, marginTop: Spacing.sm },
  modalSub:    { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  modalBtn:    { marginTop: Spacing.xl, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  modalBtnTxt: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
