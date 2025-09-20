import { useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTodoStore } from "./todoStore";

export default function TodoApp() {
  const { todos, addTodo, toggleTodo, removeTodo } = useTodoStore();
  const [text, setText] = useState("");

  return (
    <View className="flex-1 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6 mt-10">
      {/* Header */}
      <Text className="text-4xl font-extrabold mb-8 text-center text-purple-800 drop-shadow-lg">
        📝 My Todos
      </Text>

      {/* Input + Add Button */}
      <View className="flex-row mb-7 items-center">
        <TextInput
          className="flex-1 border-2 border-purple-400 bg-white rounded-2xl px-4 py-3 mr-1 text-base shadow-md focus:border-purple-600"
          placeholder="Add a new todo..."
          value={text}
          onChangeText={setText}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          className="px-7 py-5 rounded-xl shadow-lg active:opacity-90"
          onPress={() => {
            if (text.trim().length > 0) {
              addTodo(text);
              setText("");
            }
          }}
        >
          <Text className="text-purple-700 font-bold text-lg tracking-wide">
            ＋ Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Todo List */}
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="flex-row items-center mb-4 bg-white px-5 py-2 rounded-2xl shadow-lg">
            {/* Toggle */}
            <TouchableOpacity
              onPress={() => toggleTodo(item.id)}
              className="flex-1"
              activeOpacity={0.7}
            >
              <Text
                className={`text-lg ${
                  item.done
                    ? "line-through text-gray-400 italic"
                    : "text-gray-900 font-semibold"
                }`}
              >
                {item.text}
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => removeTodo(item.id)}
              className="px-8 py-4 rounded-xl shadow-md ml-3 active:opacity-90"
            >
              <Text className="text-red-600 font-bold text-lg">✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-12 text-base italic">
            🌸 No todos yet. Add your first one!
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
