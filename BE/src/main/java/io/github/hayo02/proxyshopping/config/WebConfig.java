package io.github.hayo02.proxyshopping.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry reg) {
        reg.addMapping("/api/**")
                .allowedOriginPatterns(
                    "http://localhost:*",
                    "http://211.188.56.255:*",
                    "https://dgu-buylink.vercel.app",
                    "chrome-extension://*"  // Chrome 확장 프로그램 허용
                )
                .allowedMethods("GET","POST","PUT","DELETE","PATCH","OPTIONS")
                .allowCredentials(true);
    }
}
