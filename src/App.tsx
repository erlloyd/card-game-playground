import * as Intersects from "intersects";
import { Component } from "react";
import * as React from "react";
import { Layer, Rect, Stage } from "react-konva";
import Konva from "konva";
import { cardConstants } from "./constants/card-constants";
import "./App.scss";
import Card from "./Card";
import { ICardStack, ICardsState } from "./features/cards/initialState";
import { Vector2d } from "konva/types/types";
import { getDistance } from "./utilities/geo";
import { ICardData } from "./features/cards-data/initialState";
import { KonvaEventObject } from "konva/types/Node";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";
import TopLayer from "./TopLayer";
import DeckLoader from "./DeckLoader";
import { IGameState } from "./features/game/initialState";

const SCALE_BY = 1.02;

interface IProps {
  cards: ICardsState;
  cardsData: ICardData;
  gameState: IGameState;
  showPreview: boolean;
  panMode: boolean;
  cardMove: (info: { id: string; dx: number; dy: number }) => void;
  endCardMove: (id: string) => void;
  exhaustCard: (id: string) => void;
  selectCard: (id: string) => void;
  unselectCard: (id: string) => void;
  toggleSelectCard: (id: string) => void;
  startCardMove: (payload: { id: string; splitTopCard: boolean }) => void;
  unselectAllCards: () => void;
  selectMultipleCards: (cards: { ids: string[] }) => void;
  hoverCard: (id: string) => void;
  hoverLeaveCard: (id: string) => void;
  togglePanMode: () => void;
  flipCards: () => void;
  loadCardsData: () => void;
  shuffleStack: (id: string) => void;
  fetchDecklistById: (payload: {
    decklistId: number;
    position: Vector2d;
  }) => void;
  updateZoom: (zoom: Vector2d) => void;
  updatePosition: (pos: Vector2d) => void;
  resetCards: () => void;
}

interface IState {
  drewASelectionRect: boolean;
  selectRect: {
    height: number;
    width: number;
  };
  selectStartPos: {
    x: number;
    y: number;
  };
  selecting: boolean;
  showContextMenu: boolean;
  contextMenuPosition: Vector2d | null;
  contextMenuItems: ContextMenuItem[];
  showDeckImporter: boolean;
  deckImporterPosition: Vector2d | null;
}
class App extends Component<IProps, IState> {
  public stage: Konva.Stage | null = null;

  constructor(props: IProps) {
    super(props);

    this.state = {
      drewASelectionRect: false,
      selectRect: {
        height: 0,
        width: 0,
      },
      selectStartPos: {
        x: 0,
        y: 0,
      },
      selecting: false,
      showContextMenu: false,
      contextMenuPosition: null,
      contextMenuItems: [],
      showDeckImporter: false,
      deckImporterPosition: null,
    };
  }

  public componentDidMount() {
    this.props.loadCardsData();
  }

