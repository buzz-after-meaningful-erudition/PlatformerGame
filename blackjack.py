import random

# Card values dictionary
CARD_VALUES = {'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
               'J': 10, 'Q': 10, 'K': 10, 'A': 11}

def deal_card():
    return random.choice(list(CARD_VALUES.keys()))

def calculate_hand_value(hand):
    value = sum(CARD_VALUES[card] for card in hand)
    aces = hand.count('A')
    while value > 21 and aces:
        value -= 10  # Adjust Ace value from 11 to 1
        aces -= 1
    return value

def display_hand(name, hand):
    print(f"{name}'s hand: {', '.join(hand)} (Value: {calculate_hand_value(hand)})")

def display_dealer_hand(hand, hide_second_card=True):
    if hide_second_card:
        shown_hand = [hand[0], '?']
        print(f"Dealer's hand: {', '.join(shown_hand)} (Visible value: {CARD_VALUES[hand[0]]})")
    else:
        print(f"Dealer's hand: {', '.join(hand)} (Value: {calculate_hand_value(hand)})")

def blackjack_game():
    print("Welcome to Blackjack!")
    player_hand = [deal_card(), deal_card()]
    dealer_hand = [deal_card(), deal_card()]
    
    # Show initial hands
    display_dealer_hand(dealer_hand)
    
    while True:
        display_hand("Player", player_hand)
        if calculate_hand_value(player_hand) > 21:
            print("Bust! You lose.")
            return
        action = input("Do you want to hit or stand? (h/s): ").strip().lower()
        
        if action == 'h':
            player_hand.append(deal_card())
        elif action == 's':
            break
    
    # Show dealer's full hand once player stands
    display_dealer_hand(dealer_hand, hide_second_card=False)
    
    while calculate_hand_value(dealer_hand) < 17:
        dealer_hand.append(deal_card())
        display_dealer_hand(dealer_hand, hide_second_card=False)
    
    player_value = calculate_hand_value(player_hand)
    dealer_value = calculate_hand_value(dealer_hand)
    
    if dealer_value > 21 or player_value > dealer_value:
        print("You win!")
    elif player_value < dealer_value:
        print("Dealer wins!")
    else:
        print("It's a tie!")

if __name__ == "__main__":
    blackjack_game()
