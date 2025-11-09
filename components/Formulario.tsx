// components/AddRecord.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Categorias from "./Categorias";
import { db } from "utils/firebase.js";
import { collection, addDoc } from "firebase/firestore";



export default function Formulario() {
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState<string>("");
  const [account, setAccount] = useState<string>("Cuenta transaccional");
  const [category, setCategory] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState<string>(new Date().toString());
  const [labels, setLabels] = useState<string>(""); // could be an array later
  const [note, setNote] = useState<string>("");
  const [payee, setPayee] = useState<string>("");
  const [showCategories, setShowCategories] = useState<boolean>(false);

  // aquí iría la lógica para guardar
  const initialState = {
    account,
    category: category ?? '',
    date: dateTime,
    details: note,
    labels: labels ? labels.split(',').map(s => s.trim()).filter(Boolean) : [],
    type,
    amount: Number(amount) || 0,
    payee,
  };
  const [record, setRecord] = useState(initialState);
  const handleChange = (field: string, value: string) => {
    setRecord(prev => ({ ...prev, [field]: value }));
    switch (field) {
      case 'type':
        setType(value as "expense" | "income" | "transfer");
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
  }
  const saveRecord = async (rec?: typeof record) => {
    const toSave = rec ?? record;
    try {
      await addDoc(collection(db, 'registro'), { ...toSave });
      Alert.alert('Success', 'Record saved successfully!');
      console.log('Record saved:', toSave);
    } catch (e: unknown) {
      console.error(e);
      Alert.alert('Error', 'Failed to save record.');
    }
  }

  const onCancel = () => {
    // reset o navegación atrás

    console.log("cancel");
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <Text className="text-sky-400 font-medium">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-base font-semibold text-white">Add Record</Text>

        <TouchableOpacity
          onPress={() => {
            // validación mínima
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
              labels: labels ? labels.split(',').map(s => s.trim()).filter(Boolean) : [],
              type,
              amount: Number(amount) || 0,
              payee,
            };
            setRecord(recToSave);
            saveRecord(recToSave);
          }}
          activeOpacity={0.7}
        >
          <Text className="text-sky-400 font-medium">Save</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Segment: Expense / Income / Transfer */}
        <View className="px-4 mt-3">
          <View className="flex-row bg-neutral-800 rounded-xl p-1">
            <Pressable
              onPress={() => {
                const next: "expense" | "income" | "transfer" = "expense";
                setType(next);
                handleChange("type", next);
              }}
              className={`flex-1 rounded-lg py-2 items-center justify-center ${type === "expense" ? "bg-neutral-700" : ""
                }`}
            >
              <Text className={`${type === "expense" ? "text-white" : "text-neutral-400"} font-medium`}>
                Expense
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                const next: "expense" | "income" | "transfer" = "income";
                setType(next);
                handleChange("type", next);
              }}
              className={`flex-1 rounded-lg py-2 items-center justify-center ${type === "income" ? "bg-neutral-700" : ""
                }`}
            >
              <Text className={`${type === "income" ? "text-white" : "text-neutral-400"} font-medium`}>
                Income
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                const next: "expense" | "income" | "transfer" = "transfer";
                setType(next);
                handleChange("type", next);
              }}
              className={`flex-1 rounded-lg py-2 items-center justify-center ${type === "transfer" ? "bg-neutral-700" : ""
                }`}
            >
              <Text className={`${type === "transfer" ? "text-white" : "text-neutral-400"} font-medium`}>
                Transfer
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Amount area */}
        <View className="px-4 mt-6 flex-row items-center justify-between">
          {/* Currency badge */}
          <View className="bg-neutral-800 px-3 py-2 rounded-lg mr-3">
            <Text className="text-neutral-300 font-medium">USD</Text>
          </View>

          {/* Amount input (big) */}
          <TextInput
            value={amount}
            onChangeText={(t) => {
              // permitir solo números y punto
              const filtered = t.replace(/[^0-9.]/g, "");
              setAmount(filtered);
              handleChange("amount", filtered);
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#666"
            className="flex-1 text-right text-5xl font-bold text-white"
            style={{ lineHeight: 56 }}
          />
        </View>

        {/* Divider */}
        <View className="h-px bg-neutral-800 my-6 mx-4" />

        {/* GENERAL header */}
        <View className="px-4">
          <Text className="text-xs text-neutral-400 mb-3">GENERAL</Text>

          {/* Account row */}
          <TouchableOpacity activeOpacity={0.7} className="flex-row items-center justify-between bg-neutral-800 py-4 px-4 rounded-xl mb-3">
            <View>
              <Text className="text-white font-medium">Account</Text>
              <Text className="text-neutral-400 text-sm">{account}</Text>
            </View>
            <Text className="text-neutral-400">{">"}</Text>
          </TouchableOpacity>

          {/* Category row (Required if null) */}
          <TouchableOpacity onPress={() => setShowCategories(true)} activeOpacity={0.7} className="flex-row items-center justify-between bg-neutral-800 py-4 px-4 rounded-xl mb-3">
            <View>
              <Text className="text-white font-medium">Category</Text>
            </View>
            <View className="flex-row items-center">
              {category ? (
                <Text className="text-neutral-400 mr-2">{category}</Text>
              ) : (
                <Text className="text-red-500 mr-2">Required</Text>
              )}
              <Text className="text-neutral-400">{">"}</Text>
            </View>
          </TouchableOpacity>

          <Modal visible={showCategories} animationType="slide">
            <Categorias
              onSelect={(c: string) => {
                setCategory(c);
                handleChange("category", c);
                setShowCategories(false);
              }}
              onClose={() => setShowCategories(false)}
            />
          </Modal>

          {/* Date & Time row */}
          <TouchableOpacity activeOpacity={0.7} className="flex-row items-center justify-between bg-neutral-800 py-4 px-4 rounded-xl mb-3">
            <View>
              <Text className="text-white font-medium">Date & Time</Text>
              <Text className="text-neutral-400 text-sm">{dateTime}</Text>
            </View>
            <Text className="text-neutral-400">{">"}</Text>
          </TouchableOpacity>

          {/* Labels row */}
          <TouchableOpacity activeOpacity={0.7} className="flex-row items-center justify-between bg-neutral-800 py-4 px-4 rounded-xl mb-3">
            <View>
              <Text className="text-white font-medium">Labels</Text>
              <Text className="text-neutral-400 text-sm">{labels ? labels : "—"}</Text>
            </View>
            <Text className="text-sky-400 text-xl">+</Text>
          </TouchableOpacity>
        </View>

        {/* MORE DETAIL */}
        <View className="px-4 mt-6">
          <Text className="text-xs text-neutral-400 mb-3">MORE DETAIL</Text>

          {/* Note */}
          <TouchableOpacity activeOpacity={0.7} className="bg-neutral-800 py-4 px-4 rounded-xl mb-3">
            <Text className="text-white font-medium">Note</Text>
            <Text className="text-neutral-400 text-sm mt-1">{note ? note : "—"}</Text>
          </TouchableOpacity>

          {/* Payee */}
          <TouchableOpacity activeOpacity={0.7} className="bg-neutral-800 py-4 px-4 rounded-xl mb-6">
            <Text className="text-white font-medium">Payee</Text>
            <Text className="text-neutral-400 text-sm mt-1">{payee ? payee : "—"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