  public render() {
    const staticCards = this.props.cards.cards
      .filter((card) => !card.dragging)
      .map((card) => {
        return (
          <Card
            key={card.id}
            id={card.id}
            x={card.x}
            y={card.y}
            exhausted={card.exhausted}
            fill={card.fill}
            selected={card.selected}
            dropTarget={card.id === this.props.cards.dropTargetCard?.id}
            dragging={card.dragging}
            handleDragStart={this.handleCardDragStart}
            handleDragMove={this.props.cardMove}
            handleDragEnd={this.props.endCardMove}
            handleDoubleClick={this.handleSelectAndExhaust}
            handleClick={this.props.toggleSelectCard}
            handleHover={this.props.hoverCard}
            handleHoverLeave={this.props.hoverLeaveCard}
            handleContextMenu={this.handleCardContextMenu}
            imgUrl={this.getImgUrl(card)}
            numCardsInStack={card.cardStack.length}
          />
        );
      });

    const ghostCards = this.props.cards.ghostCards.map((card) => {
      return (
        <Card
          key={`ghost${card.id}`}
          id={card.id}
          x={card.x}
          y={card.y}
          exhausted={card.exhausted}
          fill={card.fill}
          selected={false}
          dragging={false}
          imgUrl={this.getImgUrl(card)}
          isGhost={true}
        />
      );
    });

    const movingCards = this.props.cards.cards
      .filter((card) => card.dragging)
      .map((card) => {
        return (
          <Card
            key={card.id}
            id={card.id}
            x={card.x}
            y={card.y}
            exhausted={card.exhausted}
            fill={card.fill}
            selected={card.selected}
            dragging={card.dragging}
            handleDragStart={this.handleCardDragStart}
            handleDragMove={this.props.cardMove}
            handleDragEnd={this.props.endCardMove}
            handleDoubleClick={this.handleSelectAndExhaust}
            handleClick={this.props.toggleSelectCard}
            imgUrl={this.getImgUrl(card)}
          />
        );
      });

    const previewCards = this.props.cards.cards
      .filter(
        (card) =>
          !this.state.selecting &&
          this.props.showPreview &&
          !!this.props.cards.previewCard &&
          card.id === this.props.cards.previewCard.id
      )
      .map((card) => {
        const rawPos = this.getRawPreviewCardPosition();
        const previewPos = this.getRelativePositionFromTarget(
          this.stage,
          rawPos
        );
        return (
          <Card
            key={`preview${card.id}`}
            id={card.id}
            x={previewPos.x}
            y={previewPos.y}
            exhausted={false}
            fill={card.fill}
            selected={false}
            dragging={false}
            imgUrl={this.getImgUrl(card)}
            height={cardConstants.CARD_PREVIEW_HEIGHT}
            width={cardConstants.CARD_PREVIEW_WIDTH}
          />
        );
      });

    return (
      <div tabIndex={1} onKeyPress={this.handleKeyPress}>
        {this.renderEmptyMessage()}
        {this.renderContextMenu()}
        {this.renderDeckImporter()}
        <Stage
          ref={(ref) => {
            if (!ref) return;

            this.stage = ref;
          }}
          x={this.props.gameState.stagePosition.x}
          y={this.props.gameState.stagePosition.y}
          width={window.innerWidth}
          height={window.innerHeight}
          onClick={() => this.props.unselectAllCards()}
          onTap={() => this.props.unselectAllCards()}
          onMouseDown={this.props.panMode ? () => {} : this.handleMouseDown}
          onMouseUp={this.props.panMode ? () => {} : this.handleMouseUp}
          onMouseMove={this.props.panMode ? () => {} : this.handleMouseMove}
          onTouchMove={this.props.panMode ? () => {} : this.handleMouseMove}
          onContextMenu={this.handleContextMenu}
          scale={this.props.gameState.stageZoom}
          onWheel={this.handleWheel}
          draggable={this.props.panMode}
          preventDefault={true}
        >
          <Layer preventDefault={true}>
            {staticCards
              .concat(ghostCards)
              .concat(movingCards)
              .concat(previewCards)}
          </Layer>
          <Layer>
            <Rect
              x={this.state.selectStartPos.x}
              y={this.state.selectStartPos.y}
              width={this.state.selectRect.width}
              height={this.state.selectRect.height}
              stroke="black"
            />
          </Layer>
        </Stage>
      </div>
    );
  }

  private renderEmptyMessage = () => {
    if (this.props.cards.cards.length > 0) return null;

    return (
      <div>
        Right click and select 'Load Deck ID' to load a deck from marvelcdb.com
      </div>
    );
  };

  private renderContextMenu = () => {
    if (!this.state.showContextMenu) return null;

    const containerRect = this.stage?.container().getBoundingClientRect();
    const pointerPosition = this.state.contextMenuPosition;
    if (!containerRect || !pointerPosition) {
      throw new Error("Problem computing context menu position");
    }

    return (
      <ContextMenu
        position={{
          x: containerRect.left + pointerPosition.x,
          y: containerRect.top + pointerPosition.y,
        }}
        items={this.state.contextMenuItems}
        hideContextMenu={() => this.clearContextMenu()}
      ></ContextMenu>
    );
  };

