import { SettingsState } from "./settingsSlice";

export function custom(s: SettingsState): SettingsState {
  s.appearance.font.fontSizeMultiplier = 0.8;
  s.appearance.general.profileLabel = "handle";
  s.appearance.theme = "tangerine";
  s.appearance.voting.voteDisplayMode = "separate";
  s.general.comments.sort = {
    lemmyv0: "Top",
    lemmyv1: "Top",
    piefed: "Top",
  }
  s.general.enableHapticFeedback = false;
  s.general.posts.autoHideRead = true;
  s.general.posts.showHideReadButton = true;
  s.general.posts.sort = {
    lemmyv0: "TopDay",
    lemmyv1: "TopDay",
    piefed: "TopDay",
  };
  s.general.posts.upvoteOnSave = true;
  s.general.posts.markReadOnScroll = true;
  return s;
}
