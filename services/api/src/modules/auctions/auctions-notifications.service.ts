import { Injectable, Logger } from '@nestjs/common';
import { Auction, AuctionBid } from '@prisma/client';

/**
 * Pontos de integracao com push notifications (Firebase Cloud Messaging).
 * Por enquanto apenas loga a intencao do evento — quando o FCM for
 * conectado, cada metodo passa a enviar a notificacao real ao(s)
 * destinatario(s) em vez de logar.
 */
@Injectable()
export class AuctionsNotificationsService {
  private readonly logger = new Logger(AuctionsNotificationsService.name);

  notifyAuctionOpened(auction: Auction, zoneId: string | null) {
    this.logger.log(
      `[push:auction_opened] auction=${auction.id} zone=${zoneId ?? 'any'} -> notificar lojas CARWASH_SHOP elegiveis na zona`,
    );
  }

  notifyNewBid(auction: Auction, bid: AuctionBid) {
    this.logger.log(
      `[push:new_bid] auction=${auction.id} bid=${bid.id} -> notificar cliente dono do pedido`,
    );
  }

  notifyBidAccepted(bid: AuctionBid) {
    this.logger.log(
      `[push:bid_accepted] bid=${bid.id} supplier=${bid.supplierId} -> notificar loja vencedora`,
    );
  }

  notifyBidRejected(bid: AuctionBid) {
    this.logger.log(
      `[push:bid_rejected] bid=${bid.id} supplier=${bid.supplierId} -> notificar loja nao selecionada`,
    );
  }

  notifyAuctionCancelled(auction: Auction) {
    this.logger.log(`[push:auction_cancelled] auction=${auction.id} -> notificar pujadores`);
  }

  notifyAuctionExpired(auction: Auction) {
    this.logger.log(`[push:auction_expired] auction=${auction.id} -> notificar cliente`);
  }
}