  private renderDeckImporter = () => {
    if (!this.state.showDeckImporter) return null;

    const containerRect = this.stage?.container().getBoundingClientRect();
    const pointerPosition = this.state.deckImporterPosition;
    if (!containerRect || !pointerPosition) {
      throw new Error("Problem computing deck importer position");
    }

    return (
      <TopLayer
        position={{
          x: containerRect.left + pointerPosition.x,
          y: containerRect.top + pointerPosition.y,
        }}
        completed={this.clearDeckImporter}
      >
        <DeckLoader
          loadDeckId={this.handleImportDeck(
            this.getRelativePositionFromTarget(this.stage)
          )}
        />
      </TopLayer>
    );
  };

  private handleImportDeck = (position: Vector2d) => (id: number) => {
    this.clearDeckImporter();
    this.props.fetchDecklistById({ decklistId: id, position });
  };

  private clearContextMenu = () => {
    this.setState({
      showContextMenu: false,
      contextMenuPosition: null,
      contextMenuItems: [],
    });
  };

  private clearDeckImporter = () => {
    this.setState({
      showDeckImporter: false,
      deckImporterPosition: null,
    });
  };

  private handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();

    if (!this.stage) return;

    var oldScale = this.props.gameState.stageZoom.x;

    const pointer = this.stage.getPointerPosition() ?? { x: 0, y: 0 };

    const mousePointTo = {
      x: (pointer.x - this.stage.x()) / oldScale,
      y: (pointer.y - this.stage.y()) / oldScale,
    };

    const newScale =
      event.evt.deltaY < 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

