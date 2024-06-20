import { useRouter as useNextRouter } from "next/router";

export enum ERouterPaths {
  GANG = "gang",
  GANGS = "gangs",
  CREATE_GANG = "launch",
  RAID = "raid",
  RAID_OPPONENT_SELECTION = "raids",
  LOTTERY = "gl",
}

export default function useRouter() {
  const router = useNextRouter();

  const push = (path: ERouterPaths, options = "") => {
    router.push(`/${router.query.vendor || "lag"}/${path}/${options}`);
  };

  return {
    router,
    push,
  };
}
