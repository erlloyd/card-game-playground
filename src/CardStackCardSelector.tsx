import { Component } from "react";
import * as React from "react";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { CardData } from "./external-api/marvel-card-data";
import { ICardData } from "./features/cards-data/initialState";
import { ICardStack } from "./features/cards/initialState";
interface IProps {
  cardsDataEntities: ICardData;
  card: ICardStack;
  cardSelected: (jsonId: string) => void;
}

class CardStackCardSelector extends Component<IProps> {
  private cardsDataInStack: CardData[] = [];

  constructor(props: IProps) {
    super(props);
    this.cardsDataInStack = props.card.cardStack.map((c) => {
      return this.props.cardsDataEntities[c.jsonId];
    });
  }

  render() {
    return (
      <div onClick={this.cancelBubble} onKeyPress={this.cancelBubble}>
        <Autocomplete
          id="cardstack-card-selector-combobox"
          options={this.cardsDataInStack}
          getOptionLabel={(option) => option.name}
          style={{ width: 300 }}
          onChange={this.handleSelected}
          renderInput={(params) => (
            <TextField {...params} label="Find Card..." variant="outlined" />
          )}
        />
      </div>
    );
  }

  private handleSelected = (_event: any, value: CardData | null) => {
    if (!!value && !!this.props.cardSelected) {
      this.props.cardSelected(value.code);
    }
  };

  private cancelBubble = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };
}

export default CardStackCardSelector;