    this.props.updateZoom({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    this.props.updatePosition(newPos);
  };

  private handleCardContextMenu = (
    cardId: string,
    event: KonvaEventObject<PointerEvent>
  ) => {
    event.evt.preventDefault();
    event.cancelBubble = true;

    // First, select the card
    this.props.selectCard(cardId);

    const card = this.props.cards.cards.find((c) => c.id === cardId);
    const numCardsInStack = card?.cardStack?.length || 0;

    const menuItems = [
      {
        label: "Flip",
        action: () => {
          this.props.flipCards();
        },
      },
    ];

    if (numCardsInStack > 1) {
      menuItems.push({
        label: "Shuffle",
        action: () => {
          this.props.shuffleStack(cardId);
        },
      });
    }

    this.setState({
      showContextMenu: true,
      contextMenuPosition: this.stage?.getPointerPosition() ?? null,
      contextMenuItems: menuItems,
    });
  };

  private handleSelectAndExhaust = (cardId: string) => {
    this.props.selectCard(cardId);
    this.props.exhaustCard(cardId);
  };

  private handleCardDragStart = (
    cardId: string,
    event: KonvaEventObject<DragEvent>
  ) => {
    let splitTopCard = false;
    // If multiple things are selected, you can't pull something off the top of a stack,
    // so just do a normal drag
    const multipleSelected =
      this.props.cards.cards.filter((c) => c.selected).length > 1;

    if (!multipleSelected) {
      const draggingCard = this.props.cards.cards.find((c) => c.id === cardId);
      const hasStack = (draggingCard?.cardStack || []).length > 1;
      if (!!draggingCard && hasStack) {
        // Check if we're dragging in the upper right corner of the card
        const upperRightPoint = {
          x: draggingCard.x + cardConstants.CARD_WIDTH / 2,
          y: draggingCard.y - cardConstants.CARD_HEIGHT / 2,
        };
        const distance = getDistance(
          upperRightPoint,
          this.getRelativePositionFromTarget(this.stage)
        );
        if (distance < 30) {
          splitTopCard = true;
        }
      }
    }

    this.props.startCardMove({ id: cardId, splitTopCard });
  };

  private handleKeyPress = (event: any) => {
    const code = event.which || event.keyCode;
    if (code === 115) {
      this.props.togglePanMode();
    } else if (code === 102) {
      this.props.flipCards();
    }
  };

  private getRawPreviewCardPosition = (): Vector2d => {
    const pointerPos = this.stage?.getPointerPosition() ?? { x: 0, y: 0 };
    const screenMidPointX = window.innerWidth / 2;
    return pointerPos.x < screenMidPointX
      ? {
          x: window.innerWidth - cardConstants.CARD_PREVIEW_WIDTH / 2,
          y: cardConstants.CARD_PREVIEW_HEIGHT / 2,
        }
      : {
          x: cardConstants.CARD_PREVIEW_WIDTH / 2,
          y: cardConstants.CARD_PREVIEW_HEIGHT / 2,
        };
  };

  private getRelativePositionFromTarget = (
    target: any,
    posParam?: Vector2d
  ) => {
    const transform = target.getAbsoluteTransform().copy();
    transform.invert();
    let pos = posParam || target.getPointerPosition();
    return transform.point(pos);
  };

  private handleMouseDown = (event: any) => {
    const pos = this.getRelativePositionFromTarget(event.currentTarget);

    this.setState({
      selectStartPos: {
        x: pos.x,
        y: pos.y,
      },
      selecting: true,
    });
  };

  private getSelectionRectInfo = () => {
    const selectStartPos = this.state.selectStartPos;
    const selectRect = this.state.selectRect;
    return {
      height: Math.abs(selectRect.height),
      width: Math.abs(selectRect.width),
      x:
        selectRect.width < 0
          ? selectStartPos.x + selectRect.width
          : selectStartPos.x,
      y:
        selectRect.height < 0
          ? selectStartPos.y + selectRect.height
          : selectStartPos.y,
    };
  };

  private handleMouseUp = () => {
    // if we were selecting, check for intersection
    if (this.state.drewASelectionRect) {
      const selectRect = this.getSelectionRectInfo();
      const selectedCards: any[] = this.props.cards.cards.reduce<ICardStack[]>(
        (currSelectedCards, card) => {
          const intersects = Intersects.boxBox(
            selectRect.x,
            selectRect.y,
            selectRect.width,
            selectRect.height,
            card.x - 50,
            card.y - 75,
            cardConstants.CARD_WIDTH,
            cardConstants.CARD_HEIGHT
          );

          if (intersects) {
            currSelectedCards.push(card);
          }

          return currSelectedCards;
        },
        []
      );

      this.props.selectMultipleCards({
        ids: selectedCards.map((card) => card.id),
      });
    }

    this.setState({
      drewASelectionRect: false,
      selectRect: {
        height: 0,
        width: 0,
      },
      selectStartPos: {
        x: 0,
        y: 0,
      },
      selecting: false,
    });
  };

  private handleMouseMove = (event: any) => {
    if (this.state.selecting) {
      const pos = this.getRelativePositionFromTarget(event.currentTarget);
      this.setState({
        drewASelectionRect: true,
        selectRect: {
          height: pos.y - this.state.selectStartPos.y,
          width: pos.x - this.state.selectStartPos.x,
        },
      });
    }
    event.cancelBubble = true;
  };

  private handleContextMenu = (event: KonvaEventObject<PointerEvent>): void => {
    event.evt.preventDefault();
    event.cancelBubble = true;

    const menuItems = [
      {
        label: "Load Deck ID",
        action: () => {
          this.setState({
            showDeckImporter: true,
            deckImporterPosition: this.stage?.getPointerPosition() ?? null,
          });
        },
      },
      { label: "Load Encounter", action: () => {} },
      { label: "Reset", action: this.props.resetCards },
    ];

    this.setState({
      showContextMenu: true,
      contextMenuPosition: this.stage?.getPointerPosition() ?? null,
      contextMenuItems: menuItems,
    });
  };

  private getImgUrl = (card: ICardStack): string => {
    if (Object.keys(this.props.cardsData).length === 0) return "";

    const cardData = this.props.cardsData[card.cardStack[0].jsonId];

    if (!card.faceup && !!cardData.back_link) {
      return (
        process.env.PUBLIC_URL + "/images/cards/" + cardData.octgn_id + ".b.jpg"
      );
    } else if (!card.faceup) {
      return process.env.PUBLIC_URL + "/images/standard/card_back.png";
    }

    return (
      process.env.PUBLIC_URL + "/images/cards/" + cardData.octgn_id + ".jpg"
    );
  };
}

export default App;
