// src/main/java/io/github/hayo02/proxyshopping/ai/serviceImpl/ProductAiServiceStub.java
package io.github.hayo02.proxyshopping.ai.serviceImpl;

import io.github.hayo02.proxyshopping.ai.dto.AiPredictResponse;
import io.github.hayo02.proxyshopping.ai.dto.CrawlerEnvelope;
import io.github.hayo02.proxyshopping.ai.service.ProductAiService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnMissingBean(ProductAiService.class) // 실제 AI 서비스가 없을 때만 활성화
public class ProductAiServiceStub implements ProductAiService {
    @Override
    public AiPredictResponse predict(CrawlerEnvelope env) {
        // AI 미연동 상태에서는 null 반환(저장 시 AI 필드 스킵)
        return null;

        // 간단히 대략값을 주고 싶다면 위 대신 아래 주석 해제:
        // AiPredictResponse r = new AiPredictResponse();
        // r.setWeight(0.4);   // kg
        // r.setVolume(0.002); // m^3
        // return r;
    }
}
