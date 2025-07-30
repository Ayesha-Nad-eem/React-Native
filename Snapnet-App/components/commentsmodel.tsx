import { View, Text } from 'react-native'
import React from 'react'
import { Id } from '@/convex/_generated/dataModel'

type CommentsMoodelProps = {
    postId: Id<"posts">;
    visible: boolean;
    onClose: () => void;
    onCommentAdded: () => void;
}

export default function CommentsMoodel() {
    return (
        <View>
            <Text>CommentsMoodel</Text>
        </View>
    )
}