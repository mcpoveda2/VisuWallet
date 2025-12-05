// components/AddRecord.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Categorias from './Categorias';
import { db, ensureAnonymousSignIn } from 'utils/firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

interface FormularioProps {
  onBack: () => void;  
  ocrData?: { rawText?: string; amount?: number | string; date?: string; labels?: string[] } | null;
}

export default function Formulario({onBack, ocrData}:FormularioProps) {
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState<string>("");
  const [account, setAccount] = useState<string>("Cuenta transaccional");
  const [category, setCategory] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState<string>(new Date().toString());
  const [labels, setLabels] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [userLabels, setUserLabels] = useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    if (ocrData) {
      if (ocrData.amount) {
        setAmount(ocrData.amount);
        console.log('OCR amount set:', ocrData.amount);
      }
      if (ocrData.date) {
        setDateTime(ocrData.date);
        console.log('OCR date set:', ocrData.date);
      }
      if (ocrData.rawText) {
        setNote(ocrData.rawText);
        console.log('OCR rawText set to note:', ocrData.rawText.substring(0, 50));
      }
      if (ocrData.labels && ocrData.labels.length > 0) {
        setSelectedLabels(ocrData.labels);
        console.log('OCR labels set:', ocrData.labels);
      }
    }
  }, [ocrData]);

  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [showAccountsModal, setShowAccountsModal] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<
    Array<{
      id: string;
      tipo?: string;
      numero?: string;
      saldo?: number;
      cedula?: string;
      propietario?: string;
      email?: string;
    }>
  >([]);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [showPayeeModal, setShowPayeeModal] = useState<boolean>(false);
  const [showLabelsModal, setShowLabelsModal] = useState<boolean>(false);
  const recommendedLabels = ['Food', 'Transport', 'Shopping', 'Salary', 'Rent'];
  const [newLabel, setNewLabel] = useState<string>('');

  const initialState = {
    account: '',
    category: '',
    date: '',
    details: '',
    labels: [] as string[],
    type: 'expense' as 'expense' | 'income' | 'transfer',
    amount: 0,
    payee: '',
  };

  const [record, setRecord] = useState(initialState);

  const handleChange = (field: string, value: string) => {
    setRecord((prev) => ({ ...prev, [field]: value }) as any);
    switch (field) {
      case 'type':
        setType(value as 'expense' | 'income' | 'transfer');
        break;
      case 'amount':
        setAmount(value);
        break;
      case 'account':
        setAccount(value);
        break;
      case 'category':
        setCategory(value || null);
        break;
      case 'date':
        setDateTime(value);
        break;
      case 'labels':
        setLabels(value);
        break;
      case 'details':
      case 'note':
        setNote(value);
        break;
      case 'payee':
        setPayee(value);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    // Si viene ocrData desde PhotoPreview, autocompletar note (y opcionalmente amount/labels)
    if (ocrData && ocrData.rawText) {
      setNote(ocrData.rawText);
      handleChange('details', ocrData.rawText);
      handleChange('note', ocrData.rawText);
    }

    const load = async () => {
      try {
        const labelsCol = collection(db, 'labels');
        const snap = await getDocs(labelsCol);
        const results = snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name }));
        setUserLabels(results);
      } catch (e) {
        console.warn('Failed to load labels from Firestore, falling back to local storage', e);
        try {
          const raw = await AsyncStorage.getItem('labels_local');
          if (raw) {
            const parsed = JSON.parse(raw) as string[];
            const mapped = parsed.map((name, idx) => ({ id: `local-${idx}-${name}`, name }));
            setUserLabels(mapped);
          }
        } catch (err) {
          console.error('Failed to load labels from AsyncStorage', err);
        }
      }
    };
    load();
  }, []);

  const loadAccounts = async () => {
    try {
      const snapAcc = await getDocs(collection(db, 'cuentas'));
      const accs = snapAcc.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          tipo: data.tipo || 'corriente',
          numero: data.numero || '',
          saldo: data.saldo ? Number(data.saldo) : 0,
          cedula: data.cedula || '',
          propietario: data.propietario || data.titular || '',
          email: data.email || '',
        };
      });
      // sort by propietario then numero
      accs.sort(
        (a, b) =>
          (a.propietario || '').localeCompare(b.propietario || '') ||
          (a.numero || '').localeCompare(b.numero || '')
      );
      setAccounts(accs);
    } catch (e) {
      console.warn('Failed to load cuentas', e);
      setAccounts([]);
    }
  };

  const addUserLabel = async (label: string) => {
    const l = label.trim();
    if (!l) return;
    if (userLabels.find((u) => u.name === l)) return;
    try {
      // try Firestore public collection 'labels' first
      const ref = await addDoc(collection(db, 'labels'), { name: l, createdAt: serverTimestamp() });
      const next = [...userLabels, { id: ref.id, name: l }];
      setUserLabels(next);
      setNewLabel('');
    } catch (e) {
      console.warn('Failed to add label to Firestore, falling back to local storage', e);
      try {
        const nextNames = userLabels.map((u) => u.name).concat([l]);
        await AsyncStorage.setItem('labels_local', JSON.stringify(nextNames));
        const next = [...userLabels, { id: `local-${Date.now()}-${l}`, name: l }];
        setUserLabels(next);
        setNewLabel('');
      } catch (err) {
        console.error('Failed to persist label locally a ', err);
      }
    }
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) => {
      if (prev.includes(label)) return prev.filter((p) => p !== label);
      return [...prev, label];
    });
  };

  const saveRecord = async (rec?: typeof record) => {
    const toSave = rec ?? record;
    try {
      await addDoc(collection(db, 'registro'), { ...toSave });
      Alert.alert('Success', 'Record saved successfully!');
      console.log('Record saved:', toSave);
      onBack(); // ← : llamar a la función onBack
    } catch (e: unknown) {
      console.error(e);
      Alert.alert('Error', 'Failed to save record.');
    }
  };
  const createAgain = () => {
    // Funcion para despues de crear un registro poder crear otro sin salir del formulario
  };
  const onCancel = () => {
    onBack(); // ← : llamar a la función onBack
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => onCancel()} activeOpacity={0.7}>
          <Text className="font-medium text-sky-400">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-base font-semibold text-white">Add Record</Text>

        <TouchableOpacity
          onPress={() => {
            if (!category) {
              Alert.alert('Validation', 'Category is required.');
              return;
            }
            if (!amount) {
              Alert.alert('Validation', 'Amount is required.');
              return;
            }

            const recToSave = {
              account,
              category: category ?? '',
              date: dateTime,
              details: note,
              labels: labels
                ? labels
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
              type,
              amount: Number(amount) || 0,
              payee,
            };

            setRecord(recToSave as any);
            saveRecord(recToSave as any);
          }}
          activeOpacity={0.7}>
          <Text className="font-medium text-sky-400">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Segment: Expense / Income / Transfer */}
        <View className="mt-3 px-4">
          <View className="flex-row rounded-xl bg-neutral-800 p-1">
            <Pressable
              onPress={() => {
                const next: 'expense' | 'income' | 'transfer' = 'expense';
                setType(next);
                handleChange('type', next);
              }}
              className={`flex-1 items-center justify-center rounded-lg py-2 ${type === 'expense' ? 'bg-neutral-700' : ''}`}>
              <Text
                className={`${type === 'expense' ? 'text-white' : 'text-neutral-400'} font-medium`}>
                Expense
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                const next: 'expense' | 'income' | 'transfer' = 'income';
                setType(next);
                handleChange('type', next);
              }}
              className={`flex-1 items-center justify-center rounded-lg py-2 ${type === 'income' ? 'bg-neutral-700' : ''}`}>
              <Text
                className={`${type === 'income' ? 'text-white' : 'text-neutral-400'} font-medium`}>
                Income
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                const next: 'expense' | 'income' | 'transfer' = 'transfer';
                setType(next);
                handleChange('type', next);
              }}
              className={`flex-1 items-center justify-center rounded-lg py-2 ${type === 'transfer' ? 'bg-neutral-700' : ''}`}>
              <Text
                className={`${type === 'transfer' ? 'text-white' : 'text-neutral-400'} font-medium`}>
                Transfer
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Amount area */}
        <View className="mt-6 flex-row items-center justify-between px-4">
          <View className="mr-3 rounded-lg bg-neutral-800 px-3 py-2">
            <Text className="font-medium text-neutral-300">USD</Text>
          </View>

          <TextInput
            value={amount}
            onChangeText={(t) => {
              const filtered = t.replace(/[^0-9.]/g, '');
              setAmount(filtered);
              handleChange('amount', filtered);
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#666"
            className="flex-1 text-right text-5xl font-bold text-white"
            style={{ lineHeight: 56 }}
          />
        </View>

        <View className="mx-4 my-6 h-px bg-neutral-800" />

        {/* GENERAL header */}
        <View className="px-4">
          <Text className="mb-3 text-xs text-neutral-400">GENERAL</Text>

          <TouchableOpacity
            onPress={() => {
              setShowAccountsModal(true);
              loadAccounts();
            }}
            activeOpacity={0.7}
            className="mb-3 flex-row items-center justify-between rounded-xl bg-neutral-800 px-4 py-4">
            <View>
              <Text className="font-medium text-white">Account</Text>
              <Text className="text-sm text-neutral-400">{account}</Text>
            </View>
            <Text className="text-neutral-400">{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowCategories(true)}
            activeOpacity={0.7}
            className="mb-3 flex-row items-center justify-between rounded-xl bg-neutral-800 px-4 py-4">
            <View>
              <Text className="font-medium text-white">Category</Text>
            </View>
            <View className="flex-row items-center">
              {category ? (
                <Text className="mr-2 text-neutral-400">{category}</Text>
              ) : (
                <Text className="mr-2 text-red-500">Required</Text>
              )}
              <Text className="text-neutral-400">{'>'}</Text>
            </View>
          </TouchableOpacity>

          <Modal visible={showCategories} animationType="slide">
            <Categorias
              onSelect={(c: string) => {
                setCategory(c);
                handleChange('category', c);
                setShowCategories(false);
              }}
              onClose={() => setShowCategories(false)}
            />
          </Modal>

          <Modal visible={showAccountsModal} animationType="slide">
            <View className="flex-1 justify-center bg-black/50 px-4">
              <View className="w-full rounded-lg bg-neutral-900 p-4">
                <Text className="mb-3 text-lg font-semibold text-white">Seleccionar cuenta</Text>
                <View className="max-h-[60vh]">
                  <ScrollView>
                    {accounts.length === 0 ? (
                      <Text className="text-neutral-400">No hay cuentas registradas.</Text>
                    ) : (
                      accounts.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => {
                            const display = c.propietario
                              ? `${c.propietario} — ${c.numero || ''}`
                              : c.numero || 'Cuenta';
                            setAccount(display);
                            handleChange('account', display);
                            setShowAccountsModal(false);
                          }}
                          className="border-b border-neutral-800 py-3">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1 pr-2">
                              <View className="flex-row items-center">
                                <Text className="font-medium text-white">
                                  {c.propietario || 'Cuenta'}
                                </Text>
                                <Text className="ml-2 text-xs text-neutral-400">
                                  {c.tipo ? c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1) : ''}
                                </Text>
                              </View>
                              <Text className="mt-1 text-sm text-neutral-400">{c.numero}</Text>
                            </View>
                            <View className="items-end">
                              <Text className="font-bold text-white">
                                ${(c.saldo || 0).toFixed(2)}
                              </Text>
                              <Text className="text-xs text-neutral-400">{c.cedula || ''}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
                <View className="mt-4 flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => setShowAccountsModal(false)}
                    className="px-3 py-2">
                    <Text className="text-sky-400">Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            activeOpacity={0.7}
            className="mb-3 flex-row items-center justify-between rounded-xl bg-neutral-800 px-4 py-4">
            <View>
              <Text className="font-medium text-white">Date & Time</Text>
              <Text className="text-sm text-neutral-400">{dateTime}</Text>
            </View>
            <Text className="text-neutral-400">{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // setSelectedLabels(labels ? labels.split(',').map(s=>s.trim()).filter(Boolean) : []);
              // setShowLabelsModal(true);

              const existingLabels = labels
                ? labels.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

              // Sugerencias OCR
              const ocrLabels = ocrData?.labels?.slice(0, 5) || [];

              // Combinar y eliminar duplicados
              const combined = Array.from(new Set([...ocrLabels, ...existingLabels]));

              setSelectedLabels(combined);
              setShowLabelsModal(true);
            }}
            activeOpacity={0.7}
            className="mb-3 flex-row items-center justify-between rounded-xl bg-neutral-800 px-4 py-4">
            <View>
              <Text className="font-medium text-white">Labels</Text>
              <Text className="text-sm text-neutral-400">{labels || 'None'}</Text>
            </View>
            <Text className="text-xl text-sky-400">+</Text>
          </TouchableOpacity>
        </View>

        {/* MORE DETAIL */}
        <View className="mt-6 px-4">
          <Text className="mb-3 text-xs text-neutral-400">MORE DETAIL</Text>

          <TouchableOpacity
            onPress={() => setShowNoteModal(true)}
            activeOpacity={0.7}
            className="mb-3 rounded-xl bg-neutral-800 px-4 py-4">
            <Text className="font-medium text-white">Note</Text>
            <Text className="mt-1 text-sm text-neutral-400">{note || 'None'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPayeeModal(true)}
            activeOpacity={0.7}
            className="mb-6 rounded-xl bg-neutral-800 px-4 py-4">
            <Text className="font-medium text-white">Payee</Text>
            <Text className="mt-1 text-sm text-neutral-400">{payee || 'None'}</Text>
          </TouchableOpacity>
        </View>

        {/* Note modal */}
        <Modal visible={showNoteModal} animationType="slide" transparent>
          <View className="flex-1 items-center justify-center bg-black/50 px-4">
            <View className="w-full rounded-lg bg-neutral-900 p-4">
              <Text className="mb-2 font-medium text-white">Note</Text>
              <TextInput
                value={note}
                onChangeText={(t) => setNote(t)}
                multiline
                autoFocus
                placeholder="Add a note..."
                placeholderTextColor="#666"
                className="mb-4 min-h-[80px] text-white"
              />
              <View className="flex-row justify-end">
                <TouchableOpacity onPress={() => setShowNoteModal(false)} className="px-3 py-2">
                  <Text className="text-neutral-400">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    handleChange('note', note);
                    setShowNoteModal(false);
                  }}
                  className="px-3 py-2">
                  <Text className="text-sky-400">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Payee modal */}
        <Modal visible={showPayeeModal} animationType="slide" transparent>
          <View className="flex-1 items-center justify-center bg-black/50 px-4">
            <View className="w-full rounded-lg bg-neutral-900 p-4">
              <Text className="mb-2 font-medium text-white">Payee</Text>
              <TextInput
                value={payee}
                onChangeText={(t) => setPayee(t)}
                autoFocus
                placeholder="Add a payee..."
                placeholderTextColor="#666"
                className="mb-4 text-white"
              />
              <View className="flex-row justify-end">
                <TouchableOpacity onPress={() => setShowPayeeModal(false)} className="px-3 py-2">
                  <Text className="text-neutral-400">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    handleChange('payee', payee);
                    setShowPayeeModal(false);
                  }}
                  className="px-3 py-2">
                  <Text className="text-sky-400">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Labels modal
        <Modal visible={showLabelsModal} animationType="slide" transparent>
          <View className="flex-1 justify-center items-center bg-black/50 px-4">
            <View className="w-full bg-neutral-900 rounded-lg p-4">
              <Text className="text-white font-medium mb-2">Labels</Text>

              <Text className="text-neutral-400 text-sm mb-2">Recommended</Text>
              <View className="flex-row flex-wrap mb-3">
                {recommendedLabels.map((l) => {
                  const active = selectedLabels.includes(l);
                  return (
                    <TouchableOpacity
                      key={l}
                      onPress={() => toggleLabel(l)}
                      className={`px-3 py-2 mr-2 mb-2 rounded-full ${active ? 'bg-sky-400' : 'bg-neutral-800'}`}
                    >
                      <Text className={`${active ? 'text-white' : 'text-neutral-300'}`}>{l}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-neutral-400 text-sm mb-2">Your labels</Text>
              <View className="flex-row flex-wrap mb-3">
                {userLabels.map((l) => {
                  const active = selectedLabels.includes(l.name);
                  return (
                    <View key={l.id} className="flex-row items-center mr-2 mb-2">
                      <TouchableOpacity
                        onPress={() => toggleLabel(l.name)}
                        className={`px-3 py-2 rounded-full ${active ? 'bg-sky-400' : 'bg-neutral-800'}`}
                      >
                        <Text className={`${active ? 'text-white' : 'text-neutral-300'}`}>{l.name}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            // delete from Firestore
                            await deleteDoc(doc(db, 'user_labels', l.id));
                            const next = userLabels.filter((x) => x.id !== l.id);
                            setUserLabels(next);
                            // also unselect if selected
                            setSelectedLabels((prev) => prev.filter((p) => p !== l.name));
                          } catch (e) {
                            console.error('Failed to delete user label', e);
                          }
                        }}
                        className="ml-2"
                      >
                        <Text className="text-neutral-400">✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              <View className="flex-row items-center mb-4">
                <TextInput
                  value={newLabel}
                  onChangeText={(t) => setNewLabel(t)}
                  placeholder="Create new label"
                  placeholderTextColor="#666"
                  className="flex-1 text-white bg-neutral-800 px-3 py-2 rounded-lg mr-2"
                />
                <TouchableOpacity onPress={() => addUserLabel(newLabel)} className="px-3 py-2 bg-sky-400 rounded-lg">
                  <Text className="text-white">Add</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-end">
                <TouchableOpacity onPress={() => setShowLabelsModal(false)} className="px-3 py-2">
                  <Text className="text-neutral-400">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const labelsStr = selectedLabels.join(', ');
                    setLabels(labelsStr);
                    handleChange('labels', labelsStr);
                    setShowLabelsModal(false);
                  }}
                  className="px-3 py-2"
                >
                  <Text className="text-sky-400">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal> */}

        {/* Labels modal */}
        <Modal visible={showLabelsModal} animationType="slide" transparent>
          <View className="flex-1 items-center justify-center bg-black/50 px-4">
            <View className="w-full rounded-lg bg-neutral-900 p-4">
              <Text className="mb-2 font-medium text-white">Labels</Text>

              {/* OCR Suggested Labels */}
              {ocrData?.labels && ocrData.labels.length > 0 && (
                <>
                  <Text className="mb-2 text-sm text-neutral-400">Suggested by AI</Text>
                  <View className="mb-3 flex-row flex-wrap">
                    {ocrData.labels.slice(0, 5).map((l: string) => {
                      const active = selectedLabels.includes(l);
                      return (
                        <TouchableOpacity
                          key={l}
                          onPress={() => toggleLabel(l)}
                          className={`mb-2 mr-2 rounded-full px-3 py-2 ${active ? 'bg-sky-400' : 'bg-neutral-800'}`}>
                          <Text className={`${active ? 'text-white' : 'text-neutral-300'}`}>
                            {l}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Recommended Labels */}
              <Text className="mb-2 text-sm text-neutral-400">Recommended</Text>
              <View className="mb-3 flex-row flex-wrap">
                {recommendedLabels.map((l) => {
                  const active = selectedLabels.includes(l);
                  return (
                    <TouchableOpacity
                      key={l}
                      onPress={() => toggleLabel(l)}
                      className={`mb-2 mr-2 rounded-full px-3 py-2 ${active ? 'bg-sky-400' : 'bg-neutral-800'}`}>
                      <Text className={`${active ? 'text-white' : 'text-neutral-300'}`}>{l}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* User labels */}
              <Text className="mb-2 text-sm text-neutral-400">Your labels</Text>
              <View className="mb-3 flex-row flex-wrap">
                {userLabels.map((l) => {
                  const active = selectedLabels.includes(l.name);
                  return (
                    <View key={l.id} className="mb-2 mr-2 flex-row items-center">
                      <TouchableOpacity
                        onPress={() => toggleLabel(l.name)}
                        className={`rounded-full px-3 py-2 ${active ? 'bg-sky-400' : 'bg-neutral-800'}`}>
                        <Text className={`${active ? 'text-white' : 'text-neutral-300'}`}>
                          {l.name}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            await deleteDoc(doc(db, 'user_labels', l.id));
                            const next = userLabels.filter((x) => x.id !== l.id);
                            setUserLabels(next);
                            setSelectedLabels((prev) => prev.filter((p) => p !== l.name));
                          } catch (e) {
                            console.error('Failed to delete user label', e);
                          }
                        }}
                        className="ml-2">
                        <Text className="text-neutral-400">✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Add new label */}
              <View className="mb-4 flex-row items-center">
                <TextInput
                  value={newLabel}
                  onChangeText={(t) => setNewLabel(t)}
                  placeholder="Create new label"
                  placeholderTextColor="#666"
                  className="mr-2 flex-1 rounded-lg bg-neutral-800 px-3 py-2 text-white"
                />
                <TouchableOpacity
                  onPress={() => addUserLabel(newLabel)}
                  className="rounded-lg bg-sky-400 px-3 py-2">
                  <Text className="text-white">Add</Text>
                </TouchableOpacity>
              </View>

              {/* Modal actions */}
              <View className="flex-row justify-end">
                <TouchableOpacity onPress={() => setShowLabelsModal(false)} className="px-3 py-2">
                  <Text className="text-neutral-400">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const labelsStr = selectedLabels.join(', ');
                    setLabels(labelsStr);
                    handleChange('labels', labelsStr);
                    setShowLabelsModal(false);
                  }}
                  className="px-3 py-2">
                  <Text className="text-sky-400">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
