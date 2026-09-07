import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getExpenses, createExpense, deleteExpense } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const CATS = ['Rent', 'Electricity', 'Salary', 'Transport', 'Purchase', 'Misc'];
const fmt  = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function ExpensesScreen() {
  const [expenses,   setExpenses]  = useState([]);
  const [refreshing, setRefresh]   = useState(false);
  const [loading,    setLoading]   = useState(false);
  const [modal,      setModal]     = useState(false);
  const [category,   setCategory]  = useState('Rent');
  const [amount,     setAmount]    = useState('');
  const [note,       setNote]      = useState('');
  const [err,        setErr]       = useState('');

  const load = useCallback(async () => {
    try { setExpenses(await getExpenses()); } catch (e) { Alert.alert('Error', e.message); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefresh(true); await load(); setRefresh(false); };

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  const openModal = () => { setCategory('Rent'); setAmount(''); setNote(''); setErr(''); setModal(true); };

  const handleSave = async () => {
    if (!amount || isNaN(+amount) || +amount <= 0) { setErr('Enter a valid amount'); return; }
    setLoading(true);
    try {
      await createExpense({ category, amount: parseFloat(amount), note: note.trim() || undefined });
      setModal(false); await load();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = (e) => Alert.alert('Delete', `Delete ₹${e.amount} — ${e.category}?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await deleteExpense(e.id); setExpenses(prev => prev.filter(x => x.id !== e.id)); }
      catch (ex) { Alert.alert('Error', ex.message); }
    }},
  ]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Ionicons name="add" size={22} color={Colors.white} />
          <Text style={styles.addTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalBanner}>
        <Ionicons name="arrow-down-circle-outline" size={20} color={Colors.danger} />
        <Text style={styles.totalLbl}>Total Expenses</Text>
        <Text style={styles.totalVal}>{fmt(total)}</Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySub}>Tap "Add" to log an expense</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, Shadow.small]}>
            <View style={styles.cardIcon}>
              <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardCat}>{item.category}</Text>
              {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
              <Text style={styles.cardDate}>{new Date(item.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={styles.cardAmt}>{fmt(item.amount)}</Text>
              <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal transparent animationType="slide" visible={modal}>
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Log Expense</Text>
              <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
            </View>

            <Text style={styles.fieldLbl}>Category</Text>
            <View style={styles.catGrid}>
              {CATS.map(c => (
                <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipOn]} onPress={() => setCategory(c)}>
                  <Text style={[styles.catTxt, category === c && styles.catTxtOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLbl}>Amount (₹) <Text style={{ color: Colors.danger }}>*</Text></Text>
            <TextInput style={[styles.input, err && styles.inputErr]} value={amount} onChangeText={t => { setAmount(t); setErr(''); }} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={Colors.textMuted} />
            {err ? <Text style={styles.errTxt}>{err}</Text> : null}

            <Text style={styles.fieldLbl}>Note (optional)</Text>
            <TextInput style={[styles.input, { height: 72, textAlignVertical: 'top' }]} value={note} onChangeText={setNote} placeholder="Description…" placeholderTextColor={Colors.textMuted} multiline />

            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveTxt}>{loading ? 'Saving…' : 'Save Expense'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.white, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addTxt: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  totalBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.dangerLight, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  totalLbl: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.danger },
  totalVal: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.danger },
  list: { padding: Spacing.lg, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  cardIcon: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardCat:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  cardNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  cardDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  cardAmt:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.danger },
  delBtn:   { width: 30, height: 30, borderRadius: Radius.full, backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySub:   { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 40 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  fieldLbl: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: Spacing.md },
  catGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip:  { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  catChipOn:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  catTxt:   { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  catTxtOn: { color: Colors.white },
  input:    { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.background, outlineStyle: 'none' },
  inputErr: { borderColor: Colors.danger },
  errTxt:   { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
  saveBtn:  { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl },
  saveTxt:  { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
