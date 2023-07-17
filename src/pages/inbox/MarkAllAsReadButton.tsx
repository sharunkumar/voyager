import { IonActionSheet, IonButton, IonIcon } from "@ionic/react";
import { useAppDispatch } from "../../store";
import { checkmarkDone } from "ionicons/icons";
import { useState } from "react";
import { markAllRead } from "../../features/inbox/inboxSlice";

export default function MarkAllAsReadButton() {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  return (
    <>
      <IonButton onClick={() => dispatch(markAllRead())}>
        <IonIcon icon={checkmarkDone} />
      </IonButton>
    </>
  );
}
