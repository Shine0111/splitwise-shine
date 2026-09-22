import { createNavigationContainerRef } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  GroupList: undefined;
  GroupDetail: { groupId: string };
  AddExpense: { groupId: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let pendingGroupId: string | null = null;

export function navigateToGroup(groupId: string) {
  if (!navigationRef.isReady()) {
    pendingGroupId = groupId;
    return;
  }

  navigationRef.navigate("GroupDetail", { groupId });
}

export function handleNavigationReady() {
  if (!pendingGroupId) {
    return;
  }

  const groupId = pendingGroupId;
  pendingGroupId = null;

  navigationRef.navigate("GroupDetail", { groupId });
}
