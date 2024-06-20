import useStorage from "./useStorage";
import { ACTION_TYPES, TGang, TUser } from "lag-types";
import useUser, { currentUserAtom } from "./useUser";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { merge } from "lodash";

export default function useCheckin({ gangIds }: { gangIds: TGang["id"][] }) {
  const [currentUser] = useAtom(currentUserAtom);

  const { create: storageCreate } = useStorage();
  const { loadCurrentUser } = useUser();

  const [checkins, setCheckins] = useState<{
    [userId: TUser["id"]]: {
      [gangId: TGang["id"]]: {
        isCheckingIn?: boolean;
        lastCheckin: number;
        checkinAmount: number;
        hasCheckedIn: boolean;
        nextCheckinTime: string | undefined;
      };
    };
  }>({});

  const currentCheckin =
    currentUser && checkins[currentUser.id]?.[currentUser.currentGang || ""]

  const checkinTimerInterval = useRef<any>();

  useEffect(() => {
    currentUser?.currentGang &&
      gangIds?.length &&
      (clearInterval(checkinTimerInterval.current),
        (checkinTimerInterval.current = setInterval(
          () => setCheckins(getCheckins(currentUser, gangIds)),
          1000
        )));

    return () => clearInterval(checkinTimerInterval.current);
  }, [currentUser, gangIds]);

  const checkin = () =>
    currentUser?.currentGang &&
    (_updateCheckin(currentUser, currentUser.currentGang, { isCheckingIn: true }),
      storageCreate(ACTION_TYPES.CHECKIN, null)
        .then(loadCurrentUser)
        .finally(
          (
            (user: TUser) => () =>
              user.currentGang && _updateCheckin(user, user.currentGang, { isCheckingIn: false })
          )(currentUser)
        ));

  const getCheckins = (user: TUser, gangIds: TGang["id"][]) => ({
    [user.id]: gangIds.reduce(
      (acc, gangId) => ({
        ...acc,
        [gangId]: {
          lastCheckin: user.checkin[gangId].lastTimestamp,
          checkinAmount: user.checkin[gangId].value,
          hasCheckedIn: _getHasCheckedIn(user, gangId),
          nextCheckinTime: _getNextCheckinTime(user, gangId),
        },
      }),
      {} as (typeof checkins)[""]
    ),
  });

  const _getHasCheckedIn = (user: TUser, gangId: TGang["id"]) =>
    user.checkin[gangId].lastTimestamp
      ? Date.now() - user.checkin[gangId].lastTimestamp < 12 * 60 * 60 * 1000 - 1
      : false;

  const _getNextCheckinTime = (user: TUser, gangId: TGang["id"]) =>
    _getLastCheckin(user, gangId)
      ? ((date): string =>
        // @ts-ignore
        [~~(date / 60), ~~date].reduce(
          (a, b, i) =>
            // @ts-ignore
            +a ? `${a}${["h", "m", "s"][i]}` : i == 1 && !a ? `${b}s` : i == 0 ? b : a,
          ~~(date / (60 * 60 * 1000))
        ))(12 * 60 * 60 * 1000 - (+Date.now() - _getLastCheckin(user, gangId)))
      : undefined;

  const _getLastCheckin = (user: TUser, gangId: TGang["id"]) =>
    user?.checkin[gangId]?.lastTimestamp;

  const _updateCheckin = (user: TUser, gangId: TGang["id"], updates: {}) =>
    setCheckins((old) => merge(old, { [user.id]: { [gangId!]: updates } }));

  return {
    checkin,
    checkins,
    currentCheckin,
  };
}
