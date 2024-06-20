import { TGang } from "lag-types";
import { currentUserAtom } from "./useUser";
import { useAtom } from "jotai";
import { useState } from "react";

export default function useInvite() {
  const [currentUser] = useAtom(currentUserAtom);

  const [hasCopiedInviteLink, setHasCopiedInviteLink] = useState(false);

  const copyInviteLink = (gangId: TGang["id"]) => {
    currentUser &&
      (navigator.clipboard.writeText(`${location.origin}/?u=${currentUser?.id}&g=${gangId}`),
      setHasCopiedInviteLink(true),
      setTimeout(() => setHasCopiedInviteLink(false), 1500));
  };

  return {
    hasCopiedInviteLink,
    copyInviteLink,
  };
}
