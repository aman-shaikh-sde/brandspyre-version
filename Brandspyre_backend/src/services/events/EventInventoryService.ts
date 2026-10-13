import mongoose from "mongoose";
import { EventTicketType, EventAddon, EventOrder } from "../../db/ModelSceham/eventSchema";

export interface ReservationItem {
  type: 'TICKET' | 'ADDON';
  id: string | mongoose.Types.ObjectId;
  quantity: number;
}

export class EventInventoryService {
  /**
   * Concurrency-safe atomic inventory reservation
   */
  static async reserve(items: ReservationItem[]): Promise<{ success: boolean; error?: string }> {
    const reservedItems: ReservationItem[] = [];

    try {
      for (const item of items) {
        if (item.quantity <= 0) continue;

        if (item.type === 'TICKET') {
          // Atomic reservation condition: total_inventory - sold_quantity - reserved_quantity >= requested
          const updated = await EventTicketType.findOneAndUpdate(
            {
              _id: item.id,
              status: 'ACTIVE',
              is_active: true,
              $expr: {
                $gte: [
                  { $subtract: ["$total_inventory", { $add: ["$sold_quantity", "$reserved_quantity"] }] },
                  item.quantity
                ]
              }
            },
            {
              $inc: { reserved_quantity: item.quantity }
            },
            { new: true }
          );

          if (!updated) {
            throw new Error(`Insufficient ticket inventory or ticket tier unavailable.`);
          }
          reservedItems.push(item);
        } else {
          // Add-on reservation
          const updated = await EventAddon.findOneAndUpdate(
            {
              _id: item.id,
              is_active: true,
              $expr: {
                $gte: [
                  { $subtract: ["$total_inventory", "$sold_quantity"] },
                  item.quantity
                ]
              }
            },
            {
              $inc: { sold_quantity: 0 } // Addon validation
            },
            { new: true }
          );

          if (!updated) {
            throw new Error(`Insufficient addon inventory for item.`);
          }
          reservedItems.push(item);
        }
      }

      return { success: true };
    } catch (err: any) {
      // Rollback any items already reserved in this transaction
      await this.release(reservedItems);
      return { success: false, error: err.message || 'Inventory reservation failed' };
    }
  }

  /**
   * Release reserved inventory back to available pool
   */
  static async release(items: ReservationItem[]): Promise<void> {
    for (const item of items) {
      if (item.type === 'TICKET') {
        await EventTicketType.updateOne(
          { _id: item.id },
          { $inc: { reserved_quantity: -Math.abs(item.quantity) } }
        );
      }
    }
  }

  /**
   * Commit reservation upon successful payment verification
   */
  static async commit(items: ReservationItem[]): Promise<void> {
    for (const item of items) {
      if (item.type === 'TICKET') {
        const ticketType = await EventTicketType.findOneAndUpdate(
          { _id: item.id },
          {
            $inc: {
              reserved_quantity: -Math.abs(item.quantity),
              sold_quantity: Math.abs(item.quantity)
            }
          },
          { new: true }
        );

        // Auto mark SOLD_OUT if capacity reached
        if (ticketType && ticketType.sold_quantity >= ticketType.total_inventory) {
          await EventTicketType.updateOne({ _id: item.id }, { status: 'SOLD_OUT' });
        }
      } else {
        await EventAddon.updateOne(
          { _id: item.id },
          { $inc: { sold_quantity: Math.abs(item.quantity) } }
        );
      }
    }
  }

  /**
   * Cleanup expired pending reservations and free inventory
   */
  static async cleanupExpiredReservations(): Promise<number> {
    const expiredOrders = await EventOrder.find({
      status: 'RESERVED',
      reservation_expires_at: { $lt: new Date() }
    }).limit(100);

    let releasedCount = 0;

    for (const order of expiredOrders) {
      const itemsToRelease: ReservationItem[] = order.items
        .filter((i: any) => i.item_type === 'TICKET')
        .map((i: any) => ({
          type: 'TICKET' as const,
          id: i.item_id,
          quantity: i.quantity
        }));

      await this.release(itemsToRelease);
      order.status = 'EXPIRED';
      await order.save();
      releasedCount++;
    }

    return releasedCount;
  }
}

export default EventInventoryService;
