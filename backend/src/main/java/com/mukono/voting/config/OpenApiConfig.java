package com.mukono.voting.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

/**
 * OpenAPI/Swagger configuration for the Mukono Diocese Voting System.
 * 
 * Provides interactive API documentation accessible at:
 * - Swagger UI: http://localhost:8080/swagger-ui.html
 * - OpenAPI JSON: http://localhost:8080/v3/api-docs
 * 
 * Note: Authentication is disabled for Swagger in development.
 * TODO: Enable authentication for production deployment.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        // Define the JWT security scheme
        SecurityScheme jwtSecurityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization")
                .description("JWT authentication. Obtain token from /api/v1/auth/login");

        return new OpenAPI()
                .info(new Info()
                        .title("Mukono Diocese Voting System API")
                        .version("1.0.0")
                        .description("""
                                RESTful API for the Mukono Diocese Automated Voting System.
                                
                                This system provides comprehensive election management, voter registration,
                                ballot casting, and results tallying for diocese-wide elections.
                                
                                ## Features
                                - **User Management**: Admin, DS, Bishop, Staff, and Voter roles
                                - **Organization Management**: Diocese, Archdeaconry, Church, Fellowship hierarchy
                                - **Leadership Management**: Position titles, fellowship positions, assignments
                                - **Election Management**: Create elections, manage positions, candidates, and applicants
                                - **Voting**: Secure voting with voting codes, ballot casting, and vote tracking
                                - **Results & Tallying**: Real-time turnout tracking, certified results, winner computation
                                
                                ## Authentication
                                Most endpoints require JWT authentication. To authenticate:
                                1. Login via `/api/v1/auth/login` with username and password
                                2. Copy the JWT token from the response
                                3. Click 'Authorize' button and enter: Bearer {token}
                                4. All subsequent requests will include the token
                                
                                ## API Namespaces
                                - `/api/v1/auth/**` - Public authentication endpoints
                                - `/api/v1/admin/**` - Admin-only operations
                                - `/api/v1/ds/**` - Diocesan Secretary operations
                                - `/api/v1/bishop/**` - Bishop operations
                                - `/api/v1/staff/**` - Senior Staff operations
                                - `/api/v1/polling/**` - Polling Officer operations
                                - `/api/v1/vote/**` - Voter operations
                                
                                ## Development Notes
                                **IMPORTANT**: Swagger authentication is currently disabled for development.
                                This will be re-enabled before production deployment.
                                """)
                        .contact(new Contact()
                                .name("Mukono Diocese IT Team")
                                .email("it@mukonoadiocese.org"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://mukonoadiocese.org")))
                .servers(Arrays.asList(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Development Server"),
                        new Server()
                                .url("https://api.mukonoadiocese.org")
                                .description("Production Server (Future)")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", jwtSecurityScheme))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
