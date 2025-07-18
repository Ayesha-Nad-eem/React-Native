import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

export default function feedbackForm() {
    const [firstName, onChangeFirstName] = useState('');
    const [lastName, onChangeLastName] = useState('');
    const [message, onChangeMessage] = useState('');
    const [phoneNumber, onChangePhoneNumber] = useState('');

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                className='container'
                keyboardDismissMode="on-drag">
                <View>
                    <Text className="welcome">
                        How was your experience with Little Lemon?
                    </Text>
                    <Text className="welcome-para">
                        Little Lemon is a charming neighborhood bistro that serves simple food and classic cocktails in a lively but casual environment. We would love to hear your experience with us!
                    </Text>
                    <TextInput
                        placeholder='First Name'
                        className="input-field"
                        value={firstName}
                        onChangeText={onChangeFirstName}
                    />
                    <TextInput
                        placeholder='Last Name'
                        className="input-field"

                        value={lastName}
                        onChangeText={onChangeLastName}
                    />
                    <TextInput
                        placeholder='Phone Number'
                        className="input-field"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={onChangePhoneNumber}
                    />
                    <TextInput
                        placeholder='Please share your feedback'
                        className="input-field h-32"
                        multiline={true}
                        maxLength={500}
                        numberOfLines={4}
                        value={message}
                        onChangeText={onChangeMessage}
                        textAlignVertical="top"
                    />
                    
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

