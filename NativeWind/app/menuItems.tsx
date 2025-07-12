import { View ,Text, ScrollView} from 'react-native'

export default function menuItems() {
    const menuItemsToDisplay = [
        { id: 1, name: 'Greek Salad', price: '$12.99', description: 'A delicious salad with fresh vegetables and feta cheese.' },
        { id: 2, name: 'Bruschetta', price: '$8.99', description: 'Toasted bread topped with tomatoes, garlic, and basil.' },
        { id: 3, name: 'Lemon Tart', price: '$6.99', description: 'A sweet and tangy lemon tart with a buttery crust.' },
        { id: 4, name: 'Pasta Primavera', price: '$14.99', description: 'Pasta with seasonal vegetables in a light sauce.' },
        { id: 5, name: 'Grilled Salmon', price: '$18.99', description: 'Fresh salmon grilled to perfection with herbs.' },
        { id: 6, name: 'Caesar Salad', price: '$10.99', description: 'Crisp romaine lettuce with Caesar dressing and croutons.' },
        { id: 7, name: 'Tiramisu', price: '$7.99', description: 'A classic Italian dessert with coffee and mascarpone cheese.' },
        { id: 8, name: 'Caprese Salad', price: '$9.99', description: 'Fresh mozzarella, tomatoes, and basil drizzled with balsamic glaze.' },
        { id: 9, name: 'Chicken Piccata', price: '$16.99', description: 'Chicken breast in a lemon caper sauce served with pasta.' },
        { id: 10, name: 'Chocolate Lava Cake', price: '$5.99', description: 'A rich chocolate cake with a molten center.' } 
    ];
  return (
    <View className="menu-items-container">
        <ScrollView className="menu-items-scroll">
            {menuItemsToDisplay.map(item => (
                <View key={item.id} className="menu-item">
                    <Text className="menu-item-name">{item.name}</Text>
                    <Text className="menu-item-price">{item.price}</Text>
                    <Text className="menu-item-description">{item.description}</Text>
                </View>
            ))}
        </ScrollView>
    </View>
  )
}
