import { COLORS } from "@/constants/Theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
    View,
    Text,
    Modal,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    FlatList,
    TextInput,
    SafeAreaView,
} from "react-native";
import { Loader } from "./loader";
import Comment from "./comment";


type CommentsMoodelProps = {
    postId: Id<"posts">;
    visible: boolean;
    onClose: () => void;
}

export default function CommentsMoodel({ onClose, postId, visible }: CommentsMoodelProps) {
    const [newComment, setNewComment] = useState("");
    const comments = useQuery(api.comments.getComments, { postId });
    const addComment = useMutation(api.comments.addComment);
    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            await addComment({
                content: newComment,
                postId,
            });

            setNewComment("");
        } catch (error) {
            console.log("Error adding comment:", error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide"
            transparent={false}
            onRequestClose={onClose}
            statusBarTranslucent={true}>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Comments</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {comments === undefined ? (
                        <Loader />
                    ) : (
                        <FlatList
                            data={comments}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => <Comment comment={item} />}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            style={{ flex: 1 }}
                        />
                    )}

                    {Platform.OS === "ios" ? (
                        <KeyboardAvoidingView
                            behavior="padding"
                            keyboardVerticalOffset={0}
                        >
                            <View style={styles.commentInput}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Add a comment..."
                                    placeholderTextColor={COLORS.grey}
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    multiline
                                />

                                <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()}>
                                    <Text style={[styles.postButton, !newComment.trim() && styles.postButtonDisabled]}>
                                        Post
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    ) : (
                        <View style={styles.commentInput}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add a comment..."
                                placeholderTextColor={COLORS.grey}
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                            />

                            <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()}>
                                <Text style={[styles.postButton, !newComment.trim() && styles.postButtonDisabled]}>
                                    Post
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </SafeAreaView>
            </View>

        </Modal>
    )
}