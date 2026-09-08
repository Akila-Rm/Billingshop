import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReportSummary, getSales } from '../services/api';
import { globalStyles } from '../theme/styles';
import { Colors } from '../theme';

export default function ReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [salesList, setSalesList] = useState([]);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadData = useCallback(async () => {
    try {
      let from, to;
      if (fromDate) {
        const d = new Date(fromDate);
        if (!isNaN(d)) { d.setHours(0,0,0,0); from = d.toISOString(); }
      }
      if (toDate) {
        const d = new Date(toDate);
        if (!isNaN(d)) { d.setHours(23,59,59,999); to = d.toISOString(); }
      }
      
      const sum = await getReportSummary({ from, to });
      const list = await getSales({ from, to, limit: 50 });
      setSummary(sum);
      setSalesList(list);
    } catch (e) {
      console.log('Error loading reports', e);
    }
  }, [fromDate, toDate]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const money = (n) => '₹' + Number(n).toLocaleString('en-IN', {maximumFractionDigits:0});

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>Reports</Text>
      </View>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={globalStyles.card}>
        <Text style={globalStyles.h2}>Sales summary</Text>
        <View style={styles.rline}>
          <Text style={styles.rlineText}>Total revenue</Text>
          <Text style={styles.rlineText}>{money(summary?.total_revenue || 0)}</Text>
        </View>
        <View style={styles.rline}>
          <Text style={styles.rlineText}>Total profit</Text>
          <Text style={styles.rlineText}>{money(summary?.total_profit || 0)}</Text>
        </View>
        <View style={[styles.rline, { marginBottom: 0 }]}>
          <Text style={styles.rlineText}>Total sales</Text>
          <Text style={styles.rlineText}>{summary?.total_sales || 0}</Text>
        </View>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.h2}>Filter sales</Text>
        
        <View style={globalStyles.row2}>
          <View style={[globalStyles.field, globalStyles.flex1]}>
            <Text style={globalStyles.label}>Date from</Text>
            <TextInput 
              style={globalStyles.input} 
              placeholder="YYYY-MM-DD" 
              placeholderTextColor="#D8BFA3"
              value={fromDate}
              onChangeText={setFromDate}
            />
          </View>
          <View style={[globalStyles.field, globalStyles.flex1]}>
            <Text style={globalStyles.label}>Date to</Text>
            <TextInput 
              style={globalStyles.input} 
              placeholder="YYYY-MM-DD" 
              placeholderTextColor="#D8BFA3"
              value={toDate}
              onChangeText={setToDate}
            />
          </View>
        </View>

        <TouchableOpacity style={globalStyles.btnGhost} onPress={loadData}>
          <Text style={globalStyles.btnGhostText}>Apply filter</Text>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.h2}>Filtered sales</Text>
        {salesList.length === 0 ? (
          <Text style={globalStyles.empty}>No sales match this filter.</Text>
        ) : (
          <View>
            {salesList.map((sale, i) => (
              <View key={sale.id} style={[styles.saleRow, i === salesList.length - 1 && styles.lastItem]}>
                <View>
                  <Text style={styles.sname}>{sale.items?.[0]?.product_name || 'Slipper'}</Text>
                  <Text style={styles.stime}>{new Date(sale.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.samt}>{money(sale.total_amount)}</Text>
                  <Text style={styles.sprofit}>Profit {money(sale.total_profit)}</Text>
                </View>
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
  sprofit: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 11.5,
    color: Colors.inkSoft,
    marginTop: 2,
  },
});

