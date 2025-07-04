import {
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonLoading,
  useIonModal,
} from "@ionic/react";
import { useState } from "react";
import { Instance } from "threadiverse";

import { blockInstance } from "#/features/auth/siteSlice";
import { ListHeader } from "#/features/settings/shared/formatting";
import { RemoveItemButton } from "#/features/shared/ListEditor";
import InstanceSelectorModal from "#/features/shared/selectorModals/InstanceSelectorModal";
import { useAppDispatch, useAppSelector } from "#/store";

export default function BlockedInstances() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const [presentInstanceSelectorModal, onDismiss] = useIonModal(
    InstanceSelectorModal,
    {
      onDismiss: (instance?: Instance) => {
        if (instance) {
          dispatch(blockInstance(true, instance.id));
        }

        onDismiss(instance);
      },
    },
  );

  const instances = useAppSelector(
    (state) => state.site.response?.my_user?.instance_blocks,
  );

  const sortedInstances = instances
    ?.slice()
    .sort((a, b) => a.domain.localeCompare(b.domain));

  async function remove(instanceBlock: Instance) {
    setLoading(true);

    try {
      await dispatch(blockInstance(false, instanceBlock.id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ListHeader>
        <IonLabel>Blocked Instances</IonLabel>
      </ListHeader>

      <IonList inset>
        {sortedInstances?.map((instanceBlock) => (
          <IonItemSliding key={instanceBlock.id}>
            <IonItemOptions side="end" onIonSwipe={() => remove(instanceBlock)}>
              <IonItemOption
                color="danger"
                expandable
                onClick={() => remove(instanceBlock)}
              >
                Unblock
              </IonItemOption>
            </IonItemOptions>
            <IonItem>
              <IonLabel>{instanceBlock.domain}</IonLabel>
              <RemoveItemButton />
            </IonItem>
          </IonItemSliding>
        ))}

        <IonItemSliding>
          <IonItem
            onClick={() =>
              presentInstanceSelectorModal({
                cssClass: "small",
              })
            }
          >
            <IonLabel color="primary">Add Instance</IonLabel>
          </IonItem>
        </IonItemSliding>
      </IonList>

      <IonLoading isOpen={loading} />
    </>
  );
}
