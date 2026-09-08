import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Image, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createProduct, updateProduct } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const CATEGORIES = ['Slippers', 'Perfumes'];

function Field({ label, required, error, hint, children }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={fs.label}>
        {label}{required && <Text style={{ color: Colors.danger }}> *</Text>}
      </Text>
      {hint ? <Text style={fs.hint}>{hint}</Text> : null}
      {children}
      {error ? <Text style={fs.err}>{error}</Text> : null}
    </View>
  );
}
const fs = StyleSheet.create({
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 5 },
  hint:  { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  err:   { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
});

export default function AddProductScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const editProd   = route.params?.product ?? null;
  const isEdit     = !!editProd;

  const [loading,       setLoading]      = useState(false);
  const [errors,        setErrors]       = useState({});

  // Form fields
  const [name,          setName]         = useState('');
  const [category,      setCategory]     = useState('Slippers');
  const [brand,         setBrand]        = useState('');
  const [sizeVol,       setSizeVol]      = useState('');
  const [barcode,       setBarcode]      = useState('');
  const [purchasePrice, setPurchasePrice]= useState('');
  const [mrp,           setMrp]          = useState('');
  const [msp,           setMsp]          = useState('');
  const [sell,          setSell]         = useState('');
  const [stock,         setStock]        = useState('');
  const [threshold,     setThreshold]    = useState('5');
  const [imageUrl,      setImageUrl]     = useState('');

  useEffect(() => {
    if (editProd) {
      setName(editProd.name || '');
      setCategory(editProd.category || 'Slippers');
      setBrand(editProd.brand || '');
      setSizeVol(editProd.size_or_volume || '');
      setBarcode(editProd.barcode || '');
      setPurchasePrice(String(editProd.purchase_price || editProd.cost_price || ''));
      setMrp(String(editProd.mrp || ''));
      setMsp(String(editProd.msp || ''));
      setSell(String(editProd.selling_price || ''));
      setStock(String(editProd.stock_quantity ?? ''));
      setThreshold(String(editProd.low_stock_threshold ?? '5'));
      setImageUrl(editProd.image_url || '');
    }
  }, [editProd]);

  const validate = () => {
    const e = {};
    if (!name.trim())                                             e.name = 'Product name is required';
    if (!purchasePrice || isNaN(+purchasePrice) || +purchasePrice <= 0) e.purchasePrice = 'Enter a valid purchase price';
    if (!sell || isNaN(+sell) || +sell <= 0)                     e.sell = 'Enter a valid selling price';
    if (msp && +sell < +msp)                                     e.sell = `Selling price must be ≥ MSP (₹${msp})`;
    if (!stock || isNaN(+stock) || parseInt(stock) < 0)          e.stock = 'Enter valid stock quantity (0 or more)';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        brand: brand.trim() || undefined,
        size_or_volume: sizeVol.trim() || undefined,
        barcode: barcode.trim() || undefined,
        purchase_price: parseFloat(purchasePrice),
        cost_price: parseFloat(purchasePrice), // keep backward compat
        mrp: mrp ? parseFloat(mrp) : undefined,
        msp: msp ? parseFloat(msp) : undefined,
        selling_price: parseFloat(sell),
        stock_quantity: parseInt(stock, 10),
        low_stock_threshold: parseInt(threshold, 10) || 5,
        image_url: imageUrl.trim() || undefined,
      };
      if (isEdit) await updateProduct(editProd.id, payload);
      else        await createProduct(payload);
      Alert.alert('Success', `Product ${isEdit ? 'updated' : 'added'} successfully!`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Live margin calc
  const margin = (+sell && +purchasePrice && +sell > 0 && +purchasePrice > 0)
    ? { val: (+sell - +purchasePrice).toFixed(2), pct: ((+sell - +purchasePrice) / +purchasePrice * 100).toFixed(1) }
    : null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Category ── */}
        <Field label="Category" required>
          <View style={styles.catRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipOn]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.catEmoji}>{cat === 'Slippers' ? '👡' : '🌸'}</Text>
                <Text style={[styles.catTxt, category === cat && styles.catTxtOn]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* ── Product Name ── */}
        <Field label="Product / Item Name" required error={errors.name}>
          <TextInput
            style={[styles.input, errors.name && styles.inputErr]}
            value={name} onChangeText={setName}
            placeholder="e.g. VKC Hawaii Size 8"
            placeholderTextColor={Colors.textMuted}
          />
        </Field>

        {/* ── Brand ── */}
        <Field label="Brand (optional)">
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="e.g. VKC, Relaxo" placeholderTextColor={Colors.textMuted} />
        </Field>

        {/* ── Size / Volume ── */}
        <Field label={category === 'Slippers' ? 'Size (optional)' : 'Volume (optional)'}>
          <TextInput style={styles.input} value={sizeVol} onChangeText={setSizeVol} placeholder={category === 'Slippers' ? 'e.g. 6, 7, 8' : 'e.g. 50ml, 100ml'} placeholderTextColor={Colors.textMuted} />
        </Field>

        {/* ── Barcode ── */}
        <Field label="Barcode / QR Code (optional)" hint="Scan or type the product barcode">
          <View style={styles.barcodeRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={barcode} onChangeText={setBarcode}
              placeholder="e.g. 8901234567890"
              placeholderTextColor={Colors.textMuted}
              keyboardType="default"
            />
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => Alert.alert('Barcode Scanner', 'Use Expo Go on a physical device to enable camera scanning.')}
            >
              <Ionicons name="barcode-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </Field>

        {/* ── Prices section ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Pricing</Text>
        </View>

        {/* Purchase Price + MRP */}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Field label="Purchase Price (₹)" required error={errors.purchasePrice} hint="What you paid">
              <TextInput
                style={[styles.input, errors.purchasePrice && styles.inputErr]}
                value={purchasePrice} onChangeText={setPurchasePrice}
                keyboardType="decimal-pad" placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>
          </View>
          <View style={{ width: Spacing.md }} />
          <View style={{ flex: 1 }}>
            <Field label="MRP (₹)" hint="Max retail price">
              <TextInput
                style={styles.input}
                value={mrp} onChangeText={setMrp}
                keyboardType="decimal-pad" placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>
          </View>
        </View>

        {/* MSP + Selling Price */}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Field label="MSP (₹)" hint="Min selling price">
              <TextInput
                style={styles.input}
                value={msp} onChangeText={setMsp}
                keyboardType="decimal-pad" placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>
          </View>
          <View style={{ width: Spacing.md }} />
          <View style={{ flex: 1 }}>
            <Field label="Selling Price (₹)" required error={errors.sell}>
              <TextInput
                style={[styles.input, errors.sell && styles.inputErr]}
                value={sell} onChangeText={setSell}
                keyboardType="decimal-pad" placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>
          </View>
        </View>

        {/* Margin preview */}
        {margin && (
          <View style={styles.marginBox}>
            <Ionicons name="analytics-outline" size={16} color={Colors.primary} />
            <Text style={styles.marginTxt}>
              Margin: <Text style={{ color: Colors.success, fontWeight: '700' }}>₹{margin.val} ({margin.pct}%)</Text>
            </Text>
            {msp ? <Text style={styles.marginTxt}>MSP: <Text style={{ fontWeight: '700', color: Colors.warning }}>₹{msp}</Text></Text> : null}
            {mrp ? <Text style={styles.marginTxt}>MRP: <Text style={{ fontWeight: '700', color: Colors.info }}>₹{mrp}</Text></Text> : null}
          </View>
        )}

        {/* ── Stock ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="cube-outline" size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Stock</Text>
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Field label="Stock Quantity" required error={errors.stock}>
              <TextInput
                style={[styles.input, errors.stock && styles.inputErr]}
                value={stock} onChangeText={setStock}
                keyboardType="number-pad" placeholder="0"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>
          </View>
          <View style={{ width: Spacing.md }} />
          <View style={{ flex: 1 }}>
            <Field label="Low Stock Alert at">
              <TextInput
                style={styles.input}
                value={threshold} onChangeText={setThreshold}
                keyboardType="number-pad" placeholder="5"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>
          </View>
        </View>

        {/* ── Image URL ── */}
        <Field label="Image URL (optional)">
          <TextInput
            style={styles.input}
            value={imageUrl} onChangeText={setImageUrl}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.imgPreview} /> : null}
        </Field>

        {/* ── Save button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave} disabled={loading}
        >
          <Ionicons name={isEdit ? 'save-outline' : 'add-circle-outline'} size={20} color={Colors.white} />
          <Text style={styles.saveTxt}>{loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.background },
  header:      { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:     { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },

  form:    { padding: Spacing.lg },
  twoCol:  { flexDirection: 'row' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md, marginTop: Spacing.xs },
  sectionTitle:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },

  catRow:    { flexDirection: 'row', gap: Spacing.md },
  catChip:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.card },
  catChipOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  catEmoji:  { fontSize: 20 },
  catTxt:    { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  catTxtOn:  { color: Colors.primary },

  input:     { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.text, outlineStyle: 'none' },
  inputErr:  { borderColor: Colors.danger },

  barcodeRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  scanBtn:    { width: 46, height: 46, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  marginBox: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  marginTxt: { fontSize: FontSize.sm, color: Colors.text },

  imgPreview: { width: 80, height: 80, borderRadius: Radius.md, marginTop: Spacing.sm },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.sm },
  saveTxt: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
