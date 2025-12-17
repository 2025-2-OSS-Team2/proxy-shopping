package io.github.hayo02.proxyshopping.orders.service;

import io.github.hayo02.proxyshopping.orders.entity.Order;

public interface SlackNotificationService {

    /**
     * 결제 완료 알림을 Slack으로 전송하고 견적서 파일을 첨부합니다.
     * @param order 결제가 완료된 주문
     * @param quotationFilePath 견적서 파일 경로
     */
    void sendPaymentCompleteNotification(Order order, String quotationFilePath);
}
