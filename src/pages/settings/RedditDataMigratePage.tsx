import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import AppContent from "../../features/shared/AppContent";
import { useCallback, useEffect, useState } from "react";
import { InsetIonItem } from "../profile/ProfileFeedItemsPage";
import { isValidUrl } from "../../helpers/url";
import useClient from "../../helpers/useClient";
import { CommunityView, SortType } from "lemmy-js-client";
import { LIMIT } from "../../services/lemmy";
import { useAppSelector } from "../../store";
import { jwtSelector } from "../../features/auth/authSlice";
import { FetchFn } from "../../features/feed/Feed";
import CommunityFeed from "../../features/feed/CommunityFeed";
import CommunitySummary from "../../features/community/CommunitySummary";
import styled from "@emotion/styled";

const Result = styled.div`
  display: flex;
  flex-direction: column;
`;

export default function RedditMigratePage() {
  const [present] = useIonToast();
  const [subs, setSubs] = useState<string[] | undefined>();
  const [link, setLink] = useState("");

  useEffect(() => {
    if (!isValidUrl(link)) return;

    const subs = parseSubsFromLink(link);

    if (!subs.length) {
      present({
        message:
          "Problem parsing link. Please make sure the link you entered is correct.",
        duration: 3500,
        position: "bottom",
        color: "danger",
      });
      setLink("");
      return;
    }

    setSubs(subs);
  }, [link, present]);

  function renderUpload() {
    return (
      <>
        <div className="ion-padding">
          <p>
            This tool is designed for Reddit users migrating to Lemmy to easily
            search for communities similar to subscribed subreddits.
          </p>
          <ul>
            <li>
              Visit{" "}
              <a
                href="https://www.reddit.com/subreddits/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://www.reddit.com/subreddits
              </a>
            </li>
            <li>If iOS, open in Safari so you can copy links to clipboard</li>
            <li>Login</li>
            <li>
              Copy the link for &quot;multireddit of your subscriptions&quot; in
              the sidebar
            </li>
            <li>Paste below</li>
          </ul>
        </div>
        <IonList inset>
          <label htmlFor="upload-csv">
            <InsetIonItem>
              <IonLabel>Paste multireddit link</IonLabel>

              <IonInput
                label="Multireddit link"
                type="text"
                value={link}
                onIonInput={(e) => setLink(e.target.value as string)}
              />
            </InsetIonItem>
          </label>
        </IonList>
      </>
    );
  }

  function renderSubs() {
    return (
      <IonList>
        {subs?.map((sub) => (
          // <IonItem key={sub} routerLink={`/settings/reddit-migrate/${sub}`}>
          //   r/{sub}
          // </IonItem>
          <SubContainer sub={sub} key={sub} />
        ))}
      </IonList>
    );
  }

  return (
    <IonPage className="grey-bg">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" text="Settings" />
          </IonButtons>

          <IonTitle>Migrate</IonTitle>
        </IonToolbar>
      </IonHeader>
      <AppContent scrollY>{!subs ? renderUpload() : renderSubs()}</AppContent>
    </IonPage>
  );
}

function parseSubsFromLink(multiredditUrl: string) {
  const { pathname } = new URL(multiredditUrl);

  if (!pathname.startsWith("/r/")) return [];

  return pathname.slice(3).split("+");
}

function SubContainer({ sub }: { sub: string }) {
  const client = useClient();
  const sort: SortType = "TopAll";
  const jwt = useAppSelector(jwtSelector);

  const [communities, setCommunities] = useState([] as CommunityView[]);

  const fetchFn: FetchFn<CommunityView> = useCallback(
    async (page) => {
      const response = await client.search({
        limit: LIMIT,
        q: sub,
        type_: "Communities",
        listing_type: "All",
        page,
        sort,
        auth: jwt,
      });

      return response.communities;
    },
    [client, sub, sort, jwt]
  );

  fetchFn(1).then(setCommunities).catch(console.error);

  return (
    <IonItemGroup key={sub}>
      <IonItemDivider sticky>
        <IonLabel>r/{sub}</IonLabel>
      </IonItemDivider>
      {communities.map((c, idx) => {
        return <CommunitySummary community={c} key={idx} />;
      })}
    </IonItemGroup>
  );
}
