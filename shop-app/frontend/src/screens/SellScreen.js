import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ScrollView, Modal, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, completeSale } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];

// ── Receipt HTML ──────────────────────────────────────────────────────────────
function buildReceiptHTML({ cart, subtotal, discAmt, discType, discVal, total, payment, sale }) {
  const rows = cart.map(i => `
    <tr>
      <td>${i.name}</td>
      <td align="center">${i.quantity}</td>
      <td align="right">${fmt(i.price)}</td>
      <td align="right">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:8px}
  .c{text-align:center} .b{font-weight:bold}
  .div{border-top:1px dashed #000;margin:6px 0}
  table{width:100%;border-collapse:collapse} td{padding:2px 4px}
  .tot td{font-weight:bold;font-size:14px;border-top:1px solid #000;padding-top:4px}
  @media print{body{width:auto}@page{margin:5mm}}
</style></head><body>
  <div class="c"><div class="b" style="font-size:16px">🛍 Lavanya Shop</div>
  <div>Slipper &amp; Perfume Store</div>
  <div>${new Date().toLocaleString('en-IN')}</div>
  ${sale ? `<div>Receipt #${sale.id}</div>` : ''}</div>
  <div class="div"></div>
  <table><thead><tr><td><b>Item</b></td><td align="center"><b>Qty</b></td>
  <td align="right"><b>Rate</b></td><td align="right"><b>Amt</b></td></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="div"></div>
  <table>
    <tr><td>Subtotal</td><td align="right">${fmt(subtotal)}</td></tr>
    ${discAmt > 0 ? `<tr><td>Discount(${discType === 'percent' ? discVal + '%' : 'flat'})</td><td align="right">-${fmt(discAmt)}</td></tr>` : ''}
    <tr class="tot"><td>TOTAL</td><td align="right">${fmt(total)}</td></tr>
    <tr><td>Payment</td><td align="right">${payment}</td></tr>
  </table>
  <div class="div"></div>
  <div class="c"><div>Thank you! 😊</div><div>Visit again</div></div>
</body></html>`;
}

function printReceipt(html) {
  if (Platform.OS === 'web') {
    const win = window.open('', '_blank', 'width=420,height=650');
    if (!win) { Alert.alert('Popup blocked', 'Allow popups to print receipts.'); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  } else {
    Alert.alert('Print', 'Use your device print service to print the receipt.');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SellScreen() {
  const [allProducts, setAll]        = useState([]);
  const [query,       setQuery]      = useState('');
  const [results,     setResults]    = useState([]);
  const [showDrop,    setShowDrop]   = useState(false);
  const [barcodeInput, setBarcode]   = useState('');
  const [cart,        setCart]       = useState([]);
  const [discType,    setDiscType]   = useState('percent');
  const [discVal,     setDiscVal]    = useState('');
  const [payment,     setPayment]    = useState('Cash');   // primary mode for backend
  const [payAmounts,  setPayAmounts] = useState({ Cash: '', UPI: '', Card: '' }); // multi
  const [loading,     setLoading]    = useState(false);
  const [success,     setSuccess]    = useState(false);
  const [lastSale,    setLastSale]   = useState(null);
  const [lastCart,    setLastCart]   = useState([]);
  const barcodeRef = useRef(null);
  useFocusEffect(useCallback(() => {
    getProducts().then(setAll).catch(() => {});
  }, []));

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = (text) => {
    setQuery(text);
    if (!text.trim()) { setResults([]); setShowDrop(false); return; }
    const q = text.toLowerCase();
    const filtered = allProducts.filter(p =>
      p.stock_quantity > 0 && (
        p.name.toLowerCase().includes(q) ||
        String(p.id) === text.trim() ||
        (p.brand || '').toLowerCase().includes(q)
      )
    ).slice(0, 10);
    setResults(filtered);
    setShowDrop(true);
  };

  // ── Barcode ─────────────────────────────────────────────────────────────────
  const handleBarcodeSubmit = () => {
    const code = barcodeInput.trim();
    if (!code) return;
    const found = allProducts.find(p => p.barcode === code || String(p.id) === code);
    if (!found) { Alert.alert('Not found', `No product for: ${code}`); setBarcode(''); return; }
    if (found.stock_quantity <= 0) { Alert.alert('Out of stock', `"${found.name}" is out of stock.`); setBarcode(''); return; }
    addToCart(found);
    setBarcode('');
    barcodeRef.current?.focus();
  };

  // ── Cart ────────────────────────────────────────────────────────────────────
  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === p.id);
      if (ex) {
        if (ex.quantity >= p.stock_quantity) { Alert.alert('Stock limit', `Only ${p.stock_quantity} left`); return prev; }
        return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: p.id, name: p.name, category: p.category, price: parseFloat(p.selling_price), stock: p.stock_quantity, quantity: 1, barcode: p.barcode || '' }];
    });
    setQuery(''); setResults([]); setShowDrop(false);
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

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discAmt = (() => {
    const v = parseFloat(discVal) || 0;
    if (discType === 'percent') return Math.round(subtotal * v / 100 * 100) / 100;
    if (discType === 'flat')    return Math.min(v, subtotal);
    return 0;
  })();
  const total = Math.max(0, subtotal - discAmt);

  // multi-payment totals
  const totalPaid = PAYMENT_MODES.reduce((s, m) => s + (parseFloat(payAmounts[m]) || 0), 0);
  const change    = Math.max(0, totalPaid - total);

  // primary mode = highest paid mode (for backend)
  const primaryMode = PAYMENT_MODES.reduce((a, b) =>
    (parseFloat(payAmounts[a]) || 0) >= (parseFloat(payAmounts[b]) || 0) ? a : b
  );

  // ── Complete sale ────────────────────────────────────────────────────────────
  const handleSale = async () => {
    if (!cart.length) { Alert.alert('Empty cart', 'Add at least one product.'); return; }
    if (totalPaid < total - 0.01) {
      Alert.alert('Insufficient payment', `Paid ${fmt(totalPaid)} but total is ${fmt(total)}`);
      return;
    }
    setLoading(true);
    try {
      const sale = await completeSale({
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        discount_type:  discVal ? discType : undefined,
        discount_value: parseFloat(discVal) || 0,
        payment_mode:   primaryMode,
      });
      setLastSale(sale);
      setLastCart([...cart]);
      setSuccess(true);
      setCart([]); setDiscVal('');
      setPayAmounts({ Cash: '', UPI: '', Card: '' });
      getProducts().then(setAll).catch(() => {});
    } catch (e) { Alert.alert('Sale failed', e.message); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const html = buildReceiptHTML({ cart: lastCart, subtotal, discAmt, discType, discVal: discVal || '0', total, payment, sale: lastSale });
    printReceipt(html);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Sale</Text>
        {cart.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{cart.length}</Text></View>}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Barcode scan bar ── */}
        <View style={[styles.barcodeBar, Shadow.small]}>
          <Ionicons name="barcode-outline" size={18} color={Colors.primary} />
          <TextInput
            ref={barcodeRef}
            style={styles.barcodeInput}
            placeholder="Scan barcode or type product ID…"
            placeholderTextColor={Colors.textMuted}
            value={barcodeInput}
            onChangeText={setBarcode}
            onSubmitEditing={handleBarcodeSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {barcodeInput.length > 0 && (
            <TouchableOpacity onPress={handleBarcodeSubmit} style={styles.scanBtn}>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Product search ── */}
        <Text style={styles.sec}>Add Products</Text>
        <View style={[styles.searchBox, Shadow.small]}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            onFocus={() => query && setShowDrop(true)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setShowDrop(false); }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search dropdown */}
        {showDrop && results.length > 0 && (
          <View style={[styles.dropdown, Shadow.small]}>
            {results.map(p => (
              <TouchableOpacity key={p.id} style={styles.dropItem} onPress={() => addToCart(p)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Text style={styles.dropId}>#{p.id}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropName}>{p.category === 'Slippers' ? '👡' : '🌸'} {p.name}</Text>
                    {p.brand ? <Text style={styles.dropMeta}>{p.brand}{p.size_or_volume ? ` · ${p.size_or_volume}` : ''}</Text> : null}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.dropPrice}>{fmt(p.selling_price)}</Text>
                  <Text style={styles.dropStock}>Stock: {p.stock_quantity}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showDrop && results.length === 0 && query.length > 0 && (
          <View style={styles.noResult}>
            <Text style={styles.noResultTxt}>No products found for "{query}"</Text>
          </View>
        )}

        {/* ── Cart ── */}
        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTxt}>Cart is empty</Text>
            <Text style={styles.emptySub}>Search or scan barcode above</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sec}>Cart ({cart.length} item{cart.length > 1 ? 's' : ''})</Text>
            {cart.map(item => (
              <View key={item.product_id} style={[styles.cartItem, Shadow.small]}>
                <Text style={{ fontSize: 20 }}>{item.category === 'Slippers' ? '👡' : '🌸'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cartPrice}>{fmt(item.price)} each</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.product_id, -1)}>
                    <Ionicons name="remove" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyTxt}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.product_id, 1)}>
                    <Ionicons name="add" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>{fmt(item.price * item.quantity)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.product_id)} style={{ marginLeft: 4 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ── Discount ── */}
        <Text style={styles.sec}>Discount</Text>
        <View style={[styles.card, Shadow.small]}>
          <View style={styles.discTypeRow}>
            {['percent', 'flat'].map(t => (
              <TouchableOpacity key={t} style={[styles.typeChip, discType === t && styles.typeChipOn]} onPress={() => setDiscType(t)}>
                <Text style={[styles.typeChipTxt, discType === t && styles.typeChipTxtOn]}>
                  {t === 'percent' ? '% Percent' : '₹ Flat'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.discInput}
            value={discVal} onChangeText={setDiscVal}
            keyboardType="decimal-pad"
            placeholder={discType === 'percent' ? 'Enter % (0–100)' : 'Enter ₹ amount'}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* ── Payment Mode — multi select with amounts ── */}
        <Text style={styles.sec}>Payment Mode</Text>
        <View style={[styles.card, Shadow.small]}>
          {PAYMENT_MODES.map(mode => {
            const isActive = parseFloat(payAmounts[mode] || 0) > 0;
            return (
              <View key={mode} style={[styles.payRow, isActive && styles.payRowActive]}>
                {/* Mode label */}
                <View style={styles.payModeLeft}>
                  <Ionicons
                    name={mode === 'Cash' ? 'cash-outline' : mode === 'UPI' ? 'phone-portrait-outline' : 'card-outline'}
                    size={18}
                    color={isActive ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.payModeTxt, isActive && { color: Colors.primary }]}>{mode}</Text>
                </View>

                {/* Amount input */}
                <TextInput
                  style={[styles.payInput, isActive && styles.payInputActive]}
                  value={payAmounts[mode]}
                  onChangeText={v => setPayAmounts(prev => ({ ...prev, [mode]: v }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                />

                {/* Quick fill button */}
                <TouchableOpacity
                  style={styles.fillBtn}
                  onPress={() => {
                    const otherPaid = PAYMENT_MODES
                      .filter(m => m !== mode)
                      .reduce((s, m) => s + (parseFloat(payAmounts[m]) || 0), 0);
                    const remaining = Math.max(0, total - otherPaid);
                    setPayAmounts(prev => ({ ...prev, [mode]: remaining > 0 ? remaining.toFixed(2) : '' }));
                  }}
                >
                  <Text style={styles.fillBtnTxt}>Full</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Paid / Change row */}
          {totalPaid > 0 && (
            <View style={styles.paidRow}>
              <Text style={styles.paidLbl}>Total Paid</Text>
              <Text style={[styles.paidVal, { color: totalPaid >= total ? Colors.success : Colors.danger }]}>
                {fmt(totalPaid)}
              </Text>
              {change > 0 && (
                <>
                  <Text style={[styles.paidLbl, { marginLeft: Spacing.lg }]}>Change</Text>
                  <Text style={[styles.paidVal, { color: Colors.success }]}>{fmt(change)}</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── Bill summary ── */}
        <View style={[styles.bill, Shadow.medium]}>
          <Text style={styles.billTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLbl}>Subtotal</Text>
            <Text style={styles.billVal}>{fmt(subtotal)}</Text>
          </View>
          {discAmt > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLbl, { color: Colors.danger }]}>
                Discount ({discType === 'percent' ? `${discVal}%` : 'flat'})
              </Text>
              <Text style={[styles.billVal, { color: Colors.danger }]}>− {fmt(discAmt)}</Text>
            </View>
          )}
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLbl}>Total</Text>
            <Text style={styles.billTotalVal}>{fmt(total)}</Text>
          </View>
          {PAYMENT_MODES.filter(m => parseFloat(payAmounts[m] || 0) > 0).map(m => (
            <View key={m} style={styles.billRow}>
              <View style={styles.payBadge}>
                <Ionicons
                  name={m === 'Cash' ? 'cash-outline' : m === 'UPI' ? 'phone-portrait-outline' : 'card-outline'}
                  size={13} color={Colors.primary}
                />
                <Text style={styles.payBadgeTxt}>{m}</Text>
              </View>
              <Text style={[styles.billVal, { color: Colors.success }]}>{fmt(payAmounts[m])}</Text>
            </View>
          ))}
          {change > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLbl, { color: Colors.success }]}>Change</Text>
              <Text style={[styles.billVal, { color: Colors.success, fontWeight: '800' }]}>{fmt(change)}</Text>
            </View>
          )}
        </View>

        {/* ── Complete Sale ── */}
        <TouchableOpacity
          style={[styles.completeBtn, (!cart.length || loading) && styles.completeBtnOff]}
          onPress={handleSale}
          disabled={!cart.length || loading}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color={Colors.white} />
          <Text style={styles.completeTxt}>
            {loading ? 'Processing…' : `Complete Sale  ${fmt(total)}`}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Success Modal ── */}
      <Modal transparent animationType="fade" visible={success}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
            </View>
            <Text style={styles.modalTitle}>Sale Complete!</Text>
            {lastSale && (
              <>
                <Text style={styles.modalAmt}>{fmt(lastSale.total_amount)}</Text>
                <Text style={styles.modalSub}>
                  Profit: {fmt(lastSale.total_profit)}
                </Text>
                {/* Payment breakdown */}
                <View style={styles.modalPayBox}>
                  {PAYMENT_MODES.filter(m => parseFloat(payAmounts[m] || 0) > 0).map(m => (
                    <View key={m} style={styles.modalPayRow}>
                      <Ionicons name={m === 'Cash' ? 'cash-outline' : m === 'UPI' ? 'phone-portrait-outline' : 'card-outline'} size={14} color={Colors.primary} />
                      <Text style={styles.modalPayLbl}>{m}</Text>
                      <Text style={styles.modalPayVal}>{fmt(payAmounts[m])}</Text>
                    </View>
                  ))}
                  {change > 0 && (
                    <View style={[styles.modalPayRow, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 4 }]}>
                      <Ionicons name="arrow-undo-outline" size={14} color={Colors.success} />
                      <Text style={[styles.modalPayLbl, { color: Colors.success }]}>Change</Text>
                      <Text style={[styles.modalPayVal, { color: Colors.success }]}>{fmt(change)}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Print buttons */}
            <View style={styles.printRow}>
              <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                <Ionicons name="print-outline" size={16} color={Colors.white} />
                <Text style={styles.printTxt}>Print Receipt</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.newSaleBtn} onPress={() => setSuccess(false)}>
              <Text style={styles.newSaleTxt}>New Sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800', flex: 1 },
  badge:    { backgroundColor: Colors.secondary, borderRadius: Radius.full, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '700' },

  body: { padding: Spacing.lg },
  sec:  { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md },

  // Barcode
  barcodeBar:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1.5, borderColor: Colors.primary },
  barcodeInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, height: 40, outlineStyle: 'none' },
  scanBtn:      { padding: 4 },

  // Search
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 46 },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, outlineStyle: 'none' },

  // Dropdown
  dropdown:    { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xs, overflow: 'hidden' },
  dropItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropId:      { fontSize: FontSize.xs, color: Colors.textMuted, backgroundColor: Colors.background, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, fontWeight: '700' },
  dropName:    { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  dropMeta:    { fontSize: FontSize.xs, color: Colors.textMuted },
  dropPrice:   { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  dropStock:   { fontSize: FontSize.xs, color: Colors.textMuted },
  noResult:    { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.xs },
  noResultTxt: { color: Colors.textMuted, fontSize: FontSize.sm },

  // Cart
  emptyCart: { alignItems: 'center', paddingVertical: 28 },
  emptyTxt:  { color: Colors.textMuted, fontSize: FontSize.md, fontWeight: '600', marginTop: Spacing.sm },
  emptySub:  { color: Colors.textMuted, fontSize: FontSize.sm },
  cartItem:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  cartName:  { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  cartPrice: { fontSize: FontSize.xs, color: Colors.textMuted },
  qtyRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  qtyBtn:    { width: 26, height: 26, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qtyTxt:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, minWidth: 60, textAlign: 'right' },

  // Discount
  discTypeRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeChip:      { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  typeChipOn:    { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeChipTxt:   { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  typeChipTxtOn: { color: Colors.primary },
  discInput:     { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text, outlineStyle: 'none' },

  // Payment multi-select
  payRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  payRowActive: { backgroundColor: Colors.primaryLight + '55', borderRadius: Radius.md, paddingHorizontal: Spacing.xs },
  payModeLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6, width: 72 },
  payModeTxt:   { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  payInput:     { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text, textAlign: 'right', outlineStyle: 'none', backgroundColor: Colors.background },
  payInputActive:{ borderColor: Colors.primary, backgroundColor: Colors.white },
  fillBtn:      { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  fillBtnTxt:   { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  paidRow:      { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.sm, marginTop: Spacing.xs, gap: 4 },
  paidLbl:      { fontSize: FontSize.xs, color: Colors.textSecondary },
  paidVal:      { fontSize: FontSize.sm, fontWeight: '800', marginLeft: 4 },

  // Bill
  bill:         { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg },
  billTitle:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  billRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  billLbl:      { fontSize: FontSize.sm, color: Colors.textSecondary },
  billVal:      { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  billDivider:  { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  billTotalLbl: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  billTotalVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  payBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  payBadgeTxt:  { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },

  // Complete
  completeBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg },
  completeBtnOff: { backgroundColor: Colors.border },
  completeTxt:    { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },

  // Modal
  modalBg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modalBox:    { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', width: '100%', maxWidth: 340 },
  successIcon: { width: 80, height: 80, borderRadius: Radius.full, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  modalTitle:  { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  modalAmt:    { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.success, marginTop: Spacing.sm },
  modalPayBox: { alignSelf: 'stretch', backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  modalPayRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  modalPayLbl: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  modalPayVal: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
  printRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  printBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  printTxt:    { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  newSaleBtn:  { backgroundColor: Colors.success, borderRadius: Radius.lg, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  newSaleTxt:  { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
