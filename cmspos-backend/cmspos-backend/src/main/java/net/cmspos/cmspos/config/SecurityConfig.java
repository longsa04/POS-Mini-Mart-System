package net.cmspos.cmspos.config;

import java.util.List;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/activity-logs/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.POST, "/activity-logs/**").hasAnyRole("ADMIN", "MANAGER", "CASHIER")
                        .requestMatchers("/users/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.POST, "/orders/**").hasAnyRole("ADMIN", "MANAGER", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/orders/**").hasAnyRole("ADMIN", "MANAGER", "CASHIER")
                        .requestMatchers(HttpMethod.PATCH, "/orders/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/orders/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/products/**").hasAnyRole("ADMIN", "MANAGER", "CASHIER")
                        .requestMatchers("/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/categories/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers("/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/customers/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers("/customers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/locations/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers("/locations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/suppliers/**").hasAnyRole("ADMIN", "MANAGER", "CASHIER")
                        .requestMatchers("/suppliers/**").hasRole("ADMIN")
                        .requestMatchers("/purchase-orders/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/inventory/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.GET, "/expenses/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.POST, "/expenses/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/expenses/**").hasRole("ADMIN")
                        .requestMatchers("/taxes/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/cash-registers/**").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers("/cash-registers/**").hasRole("ADMIN")
                        .requestMatchers("/reports/**").hasAnyRole("ADMIN", "MANAGER")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
