import { IonButton, IonIcon } from "@ionic/react";
import { useAppDispatch } from "../../store";
import { checkmarkDone } from "ionicons/icons";
import { markAllRead } from "../../features/inbox/inboxSlice";

export default function MarkAllAsReadButton() {
  const dispatch = useAppDispatch();

  return (
    <>
      <IonButton onClick={() => dispatch(markAllRead())}>
        <IonIcon icon={checkmarkDone} />
      </IonButton>
    </>
  );
}
