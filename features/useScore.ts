import useStorage from "./useStorage";
import { ACTION_TYPES, TGang } from "lag-types";
import { currentUserAtom } from "./useUser";
import { useAtom } from "jotai";

export default function useScore() {
  const [currentUser] = useAtom(currentUserAtom);
  
  const { create: storageCreate } = useStorage();

  const commitScore = async (score: number, opponentGang: TGang["id"]) =>
    currentUser &&
    storageCreate(ACTION_TYPES.COMMIT_SCORE, {
      id: currentUser.id,
      score,
      opponent: opponentGang,
    });

  return {
    commitScore,
  };
}
