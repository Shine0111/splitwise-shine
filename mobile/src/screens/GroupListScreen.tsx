import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { createGroupRequest, getMyGroupsRequest, Group } from "../api/groups";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing } from "../utils/theme";

export default function GroupListScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchGroups = async () => {
    try {
      const data = await getMyGroupsRequest();
      setGroups(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, []),
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("Missing name", "Please enter a group name");
      return;
    }

    setCreating(true);
    try {
      await createGroupRequest(newGroupName.trim());
      setNewGroupName("");
      setModalVisible(true);
      fetchGroups();
    } catch (error) {
      Alert.alert("Error", "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Groups</Text>
          <Text style={styles.subtitle}>
            Keep shared expenses organized in one place.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        contentContainerStyle={groups.length === 0 && styles.centered}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyText}>
              Create a group to start splitting expenses with friends.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupCard}
            onPress={() =>
              navigation.navigate("GroupDetail", {
                groupId: item._id,
                groupName: item.name,
              })
            }
          >
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMembers}>
              {item.members.length} member{item.members.length !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Group</Text>
            <TextInput
              style={styles.input}
              placeholder="Group name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewGroupName("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateGroup}
                disabled={creating}
              >
                <Text style={styles.createText}>
                  {creating ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    maxWidth: 240,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  groupName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  groupMembers: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: "#666", fontSize: 15 },
  createButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createText: { color: "#fff", fontWeight: "600" },
});
