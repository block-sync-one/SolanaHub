import { Component, OnInit, signal } from '@angular/core';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { SolanaHelpersService } from 'src/app/services/solana-helpers.service';
import { IonImg, IonLabel, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonText } from '@ionic/angular/standalone';
import { PublicKey } from '@solana/web3.js';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'marinade-unstake-ticket',
  templateUrl: './marinade-unstake-ticket.component.html',
  styleUrls: ['./marinade-unstake-ticket.component.scss'],
  standalone: true,
  imports: [
    IonImg,   
    IonLabel,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonText,
    DecimalPipe
  ]
})
export class MarinadeUnstakeTicketComponent implements OnInit {
  tickets = signal<any[]>([]);

  constructor(
    private _lss: LiquidStakeService,
    private _shs: SolanaHelpersService
  ) { }

  async ngOnInit() {
    console.log('ngOnInit marinade tickets')
    await this.loadTickets();
  }

  async loadTickets() {
    const tickets = await this._lss.getMarinadeTickets()
    console.log('tickets', tickets)
    // Convert Map to array if needed
    const ticketsArray = tickets instanceof Map ? Array.from(tickets.values()) : (tickets || []);
    
    // Process tickets to add computed properties
    const processedTickets = await Promise.all(
      ticketsArray.map(async (ticket) => {
        const isDue = await this.isTicketDue(ticket);
        const timeRemaining = await this.getTimeRemaining(ticket);
        return {
          ...ticket,
          isDue,
          timeRemaining
        };
      })
    );
    
    this.tickets.set(processedTickets);
  }

  async claimTicket(ticketAccount: PublicKey) {
    console.log('claimTicket', ticketAccount)
    try {
      const ticket = await this._lss.marinadeSDK.claim(ticketAccount)
      console.log('ticket', ticket)
      // Refresh tickets after claiming
      await this.loadTickets();
    } catch (error) {
      console.error('error', error)
    }
  }

  async isTicketDue(ticket: any): Promise<boolean> {
    if (!ticket || !ticket.ticketDueDate) return false;
    
    try {
      const currentDate = new Date();
      const dueDate = new Date(ticket.ticketDueDate);
      return currentDate >= dueDate;
    } catch (error) {
      console.error('Error checking ticket due date:', error);
      return false;
    }
  }

  async getTimeRemaining(ticket: any): Promise<string> {
    if (!ticket || !ticket.ticketDueDate) return 'unknown time';
    
    try {
      const currentDate = new Date();
      const dueDate = new Date(ticket.ticketDueDate);
      const timeDiff = dueDate.getTime() - currentDate.getTime();
      
      if (timeDiff <= 0) return 'ready to claim';
      
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));
      
      if (daysRemaining >= 1) {
        return `${daysRemaining} days`;
      } else if (hoursRemaining >= 1) {
        return `${hoursRemaining} hours`;
      } else {
        const minutesRemaining = Math.ceil(timeDiff / (1000 * 60));
        return `${minutesRemaining} minutes`;
      }
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 'unknown time';
    }
  }
}
