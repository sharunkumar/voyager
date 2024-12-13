import { useMemo } from "react";

import { calculateIsCakeDay, calculateNewAccount } from "#/helpers/date";
import { useAppSelector } from "#/store";

import Ago from "../Ago";

import styles from "./AppBadge.module.css";

interface AgeBadgeProps {
  published: string;
}

export default function AgeBadge({ published }: AgeBadgeProps) {
  const highlightNewAccount = useAppSelector(
    (state) => state.settings.general.comments.highlightNewAccount,
  );

  const ageBadgeData = useMemo(() => {
    const publishedDate = new Date(published);

    if (calculateIsCakeDay(publishedDate)) return { type: "cake" } as const;

    const days = calculateNewAccount(publishedDate);

    if (days !== undefined) {
      if (days >= 0) return { type: "new", days } as const;
      else return { type: "alien", days } as const;
    }
  }, [published]);

  if (!ageBadgeData) return;

  switch (ageBadgeData.type) {
    case "cake":
      return " 🍰";
    case "new": {
      if (!highlightNewAccount) return;

      return (
        <span className={styles.newAccountBadge}>
          {" "}
          👶 {formatDaysOld(ageBadgeData.days)}
        </span>
      );
    }
    case "alien": {
      return (
        <span className={styles.alienBadge}>
          {" "}
          👽 <Ago date={published} />
        </span>
      );
    }
  }
}

function formatDaysOld(days: number): string {
  switch (days) {
    case 0:
      return "<1d";
    default:
      return `${days}d`;
  }
}
