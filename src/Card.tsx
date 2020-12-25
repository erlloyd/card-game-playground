// tslint:disable:no-console
import { KonvaEventObject } from "konva/types/Node";
import * as React from "react";
import { Component } from "react";
import { Rect } from "react-konva";
import { animated, Spring } from "react-spring/renderprops-konva";
import { cardConstants } from "./constants/card-constants";
// import Portal from './Portal';
// import ContextMenu from './ContextMenu';

export const HORIZONTAL_TYPE_CODES = ["main_scheme", "side_scheme"];
interface IProps {
  dragging: boolean;
  exhausted: boolean;
  fill: string;
  handleClick?: (id: string) => void;
  handleDoubleClick?: (id: string) => void;
  handleDragStart?: (id: string, event: KonvaEventObject<DragEvent>) => void;
  handleDragMove?: (info: { id: string; dx: number; dy: number }) => void;
  handleDragEnd?: (id: string) => void;
  handleHover?: (id: string) => void;
  handleHoverLeave?: (id: string) => void;
  id: string;
  selected: boolean;
  dropTarget?: boolean;
  x: number;
  y: number;
  width?: number;
  height?: number;
  imgUrl: string;
  isGhost?: boolean;
  numCardsInStack?: number;
  typeCode?: string;
  faceup: boolean;
  handleContextMenu?: (
    id: string,
    event: KonvaEventObject<PointerEvent>
  ) => void;
}

interface IState {
  imageLoaded: boolean;
  prevImgUrl: string;
}

class Card extends Component<IProps, IState> {
  // tslint:disable-next-line:member-access
  static getDerivedStateFromProps(props: IProps, state: IState): IState | null {
    if (props.imgUrl !== state.prevImgUrl) {
      return {
        imageLoaded: false,
        prevImgUrl: props.imgUrl,
      };
    }
    // No state update necessary
    return null;
  }

  private img: HTMLImageElement;
  private unmounted: boolean;
  private renderAnimated: boolean = false;

  constructor(props: IProps) {
    super(props);

    if (localStorage.getItem("__render_animated__")) {
      this.renderAnimated = true;
    }

    this.unmounted = true;

    this.state = {
      imageLoaded: false,
      prevImgUrl: this.props.imgUrl,
    };

    this.img = new Image();

    // When the image loads, set a flag in the state
    this.img.onload = () => {
      if (!this.unmounted) {
        this.setState({
          imageLoaded: true,
        });
      }
    };

    if (props.imgUrl) {
      this.img.src = props.imgUrl;
    }
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    if (
      !this.state.imageLoaded &&
      this.props.imgUrl &&
      this.props.imgUrl !== this.img.src
    ) {
      this.img.src = this.props.imgUrl;
    }
  }

  public componentDidMount() {
    this.unmounted = false;
  }

  public componentWillUnmount() {
    this.unmounted = true;
  }

  public render() {
    return this.state.imageLoaded ? this.renderCard() : null;
  }

  private renderCard() {
    const heightToUse = this.props.height || cardConstants.CARD_HEIGHT;
    const widthToUse = this.props.width || cardConstants.CARD_WIDTH;

    return this.renderAnimated
      ? this.renderAnimatedCard(heightToUse, widthToUse)
      : this.renderUnanimatedCard(heightToUse, widthToUse);
  }

  private renderAnimatedCard = (heightToUse: number, widthToUse: number) => {
    return (
      <Spring
        key={`${this.props.id}-card`}
        native={true}
        to={{
          rotation: this.props.exhausted ? 90 : 0,
        }}
      >
        {(animatedProps: any) => (
          <animated.Rect
            {...animatedProps}
            cornerRadius={9}
            x={this.props.x}
            y={this.props.y}
            width={widthToUse}
            height={heightToUse}
            offset={{
              x: widthToUse / 2,
              y: heightToUse / 2,
            }}
            stroke={this.props.dropTarget ? "blue" : ""}
            strokeWidth={this.props.dropTarget ? 2 : 0}
            fillPatternImage={this.img}
            fillPatternScaleX={
              this.state.imageLoaded
                ? widthToUse / this.img.naturalWidth
                : widthToUse
            }
            fillPatternScaleY={
              this.state.imageLoaded
                ? heightToUse / this.img.naturalHeight
                : heightToUse
            }
            shadowBlur={this.props.dragging ? 10 : this.props.selected ? 5 : 0}
            opacity={this.props.isGhost ? 0.5 : 1}
            draggable={true}
            onDragStart={this.handleDragStart}
            onDragMove={this.handleDragMove}
            onDragEnd={this.handleDragEnd}
            onDblClick={this.handleDoubleClick}
            onDblTap={this.handleDoubleClick}
            onClick={this.handleClick}
            onTap={this.handleClick}
            onMouseDown={this.handleMouseDown}
            onTouchStart={this.handleMouseDown}
            onMouseOver={this.handleMouseOver}
            onMouseOut={this.handleMouseOut}
            onContextMenu={this.handleContextMenu}
          />
        )}
      </Spring>
    );
  };

