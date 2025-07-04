import { MouseEvent } from "react";

import {
  couldNotFindUrl,
  resolveObject,
  unfurlRedirectServiceIfNeeded,
} from "#/features/resolve/resolveSlice";
import { isNative } from "#/helpers/device";
import { useBuildGeneralBrowseLink } from "#/helpers/routes";
import useAppNavigation from "#/helpers/useAppNavigation";
import useAppToast from "#/helpers/useAppToast";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { buildBaseClientUrl } from "#/services/client";
import { useAppDispatch, useAppSelector } from "#/store";

import useDetermineSoftware from "./useDetermineSoftware";
import { useLoadingIndicator } from "./useLoadingIndicator";
import { useOpenNativeBrowserIfPreferred } from "./useNativeBrowser";

export const POST_PATH = /^\/post\/(\d+)$/;

export const COMMENT_PATH = /^\/comment\/(\d+)$/;

export const PIEFED_COMMENT_PATH_AND_HASH = /^\/post\/(?:\d+)#comment_(\d+)$/;

/**
 * Lemmy 0.19.4 added a new url format to reference comments,
 * in addition to `COMMENT_PATH`.
 *
 * It is functionally exactly the same. IDK why
 *
 * https://github.com/LemmyNet/lemmy-ui/commit/b7fe70d8c15fe8c8482c8403744f24f63d1c505a#diff-13e07e23177266e419a34a839636bcdbd2f6997000fb8e0f3be26c78400acf77R145
 */
export const COMMENT_VIA_POST_PATH = /^\/post\/\d+\/(\d+)$/;

