import { useAppDispatch, useAppSelector } from "../../store";
import { IonIcon, useIonToast } from "@ionic/react";
import { arrowDownSharp, arrowUpSharp } from "ionicons/icons";
import styled from "@emotion/styled";
import { voteOnPost } from "../post/postSlice";
import { useContext } from "react";
import { voteOnComment } from "../comment/commentSlice";
import { voteError } from "../../helpers/toastMessages";
import { PageContext } from "../auth/PageContext";
import { CommentView, PostView } from "lemmy-js-client";

const UpvoteContainer = styled.div<{ vote: 1 | -1 | 0 | undefined }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  && {
    color: ${({ vote }) => {
      switch (vote) {
        case 1:
          return "var(--ion-color-primary)";
      }
    }};
  }
`;

const DownvoteContainer = styled.div<{ vote: 1 | -1 | 0 | undefined }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  && {
    color: ${({ vote }) => {
      switch (vote) {
        case -1:
          return "var(--ion-color-danger)";
      }
    }};
  }
`;

interface VoteProps {
  item: PostView | CommentView;
  className?: string;
}

export default function Vote({ item, className }: VoteProps) {
  const [present] = useIonToast();
  const dispatch = useAppDispatch();
  const votesById = useAppSelector((state) =>
    "comment" in item
      ? state.comment.commentVotesById
      : state.post.postVotesById
  );
  const id = "comment" in item ? item.comment.id : item.post.id;

  const myVote = votesById[id] ?? item.my_vote;

  const { presentLoginIfNeeded } = useContext(PageContext);

  const upvotes = item.counts.upvotes + (myVote == 1 ? 1 : 0);
  const downvotes = item.counts.downvotes + (myVote == -1 ? 1 : 0);

  const upvotesDisplay = upvotes == 0 ? "" : upvotes;
  const downvotesDisplay = downvotes == 0 ? "" : downvotes;

  return (
    <>
      <UpvoteContainer
        className={className}
        vote={myVote as 1 | 0 | -1}
        onClick={async (e) => {
          e.stopPropagation();
          e.preventDefault();

          if (presentLoginIfNeeded()) return;

          let dispatcherFn;
          if ("comment" in item) {
            dispatcherFn = voteOnComment;
          } else {
            dispatcherFn = voteOnPost;
          }

          try {
            await dispatch(dispatcherFn(id, myVote == 1 ? 0 : 1));
          } catch (error) {
            present(voteError);

            throw error;
          }
        }}
      >
        <IonIcon icon={arrowUpSharp} /> {upvotesDisplay}
      </UpvoteContainer>

      <DownvoteContainer
        className={className}
        vote={myVote as 1 | 0 | -1}
        onClick={async (e) => {
          e.stopPropagation();
          e.preventDefault();

          if (presentLoginIfNeeded()) return;

          let dispatcherFn;
          if ("comment" in item) {
            dispatcherFn = voteOnComment;
          } else {
            dispatcherFn = voteOnPost;
          }

          try {
            await dispatch(dispatcherFn(id, myVote == -1 ? 0 : -1));
          } catch (error) {
            present(voteError);

            throw error;
          }
        }}
      >
        <IonIcon icon={arrowDownSharp} /> {downvotesDisplay}
      </DownvoteContainer>
    </>
  );
}
