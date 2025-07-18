import { useState } from 'react';
import { SectionList, Text, View, Pressable } from 'react-native';

const menuItemsToDisplay = [
  {
    title: 'Appetizers',
    data: [
      { name: 'Hummus', price: '$5.00' },
      { name: 'Moutabal', price: '$5.00' },
      { name: 'Falafel', price: '$7.50' },
      { name: 'Marinated Olives', price: '$5.00' },
      { name: 'Kofta', price: '$5.00' },
      { name: 'Eggplant Salad', price: '$8.50' },
    ],
  },
  {
    title: 'Main Dishes',
    data: [
      { name: 'Lentil Burger', price: '$10.00' },
      { name: 'Smoked Salmon', price: '$14.00' },
      { name: 'Kofta Burger', price: '$11.00' },
      { name: 'Turkish Kebab', price: '$15.50' },
    ],
  },
  {
    title: 'Sides',
    data: [
      { name: 'Fries', price: '$3.00', id: '11K' },
      { name: 'Buttered Rice', price: '$3.00' },
      { name: 'Bread Sticks', price: '$3.00' },
      { name: 'Pita Pocket', price: '$3.00' },
      { name: 'Lentil Soup', price: '$3.75' },
      { name: 'Greek Salad', price: '$6.00' },
      { name: 'Rice Pilaf', price: '$4.00' },
    ],
  },
  {
    title: 'Desserts',
    data: [
      { name: 'Baklava', price: '$3.00' },
      { name: 'Tartufo', price: '$3.00' },
      { name: 'Tiramisu', price: '$5.00' },
      { name: 'Panna Cotta', price: '$5.00' },
    ],
  },
];

const Item = ({ name, price }: { name: string, price: string }) => (
  <View className='menu-item'>
    <Text className='menu-item-text'>{name}</Text>
    <Text className='menu-item-text'>{price}</Text>
  </View>
);

const Separator = () => (
  <View style={{ height: 1, backgroundColor: '#F4CE14' }} />
);

const header = () => (
  <Text className='welcome'>View Menu</Text>
);

const Footer = () => (
  <View className='lemon-footer'>
    <Text className='lemon-footer-text'>© 2023 Little Lemon</Text>
  </View>
);
export default function menu() {

  const [showMenu, setShowMenu] = useState(false);
  const renderItem = ({ item }: { item: { name: string, price: string } }) => (
    <Item name={item.name} price={item.price} />
  );
  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text className='section-header'>{section.title}</Text>
  );
  return (
    <>
      <View className='flex-1'>
        {!showMenu && (
          <Text className='welcome-para'>
            Little Lemon is a charming neighborhood bistro that serves simple food
            and classic cocktails in a lively but casual environment. View our
            menu to explore our cuisine with daily specials!
          </Text>
        )}
        <View className='flex-row justify-center'>
          <Pressable
            className='menu-button'
            onPress={() => setShowMenu(prevState => !prevState)}>
            <Text className='menu-button-text'>
              {showMenu ? 'Home' : 'View Menu'}
            </Text>
          </Pressable>
        </View>
          {showMenu && (
            <SectionList
              sections={menuItemsToDisplay}
              keyExtractor={(item, index) => item.name + index}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              ItemSeparatorComponent={Separator}
              ListHeaderComponent={header}
              ListFooterComponent={Footer}
            />)}
        </View>
      </>
      )
}
