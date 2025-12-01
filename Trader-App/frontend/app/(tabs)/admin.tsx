import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Car, useCars } from '../contexts/CarsContext';

export default function AdminTab() {
  const { cars, addCar, updateCar, deleteCar } = useCars();

  const [modelName, setModelName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [luggageSpace, setLuggageSpace] = useState('2');
  const [perHourRate, setPerHourRate] = useState('10');
  const [modelYear, setModelYear] = useState('2020');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (editingId) {
      const c = cars.find((x: Car) => x.id === editingId);
      if (c) {
        setModelName(c.modelName);
        setCapacity(String(c.capacity));
        setLuggageSpace(String(c.luggageSpace));
        setPerHourRate(String(c.perHourRate));
        setModelYear(String(c.modelYear));
        setImageUri(c.imageUri || null);
        setShowForm(true);
      }
    } else {
      setModelName('');
      setImageUri(null);
    }
  }, [editingId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    if (!modelName.trim()) {
      Alert.alert('Validation', 'Please provide a model name');
      return;
    }

    const payload = {
      modelName: modelName.trim(),
      capacity: Number(capacity) || 0,
      luggageSpace: Number(luggageSpace) || 0,
      perHourRate: Number(perHourRate) || 0,
      modelYear: Number(modelYear) || 0,
      imageUri: imageUri || '', // save local URI
    };

    if (editingId) {
      await updateCar(editingId, payload);
      setSuccessMsg('Car updated');
      setEditingId(null);
    } else {
      await addCar(payload);
      setSuccessMsg('Car added');
    }

    setModelName('');
    setCapacity('4');
    setLuggageSpace('2');
    setPerHourRate('10');
    setModelYear('2020');
    setImageUri(null);
    setShowForm(false);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const onEdit = (c: Car) => {
    setEditingId(c.id);
    setShowForm(true);
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete car', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCar(id) },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      {successMsg ? (
        <View className="absolute top-6 left-4 right-4 items-center z-50">
          <View className="bg-green-600 px-4 py-2 rounded-full">
            <Text className="text-white">{successMsg}</Text>
          </View>
        </View>
      ) : null}

      <View className="flex-1 p-4">
        <Text className="text-lg font-semibold mb-3">Cars</Text>
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row p-3 border border-gray-100 rounded-lg mb-2 items-center">
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 10 }} />
              ) : null}
              <View className="flex-1">
                <Text className="text-base font-semibold">{item.modelName} ({item.modelYear})</Text>
                <Text className="text-gray-600 mt-1">Capacity: {item.capacity} · Luggage: {item.luggageSpace} · ${item.perHourRate}/hr</Text>
              </View>
              <View className="ml-3 items-end">
                <Pressable onPress={() => onEdit(item)} className="px-3 py-1 bg-blue-100 rounded-md mb-2">
                  <Text className="text-blue-700">Edit</Text>
                </Pressable>
                <Pressable onPress={() => onDelete(item.id)} className="px-3 py-1 bg-red-100 rounded-md">
                  <Text className="text-red-700">Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text className="text-center mt-2 text-gray-500">No cars yet.</Text>}
        />
      </View>

      <View className="absolute bottom-6 left-0 right-0 px-6">
        <View className="items-center">
          <Pressable onPress={() => { setShowForm(true); setEditingId(null); }} className="bg-blue-600 px-5 py-3 rounded-full shadow-lg">
            <Text className="text-white font-semibold">Add car</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
      >
        {/* Dim background */}
        <TouchableWithoutFeedback
          onPress={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        >
          <View className="flex-1 bg-black/30" />
        </TouchableWithoutFeedback>

        {/* Bottom sheet */}
        <View className="absolute left-0 right-0 bottom-0 max-h-[85%]">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
            style={{ flex: 1 }}
          >
            <View className="bg-white border-t border-gray-200 p-4 rounded-t-2xl flex-1">
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
              >
                {/* HEADER */}
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-semibold">
                    {editingId ? 'Edit Car' : 'Add Car'}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    className="px-2 py-1"
                  >
                    <Text className="text-gray-600">Close</Text>
                  </Pressable>
                </View>

                {/* IMAGE PICKER */}
                <Pressable
                  onPress={pickImage}
                  className="border border-dashed border-gray-400 rounded-lg mb-3 overflow-hidden"
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: '100%', height: 180, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-40 justify-center items-center">
                      <Text className="text-gray-600">Tap to select car image</Text>
                    </View>
                  )}
                </Pressable>

                {/* INPUT FIELDS */}
                <Text className="text-sm text-gray-700 mb-1">Model name</Text>
                <TextInput
                  className="border border-gray-200 p-2 rounded-md"
                  value={modelName}
                  onChangeText={setModelName}
                  placeholder="e.g. Toyota Prius"
                />

                <Text className="text-sm mt-2 mb-1 text-gray-700">Capacity</Text>
                <TextInput
                  className="border border-gray-200 p-2 rounded-md"
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="numeric"
                />

                <Text className="text-sm mt-2 mb-1 text-gray-700">Luggage space</Text>
                <TextInput
                  className="border border-gray-200 p-2 rounded-md"
                  value={luggageSpace}
                  onChangeText={setLuggageSpace}
                  keyboardType="numeric"
                />

                <Text className="text-sm mt-2 mb-1 text-gray-700">Per hour rate</Text>
                <TextInput
                  className="border border-gray-200 p-2 rounded-md"
                  value={perHourRate}
                  onChangeText={setPerHourRate}
                  keyboardType="numeric"
                />

                <Text className="text-sm mt-2 mb-1 text-gray-700">Model year</Text>
                <TextInput
                  className="border border-gray-200 p-2 rounded-md"
                  value={modelYear}
                  onChangeText={setModelYear}
                  keyboardType="numeric"
                />

                {/* SAVE BUTTON */}
                <Pressable
                  onPress={onSave}
                  className="bg-blue-600 py-2 px-3 rounded-md mt-5 items-center"
                >
                  <Text className="text-white font-medium">
                    {editingId ? 'Update car' : 'Save car'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}