export const USER_PATH =
  /^\/u\/([a-zA-Z0-9._%+-]+(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?)\/?$/;
export const COMMUNITY_PATH =
  /^\/c\/([a-zA-Z0-9._%+-]+(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?)\/?$/;

const POTENTIAL_PATHS = [
  POST_PATH,
  COMMENT_PATH,
  COMMENT_VIA_POST_PATH,
  USER_PATH,
  COMMUNITY_PATH,
  PIEFED_COMMENT_PATH_AND_HASH,
] as const;

export type LemmyObjectType = "community" | "post" | "comment" | "user";

export default function useLemmyUrlHandler() {
  const determineSoftwareFromUrl = useDetermineSoftware();
  const connectedInstance = useAppSelector(
    (state) => state.auth.connectedInstance,
  );
  const connectedInstanceUrl = buildBaseClientUrl(connectedInstance);
  const objectByUrl = useAppSelector((state) => state.resolve.objectByUrl);
  const {
    navigateToComment,
    navigateToCommunity,
    navigateToPost,
    navigateToUser,
  } = useAppNavigation();
  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();
  const router = useOptimizedIonRouter();
  const dispatch = useAppDispatch();
  const presentToast = useAppToast();
  const { showLoading, hideLoading } = useLoadingIndicator();
  const openNativeBrowser = useOpenNativeBrowserIfPreferred();

  function handleCommunityClickIfNeeded(url: URL, e?: MouseEvent) {
    const matchedCommunityHandle = matchLemmyOrPiefedCommunity(url.pathname);

    if (!matchedCommunityHandle) return;
    const [communityName, domain] = matchedCommunityHandle;

    e?.preventDefault();
    e?.stopPropagation();

    if (
      (!domain && url.hostname === connectedInstance) ||
      (domain === url.hostname && domain === connectedInstance)
    ) {
      router.push(buildGeneralBrowseLink(`/c/${communityName}`));
      return true;
    }

    router.push(
      buildGeneralBrowseLink(`/c/${communityName}@${domain ?? url.hostname}`),
    );

    return true;
  }

  function handleUserClickIfNeeded(url: URL, e?: MouseEvent) {
    const matchedUserHandle = matchLemmyOrPiefedUser(url.pathname);

    if (!matchedUserHandle) return;
    const [userName, domain] = matchedUserHandle;

    e?.preventDefault();
    e?.stopPropagation();

    if (
      (!domain && url.hostname === connectedInstance) ||
      (domain === url.hostname && domain === connectedInstance)
    ) {
      navigateToUser(userName);
      return true;
    }

    navigateToUser(`${userName}@${domain ?? url.hostname}`);

    return true;
  }

  async function handleObjectIfNeeded(
    url: URL,
    e?: MouseEvent,
  ): Promise<"already-there" | "not-found" | "success" | "aborted"> {
    const cachedResolvedObject = objectByUrl[url.toString()];
    if (cachedResolvedObject === "couldnt_find_object") return "not-found";

    e?.preventDefault();
    e?.stopPropagation();

    let object = cachedResolvedObject;

    if (!object) {
      const abortCtrl = new AbortController();

      // Show loading indicator with abort callback
      showLoading(() => {
        abortCtrl.abort();
      });

      try {
        object = await dispatch(
          resolveObject(url.toString(), abortCtrl.signal),
        );
      } catch (error) {
        if (abortCtrl.signal.aborted) return "aborted";

        if (isNative()) {
          openNativeBrowser(url.toString());
        } else {
          // Force a not found state so next time
          // the link will be opened in browser
          dispatch(couldNotFindUrl(url.toString()));

          presentToast({
            message: `Could not find ${getObjectName(
              url.pathname,
            )} on your instance. Try again to open in browser.`,
            duration: 3500,
            color: "warning",
          });
        }

        throw error;
      } finally {
        hideLoading();
      }

      if (abortCtrl.signal.aborted) return "aborted";
    }

    if (object.post) {
      return navigateToPost(object.post);
    } else if (object.community) {
      return navigateToCommunity(object.community);
    } else if (object.person) {
      return navigateToUser(object.person);
    } else if (object.comment) {
      return navigateToComment(object.comment);
    }

    return "not-found";
  }

  function getUrl(link: string) {
    const unfurledLink = unfurlRedirectServiceIfNeeded(link);

    try {
      return new URL(unfurledLink, connectedInstanceUrl);
    } catch (error) {
      console.error("Error parsing url", error);
    }
  }

  function determineObjectTypeFromUrl(
    link: string,
  ): LemmyObjectType | undefined {
    const url = getUrl(link);

    if (!url) return;

    if (matchLemmyOrPiefedCommunity(url.pathname)) return "community";

    switch (determineSoftwareFromUrl(url)) {
      case "piefed":
        if (PIEFED_COMMENT_PATH_AND_HASH.test(`${url.pathname}${url.hash}`))
          return "comment";
        if (POST_PATH.test(url.pathname)) return "post";
        if (USER_PATH.test(url.pathname)) return "user";
        if (COMMENT_PATH.test(url.pathname)) return "comment";
        break;
      case "lemmy":
        if (POST_PATH.test(url.pathname)) return "post";
        if (COMMENT_PATH.test(url.pathname)) return "comment";
        if (COMMENT_VIA_POST_PATH.test(url.pathname)) return "comment";
        if (USER_PATH.test(url.pathname)) return "user";
    }
  }

  async function redirectToLemmyObjectIfNeeded(
    link: string,
    e?: MouseEvent,

    /**
     * If its a known Lemmy link, bypass checking link domain against known instances list
     * (this helps with new instances that aren't well federated yet)
     */
    forceResolveObject = false,
  ): Promise<"not-found" | "already-there" | "success" | "aborted"> {
    const url = getUrl(link);

    if (!url) return "not-found";

    const software = determineSoftwareFromUrl(url);

    if (!forceResolveObject && software === "unknown") return "not-found"; // If non-lemmy domain, return

    if (handleCommunityClickIfNeeded(url, e)) return "success";
    if (handleUserClickIfNeeded(url, e)) return "success";
    if (!isPotentialObjectPath(url.pathname)) return "not-found";

    return handleObjectIfNeeded(url, e);
  }

  return {
    determineObjectTypeFromUrl,
    redirectToLemmyObjectIfNeeded,
  };
}

export function matchLemmyOrPiefedCommunity(
  urlPathname: string,
): [string, string] | [string] | null {
  const matches = urlPathname.match(COMMUNITY_PATH);
  if (matches && matches[1]) {
    const [communityName, domain] = matches[1].split("@");
    if (!domain) return [communityName!];
    return [communityName!, domain];
  }
  return null;
}

export function matchLemmyOrPiefedUser(
  urlPathname: string,
): [string, string] | [string] | null {
  const matches = urlPathname.match(USER_PATH);
  if (matches && matches[1]) {
    const [userName, domain] = matches[1].split("@");
    if (!domain) return [userName!];
    return [userName!, domain];
  }
  return null;
}

function isPotentialObjectPath(urlPathname: string): boolean {
  for (const regex of POTENTIAL_PATHS) {
    if (regex.test(urlPathname)) return true;
  }

  return false;
}

function getObjectName(urlPathname: string): string | undefined {
  if (POST_PATH.test(urlPathname)) return "post";
  if (COMMENT_PATH.test(urlPathname)) return "comment";
  if (COMMENT_VIA_POST_PATH.test(urlPathname)) return "comment";
  if (USER_PATH.test(urlPathname)) return "user";
  if (COMMUNITY_PATH.test(urlPathname)) return "community";
}
