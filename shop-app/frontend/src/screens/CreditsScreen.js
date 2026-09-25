import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCredits, markCreditPaid, deleteCredit } from '../services/api';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function CreditsScreen() {
  const [credits,    setCredits]   = useState([]);
  const [filter,     setFilter]    = useState('pending');
  const [refreshing, setRefreshing]= useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCredits({ status: filter === 'all' ? undefined : filter });
      setCredits(data);
    } catch (e) { Alert.alert('Error', e.message); }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalPending = credits
    .filter(c => !c.is_paid)
    .reduce((s, c) => s + parseFloat(c.amount), 0);

  const handleMarkPaid = async (credit) => {
    const confirmed = window.confirm(
      `Mark ₹${credit.amount} from "${credit.customer_name}" as paid?`
    );
    if (!confirmed) return;
    try {
      await markCreditPaid(credit.id);
      await load();
    } catch (e) {
      window.alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (credit) => {
    const confirmed = window.confirm(
      `Delete credit of ₹${credit.amount} for "${credit.customer_name}"?`
    );
    if (!confirmed) return;
    try {
      await deleteCredit(credit.id);
      setCredits(prev => prev.filter(c => c.id !== credit.id));
    } catch (e) {
      window.alert('Error: ' + e.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, Shadow.small]}>
      {/* Top: avatar + info + amount */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, {
          backgroundColor: item.is_paid ? Colors.successLight : Colors.warningLight,
        }]}>
          <Text style={styles.avatarTxt}>{item.customer_name.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.custName}>{item.customer_name}</Text>
          {item.phone ? (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
          ) : null}
          {item.note ? <Text style={styles.note}>📝 {item.note}</Text> : null}
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
          {item.is_paid && item.paid_at ? (
            <Text style={styles.paidDate}>
              ✅ Paid on {new Date(item.paid_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short',
              })}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.amount, { color: item.is_paid ? Colors.success : Colors.danger }]}>
          {fmt(item.amount)}
        </Text>
      </View>

      {/* Bottom: action buttons */}
      <View style={styles.cardBtns}>
        {!item.is_paid ? (
          <TouchableOpacity
            style={styles.markPaidBtn}
            onPress={() => handleMarkPaid(item)}
          >
            <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
            <Text style={styles.markPaidTxt}>Mark as Paid</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.doneBadge}>
            <Text style={styles.doneTxt}>✅ Paid</Text>
          </View>
        )}
        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={15} color={Colors.danger} />
          <Text style={styles.delTxt}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Credits</Text>
      </View>

      {/* Total pending banner */}
      {totalPending > 0 && filter !== 'paid' && (
        <View style={styles.totalBanner}>
          <Ionicons name="time-outline" size={18} color={Colors.danger} />
          <Text style={styles.totalLbl}>Total Pending</Text>
          <Text style={styles.totalVal}>{fmt(totalPending)}</Text>
        </View>
      )}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {[
          { key: 'pending', label: '⏳ Pending' },
          { key: 'paid',    label: '✅ Paid'    },
          { key: 'all',     label: '📋 All'     },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipOn]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterTxt, filter === f.key && styles.filterTxtOn]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={credits}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5C2D0E']} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>
              {filter === 'pending' ? 'No pending credits' :
               filter === 'paid'    ? 'No paid credits yet' : 'No credits yet'}
            </Text>
            <Text style={styles.emptySub}>
              {filter === 'pending' ? 'All payments are cleared! 🎉' : 'Credits will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: '#5C2D0E', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },

  totalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  totalLbl: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.danger },
  totalVal: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.danger },

  filterRow: {
    flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterChip:   { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  filterChipOn: { backgroundColor: '#5C2D0E', borderColor: '#5C2D0E' },
  filterTxt:    { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  filterTxtOn:  { color: Colors.white },

  list: { padding: Spacing.lg, paddingBottom: 40 },

  card:    { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },

  avatar:    { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: FontSize.xl, fontWeight: '800', color: '#5C2D0E' },

  custName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  phone:    { fontSize: FontSize.xs, color: Colors.textMuted },
  note:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  date:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  paidDate: { fontSize: FontSize.xs, color: Colors.success, marginTop: 2 },
  amount:   { fontSize: FontSize.xl, fontWeight: '800' },

  cardBtns:    { flexDirection: 'row', gap: Spacing.sm },
  markPaidBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#5C2D0E',
    borderRadius: Radius.md, paddingVertical: Spacing.md,
  },
  markPaidTxt: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  doneBadge:   { flex: 1, backgroundColor: Colors.successLight, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  doneTxt:     { color: Colors.success, fontWeight: '700', fontSize: FontSize.sm },
  delBtn:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  delTxt: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.sm },

  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySub:   { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
});
