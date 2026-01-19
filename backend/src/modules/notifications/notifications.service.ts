import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Notification,
  NotificationStatus,
  NotificationType,
  NotificationChannel,
} from '../../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async findByUser(userId: string, limit = 50) {
    return this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        recipientId: userId,
        status: In([NotificationStatus.PENDING, NotificationStatus.SENT]),
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      {
        recipientId: userId,
        status: In([NotificationStatus.PENDING, NotificationStatus.SENT]),
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
  }

  async create(data: {
    type: NotificationType;
    recipientId: string;
    channel?: NotificationChannel;
    title: string;
    content: string;
    payload?: Record<string, any>;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      channel: data.channel || NotificationChannel.SYSTEM,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });

    return this.notificationRepository.save(notification);
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    await this.notificationRepository.remove(notification);
  }
}
