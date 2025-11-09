import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TransaccionItem from './ItemTransaccion';
import { Transaccion } from '../types';
import { db } from 'utils/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TransaccionList({ visible, onClose }: Props) {
  const [transactions, setTransactions] = useState<Transaccion[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'registro'));
        const docs = snap.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            tipo: data.type ?? data.tipo ?? 'expense',
            categoria: data.category ?? data.categoria ?? '',
            monto: Number(data.amount ?? data.monto ?? 0),
            fecha: data.date ?? data.fecha ?? (data.createdAt ? data.createdAt.toDate().toString() : ''),
          } as Transaccion;
        });
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
