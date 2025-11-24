import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TransaccionItem from './ItemTransaccion';
import { Transaccion } from '../types';
import { db } from 'utils/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import { getRecentTransactionsForUser } from '../firebase/firestoreService';
import { getAuth } from 'firebase/auth';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TransaccionList({ visible, onClose }: Props) {
  const [transactions, setTransactions] = useState<Transaccion[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const snap = await getRecentTransactionsForUser(user.uid, 200);
        const docs = snap.map((d: any) => ({
          id: d.id,
          tipo: d.tipo ?? d.type ?? 'expense',
          categoria: d.categoria ?? d.category ?? '',
          monto: Number(d.monto ?? d.amount ?? 0),
          fecha: d.fecha ?? d.date ?? (d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate().toString() : d.createdAt) : ''),
        } as Transaccion));
        docs.sort((a,b) => {
          const ta = a.fecha ? new Date(a.fecha).getTime() : 0;
          const tb = b.fecha ? new Date(b.fecha).getTime() : 0;
          return tb - ta;
        });
        setTransactions(docs);
      } catch (e) {
        console.warn('Failed to load transactions for list', e);
      }
    };
    if (visible) load();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView className="flex-1 bg-neutral-900">
        <View className="px-4 py-3 flex-row items-center justify-between">
          <Text className="text-white text-lg font-semibold">All transactions</Text>
          <TouchableOpacity onPress={onClose} className="px-2 py-1">
            <Text className="text-sky-400">Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {transactions.map((t) => (
            <TransaccionItem key={t.id} transaccion={t} onPress={() => {}} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
