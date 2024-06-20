import useStorage from "./useStorage";
import { ACTION_TYPES, IState, TGang, TLotteryTicket } from "lag-types";
import useUser, { currentUserAtom } from "./useUser";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { filter, last } from "lodash";

export default function useLottery({ gangId }: { gangId?: TGang["id"] } = {}) {
  const [currentUser] = useAtom(currentUserAtom);

  const { create: storageCreate, read: storageRead } = useStorage();
  const { loadCurrentUser } = useUser();

  const [rules, setRules] = useState<IState["rules"]["lottery"]>();
  const [isUsingTicket, setIsUsingTicket] = useState(false);
  const [isRedeemingTicket, setIsRedeemingTicket] = useState(false);
  const [freeTicketCountdown, setFreeTicketCountdown] = useState<string>();
  const [lastUsedTicketInSession, setLastUsedTicketInSession] = useState<TLotteryTicket>();

  const tickets = currentUser?.lotteryTickets;
  const unusedTickets = currentUser?.lotteryTickets.amount;
  const lastUsedTicketTimestamp = tickets?.lastUsedTimestamp[currentUser?.currentGang || ""];
  const usedTickets = tickets?.used[currentUser?.currentGang || ""];
  const lotteryResultTiers = rules && Object.keys(rules.scoreRewards);
  const redeemedTickets = usedTickets && filter(usedTickets, ({ redeemedAt }) => !!redeemedAt);
  const winningTickets =
    usedTickets &&
    lotteryResultTiers &&
    filter(usedTickets, ({ result }) => result > +lotteryResultTiers[0]);
  const loosingTickets =
    usedTickets &&
    lotteryResultTiers &&
    filter(usedTickets, ({ result }) => result < +lotteryResultTiers[0]);

  const freeTicketTimerInterval = useRef<any>();

  useEffect(() => {
    storageRead(ACTION_TYPES.GET_RULES).then((rules) => rules && setRules(rules.lottery));
  }, []);

  useEffect(() => {
    lastUsedTicketTimestamp &&
      (clearInterval(freeTicketTimerInterval.current),
        (freeTicketTimerInterval.current = setInterval(
          () => _getNextFreeTicketCountdown(lastUsedTicketTimestamp),
          1000
        )));

    return () => clearInterval(freeTicketTimerInterval.current);
  }, [lastUsedTicketTimestamp]);

  const useTicket = () => (
    setIsUsingTicket(true),
    storageCreate(ACTION_TYPES.DRAW_LOTTERY, null, { vrf: true })
      .then(() =>
        loadCurrentUser()?.then(
          (user) => user && setLastUsedTicketInSession(last(Object.values(user?.lotteryTickets?.used?.[user.currentGang!])))
        )
      )
      .finally(() => setTimeout(() => setIsUsingTicket(true), 1000))
  );

  const redeemTicket = (ticketId: number) => (
    setIsRedeemingTicket(true),
    storageCreate(ACTION_TYPES.REDEEM_LOTTERY, { ticketId })
      .then(loadCurrentUser)
      .finally(() => setTimeout(() => setIsRedeemingTicket(true), 1000))
  );

  // const _getHasUsedFreeTicket = (user: TUser, gangId: TGang["id"]) =>
  //   _getLastTicketUsed(user, gangId) &&
  //   Date.now() - _getLastTicketUsed(user, gangId) < 12 * 60 * 60 * 1000 - 1;

  const _getNextFreeTicketCountdown = (lastUsedTimestamp: number) =>
    setFreeTicketCountdown(
      lastUsedTimestamp
        ? ((date): string =>
          // @ts-ignore
          [~~(date / 60), ~~date].reduce(
            (a, b, i) =>
              // @ts-ignore
              +a ? `${a}${["h", "m", "s"][i]}` : i == 1 && !a ? `${b}s` : i == 0 ? b : a,
            ~~(date / (60 * 60 * 1000))
          ))(12 * 60 * 60 * 1000 - (+Date.now() - lastUsedTimestamp))
        : undefined
    );

  return {
    unusedTickets,
    usedTickets,
    redeemedTickets,
    winningTickets,
    loosingTickets,
    freeTicketCountdown,
    useTicket,
    isUsingTicket,
    redeemTicket,
    isRedeemingTicket,
    lastUsedTicketInSession,
    rules,
  };
}
