import useStorage from "./useStorage";
import { ACTION_TYPES, TGang, TUser } from "lag-types";
import useUser from "./useUser";
import { useRef, useState } from "react";
import { merge } from "lodash";
import { useDeepCompareEffectNoCheck } from "use-deep-compare-effect";

export default function useCheckin({ gangIds }: { gangIds: TGang["id"][] }) {
  const { create: storageCreate } = useStorage();
  const { currentUser, loadCurrentUser, login } = useUser();

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
  }>();

  const ready = currentUser && checkins;
  const currentCheckin = currentUser && checkins?.[currentUser.id]?.[currentUser.currentGang || ""];

  const checkinTimerInterval = useRef<any>();

  useDeepCompareEffectNoCheck(() => {
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
          lastCheckin: user.checkin[gangId]?.lastTimestamp,
          checkinAmount: user.checkin[gangId]?.value,
          hasCheckedIn: _getHasCheckedIn(user, gangId),
          nextCheckinTime: _getNextCheckinTime(user, gangId),
        },
      }),
      {}
    ),
  });

  const _getHasCheckedIn = (user: TUser, gangId: TGang["id"]) =>
    user.checkin[gangId]?.lastTimestamp
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
    ready,
    checkin,
    checkins,
    currentCheckin,
  };
}
