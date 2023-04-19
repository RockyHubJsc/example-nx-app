import { ShopifyAuthAfterHandler } from '@nestjs-shopify/auth';
import { ShopifyWebhooksService } from '@nestjs-shopify/webhooks';
import { Injectable, Logger } from '@nestjs/common';
import { FastifyRequest as Request, FastifyReply as Response} from 'fastify';
import { ShopsService } from '../../shops/shops.service';
import { SessionEntity } from '../../../entities/session.entity';

@Injectable()
export class AfterAuthHandlerService implements ShopifyAuthAfterHandler {
  constructor(
    private readonly shopsService: ShopsService,
    private readonly webhookService: ShopifyWebhooksService
  ) {}

  async afterAuth(
    req: Request,
    res: Response,
    session: SessionEntity
  ): Promise<void> {
    const { isOnline, shop, accessToken } = session;
    const host= req.query['host'];

    if (isOnline) {
      if (!(await this.shopsService.exists(shop))) {
        return res.redirect(`/api/offline/auth?shop=${shop}`);
      }

      return res.redirect(`/?shop=${shop}&host=${host}`);
    }

    await this.shopsService.findOrCreate(shop, accessToken);
    Logger.log('Registering webhooks');
    await this.webhookService.registerWebhooks(session);

    return res.redirect(`/api/online/auth?shop=${shop}`);
  }
}
