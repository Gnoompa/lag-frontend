import useStorage from "./useStorage";
import { ACTION_TYPES, EActivityTypes, TGang, TGangMetadata } from "lag-types";
import { filter } from "lodash";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "./useUser";
import { useDeepCompareEffectNoCheck } from "use-deep-compare-effect";
import useMedia from "./useMedia";

export default function useGangs(options?: { gangIds?: TGang["id"][]; fetch?: boolean }) {
  const currentUser = useAtomValue(currentUserAtom);
  const { create: storageCreate, read: storageRead } = useStorage();
  const { uploadMetadata } = useMedia();

  const [isCreatingGang, setIsCreatingGang] = useState(false);
  const [gangs, setGangs] = useState<Record<TGang["id"], TGang> | undefined>();
  const [gangMetadata, setGangMetadata] = useState<{
    [gangId: TGang["id"]]: TGangMetadata;
  }>();

  const currentGang = currentUser?.currentGang && gangs?.[currentUser.currentGang];
  const currentGangMetadata = currentGang && gangMetadata?.[currentGang.id];

  useDeepCompareEffectNoCheck(() => {
    options?.gangIds?.filter(Boolean).length && getGangs(options.gangIds).then(setGangs);
    options?.fetch && getGangs().then(setGangs);
  }, [options]);

  useEffect(() => {
    gangs && fetchGangsMetadata(gangs);
  }, [gangs]);

  const fetchGangsMetadata = (gangs: Record<TGang["id"], TGang>) =>
    Object.values(gangs).map(
      (gang) =>
        !gangMetadata?.[gang.id] &&
        fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${gang.metadata}`)
          .then((res) => res.json())
          .then((metadata) =>
            setGangMetadata((old) => ({
              ...old,
              [gang.id]: metadata,
            }))
          )
    );

  const createGang = (
    gangMetadata: TGangMetadata,
    gangImage: Parameters<typeof uploadMetadata>[0]
  ) =>
    validateGagnMetadata(gangMetadata) &&
    (setIsCreatingGang(true),
    uploadMetadata(gangImage, gangMetadata).then((metadataHash) =>
      storageCreate(ACTION_TYPES.CREATE_GANG, {
        gang: {
          endpointId: 1,
          metadata: metadataHash,
        },
      }).finally(() => setIsCreatingGang(false))
    ));

  const validateGagnMetadata = (gangMetadata: Partial<TGangMetadata>) =>
    gangMetadata.name && gangMetadata.ticker && gangMetadata.about;

  const getGangs = async (gangIds?: TGang["id"][]) =>
    storageRead(ACTION_TYPES.GET_GANGS).then(
      (gangs) =>
        gangs &&
        (gangIds
          ? filter(gangs, ({ id }) => gangIds.includes(id)).reduce(
              (acc, gang) => ({ ...acc, [gang.id]: gang }),
              {} as Record<TGang["id"], TGang>
            )
          : gangs)
    );

  const getScore = (gang: TGang["id"] | TGang, activity = EActivityTypes.GANG) =>
    typeof gang === "string"
      ? getGangs([gang]).then((gangs) => gangs?.[gang].score?.[`${activity}_${gang}`])
      : gang.score?.[activity] || 0;

  const getGangImageUrl = (gangMetadata: TGangMetadata) =>
    `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${gangMetadata.image}`;

  return {
    createGang,
    isCreatingGang,
    getGangs,
    getScore,
    gangs,
    currentGang,
    currentGangMetadata,
    fetchGangsMetadata,
    getGangImageUrl,
    gangMetadata,
    validateGagnMetadata,
  };
}
