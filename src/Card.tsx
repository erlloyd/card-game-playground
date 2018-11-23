import * as React from 'react';
import { PureComponent } from 'react';
import { animated, Spring } from 'react-spring/dist/konva';
import { cardConstants } from 'src/constants/card-constants';

interface IProps {
  dragging: boolean,
  exhausted: boolean,
  fill: string,
  handleClick: (id: number) => void,
  handleDoubleClick: (id: number) => void,
  handleDragStart: (id: number) => void,
  handleDragMove: (id: number, dx: number, dy: number) => void,
  handleDragEnd: (id: number) => void,
  id: number,
  selected: boolean,
  x: number,
  y: number,
  img: any,
}

class Card extends PureComponent<IProps> {
  
  public render() {
    return (
      <Spring
        native={true}
        to={{
            rotation: this.props.exhausted ? 90 : 0
        }}>
        {(animatedProps: any) => (
            <animated.Rect
            {...animatedProps}
            cornerRadius={7}
            x={this.props.x}
            y={this.props.y}
            width={cardConstants.CARD_WIDTH}
            height={cardConstants.CARD_HEIGHT}
            offset={{
                x: cardConstants.CARD_WIDTH / 2,
                y: cardConstants.CARD_HEIGHT / 2,
            }}
            stroke={this.props.selected ? 'blue' : ''}
            strokeWidth= {this.props.selected ? 8 : 0}
            fillPatternImage={this.props.img}
            fillPatternScaleX={0.5}
            fillPatternScaleY={0.5}
            shadowBlur={this.props.dragging ? 10 : 0}
            draggable={true}
            onDragStart={this.handleDragStart}
            onDragMove={this.handleDragMove}
            onDragEnd={this.handleDragEnd}
            onDblClick={this.handleDoubleClick}
            onDblTap={this.handleDoubleClick}
            onClick={this.handleClick}
            onTap={this.handleClick}
            onMouseDown={this.handleMouseDown}
            onTouchStart={this.handleMouseDown}/>
        )}
      </Spring>
    );
  }

  private handleDoubleClick = () => {
      this.props.handleDoubleClick(this.props.id);
  }

  private handleDragStart = (event: any) => {
      this.props.handleDragStart(this.props.id);
  }

  private handleDragMove = (event: any) => {
      this.props.handleDragMove(
          this.props.id,
          event.target.x() - this.props.x,
          event.target.y() - this.props.y);
  }

  private handleDragEnd = () => {
      this.props.handleDragEnd(this.props.id);
  }

  private handleClick = (event: any) => {
      this.props.handleClick(this.props.id);
      event.cancelBubble = true;
  }

  private handleMouseDown = (event: any) => {
      event.cancelBubble = true;
  }
};

export default Card;