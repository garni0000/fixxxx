import axios from 'axios';

/**
 * MoneyFusion Mobile Money Payment Service
 * Documentation: https://my.moneyfusion.net/
 */

// Types basés sur la documentation MoneyFusion
export interface MoneyFusionPaymentRequest {
  totalPrice: number;
  article: Array<{ [key: string]: number }>;
  personal_Info?: Array<{ userId?: string; orderId?: string; [key: string]: any }>;
  numeroSend: string; // Numéro de téléphone du client
  nomclient: string; // Nom du client
  return_url?: string; // URL de retour après paiement
  webhook_url?: string; // URL du webhook pour notifications
}

export interface MoneyFusionPaymentResponse {
  statut: boolean;
  token: string; // Token unique pour suivre le paiement
  message: string;
  url: string; // URL de la page de paiement
}

export interface MoneyFusionPaymentStatus {
  statut: boolean;
  data: {
    _id: string; // Transaction ID
    tokenPay: string;
    numeroSend: string;
    nomclient: string;
    personal_Info?: Array<{ [key: string]: any }>;
    numeroTransaction: string;
    Montant: number;
    frais: number;
    statut: 'pending' | 'paid' | 'failure' | 'no paid';
    moyen: string; // Mode de paiement (orange, mtn, etc.)
    return_url?: string;
    createdAt: string;
  };
  message: string;
}

export interface MoneyFusionWebhookPayload {
  event: 'payin.session.pending' | 'payin.session.completed' | 'payin.session.cancelled';
  personal_Info?: Array<{ [key: string]: any }>;
  tokenPay: string;
  numeroSend: string;
  nomclient: string;
  numeroTransaction: string;
  Montant: number;
  frais: number;
  return_url?: string;
  webhook_url?: string;
  createdAt: string;
}

/**
 * Service MoneyFusion pour gérer les paiements Mobile Money
 */
export class MoneyFusionService {
  private apiUrl: string;

  constructor() {
    const apiUrl = import.meta.env.MMONEY_API_URL;
    if (!apiUrl) {
      throw new Error('MMONEY_API_URL environment variable is not set');
    }
    this.apiUrl = apiUrl;
  }

  /**
   * Initier un nouveau paiement
   */
  async initiatePayment(data: MoneyFusionPaymentRequest): Promise<MoneyFusionPaymentResponse> {
    try {
      const response = await axios.post<MoneyFusionPaymentResponse>(this.apiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('MoneyFusion payment initiation error:', error);
      throw new Error('Failed to initiate MoneyFusion payment');
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(token: string): Promise<MoneyFusionPaymentStatus> {
    try {
      const response = await axios.get<MoneyFusionPaymentStatus>(
        `https://www.pay.moneyfusion.net/paiementNotif/${token}`
      );
      return response.data;
    } catch (error) {
      console.error('MoneyFusion payment status check error:', error);
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Traiter une notification webhook
   * Retourne true si la notification doit être traitée, false si elle est redondante
   */
  shouldProcessWebhook(
    webhookPayload: MoneyFusionWebhookPayload,
    currentStatus?: string
  ): boolean {
    // Logique de filtrage des notifications redondantes
    const incomingStatus = this.mapWebhookEventToStatus(webhookPayload.event);
    
    if (currentStatus && incomingStatus === currentStatus) {
      // Notification redondante, ignorer
      return false;
    }
    
    return true;
  }

  /**
   * Mapper l'événement webhook vers un statut de paiement
   */
  private mapWebhookEventToStatus(event: MoneyFusionWebhookPayload['event']): string {
    switch (event) {
      case 'payin.session.pending':
        return 'pending';
      case 'payin.session.completed':
        return 'paid';
      case 'payin.session.cancelled':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Construire l'URL de webhook pour cette application
   */
  getWebhookUrl(baseUrl: string): string {
    return `${baseUrl}/api/webhooks/moneyfusion`;
  }

  /**
   * Construire l'URL de retour après paiement
   */
  getReturnUrl(baseUrl: string, paymentId: string): string {
    return `${baseUrl}/payment/callback?paymentId=${paymentId}`;
  }
}

// Instance singleton
export const moneyFusionService = new MoneyFusionService();
