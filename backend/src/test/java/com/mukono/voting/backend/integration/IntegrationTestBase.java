package com.mukono.voting.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base configuration for integration tests.
 * Extends this class in test classes to get @SpringBootTest and @Transactional automatically.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public abstract class IntegrationTestBase {
    
    @Autowired
    protected MockMvc mockMvc;
    
    protected ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Convert object to JSON string for request bodies.
     */
    protected String asJson(Object object) throws Exception {
        return objectMapper.writeValueAsString(object);
    }
}
