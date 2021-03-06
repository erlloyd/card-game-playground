import { Component } from "react";
import * as React from "react";
import { ICardStack } from "./features/cards/initialState";
import { Group, Rect, Text } from "react-konva";
import { cardConstants } from "./constants/card-constants";
import { GameType } from "./constants/app-constants";
import { GamePropertiesMap } from "./constants/game-type-properties-mapping";
import cloneDeep from "lodash.clonedeep";

interface IProps {
  currentGameType: GameType;
  x: number;
  y: number;
  card: ICardStack | undefined;
  cardHeight: number | undefined;
  cardWidth: number | undefined;
  isPreview: boolean;
}

interface IState {
  imagesLoaded: {
    [K: string]: boolean;
  };
}

const desiredWidth = 36;
const desiredHeight = 36;

const textWidth = 40;

class CardModifiers extends Component<IProps, IState> {
  private imgs: { [K: string]: HTMLImageElement };
  private unmounted: boolean;

  constructor(props: IProps) {
    super(props);

    this.unmounted = true;

    this.imgs = {};

    const modifiersInfo =
      GamePropertiesMap[this.props.currentGameType].modifiers;

    const newImagesLoaded: {
      [K: string]: boolean;
    } = {};

    modifiersInfo.forEach((m) => {
      this.imgs[m.attributeId] = new Image();
      newImagesLoaded[m.attributeId] = false;
    });

    this.state = {
      imagesLoaded: newImagesLoaded,
    };

    // set up onload
    modifiersInfo.forEach((m) => {
      this.imgs[m.attributeId].onload = () => {
        if (!this.unmounted) {
          const updatedImagesLoaded = cloneDeep(this.state.imagesLoaded);
          updatedImagesLoaded[m.attributeId] = true;
          this.setState({
            imagesLoaded: updatedImagesLoaded,
          });
        }
      };
    });

    // set up the img src values
    modifiersInfo.forEach((m) => {
      if (!!this.props.card?.modifiers[m.attributeId]) {
        this.imgs[m.attributeId].src = m.icon;
      }
    });
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    const modifiersInfo =
      GamePropertiesMap[this.props.currentGameType].modifiers;

    // handle change
    modifiersInfo.forEach((m) => {
      if (
        !this.state.imagesLoaded[m.attributeId] &&
        !prevProps.card?.modifiers[m.attributeId] &&
        !!this.props.card?.modifiers[m.attributeId]
      ) {
        this.imgs[m.attributeId].src = m.icon;
      }
    });
  }

  public componentDidMount() {
    this.unmounted = false;
  }

  public componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    if (!this.props.card) return null;
    if (!this.props.card?.modifiers) return null;

    const modifiersInfo =
      GamePropertiesMap[this.props.currentGameType].modifiers;

    const nodesToRender: JSX.Element[] = [];

    modifiersInfo.forEach((m) => {
      const modifierX = this.props.isPreview
        ? this.props.x +
          (this.props.cardWidth || 0) / 2 -
          desiredWidth -
          textWidth
        : this.props.x + cardConstants.CARD_WIDTH / 2 - desiredWidth / 2;
      const modifierTextX = modifierX + desiredWidth - 2;
      const modifierY =
        this.props.y -
        cardConstants.CARD_HEIGHT / 2 +
        10 * (m.slot - 1) +
        desiredHeight * (m.slot - 1);
      const showModifier =
        this.state.imagesLoaded[m.attributeId] &&
        !!this.props.card?.modifiers[m.attributeId];

      const img = this.imgs[m.attributeId];

      const modifierValue = this.props.card?.modifiers[m.attributeId];

      const modifierToken = showModifier ? (
        <Rect
          key={`${this.props.card?.id}-${m.attributeId}-modifier-token`}
          x={modifierX}
          y={modifierY}
          scale={{
            x: desiredWidth / img.naturalWidth,
            y: desiredHeight / img.naturalHeight,
          }}
          width={img.naturalWidth}
          height={img.naturalHeight}
          fillPatternImage={img}
        ></Rect>
      ) : null;

      const modifierText = showModifier ? (
        <Group
          key={`${this.props.card?.id}-${m.attributeId}-modifier-text`}
          x={modifierTextX}
          y={modifierY}
          width={textWidth}
          height={desiredHeight}
        >
          <Rect width={textWidth} height={desiredHeight} fill="white"></Rect>
          <Text
            width={textWidth}
            height={desiredHeight}
            text={`${modifierValue && modifierValue > 0 ? "+" : ""}${
              modifierValue ?? "?"
            }`}
            fill="black"
            background="white"
            align="center"
            verticalAlign="middle"
            fontSize={24}
          ></Text>
        </Group>
      ) : null;

      if (!!modifierToken) {
        nodesToRender.push(modifierToken);
      }
      if (!!modifierText) {
        nodesToRender.push(modifierText);
      }
    });

    return nodesToRender;
  }
}

export default CardModifiers;
