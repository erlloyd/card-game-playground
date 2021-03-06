import { combineReducers } from "redux";
import undoable, { excludeAction, groupByActionTypes } from "redux-undo";
import cardsData from "../features/cards-data/cards-data.slice";
import { startCardMoveWithSplitStackId } from "../features/cards/cards.actions";
import cards, { cardMove } from "../features/cards/cards.slice";
import game, {
  clearPreviewCard,
  setPreviewCardId,
} from "../features/game/game.slice";

import counters, { moveCounter } from "../features/counters/counters.slice";

const undoableState = combineReducers({
  counters,
  cards,
});

const rootReducer = combineReducers({
  game,
  cardsData,
  liveState: undoable(undoableState, {
    limit: 20,
    groupBy: groupByActionTypes([moveCounter.type]),
    filter: excludeAction([
      startCardMoveWithSplitStackId.type,
      cardMove.type,
      setPreviewCardId.type,
      clearPreviewCard.type,
    ]),
  }),
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
