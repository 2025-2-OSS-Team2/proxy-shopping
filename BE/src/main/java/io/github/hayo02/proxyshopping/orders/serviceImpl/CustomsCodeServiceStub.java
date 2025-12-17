package io.github.hayo02.proxyshopping.orders.serviceImpl;

import io.github.hayo02.proxyshopping.orders.dto.CustomsCodeVerifyResponse;
import io.github.hayo02.proxyshopping.orders.service.CustomsCodeService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary   
public class CustomsCodeServiceStub implements CustomsCodeService {

    @Override
    public CustomsCodeVerifyResponse verify(String code) {
        
        return CustomsCodeVerifyResponse.of(true, "홍길동");
    }
}
