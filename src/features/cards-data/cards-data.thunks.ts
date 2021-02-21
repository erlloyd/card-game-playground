import { Action, ThunkAction } from "@reduxjs/toolkit";
import axios, { AxiosResponse } from "axios";
import { CardPack as CardPackMarvel } from "../../external-api/marvel-card-data";
// import { CardPack as CardPackLOTR } from "../../external-api/beorn-json-data";
import { packList as marvelPackList } from "../../generated/packsList";
// import { packList as lotrPackList } from "../../generated/packsList_lotr";
import { RootState } from "../../store/rootReducer";
import { loadCardsDataForPack } from "./cards-data.slice";
import { GameType } from "../../constants/app-constants";

export const allJsonData = (): ThunkAction<
  void,
  RootState,
  unknown,
  Action<string>
> => async (dispatch) => {
  let resultsList = await Promise.all(
    marvelPackList.map((pack) => getSpecificMarvelPack(pack))
  );

  // const resultsListLOTR = await Promise.all(
  //   lotrPackList.map((pack) => getSpecificLOTRPack(pack))
  // );

  console.log(resultsList);
  resultsList.forEach((result) => {
    if (result.res.status === 200) {
      dispatch(
        loadCardsDataForPack({
          packType: GameType.MarvelChampions,
          pack: result.res.data as any,
          pack_code: result.packCode,
        })
      );
    } else {
      console.error("Failed to load some json data");
    }
  });
};

const getSpecificMarvelPack = async (
  packName: string
): Promise<{ res: AxiosResponse<CardPackMarvel>; packCode: string }> => {
  const response = await axios.get<CardPackMarvel>(
    process.env.PUBLIC_URL + "/json_data/" + packName
  );
  return {
    res: response,
    packCode: packName.split(".json")[0],
  };
};

// const getSpecificLOTRPack = async (
//   packName: string
// ): Promise<{ res: AxiosResponse<CardPackLOTR>; packCode: string }> => {
//   const response = await axios.get<CardPackLOTR>(
//     process.env.PUBLIC_URL + "/json_data/" + packName
//   );
//   return {
//     res: response,
//     packCode: packName.split(".json")[0],
//   };
// };
