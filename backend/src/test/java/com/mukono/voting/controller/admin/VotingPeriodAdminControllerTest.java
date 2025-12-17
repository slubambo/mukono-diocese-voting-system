package com.mukono.voting.controller.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionStatus;
import com.mukono.voting.model.election.VotingPeriod;
import com.mukono.voting.model.election.VotingPeriodStatus;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.org.Fellowship;
import com.mukono.voting.payload.request.CreateVotingPeriodRequest;
import com.mukono.voting.payload.request.UpdateVotingPeriodRequest;
import com.mukono.voting.repository.election.ElectionRepository;
import com.mukono.voting.repository.election.VotingPeriodRepository;
import com.mukono.voting.repository.org.FellowshipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for VotingPeriodAdminController.
 * Tests CRUD operations, status transitions, and business rule validation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(roles = "ADMIN")
public class VotingPeriodAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private VotingPeriodRepository votingPeriodRepository;

    @Autowired
    private FellowshipRepository fellowshipRepository;

    private Election election;
    private LocalDateTime now;

    @BeforeEach
    public void setup() {
        // Create test fellowship
        Fellowship fellowship = new Fellowship();
        fellowship.setName("Test Fellowship");
        fellowship = fellowshipRepository.save(fellowship);

        // Create test election
        election = new Election();
        election.setName("Test Election");
        election.setStatus(ElectionStatus.VOTING_OPEN);
        election.setFellowship(fellowship);
        election.setScope(PositionScope.CHURCH);
        election.setTermStartDate(LocalDate.now());
        election.setTermEndDate(LocalDate.now().plusDays(365));
        election.setVotingStartAt(java.time.Instant.now());
        election.setVotingEndAt(java.time.Instant.now().plusSeconds(86400)); // +1 day
        election = electionRepository.save(election);

        // Set time reference
        now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
    }

    @Test
    public void testCreateVotingPeriod_Success() throws Exception {
        // Arrange
        CreateVotingPeriodRequest request = new CreateVotingPeriodRequest();
        request.setName("Round 1");
        request.setDescription("First voting round");
        request.setStartTime(now.plusHours(1));
        request.setEndTime(now.plusHours(2));

        // Act & Assert
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods", election.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.electionId").value(election.getId()))
                .andExpect(jsonPath("$.name").value("Round 1"))
                .andExpect(jsonPath("$.description").value("First voting round"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    public void testCreateVotingPeriod_InvalidTimeWindow() throws Exception {
        // Arrange
        CreateVotingPeriodRequest request = new CreateVotingPeriodRequest();
        request.setName("Invalid Round");
        request.setStartTime(now.plusHours(2));
        request.setEndTime(now.plusHours(1)); // End before start

        // Act & Assert
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods", election.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Start time must be before end time")));
    }

    @Test
    public void testCreateVotingPeriod_ElectionNotFound() throws Exception {
        // Arrange
        CreateVotingPeriodRequest request = new CreateVotingPeriodRequest();
        request.setName("Round");
        request.setStartTime(now.plusHours(1));
        request.setEndTime(now.plusHours(2));

        // Act & Assert
        mockMvc.perform(post("/api/v1/admin/elections/99999/voting-periods", 99999)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Election not found")));
    }

    @Test
    public void testGetVotingPeriod_Success() throws Exception {
        // Arrange
        VotingPeriod votingPeriod = createTestVotingPeriod("Get Test");

        // Act & Assert
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}", 
                election.getId(), votingPeriod.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(votingPeriod.getId()))
                .andExpect(jsonPath("$.name").value("Get Test"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    public void testListVotingPeriods_Success() throws Exception {
        // Arrange
        createTestVotingPeriod("Period 1");
        createTestVotingPeriod("Period 2");
        createTestVotingPeriod("Period 3");

        // Act & Assert
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods", election.getId())
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    public void testListVotingPeriods_FilterByStatus() throws Exception {
        // Arrange
        VotingPeriod period1 = createTestVotingPeriod("Period 1");
        VotingPeriod period2 = createTestVotingPeriod("Period 2");
        
        // Open one period
        votingPeriodRepository.save(period1);
        period1.setStatus(VotingPeriodStatus.OPEN);
        votingPeriodRepository.save(period1);

        // Act & Assert
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods", election.getId())
                .param("status", "OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status").value("OPEN"));
    }

    @Test
    public void testUpdateVotingPeriod_Success() throws Exception {
        // Arrange
        VotingPeriod votingPeriod = createTestVotingPeriod("To Update");
        UpdateVotingPeriodRequest request = new UpdateVotingPeriodRequest();
        request.setName("Updated Name");
        request.setDescription("Updated description");

        // Act & Assert
        mockMvc.perform(put("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}", 
                election.getId(), votingPeriod.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.description").value("Updated description"));
    }

    @Test
    public void testUpdateVotingPeriod_RejectsClosedStatus() throws Exception {
        // Arrange
        VotingPeriod votingPeriod = createTestVotingPeriod("To Update");
        votingPeriod.setStatus(VotingPeriodStatus.CLOSED);
        votingPeriodRepository.save(votingPeriod);

        UpdateVotingPeriodRequest request = new UpdateVotingPeriodRequest();
        request.setName("Updated Name");

        // Act & Assert
        mockMvc.perform(put("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}", 
                election.getId(), votingPeriod.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Cannot update")));
    }

    @Test
    public void testOpenVotingPeriod_Success() throws Exception {
        // Arrange
        VotingPeriod votingPeriod = createTestVotingPeriod("To Open");

        // Act & Assert
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/open", 
                election.getId(), votingPeriod.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    public void testOpenVotingPeriod_OnlyOneOpenPerElection() throws Exception {
        // Arrange
        VotingPeriod period1 = createTestVotingPeriod("Period 1");
        VotingPeriod period2 = createTestVotingPeriod("Period 2");

        // Open first period
        period1.setStatus(VotingPeriodStatus.OPEN);
        votingPeriodRepository.save(period1);

        // Act & Assert - trying to open second should fail
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/open", 
                election.getId(), period2.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("only have one OPEN")));
    }

    @Test
    public void testCloseVotingPeriod_Success() throws Exception {
        // Arrange
        VotingPeriod votingPeriod = createTestVotingPeriod("To Close");
        votingPeriod.setStatus(VotingPeriodStatus.OPEN);
        votingPeriodRepository.save(votingPeriod);

        // Act & Assert
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/close", 
                election.getId(), votingPeriod.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    public void testCancelVotingPeriod_Success() throws Exception {
        // Arrange
        VotingPeriod votingPeriod = createTestVotingPeriod("To Cancel");

        // Act & Assert
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/cancel", 
                election.getId(), votingPeriod.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    public void testCancelVotingPeriod_OnlyFromScheduled() throws Exception {
        // Arrange
        VotingPeriod votingPeriod = createTestVotingPeriod("To Cancel");
        votingPeriod.setStatus(VotingPeriodStatus.OPEN);
        votingPeriodRepository.save(votingPeriod);

        // Act & Assert
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/cancel", 
                election.getId(), votingPeriod.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("only cancel")));
    }

    // Helper method
    private VotingPeriod createTestVotingPeriod(String name) {
        VotingPeriod votingPeriod = new VotingPeriod();
        votingPeriod.setElection(election);
        votingPeriod.setName(name);
        votingPeriod.setStartTime(now.plusHours(1));
        votingPeriod.setEndTime(now.plusHours(2));
        votingPeriod.setStatus(VotingPeriodStatus.SCHEDULED);
        return votingPeriodRepository.save(votingPeriod);
    }
}
