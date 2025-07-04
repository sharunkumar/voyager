import { IonButton, IonIcon } from "@ionic/react";
import { ellipsisHorizontal } from "ionicons/icons";
import { use } from "react";
import { PostView } from "threadiverse";

import { InFeedContext } from "#/features/feed/Feed";
import { ActionButton } from "#/features/post/actions/ActionButton";
import HeaderEllipsisIcon from "#/features/shared/HeaderEllipsisIcon";

import usePostActions from "./usePostActions";

interface MoreActionsProps {
  post: PostView;
  className?: string;
}

export default function MoreActions({ post, className }: MoreActionsProps) {
  const inFeed = use(InFeedContext);
  const Button = inFeed ? ActionButton : IonButton;
  const openPostActions = usePostActions(post);

  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          openPostActions();
        }}
        className={className}
      >
        {inFeed ? (
          <IonIcon icon={ellipsisHorizontal} />
        ) : (
          <HeaderEllipsisIcon slot="icon-only" />
        )}
      </Button>
    </>
  );
}
