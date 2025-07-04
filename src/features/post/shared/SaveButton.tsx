import { ImpactStyle } from "@capacitor/haptics";
import { IonIcon } from "@ionic/react";
import { bookmarkOutline } from "ionicons/icons";
import { MouseEvent, use } from "react";
import { PostView } from "threadiverse";

import { SharedDialogContext } from "#/features/auth/SharedDialogContext";
import { ActionButton } from "#/features/post/actions/ActionButton";
import { saveError, saveSuccess } from "#/helpers/toastMessages";
import useAppToast from "#/helpers/useAppToast";
import useHapticFeedback from "#/helpers/useHapticFeedback";
import { useAppDispatch, useAppSelector } from "#/store";

import { savePost } from "../postSlice";

import styles from "./SaveButton.module.css";

interface SaveButtonProps {
  post: PostView;
}

export function SaveButton({ post }: SaveButtonProps) {
  const presentToast = useAppToast();
  const dispatch = useAppDispatch();
  const { presentLoginIfNeeded } = use(SharedDialogContext);
  const vibrate = useHapticFeedback();

  const postSavedById = useAppSelector((state) => state.post.postSavedById);
  const mySaved = postSavedById[post.post.id];

  async function onSavePost(e: MouseEvent) {
    e.stopPropagation();

    vibrate({ style: ImpactStyle.Light });

    if (presentLoginIfNeeded()) return;

    try {
      await dispatch(savePost(post, !mySaved));

      if (!mySaved) presentToast(saveSuccess);
    } catch (error) {
      presentToast(saveError);

      throw error;
    }
  }

  return (
    <ActionButton
      className={mySaved ? styles.button : undefined}
      onClick={onSavePost}
    >
      <IonIcon icon={bookmarkOutline} />
    </ActionButton>
  );
}
