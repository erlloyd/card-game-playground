import { Vector2d } from "konva/types/types";
import { loadState } from "../../store/localStorage";

export interface IGameState {
  stageZoom: Vector2d;
  stagePosition: Vector2d;
}

const localStorageState: IGameState = loadState("game");
const defaultState: IGameState = {
  stageZoom: { x: 1, y: 1 },
  stagePosition: { x: 0, y: 0 },
};
export const initialState: IGameState = {
  ...defaultState,
  ...localStorageState,
};