  private renderUnanimatedCard = (heightToUse: number, widthToUse: number) => {
    const scale = this.getScale(widthToUse, heightToUse);
    const offset = {
      x: widthToUse / 2,
      y: heightToUse / 2,
    };

    const card = (
      <Rect
        key={`${this.props.id}-card`}
        native={true}
        rotation={this.props.exhausted ? 90 : 0}
        cornerRadius={9}
        x={this.props.x}
        y={this.props.y}
        width={widthToUse}
        height={heightToUse}
        offset={offset}
        stroke={this.props.dropTarget ? "blue" : ""}
        strokeWidth={this.props.dropTarget ? 2 : 0}
        fillPatternRotation={
          this.shouldRenderImageHorizontal(
            this.props.typeCode || "",
            HORIZONTAL_TYPE_CODES
          )
            ? 270
            : 0
        }
        fillPatternImage={this.img}
        fillPatternScaleX={scale.width}
        fillPatternScaleY={scale.height}
        shadowBlur={this.props.dragging ? 10 : this.props.selected ? 5 : 0}
        opacity={this.props.isGhost ? 0.5 : 1}
        draggable={true}
        onDragStart={this.handleDragStart}
        onDragMove={this.handleDragMove}
        onDragEnd={this.handleDragEnd}
        onDblClick={this.handleDoubleClick}
        onDblTap={this.handleDoubleClick}
        onClick={this.handleClick}
        onTap={this.handleClick}
        onMouseDown={this.handleMouseDown}
        onTouchStart={this.handleMouseDown}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        onContextMenu={this.handleContextMenu}
      />
    );

    const cardStackOffset = {
      x: offset.x + 4,
      y: offset.y - 4,
    };

    const cardStack =
      (this.props.numCardsInStack || 1) > 1 ? (
        <Rect
          key={`${this.props.id}-cardStack`}
          native={true}
          rotation={this.props.exhausted ? 90 : 0}
          cornerRadius={[9, 9, 9, 9]}
          x={this.props.x}
          y={this.props.y}
          width={widthToUse}
          height={heightToUse}
          offset={cardStackOffset}
          opacity={this.props.isGhost ? 0.5 : 1}
          fill={"gray"}
          shadowBlur={this.props.dragging ? 10 : this.props.selected ? 5 : 0}
        />
      ) : null;

    return [cardStack, card];
  };

  private shouldRenderImageHorizontal(
    type: string,
    typeCodes: string[]
  ): boolean {
    return typeCodes.includes(type) && !this.plainCardBack;
  }

  private get plainCardBack() {
    return (
      this.props.imgUrl?.includes("standard") &&
      this.props.imgUrl?.includes("_back")
    );
  }

  private getScale(widthToUse: number, heightToUse: number) {
    const width = this.state.imageLoaded
      ? widthToUse / this.img.naturalWidth
      : widthToUse;

    const widthHorizontal = this.state.imageLoaded
      ? heightToUse / this.img.naturalWidth
      : widthToUse;

    const height = this.state.imageLoaded
      ? heightToUse / this.img.naturalHeight
      : heightToUse;

    const heightHorizontal = this.state.imageLoaded
      ? widthToUse / this.img.naturalHeight
      : heightToUse;

    return this.shouldRenderImageHorizontal(
      this.props.typeCode || "",
      HORIZONTAL_TYPE_CODES
    )
      ? { width: widthHorizontal, height: heightHorizontal }
      : { width, height };
  }

  private handleContextMenu = (event: KonvaEventObject<PointerEvent>): void => {
    if (!!this.props.handleContextMenu) {
      this.props.handleContextMenu(this.props.id, event);
    }
  };

  private handleDoubleClick = () => {
    if (this.props.handleDoubleClick) {
      this.props.handleDoubleClick(this.props.id);
    }
  };

  private handleDragStart = (event: KonvaEventObject<DragEvent>) => {
    if (this.props.handleDragStart) {
      this.props.handleDragStart(this.props.id, event);
    }
  };

  private handleDragMove = (event: any) => {
    if (this.props.handleDragMove) {
      this.props.handleDragMove({
        id: this.props.id,
        dx: event.target.x() - this.props.x,
        dy: event.target.y() - this.props.y,
      });
    }
  };

  private handleDragEnd = () => {
    if (this.props.handleDragEnd && this.props.dragging) {
      this.props.handleDragEnd(this.props.id);
    }
  };

  private handleClick = (event: any) => {
    if (this.props.handleClick) {
      this.props.handleClick(this.props.id);
      event.cancelBubble = true;
    }
  };

  private handleMouseDown = (event: any) => {
    event.cancelBubble = true;
  };

  private handleMouseOver = () => {
    if (this.props.handleHover) {
      this.props.handleHover(this.props.id);
    }
  };

  private handleMouseOut = () => {
    if (this.props.handleHoverLeave) {
      this.props.handleHoverLeave(this.props.id);
    }
  };
}

export default Card;
