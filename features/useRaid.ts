import useStorage from "./useStorage";
import { ACTION_TYPES, EActivityTypes, IState, TGang } from "lag-types";
import useUser from "./useUser";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import useGangs from "./useGangs";
import { min } from "lodash";

export default function useRaid(opponentGangId: TGang["id"] | undefined) {
  const { create: storageCreate, read: storageRead } = useStorage();
  const { currentUser } = useUser({ autoLogin: true });
  const { gangs } = useGangs({ fetch: true, gangIds: opponentGangId ? [opponentGangId] : [] });

  const opponentGang = opponentGangId && gangs?.[opponentGangId];
  const raidActivityId = currentUser && `${EActivityTypes.GANG}_${currentUser?.currentGang}`;
  const initialEnergy = raidActivityId && currentUser?.energy[raidActivityId]?.value;
  const initialScore = raidActivityId && (currentUser?.score[raidActivityId] || 0);

  const [rules, setRules] = useState<IState["rules"]["activity"][EActivityTypes.RAID]>();
  const [energy, setEnergy] = useState<number>();
  const [sessionScore, setSessionScore] = useState(0);
  const [debauncedSessionScore] = useDebounce(sessionScore, 1500);

  const energyRechargeRateIntervalRef = useRef<any>();

  const score =
    initialScore !== undefined && sessionScore !== undefined && +initialScore + sessionScore;

  const scorePerEnergyFactor = 1;
  const energyRechargeRate =
    rules && rules.maxScoreValue / (rules.maxScoreInterval / rules.maxScoreValue);

  useEffect(() => {
    storageRead(ACTION_TYPES.GET_RULES).then(
      (rules) => rules && setRules(rules.activity[EActivityTypes.RAID])
    );

    return () => clearInterval(energyRechargeRateIntervalRef.current);
  }, []);

  useEffect(() => {
    rules && energyRechargeRate && initEnergyRecovery();
  }, [energy, energyRechargeRate, rules]);

  useEffect(() => {
    currentUser &&
      raidActivityId &&
      energyRechargeRate &&
      setEnergy(
        min([
          currentUser.energy[raidActivityId] === undefined
            ? rules?.maxScoreValue
            : currentUser.energy[raidActivityId].value +
              ((Date.now() - (currentUser.energy[raidActivityId].lastTimestamp || 0)) / 1000) *
                energyRechargeRate,
          rules?.maxScoreValue,
        ])
      );
  }, [currentUser, raidActivityId, initialEnergy, initialScore, energyRechargeRate]);

  useEffect(() => {
    debauncedSessionScore &&
      opponentGangId &&
      initialScore !== undefined &&
      commitScore((initialScore || 0) + debauncedSessionScore, opponentGangId);
  }, [debauncedSessionScore, opponentGangId, initialScore]);

  const initEnergyRecovery = () =>
    !energyRechargeRateIntervalRef.current &&
    (energyRechargeRateIntervalRef.current = setInterval(
      () => setEnergy((old) => min([old! + energyRechargeRate!, rules?.maxScoreValue])),
      1000
    ));

  const spendEnergy = (energyToSpend: number) =>
    energy !== undefined &&
    energy > energyToSpend &&
    (setEnergy((old) => old! - energyToSpend),
    setSessionScore((old) => old + energyToSpend * scorePerEnergyFactor));

  const commitScore = async (score: number, opponentGang: TGang["id"]) =>
    currentUser?.currentGang &&
    storageCreate(ACTION_TYPES.COMMIT_SCORE, {
      id: currentUser.currentGang,
      score,
      opponent: opponentGang,
    });

  return {
    rules,
    opponentGang,
    energy,
    energyRechargeRate,
    maxEnergy: rules?.maxScoreValue,
    score,
    sessionScore,
    spendEnergy,
  };
}
