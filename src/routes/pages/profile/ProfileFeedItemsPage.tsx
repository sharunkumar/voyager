import {
  IonBackButton,
  IonButtons,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { GetComments, GetPosts } from "lemmy-js-client";
import { useParams } from "react-router";

import { FetchFn } from "#/features/feed/Feed";
import PostCommentFeed, {
  PostCommentItem,
} from "#/features/feed/PostCommentFeed";
import AppHeader from "#/features/shared/AppHeader";
import { sortPostCommentByPublished } from "#/helpers/lemmy";
import { useBuildGeneralBrowseLink } from "#/helpers/routes";
import useClient from "#/helpers/useClient";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { LIMIT } from "#/services/lemmy";

interface ProfileFeedItemsPageProps {
  type: "Comments" | "Posts" | "Saved" | "Upvoted" | "Downvoted";
}
export default function ProfileFeedItemsPage({
  type,
}: ProfileFeedItemsPageProps) {
  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();
  const { handle } = useParams<{ handle: string }>();
  const client = useClient();

  const fetchFn: FetchFn<PostCommentItem> = async (pageData, ...rest) => {
    if (type === "Upvoted" || type === "Downvoted") {
      const requestPayload: GetPosts & GetComments = {
        ...pageData,
        limit: Math.floor(LIMIT / 2),
        sort: "New",
        liked_only: type === "Upvoted",
        disliked_only: type === "Downvoted",
        show_read: true,
      };

      const [{ posts }, { comments }] = await Promise.all([
        client.getPosts(requestPayload, ...rest),
        client.getComments(requestPayload, ...rest),
      ]);

      return [...comments, ...posts].sort(sortPostCommentByPublished);
    }
    const { comments, posts } = await client.getPersonDetails(
      {
        ...pageData,
        limit: LIMIT,
        username: handle,
        sort: "New",
        saved_only: type === "Saved",
      },
      ...rest,
    );

    if (type === "Saved") {
      return [...comments, ...posts].sort(sortPostCommentByPublished);
    }

    return type === "Comments" ? comments : posts;
  };

  return (
    <IonPage>
      <AppHeader>
        <IonToolbar>
          <IonTitle>{type}</IonTitle>
          <IonButtons slot="start">
            <IonBackButton
              text={handle}
              defaultHref={buildGeneralBrowseLink(`/u/${handle}`)}
            />
          </IonButtons>
        </IonToolbar>
      </AppHeader>
      <FeedContent>
        <PostCommentFeed
          fetchFn={fetchFn}
          filterHiddenPosts={false}
          filterKeywordsAndWebsites={false}
        />
      </FeedContent>
    </IonPage>
  );
}
